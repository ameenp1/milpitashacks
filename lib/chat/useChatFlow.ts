"use client";
// Chat orchestration (Role 4). Owns the question queue, current question, active
// form, submit/skip/edit, language-switch glue, and the post-interview review pass.
// The panels (ChatTranscript / ChatComposer / DocumentPanel) are presentational
// and consume this hook via app/chat/page.tsx.
import { useEffect, useMemo, useRef, useState } from "react";
import { getFormDef, getGroup } from "@/lib/data";
import { useAppState, setAnswer, setLanguage } from "@/lib/profile";
import { todayMMDDYYYY } from "@/lib/date";
import { chat, reviewPass, NoKeyError } from "@/lib/client/api";
import { useSpeak } from "@/lib/client/useSpeak";
import { useI18n } from "@/components/I18nProvider";
import { useToast } from "@/components/Toast";
import type { QuestionGroup } from "@/lib/types";
import type { DetectedLanguage, Msg } from "./contracts";

const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

const GUIDE_GROUP: QuestionGroup = {
  id: "__guide_calworks_path",
  question:
    "Would you like to start with CalWORKs first? That is the recommended route. If you already receive CalWORKs, you can skip ahead to the housing assistance questions.",
  help: "This only guides the conversation. It is not written on the official form.",
  answerType: "choice",
  choices: ["Start with CalWORKs", "I already receive CalWORKs"],
  isCore: false,
};

const INTRO =
  "Hi. I can help you go through the process of getting homelessness assistance. First we will choose the right path, then I will ask only the questions this form needs, fill the official forms as you go, and help you review everything before download.";
const THANK_YOU = "Thank you.";
const DONE = "All your forms are filled in. Review the answers on the right.";
const EMAIL_RETRY =
  "That doesn't look like a complete email (like name@example.com). Want to try again, or skip it?";
const CHECKING = "Checking your answers…";
const REVIEW_OK = "Everything looks good. You can review and download on the right.";
const UNCLEAR = "Sorry, I didn't catch that. Could you say it another way?";
const ERROR = "Something went wrong. Please try again or type your answer.";
const SWITCH_PREFIX = "Switch to";
const SWITCH_STAY = "Stay with my current language";

export const CHROME = [
  "All forms",
  "Review & download",
  "Sound on",
  "Sound off",
  "Type your answer…",
  "Send",
  "Print",
  "Skip",
  "Edit",
  "Save",
  EMAIL_RETRY,
  CHECKING,
  REVIEW_OK,
  DONE,
  UNCLEAR,
  ERROR,
  "Answers will appear here as you go.",
  "answered",
  INTRO,
  THANK_YOU,
  GUIDE_GROUP.question,
  ...(GUIDE_GROUP.choices ?? []),
  SWITCH_PREFIX,
  SWITCH_STAY,
];

export function useChatFlow() {
  const { profile } = useAppState();
  const answers = profile.answers;
  const { t, ensure, ready, langLabel, lang } = useI18n();
  const { speak, stop } = useSpeak();
  const { showToast } = useToast();

  const [messages, setMessages] = useState<Msg[]>([]);
  const [sending, setSending] = useState(false);
  const [hearMode, setHearMode] = useState(true);
  const [voice, setVoice] = useState("alloy");
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [activeForm, setActiveFormState] = useState("cw42");
  const [lastValue, setLastValue] = useState<string | undefined>(undefined);
  const [guideDone, setGuideDone] = useState(false);
  const [pendingAck, setPendingAck] = useState("");
  const [languageOffer, setLanguageOffer] = useState<DetectedLanguage | null>(null);

  const askedRef = useRef<string>("");
  const idRef = useRef(1);
  const reviewRanRef = useRef<Set<string>>(new Set());

  const activeGroups = useMemo<QuestionGroup[]>(() => {
    const def = getFormDef(activeForm);
    if (!def) return [];
    const seen = new Set<string>();
    const fieldGroups = def.fields
      .map((field) => field.group)
      .filter((group) => {
        if (seen.has(group)) return false;
        seen.add(group);
        return true;
      });

    // Include prerequisite questions needed to decide whether mapped conditional
    // fields apply, without expanding to a global all-form queue.
    const groupIds: string[] = [];
    const queued = new Set<string>();
    for (const id of fieldGroups) {
      const group = getGroup(id);
      const dependency = group?.dependsOn?.group;
      if (dependency && !queued.has(dependency)) {
        queued.add(dependency);
        groupIds.push(dependency);
      }
      if (!queued.has(id)) {
        queued.add(id);
        groupIds.push(id);
      }
    }

    return groupIds
      .map((group) => getGroup(group))
      .filter(Boolean) as QuestionGroup[];
  }, [activeForm]);

  const applies = (g: QuestionGroup) =>
    !g.dependsOn || answers[g.dependsOn.group] === g.dependsOn.equals;

  const nextFormGroup =
    activeGroups.find(
      (g) => applies(g) && !(answers[g.id]?.trim()) && !skipped.has(g.id),
    ) ?? null;
  const currentGroup = guideDone ? nextFormGroup : GUIDE_GROUP;
  const answeredCount = activeGroups.filter((g) => answers[g.id]?.trim()).length;

  function addBot(text: string, doSpeak: boolean) {
    setMessages((m) => [...m, { id: idRef.current++, role: "bot", text, speak: doSpeak }]);
  }
  function addUser(text: string, mask = false) {
    setMessages((m) => [
      ...m,
      { id: idRef.current++, role: "user", text: mask ? text.replace(/[0-9]/g, "*") : text },
    ]);
  }

  // Translations for active-form questions/help + chrome. This keeps the old
  // no-English-flicker behavior while avoiding global all-form preloading.
  useEffect(() => {
    ensure(activeGroups.flatMap((g) => [g.question, g.help ?? "", ...(g.choices ?? [])]).filter(Boolean));
    ensure(CHROME);
  }, [ensure, activeGroups]);

  // Preselect ?form= and auto-fill today's date.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("form");
    if (q && getFormDef(q)) setActiveFormState(q);
    if (!answers.sign_date?.trim()) setAnswer("sign_date", todayMMDDYYYY());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ask the current question once it is translated. If an answer was just saved,
  // combine the acknowledgement and next question into one bot turn.
  useEffect(() => {
    if (languageOffer) return;
    if (currentGroup) {
      if (!ready(currentGroup.question)) return;
      if (currentGroup.choices?.some((choice) => !ready(choice))) return;
      if (!guideDone && !ready(INTRO)) return;
      if (pendingAck && !ready(pendingAck)) return;
      const key = `${activeForm}:${currentGroup.id}`;
      if (askedRef.current === key) return;
      askedRef.current = key;
      const question = t(currentGroup.question);
      const text = !guideDone
        ? `${t(INTRO)} ${question}`
        : pendingAck
          ? `${t(pendingAck)} ${question}`
          : question;
      addBot(text, true);
      if (pendingAck) setPendingAck("");
    } else {
      const key = `${activeForm}:DONE`;
      if (askedRef.current === key) return;
      askedRef.current = key;
      addBot(pendingAck ? `${t(pendingAck)} ${t(DONE)}` : t(DONE), true);
      if (pendingAck) setPendingAck("");
      runReviewPass();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeForm, currentGroup?.id, currentGroup?.question, pendingAck, languageOffer, ready, t]);

  async function submit(message: string) {
    const text = message.trim();
    if (!text || sending) return;

    if (languageOffer) {
      stop();
      addUser(text);
      setSending(true);
      if (/^(yes|y|switch|ok|okay|sure)/i.test(text)) {
        setLanguage(languageOffer.code, languageOffer.label);
      }
      setLanguageOffer(null);
      setSending(false);
      return;
    }

    if (!currentGroup) return;
    stop(); // cut audio when moving on
    addUser(text, currentGroup.answerType === "ssn");
    setSending(true);

    if (currentGroup.id === GUIDE_GROUP.id) {
      if (/already/i.test(text)) setAnswer("gets_cash_aid", "Yes");
      setGuideDone(true);
      setPendingAck(THANK_YOU);
      setSending(false);
      return;
    }

    const g = currentGroup;
    try {
      const r = await chat({
        message: text,
        question: g.question,
        answerType: g.answerType,
        choices: g.choices,
        help: g.help,
        language: langLabel,
      });

      if (r.detectedLanguage) {
        setLanguageOffer(r.detectedLanguage);
        addBot(`${t(SWITCH_PREFIX)} ${r.detectedLanguage.label}? ${t(SWITCH_STAY)}.`, true);
      }

      if (r.type === "answer" && r.value) {
        if (g.answerType === "email" && !isValidEmail(r.value)) {
          addBot(t(EMAIL_RETRY), true);
        } else {
          setLastValue(r.value);
          setAnswer(g.id, r.value);
          setPendingAck(THANK_YOU);
        }
      } else {
        addBot(r.reply || t(UNCLEAR), true);
      }
    } catch (err) {
      if (err instanceof NoKeyError) {
        if (g.answerType === "email" && !isValidEmail(text)) {
          addBot(t(EMAIL_RETRY), false);
        } else {
          setLastValue(text);
          setAnswer(g.id, text);
          setPendingAck(THANK_YOU);
        }
      } else {
        showToast(t(ERROR), "error");
      }
    } finally {
      setSending(false);
    }
  }

  function skip() {
    stop();
    if (!currentGroup || currentGroup.id === GUIDE_GROUP.id) {
      setGuideDone(true);
      return;
    }
    setSkipped((s) => new Set(s).add(currentGroup.id));
  }

  function editField(group: string, value: string) {
    setLastValue(value);
    setAnswer(group, value);
    setSkipped((s) => {
      if (!s.has(group)) return s;
      const next = new Set(s);
      next.delete(group);
      return next;
    });
  }

  function setActiveForm(formId: string | null) {
    const next = formId && getFormDef(formId) ? formId : "cw42";
    setActiveFormState(next);
    askedRef.current = "";
    setLastValue(undefined);
  }

  // Final pass once each active form is done: reformat + flag nonsense.
  async function runReviewPass() {
    if (reviewRanRef.current.has(activeForm)) return;
    reviewRanRef.current.add(activeForm);
    const items = activeGroups
      .filter((g) => g.id !== "ssn" && g.id !== "sign_date" && answers[g.id]?.trim())
      .map((g) => ({
        group: g.id,
        question: g.question,
        answerType: g.answerType,
        value: answers[g.id],
      }));
    if (!items.length) return;
    addBot(t(CHECKING), false);
    try {
      const { fixes, issues } = await reviewPass(items);
      Object.entries(fixes).forEach(([g, v]) => {
        if (v && v !== answers[g]) setAnswer(g, v);
      });
      if (issues.length) {
        issues
          .slice(0, 5)
          .forEach((i) =>
            showToast(`${getGroup(i.group)?.question ?? i.group}: ${i.reason}`, "error"),
          );
      } else {
        addBot(t(REVIEW_OK), true);
      }
    } catch {
      /* no key or failure: skip silently */
    }
  }

  return {
    messages,
    sending,
    currentGroup,
    activeForm,
    answers,
    answeredCount,
    hearMode,
    setHearMode,
    voice,
    setVoice,
    speak,
    stop,
    lastValue,
    submit,
    skip,
    editField,
    setActiveForm,
    t,
    lang,
    langLabel,
  };
}

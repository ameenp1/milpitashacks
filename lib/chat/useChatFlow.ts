"use client";
// Chat orchestration (Role 4). Owns the question queue, current question, active
// form, submit/skip/edit, the post-interview review pass, and audio handles.
// The panels (ChatTranscript / ChatComposer / DocumentPanel) are presentational
// and consume this hook via app/chat/page.tsx.
import { useEffect, useMemo, useRef, useState } from "react";
import { PROFILE_SCHEMA, FORM_INDEX, getFormDef, getGroup } from "@/lib/data";
import { useAppState, setAnswer } from "@/lib/profile";
import { todayMMDDYYYY } from "@/lib/date";
import { chat, reviewPass, NoKeyError } from "@/lib/client/api";
import { useSpeak } from "@/lib/client/useSpeak";
import { useI18n } from "@/components/I18nProvider";
import { useToast } from "@/components/Toast";
import type { QuestionGroup } from "@/lib/types";
import type { Msg } from "./contracts";

const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

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
  "Type instead",
  "Hide typing",
  "That doesn't look like a complete email (like name@example.com). Want to try again, or skip it?",
  "Checking your answers…",
  "Everything looks good. You can review and download on the right.",
  "All your forms are filled in. Review the answers on the right.",
  "Sorry, I didn't catch that. Could you say it another way?",
  "Something went wrong. Please try again or type your answer.",
  "Answers will appear here as you go.",
  "answered",
  "Hi! I'll help you fill out your forms. You can speak or type, and you can ask me anything.",
];

export function useChatFlow() {
  const { profile } = useAppState();
  const answers = profile.answers;
  const { t, ensure, ready, langLabel, lang } = useI18n();
  const { speak, stop, speaking } = useSpeak();
  const { showToast } = useToast();

  const [messages, setMessages] = useState<Msg[]>([]);
  const [sending, setSending] = useState(false);
  const [hearMode, setHearMode] = useState(true);
  const [voice, setVoice] = useState("alloy");
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [manualForm, setManualForm] = useState<string | null>(null);
  const [lastValue, setLastValue] = useState<string | undefined>(undefined);

  const askedRef = useRef<string>("");
  const idRef = useRef(1);
  const greetedRef = useRef(false);

  // Ordered question groups: core profile, then per-form extras (deduped).
  const orderedGroups = useMemo<QuestionGroup[]>(() => {
    const coreIds = new Set(PROFILE_SCHEMA.map((g) => g.id));
    const extra: string[] = [];
    for (const f of FORM_INDEX) {
      const def = getFormDef(f.id);
      if (!def) continue;
      for (const fl of def.fields) {
        if (!coreIds.has(fl.group) && !extra.includes(fl.group)) extra.push(fl.group);
      }
    }
    return [
      ...PROFILE_SCHEMA,
      ...(extra.map((id) => getGroup(id)).filter(Boolean) as QuestionGroup[]),
    ];
  }, []);

  const applies = (g: QuestionGroup) =>
    !g.dependsOn || answers[g.dependsOn.group] === g.dependsOn.equals;
  const currentGroup =
    orderedGroups.find(
      (g) => applies(g) && !(answers[g.id]?.trim()) && !skipped.has(g.id),
    ) ?? null;

  const formForGroup = (gid: string | undefined) => {
    if (!gid) return "cw42";
    for (const f of FORM_INDEX) {
      const def = getFormDef(f.id);
      if (def?.fields.some((fl) => fl.group === gid)) return f.id;
    }
    return "cw42";
  };
  const activeForm = manualForm ?? formForGroup(currentGroup?.id);
  const answeredCount = orderedGroups.filter((g) => answers[g.id]?.trim()).length;

  function addBot(text: string, doSpeak: boolean) {
    setMessages((m) => [...m, { id: idRef.current++, role: "bot", text, speak: doSpeak }]);
  }
  function addUser(text: string) {
    setMessages((m) => [...m, { id: idRef.current++, role: "user", text }]);
  }

  // Translations for every question/help + chrome.
  useEffect(() => {
    ensure(orderedGroups.flatMap((g) => [g.question, g.help ?? ""]).filter(Boolean));
    ensure(CHROME);
  }, [ensure, orderedGroups]);

  // Preselect ?form= and auto-fill today's date.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("form");
    if (q && getFormDef(q)) setManualForm(q);
    if (!answers.sign_date?.trim()) setAnswer("sign_date", todayMMDDYYYY());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Greet once.
  useEffect(() => {
    if (greetedRef.current) return;
    if (!ready(CHROME[CHROME.length - 1])) return;
    greetedRef.current = true;
    addBot(
      t("Hi! I'll help you fill out your forms. You can speak or type, and you can ask me anything."),
      true,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, t]);

  // Ask the current question — only once its translation is ready (no flicker).
  const displayedQuestion = currentGroup ? t(currentGroup.question) : "";
  const questionReady = currentGroup ? ready(currentGroup.question) : true;
  useEffect(() => {
    if (!greetedRef.current) return;
    if (currentGroup) {
      if (!questionReady) return;
      if (askedRef.current === currentGroup.id) return;
      askedRef.current = currentGroup.id;
      addBot(displayedQuestion, true);
    } else {
      if (askedRef.current === "DONE") return;
      askedRef.current = "DONE";
      addBot(t("All your forms are filled in. Review the answers on the right."), true);
      runReviewPass();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGroup?.id, questionReady, displayedQuestion]);

  async function submit(message: string) {
    const text = message.trim();
    if (!text || sending || !currentGroup) return;
    stop(); // cut audio when moving on
    addUser(text);
    setSending(true);
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
      if (r.type === "answer" && r.value) {
        if (g.answerType === "email" && !isValidEmail(r.value)) {
          addBot(t("That doesn't look like a complete email (like name@example.com). Want to try again, or skip it?"), true);
        } else {
          setLastValue(r.value);
          setAnswer(g.id, r.value);
          if (r.reply) addBot(r.reply, true);
        }
      } else {
        addBot(r.reply || t("Sorry, I didn't catch that. Could you say it another way?"), true);
      }
    } catch (err) {
      if (err instanceof NoKeyError) {
        if (g.answerType === "email" && !isValidEmail(text)) {
          addBot(t("That doesn't look like a complete email (like name@example.com). Want to try again, or skip it?"), false);
        } else {
          setLastValue(text);
          setAnswer(g.id, text);
        }
      } else {
        showToast(t("Something went wrong. Please try again or type your answer."), "error");
      }
    } finally {
      setSending(false);
    }
  }

  function skip() {
    if (!currentGroup) return;
    stop();
    setSkipped((s) => new Set(s).add(currentGroup.id));
  }

  function editField(group: string, value: string) {
    setLastValue(value);
    setAnswer(group, value);
  }

  // Final pass once the interview is done: reformat + flag nonsense (once).
  async function runReviewPass() {
    const items = orderedGroups
      .filter((g) => g.id !== "ssn" && g.id !== "sign_date" && answers[g.id]?.trim())
      .map((g) => ({
        group: g.id,
        question: g.question,
        answerType: g.answerType,
        value: answers[g.id],
      }));
    if (!items.length) return;
    addBot(t("Checking your answers…"), false);
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
        addBot(t("Everything looks good. You can review and download on the right."), true);
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
    speaking,
    lastValue,
    submit,
    skip,
    editField,
    setActiveForm: setManualForm,
    t,
    lang,
    langLabel,
  };
}

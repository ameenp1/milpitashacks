"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { PROFILE_SCHEMA, FORM_INDEX, getFormDef, getGroup } from "@/lib/data";
import { useAppState, setAnswer, approveGroups } from "@/lib/profile";
import { chat, NoKeyError } from "@/lib/client/api";
import { useSpeak } from "@/lib/client/useSpeak";
import { useI18n } from "@/components/I18nProvider";
import { useToast } from "@/components/Toast";
import { VoiceButton } from "@/components/VoiceButton";
import { Typewriter } from "@/components/chat/Typewriter";
import { ApprovalPanel } from "@/components/chat/ApprovalPanel";
import { FormPreview } from "@/components/FormPreview";
import type { QuestionGroup } from "@/lib/types";

interface Msg {
  id: number;
  role: "bot" | "user";
  text: string;
}

const CHROME = [
  "All forms",
  "Review & download",
  "Sound on",
  "Sound off",
  "Type your answer…",
  "Send",
  "All your forms are filled in. Review the highlighted answers on the right and approve them.",
  "Sorry, I didn't catch that. Could you say it another way?",
  "Something went wrong. Please try again or type your answer.",
  "Changes to approve",
  "Approve all",
  "Approved",
  "Approve",
  "Reject",
  "Answers will appear here as you go.",
  "answered",
  "Hi! I'll help you fill out your forms. You can speak or type, and you can ask me anything.",
];

export default function ChatPage() {
  const { profile, approved } = useAppState();
  const answers = profile.answers;
  const { t, ensure, ready, langLabel, lang } = useI18n();
  const { speak, stop } = useSpeak();
  const { showToast } = useToast();

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [hearMode, setHearMode] = useState(true);
  const [manualForm, setManualForm] = useState<string | null>(null);
  const [lastValue, setLastValue] = useState<string | undefined>(undefined);

  const askedRef = useRef<string>("");
  const idRef = useRef(1);
  const greetedRef = useRef(false);
  const transcriptRef = useRef<HTMLDivElement>(null);

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
    orderedGroups.find((g) => applies(g) && !(answers[g.id]?.trim())) ?? null;

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

  // Pre-load translations for every question/help + chrome.
  useEffect(() => {
    ensure(orderedGroups.flatMap((g) => [g.question, g.help ?? ""]).filter(Boolean));
    ensure(CHROME);
  }, [ensure, orderedGroups]);

  // Preselect the form from ?form= (when arriving from the forms list).
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("form");
    if (q && getFormDef(q)) setManualForm(q);
  }, []);

  function addBot(text: string, doSpeak: boolean) {
    setMessages((m) => [...m, { id: idRef.current++, role: "bot", text }]);
    if (doSpeak && hearMode) {
      stop();
      speak(text);
    }
  }
  function addUser(text: string) {
    setMessages((m) => [...m, { id: idRef.current++, role: "user", text }]);
  }

  // Greet once.
  useEffect(() => {
    if (greetedRef.current) return;
    if (!ready(CHROME[CHROME.length - 1])) return; // wait for translation
    greetedRef.current = true;
    addBot(t("Hi! I'll help you fill out your forms. You can speak or type, and you can ask me anything."), true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, t]);

  // Ask the current question — only once its translation is ready (no English
  // flicker), appended to the end. Advances automatically as answers fill in.
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
      addBot(
        t("All your forms are filled in. Review the highlighted answers on the right and approve them."),
        true,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGroup?.id, questionReady, displayedQuestion, greetedRef.current]);

  // Keep transcript scrolled to the latest message.
  useEffect(() => {
    transcriptRef.current?.scrollTo({
      top: transcriptRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  async function submit(message: string) {
    const text = message.trim();
    if (!text || sending || !currentGroup) return;
    stop(); // cut audio when moving on
    addUser(text);
    setInput("");
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
        setLastValue(r.value);
        setAnswer(g.id, r.value);
        if (r.reply) addBot(r.reply, true);
      } else {
        addBot(r.reply || t("Sorry, I didn't catch that. Could you say it another way?"), true);
      }
    } catch (err) {
      if (err instanceof NoKeyError) {
        // Deterministic fallback: take the text as the answer.
        setLastValue(text);
        setAnswer(g.id, text);
      } else {
        showToast(t("Something went wrong. Please try again or type your answer."), "error");
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="mx-auto h-screen max-w-6xl px-4 py-4">
      <header className="no-print mb-3 flex items-center justify-between">
        <Link href="/forms" className="text-sm text-neutral-500 hover:text-neutral-900">
          ← {t("All forms")}
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400">
            {answeredCount} {t("answered")}
          </span>
          <button
            type="button"
            onClick={() => {
              if (hearMode) stop();
              setHearMode((s) => !s);
            }}
            className="rounded-full border border-neutral-200 px-3 py-1 text-sm text-neutral-600 hover:bg-neutral-50"
          >
            {hearMode ? `🔊 ${t("Sound on")}` : `🔇 ${t("Sound off")}`}
          </button>
          <Link
            href="/review"
            className="rounded-full bg-neutral-900 px-3 py-1 text-sm font-medium text-white hover:bg-neutral-700"
          >
            {t("Review & download")}
          </Link>
        </div>
      </header>

      <div className="grid h-[calc(100vh-5rem)] gap-6 lg:grid-cols-2">
        {/* Chat */}
        <section className="flex min-h-0 flex-col rounded-2xl border border-neutral-200">
          <div ref={transcriptRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={[
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed",
                    m.role === "user"
                      ? "bg-neutral-900 text-white"
                      : "bg-neutral-100 text-neutral-900",
                  ].join(" ")}
                >
                  {m.role === "bot" ? <Typewriter text={m.text} /> : m.text}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-neutral-100 px-4 py-2.5 text-neutral-400">
                  …
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-neutral-100 p-3">
            {currentGroup?.choices && (
              <div className="mb-2 flex flex-wrap gap-2">
                {currentGroup.choices.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => submit(c)}
                    disabled={sending}
                    className="rounded-full border border-neutral-300 px-4 py-2 text-sm hover:border-neutral-900 disabled:opacity-50"
                  >
                    {t(c)}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit(input)}
                placeholder={t("Type your answer…")}
                disabled={!currentGroup || sending}
                className="flex-1 rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900 disabled:bg-neutral-50"
              />
              <VoiceButton onResult={submit} language={lang} idleLabel="🎤" />
              <button
                type="button"
                onClick={() => submit(input)}
                disabled={!input.trim() || sending || !currentGroup}
                className="rounded-xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white hover:bg-neutral-700 disabled:bg-neutral-200 disabled:text-neutral-400"
              >
                {t("Send")}
              </button>
            </div>
          </div>
        </section>

        {/* Active form: live tracked-changes preview + approval */}
        <section className="flex min-h-0 flex-col">
          <div className="no-print mb-2 flex items-center justify-between gap-2">
            <select
              value={activeForm}
              onChange={(e) => setManualForm(e.target.value)}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm"
            >
              {FORM_INDEX.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.code} — {f.title}
                </option>
              ))}
            </select>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <FormPreview
              formId={activeForm}
              answers={answers}
              approved={approved}
              scrollToText={lastValue}
            />
            <div className="mt-3">
              <ApprovalPanel
                formId={activeForm}
                answers={answers}
                approved={approved}
                onApprove={(g) => approveGroups([g])}
                onApproveAll={(gs) => approveGroups(gs)}
                onReject={(g) => setAnswer(g, "")}
                t={t}
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

# errors.md — gotchas & status

Status of the issues found while implementing the chat brain (R1), the
statement-vs-field fix (R3), and speak-before-typewriter (R2). Updated as fixes
landed on `role1`.

## ✅ Fixed

1. **Statements/headings were being filled like fields (across forms).**
   The loose `AUTO` regexes in [scripts/preprocess.ts](scripts/preprocess.ts)
   stamped answer tokens onto prose — e.g. phone → `"Phone and utility costs."`,
   ssn → `"Use of Social Security Numbers (SSN)"`, saws2asar phone →
   `"by mail, telephone, or in person at the "`, cw74 phone → `"EW Phone:"` (the
   *worker's* phone). Added `looksLikeFieldLabel()` (rejects sentences, headings,
   and running prose by lowercase-connector count) + a worker/office exclusion on
   the phone test. Re-ran `npm run preprocess`; every form now anchors only to
   real fill-in labels (`SOCIAL SECURITY NUMBER`, `HOME PHONE`, `EMAIL ADDRESS`,
   …). saws2asar correctly drops to just its signature field. Verified templates
   carry exactly the intended tokens.

2. **`detectedLanguage` contract.** `/api/chat` returns
   `{ type, value, reply, detectedLanguage? }`; `ChatResult`/`DetectedLanguage`
   now live in [lib/chat/contracts.ts](lib/chat/contracts.ts) and
   [useChatFlow](lib/chat/useChatFlow.ts) consumes it to offer a language switch.

3. **Combined "Thank you… [next question]" turn (L4).** `useChatFlow` composes
   one bot turn via `pendingAck` (`${ack} ${nextQuestion}`) instead of a separate
   reply turn — no more cut-off acknowledgement.

4. **Guide persona + CalWORKs-first (L11).** `useChatFlow` opens with the `INTRO`
   and a `GUIDE_GROUP` CalWORKs-first/skip-to-housing choice (the skip is a stub,
   as intended).

5. **Speak before the typewriter (L4).** `useSpeak` now exposes `playingText`
   (set when audio actually begins); `ChatTranscript` holds each spoken turn's
   `Typewriter` (`start` prop) until its audio starts, with a 4s fallback so text
   never gets stuck when TTS is slow/absent. Speech now leads the typing.

6. **SSN privacy in replies (L12).** The brain never echoes/confirms SSN digits
   (prompt + a hard digit-strip failsafe on the `ssn` reply); `useChatFlow` masks
   the user's echoed SSN. `value` still carries the real SSN to fill the form.

## ⚠️ Open / watch

7. **`guideScript.ts` vs inline copy.** I created
   [lib/chat/guideScript.ts](lib/chat/guideScript.ts) per ROLES.md, but the
   integrated `useChatFlow` inlines its own `INTRO`/`THANK_YOU`/`GUIDE_GROUP`.
   guideScript is currently **unused** — consolidate to one source (either import
   guideScript in `useChatFlow`, or delete guideScript) to avoid drift.

8. **Language-switch label is the English name.** The offer calls
   `setLanguage(code, label)` where `label` is e.g. `"Spanish"` (not the native
   `"Español"`). Translation still works (target = "Spanish"), but the on-screen
   language label/STT hint won't match the native form. Map `code` → the
   `LANGUAGES` entry in [app/language/page.tsx](app/language/page.tsx) if that
   matters. Past transcript messages also don't retranslate after a switch.

9. **No-key fallback bypasses the brain.** With no `OPENAI_API_KEY`,
   `useChatFlow.submit` stores raw text and skips `/api/chat`, so language
   detection / SSN-safe phrasing / value-cleaning don't run. Acceptable fallback.

10. **PDF/print formatting** — reported separately; not yet diagnosed. Print is a
    browser print of the `docx-preview` render ([app/print/[formId]/page.tsx](app/print/%5BformId%5D/page.tsx)
    → [FormPreview](components/FormPreview.tsx), print CSS in
    [app/globals.css](app/globals.css)). Needs specifics to fix (see chat).

## Environment
11. `~/.nvm/nvm.sh` doesn't exist on this machine; `node` (v25.2.1) is on PATH via
    Homebrew. `npm install` is required before build/preprocess. `npm run build`
    is green; live click-through (voice, docx-preview) not run headlessly.

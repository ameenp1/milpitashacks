# ROLES — four-person split for revisions_2.md

Four people, four agents, four branches, one `main`. Work is mergeable because
**each role owns a disjoint set of files** (see the ownership matrix in
[PLAN.md](PLAN.md)). Read [CONTEXT.md](CONTEXT.md) first for how the app works.

Source of tasks: [revisions_2.md](revisions_2.md) (line numbers referenced as L2–L12).

> **Phase 0 (do this before anyone branches):** Role 4 lands a small refactor that
> splits the 439-line [app/chat/page.tsx](app/chat/page.tsx) into a thin shell + three
> panels + one flow hook, with typed contracts. Everyone branches off `main` *after*
> Phase 0. Details in [PLAN.md](PLAN.md) §2.

---

## Role 1 — Conversation Designer (the chat brain & guidance)
**Branch:** `feat/r1-conversation` · **Theme:** what the assistant *says*.

**Owns (edit freely):**
- `app/api/chat/route.ts` — the LLM prompt/classifier.
- `lib/chat/guideScript.ts` *(new)* — intro/steps copy + localized phrases (e.g. "Thank you.").
- `app/api/detect-language/route.ts` *(new, optional)* or extend `/api/chat` to also return a detected language.

**Do NOT edit:** chat UI components, `useChatFlow`, `profile.ts`, `fillEngine.ts`, `data/`.

**Tasks:**
1. **Guide persona (L11).** The assistant introduces itself, explains it helps the
   user get homelessness assistance, lists the steps, and asks if they want to apply
   for **CalWORKs first** (recommended) — noting that existing CalWORKs recipients
   can skip to housing (stub the skip; just convey it). Put this copy in `guideScript.ts`.
2. **Language detection (L2).** When a user reply is in a different language than the
   chosen one, the brain returns `detectedLanguage: {code,label}`. (Applying the switch
   is Role 4; you only detect + surface it.)
3. **SSN prompting (L12).** Never echo the SSN digits back; never ask "is your SSN
   910-87-0886?". Instead ask the user to *look over their own SSN* on the form. Ensure
   the cleaned value is returned but the `reply` text contains **no digits**.
4. **"Thank you" phrasing (L4).** Provide a short localized acknowledgement ("Thank
   you.") that Role 4 will prepend to the next question as **one** combined turn.

**Contract you produce** (Role 4 consumes): `/api/chat` response
`{ type, value, reply, detectedLanguage? }`. Coordinate any field changes with Role 4.

---

## Role 2 — Voice & Audio UX
**Branch:** `feat/r2-voice` · **Theme:** mic, TTS, typing/audio timing.

**Owns (edit freely):**
- `components/VoiceButton.tsx`, `lib/client/useSpeak.ts`, `components/chat/Typewriter.tsx`
- `components/chat/ChatTranscript.tsx` *(new — messages + typewriter + audio)*
- `components/chat/ChatComposer.tsx` *(new — text input, big mic, SSN-masked field)*

**Do NOT edit:** the flow hook, the document panel, the chat route, `profile.ts`, `data/`.

**Tasks:**
1. **Mic-first (L3).** Make the **microphone the default and the big primary control**;
   text input is secondary.
2. **Auto-listen (L3).** When a bot turn finishes being read aloud, **automatically
   start recording** (so the user can just answer). Expose an `onSpeakEnd` from `useSpeak`.
3. **Audio starts with typing (L4).** Begin TTS **as the typewriter starts**, not after.
   The combined "Thank you… [next question]" must be one utterance that is **not cut off**
   by the following turn (play the full message; don't `stop()` it mid-acknowledgement).
4. **SSN masked input (L12).** In the composer, when the active question is the SSN, the
   typed value renders as `••••` with an eye toggle (mirror the approval/list masking).

**Contract you consume** (from Role 4): `ChatTranscriptProps` and `ChatComposerProps`
in `lib/chat/contracts.ts` (messages, `hearMode`, `currentGroup`, `onSubmit`, `voice`).

---

## Role 3 — Document, Editing & Signature
**Branch:** `feat/r3-document` · **Theme:** the form on the right.

**Owns (edit freely):**
- `components/FormPreview.tsx`
- `components/chat/DocumentPanel.tsx` *(new — preview + answer list + form switcher slot)*
- `components/chat/AnswerList.tsx` *(new — REPLACES `ApprovalPanel.tsx`, which you delete)*
- `lib/docx/fillEngine.ts`, `app/api/fill/route.ts`
- `scripts/preprocess.ts`, `data/forms/*`, `data/templates/*` (you are the ONLY one who
  runs `npm run preprocess` and commits `data/`)
- `app/print/[formId]/page.tsx`, `app/sign/page.tsx`, signature block in `app/review/page.tsx`

**Do NOT edit:** chat route, voice components, `useChatFlow`, `profile.ts`.

**Tasks:**
1. **Remove approve/disapprove → list + edit (L5).** Delete `ApprovalPanel`; build
   `AnswerList` = the list of filled answers with an **Edit** button each (Edit calls the
   `onEditField` prop → Role 4's `setAnswer`). No approve/reject buttons.
2. **Always-accept + "what just changed" (L3).** Simplify `fillEngine` to drop the
   `approved` branch (answers are always applied) and make the **most recent change
   obvious** in the preview (e.g. highlight/animate the last-edited field).
3. **Click-to-edit on the document (L6).** Let the user click a field in the rendered
   form and edit it inline; commit via `onEditField`.
4. **Reliable scroll/highlight (L7).** Fix `FormPreview` so it **always** scrolls to and
   highlights the field that was just answered (use the field token/anchor, not a fragile
   text search). Define the default target with Role 4 (`activeField`).
5. **Signature in the signature box (L8).** Place the captured signature (image) into the
   form's signature box — add the signature field/anchor in `preprocess.ts` and render it
   in `fillEngine` (embed the image, or stamp name + date on the signature line).

**Contracts:** consume `DocumentPanelProps` (answers, activeForm, `onEditField`,
`onSwitchForm`, `activeField`); keep `/api/fill` request shape stable for Role 4.

---

## Role 4 — Flow, Form-Scoping & Integration (lead)
**Branch:** `feat/r4-flow` · **Theme:** orchestration + glue. **Does Phase 0.**

**Owns (edit freely):**
- `app/chat/page.tsx` (thin shell after Phase 0)
- `lib/chat/useChatFlow.ts` *(new — queue, current question, active form, submit)*
- `lib/chat/contracts.ts` *(new — all shared prop/return types)*
- `lib/profile.ts` (store), `components/I18nProvider.tsx`, `app/language/page.tsx`

**Do NOT edit:** the panel internals (Roles 2/3), the chat route (Role 1), `data/`.

**Tasks:**
0. **Phase 0 decomposition (blocking).** Split `page.tsx` into `<ChatTranscript>`,
   `<ChatComposer>`, `<DocumentPanel>` + `useChatFlow`; define `contracts.ts`; remove the
   `approved` state from `profile.ts`. Merge to `main` first. Provide stub panels so
   Roles 2/3 can implement against real props.
1. **Form-scoped questions (L9).** The queue asks **only the active form's** groups; a
   group already answered (on any form) is **not re-asked**; never ask a group the form
   doesn't have. (Today it asks a global union — change to per-form scoping.)
2. **Switching forms follows in chat (L10).** Changing the active form (selector or
   click) recomputes the queue so the chat continues with the new form's remaining
   questions and reflects its data.
3. **Combined turn (L4).** Compose each bot turn as one message =
   `Role1.ack + " " + nextQuestion` so audio/typing isn't split.
4. **Apply language switch (L2).** On `detectedLanguage` from the brain, prompt
   "Switch to X?"; on yes call `setLanguage` (I18n re-translates; Role 2 re-speaks).
5. **Wire CalWORKs-first branch (L11).** Drive the guided steps from Role 1's script
   (CalWORKs vs skip-to-housing stub) as the queue's high-level ordering.

**Contract you produce:** `lib/chat/contracts.ts` (the single source of shared types).
Announce any change to it; it is the only "shared" file and changes are additive.

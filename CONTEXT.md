# CONTEXT — Homeless Assistance Form Assistant (handoff)

Read this first if you're a coding agent picking up this repo. It captures the
goal, architecture, repo layout, key mechanisms, current state, and gotchas.
Companion docs: [hackathon.md](hackathon.md) (original brief), [revisions.md](revisions.md)
(post-MVP change requests — all implemented), [CLAUDE.md](CLAUDE.md) (behavioral
guidelines: think before coding, simplicity, surgical changes), [README.md](README.md)
(run instructions).

---

## 1. What this is
A multilingual, **voice-enabled chatbot** that helps Santa Clara County applicants
fill out the **CalWORKs Homeless Assistance** form packet. The applicant answers
each common question **once** (voice or text, in their language); answers are reused
across all 6 forms, applied to each official `.docx` as **Word tracked changes**, and
exported. Privacy-first: data lives only in the browser and is deletable.

Target user: someone in housing crisis on an iPad/computer. Priority form: **CW 42**.

## 2. Stack & environment (important quirks)
- **Next.js 16.2.9** (App Router, Turbopack) · **React 19** · **TypeScript** ·
  **Tailwind v4** (`@import "tailwindcss"`, config in [app/globals.css](app/globals.css)).
- **OpenAI** for ALL AI (NOT Claude — this is mandated by the brief): models in
  [lib/openai.ts](lib/openai.ts) → `gpt-4o-transcribe` (STT), `gpt-4o` (chat/translate),
  `gpt-4o-mini-tts` (TTS). Needs `OPENAI_API_KEY` in `.env.local`.
- DOCX: **pizzip** (zip), **fast-xml-parser** (preprocess only), **docx-preview** (browser render).
- **Node is via nvm and NOT on PATH.** Always: `source ~/.nvm/nvm.sh && nvm use 24`
  (Node 24.15). Node is pinned for Vercel via `engines.node>=20.9` + `.nvmrc`.
- Run: `npm run dev` (or `npm run build && npm run start`) on :3000.
  `npm run preprocess` regenerates `data/` (see §5). `node scripts/preprocess.ts` works
  directly (Node strips TS types).
- **Deploy**: team pushes `main` → Vercel builds. For instant shared link we use
  **ngrok** (`ngrok http 3000`). Convention: **commit after each change, do NOT push**
  (the team pushes).
- Without a key the app still works: chat falls back to deterministic question flow +
  text input, UI stays English (API routes return `503 {error:"no_key"}`).

## 3. The 6 forms
All are **plain text+table DOCX with NO AcroForm fields** — "filling" = inserting answer
text. `forms/*.docx` are the untouched originals (+ `forms/pdf_versions/` for reference).
- `cw42` — Statement of Facts (Homeless Assistance) — **priority, fully curated (22 fields)**.
- `cw74` (housing search), `saws1` (initial app), `saws2plus` (main app, ~1.2MB),
  `saws2asar` (rights), `scd508` (voter reg) — get **auto-detected shared fields**
  (name, address, ssn, dob, phone, email) so the profile cross-fills.
- `context_docs/*.md` are background info (rights/guides), NOT forms to fill.

## 4. Architecture (data-driven pipeline)
```
ONE-TIME (offline)                         RUNTIME (Next.js)
scripts/preprocess.ts  ──generates──►  data/  ──read-only──►  fill engine + chat UI
  • find each field by a unique         templates/*.docx (tokens injected)
    label "anchor" in the docx          forms/*.json     (field maps)
  • inject {{form__field}} token run    forms/*.md       (md working doc)
  • emit md + field maps + groups       question-groups.json, profile-schema.json
                                         i18n/<lang>.json (translation dataset, grows)
```
Runtime never re-extracts. Each form = a placeholdered `template.docx` + a `fieldMap`.
Answers are keyed by **group id** (not per-form), which is what makes cross-fill work.

## 5. Repo layout (annotated)
```
app/
  page.tsx                landing → /language
  language/page.tsx       voice-promptable language pick → /sign
  sign/page.tsx           e-signature pad + auto today's date → /chat
  chat/page.tsx           ★ THE UNIFIED CHATBOT (439 lines, core of the app)
  forms/page.tsx          overview/checklist (links into /chat?form=<id>)
  review/page.tsx         summary, doc checklist, downloads, print, delete, signature
  print/[formId]/page.tsx clean full-document print/PDF view (all pages)
  privacy/page.tsx        privacy explainer + delete
  interview/page.tsx      LEGACY → redirects to /chat
  forms/[formId]/page.tsx LEGACY → redirects to /chat?form=<id>
  api/
    chat/route.ts         classify msg: answer|question|unclear; clean → English value; reply in user lang
    fill/route.ts         {formId, answers, mode, approved} → completed .docx bytes
    transcribe/route.ts   audio → gpt-4o-transcribe → text (handles iPad mp4)
    tts/route.ts          text → gpt-4o-mini-tts → audio/mpeg
    translate/route.ts    batch translate, backed by data/i18n/<lang>.json dataset
    review-pass/route.ts  one-shot post-interview: reformat answers + flag nonsense
    understand/route.ts   LEGACY (superseded by chat), still present
components/
  chat/Typewriter.tsx     types text char-by-char (once)
  chat/ApprovalPanel.tsx  list tracked-changes → Approve / Approve-all / Reject; masks SSN
  FormPreview.tsx         docx-preview render of /api/fill preview; scroll-to-field
  VoiceButton.tsx         MediaRecorder → /api/transcribe
  SignaturePad.tsx        canvas signature (mouse+touch)
  I18nProvider.tsx        t()/ensure()/ready(); per-language localStorage cache
  Toast.tsx               toasts (errors add "ask a worker / call 2-1-1")
  Providers.tsx           wraps Toast + I18n (used in app/layout.tsx)
  QuestionCard.tsx        LEGACY (was the old per-question card; now unused)
  StatusBadge.tsx, DeleteButton.tsx
lib/
  data.ts                 static JSON accessors (GROUPS, PROFILE_SCHEMA, FORM_INDEX, getFormDef, getGroup)
  status.ts               fieldStatus / formProgress / formStatus
  profile.ts              ★ localStorage store (useSyncExternalStore): answers/reviewed/approved/signature
  date.ts                 todayMMDDYYYY()
  openai.ts               getClient(), MODELS, NoKeyError, errorResponse
  docx/fillEngine.ts      ★ token → run replacement (blank / approved-plain / w:ins / blue-underline)
  server/forms.ts         getFormMarkdown / getFilledMarkdown (md working doc)
  server/i18nStore.ts     load/save data/i18n/<lang>.json
  client/api.ts           fetch wrappers: chat, reviewPass, transcribeAudio, fetchTts, translateBatch, fetchFilledDoc
  client/useSpeak.ts      TTS playback hook (speak/stop); stop() = "cut audio"
  types.ts                AnswerType, QuestionGroup, Field, FormDef, Profile, FormStatus
scripts/preprocess.ts     ★ the one-time generator (curated CW42 map + auto-detect + md + groups)
data/ …                   generated; committed. forms/ context_docs/  originals.
```
★ = the files you'll most likely touch.

## 6. Key mechanisms (how things actually work)

**Field tokens & fill engine** ([lib/docx/fillEngine.ts](lib/docx/fillEngine.ts)).
Preprocess injects a run `<w:r><w:t> {{form__field}}</w:t></w:r>` after each field's
label paragraph. `fillDocx(formId, answers, {mode, approved})` regex-replaces each token run:
- no answer → gray `____`; answered+approved → near-black plain run (accepted change);
- answered+unapproved → `<w:ins>` (mode `export`) or blue underlined run (mode `preview`).
Approval is keyed by group id. `/api/fill` is the only consumer.

**adeu / md working doc.** [data/forms/<id>.md](data/forms/) is the form text with `{{tokens}}`
inline; [lib/server/forms.ts](lib/server/forms.ts) `getFilledMarkdown` swaps tokens for current
answers. The "diff applied as a tracked change" is realized as **per-field token → `w:ins`**
(reliable run mapping) rather than a positional free-form md diff — see caveats.

**Chat orchestration** ([app/chat/page.tsx](app/chat/page.tsx)).
- `orderedGroups` = `PROFILE_SCHEMA` (core, `dependsOn`-filtered) then per-form extra groups,
  deduped by group id. `currentGroup` = first applicable, unanswered, un-skipped group.
- `activeForm` (right panel) = `?form=` or manual selector, else the form owning `currentGroup`
  (prefers cw42). Each answer → `setAnswer(group, value)` → preview re-renders + scrolls.
- Bot turns are **typewritten** and (in hear-mode, default on) spoken; `stop()` cuts audio on
  advance/submit. User messages route through `/api/chat`; `type:"question"` answers without
  advancing. SSN input masked + eye. Per-question **Skip**. On completion → `/api/review-pass`.

**No-flicker translations.** [I18nProvider](components/I18nProvider.tsx) exposes `ready(text)`
(true iff the translation is in the dict). The chat only appends a question **once `ready` is
true** for non-English — never shows English then swaps. Client cache `localStorage ha_tr_<lang>`;
server dataset `data/i18n/<lang>.json` (translate-once across users).

**State / privacy** ([lib/profile.ts](lib/profile.ts)). Everything lives in `localStorage` key
`ha_state` = `{ profile:{language, languageLabel, answers{groupId→value}}, reviewed[], approved[], signature }`.
`clearAll()` wipes `ha_state` + all `ha_tr_*`. Nothing is persisted server-side; `/api/fill`
builds docs in memory.

## 7. Data model
- **QuestionGroup** (`data/question-groups.json`): `{id, question, help?, answerType, choices?,
  isCore, needsReview?, order?, dependsOn?}`. 28 groups; 20 are core (the interview), ordered.
  `dependsOn` gates conditional questions (e.g., `where_staying` needs `has_home === "No"`).
- **Field** (`data/forms/<id>.json`): `{id, token, group, anchor, answerType, needsReview?}`.
- **Profile answers** are `Record<groupId, string>` — so any field whose `group` has an answer
  is filled, on every form (cross-fill). Booleans stored as `"Yes"/"No"`; dates `MM/DD/YYYY`;
  the chat/`review-pass` produce **English** values for the official form.

## 8. Flow (routes)
`/` → `/language` → `/sign` → `/chat` → `/review`. `/forms` is an overview;
`/print/[id]` a print view; `/privacy` the explainer. `/interview` and `/forms/[id]` redirect to `/chat`.

## 9. Current state — revisions.md is fully implemented
Format overhaul (chatbot, md, per-answer tracked-change, approve/approve-all) + all listed fixes:
manual continue, ask-it-questions, default hear-mode + cut audio, colored answers + scroll-to-field,
email validation (no period), reformat + nonsense failsafe (post-completion), cross-fill, SSN mask+eye,
e-signature + auto date, English answers on export while UI is in-language, print all pages, review in
user's language + per-language dataset, privacy page, TTS voice selection. Live via ngrok.

## 10. Caveats / known gaps (read before "finishing" things)
- **"Full adeu" is token-anchored**, not a positional free-form md diff engine. Each answer is a
  real per-field `w:ins` tracked change. Going fully positional means reimplementing run-mapping.
- **Vercel build not verified by a push** (local `next build` is green; Node is pinned). If it
  fails, get the build log.
- **Field coverage**: CW 42 is deeply mapped (22 fields, hand-curated in `scripts/preprocess.ts`
  `CW42_FIELDS`). Other forms only have auto-detected identity fields — "full docx structure" for
  SAWS 2 PLUS etc. is the main remaining depth work (add curated field maps like CW42's).
- **Legacy/dead code**: `components/QuestionCard.tsx` and `app/api/understand/route.ts` are unused
  now (superseded by chat) — safe to delete.
- **Signature image** is shown on `/review` only; the form's signature line gets the auto **date**,
  not an embedded image (image-in-docx was out of scope).
- **docx-preview & live voice** were verified by clicking the app, not headlessly.
- `data/i18n/<lang>.json` grows at runtime and is committed (seeded `espa_ol.json`); on serverless
  the write is a no-op (read-only FS) but reads still work from committed snapshots.

## 11. Common extension tasks
- **Deepen a form** (e.g. SAWS 2 PLUS): add curated entries to `CW42_FIELDS`-style logic in
  `scripts/preprocess.ts` (give each field a unique `anchor` substring from `data/forms/<id>.md`),
  add any new groups to `GROUPS`, `npm run preprocess`, commit `data/`.
- **Add a question**: add to `GROUPS` (set `isCore`+`order` to include in the interview); map it to
  form fields via anchors; preprocess.
- **Change fill styling / tracked-change behavior**: `lib/docx/fillEngine.ts`.
- **Change chat behavior** (queue, voice, approval): `app/chat/page.tsx` + `components/chat/*`.
- **Verify**: `npm run build`; `curl -XPOST /api/fill` to confirm a form fills with 0 leftover
  `{{...}}` tokens; click through `/chat` for the live experience.

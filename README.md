# Homeless Assistance Form Assistant

A multilingual, voice-enabled assistant that helps Santa Clara County applicants
complete the **CalWORKs Homeless Assistance** packet. The applicant answers each
common question **once** (by voice, in their language); the tool reuses those
answers across every form, explains confusing form language in plain terms, and
generates completed `.docx` files with the answers inserted as Word tracked
changes. Privacy-first: answers live only in the browser and can be deleted with
one tap.

Built for: **CW 42** (priority), plus CW 74, SAWS 1, SAWS 2 PLUS, SAWS 2A SAR,
and SCD 508.

## Stack
Next.js 16 (App Router) · TypeScript · Tailwind v4 · OpenAI (GPT-4o Transcribe +
GPT-4o + TTS) · pizzip (DOCX) · docx-preview (in-browser preview).

## What it looks like (chatbot)
The core is a single conversational surface (`/chat`): the assistant **typewrites**
each question, reads it aloud (hear-mode by default, audio cuts when you move on),
takes **voice or text**, and you can **ask it questions** mid-flow. Each answer is
applied to the **md form** and shown on the right as a **Word tracked change** on the
live document; an **Approve / Approve-all** panel accepts the changes. Questions appear
in the user's language only once translated (no English flicker); answers are stored in
**English** for the official form.

## Setup & run

Node is provided via nvm (not on the default PATH):

```bash
source ~/.nvm/nvm.sh && nvm use 24
npm install                 # already done
cp .env.local.example .env.local   # then paste your OPENAI_API_KEY
npm run dev                 # http://localhost:3000
```

The app is **fully usable without a key** (text input, English UI). Adding
`OPENAI_API_KEY` turns on speech-to-text, spoken questions, answer
understanding, and translation.

## One-time preprocessing
`scripts/preprocess.ts` reads the official forms in `forms/`, injects
`{{token}}` placeholders at each field, and emits the field maps + question
groups into `data/`. It is already run (outputs are committed). Re-run only if
the source forms or the curated field map change:

```bash
npm run preprocess
```

## How it works
- **`data/`** — generated, read-only at runtime: `templates/*.docx` (placeholdered
  copies), `forms/*.json` (field maps), `question-groups.json`, `profile-schema.json`.
  Originals in `forms/` are never modified.
- **`lib/docx/fillEngine.ts`** — replaces each `{{token}}` run with the answer.
  `mode=preview` → plain blue runs (renders reliably in the browser);
  `mode=export` → Word tracked-change `<w:ins>` insertions (for download).
- **Flow**: `/` → `/language` → `/sign` (e-signature + auto date) → `/chat` (the
  unified assistant) → `/review` (summary, document checklist, downloads, delete).
  `/forms` is an overview; `/print/[id]` is a clean full-document print/PDF view.
- **Other touches**: SSN masked with an eye toggle; per-question Skip; a one-time
  post-interview pass reformats answers and flags nonsense; `/api/translate` is backed
  by a growing per-language dataset (`data/i18n/<lang>.json`); `/privacy` page; TTS
  voice selection; "Delete my information" wipes the profile + translation caches.

## Share a test link (ngrok)
Vercel deploys from the team's pushes (Node is pinned via `engines` + `.nvmrc`). For an
instant shared link, tunnel the running server:
```bash
ngrok config add-authtoken <token>
npm run build && npm run start    # serves :3000
ngrok http 3000                   # prints the public https URL
```
ngrok-free shows a one-time "Visit Site" interstitial in the browser — click through.

## Verified
- `npm run build` passes (TypeScript + all routes).
- `/api/fill` produces valid `.docx` for all 6 forms with 0 leftover tokens and
  real `w:ins` tracked changes.
- OpenAI routes degrade to `503 no_key` when no key is set; the UI falls back to
  text + English.

> Note: PDF export is the browser's **Print → Save as PDF** on the live preview
> (no LibreOffice dependency). The completed `.docx` is the primary deliverable.

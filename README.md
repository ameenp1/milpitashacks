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
- **Flow**: `/` → `/language` (voice) → `/interview` (≈20 grouped questions) →
  `/forms` (checklist with status) → `/forms/[id]` (guided Q&A + live preview) →
  `/review` (summary, document checklist, downloads, print-to-PDF, delete).

## Verified
- `npm run build` passes (TypeScript + all routes).
- `/api/fill` produces valid `.docx` for all 6 forms with 0 leftover tokens and
  real `w:ins` tracked changes.
- OpenAI routes degrade to `503 no_key` when no key is set; the UI falls back to
  text + English.

> Note: PDF export is the browser's **Print → Save as PDF** on the live preview
> (no LibreOffice dependency). The completed `.docx` is the primary deliverable.

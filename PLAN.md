# PLAN — parallelizing revisions_2.md across 4 branches

Goal: four people + agents implement [revisions_2.md](revisions_2.md) **in parallel**
with **near-zero merge conflicts**, each on their own branch, all cleanly mergeable to
`main`. Role details: [ROLES.md](ROLES.md). App architecture: [CONTEXT.md](CONTEXT.md).

## 1. The core idea: ownership, not coordination
Conflicts happen when two branches edit the same lines. We avoid that by giving **every
file a single owner**. Today most tasks pile into one 439-line file
([app/chat/page.tsx](app/chat/page.tsx)); Phase 0 breaks it into owned pieces so the four
streams never touch the same file.

## 2. Phase 0 — decomposition (Role 4, merged to `main` BEFORE anyone branches)
Role 4 lands one small, behavior-preserving PR that:
1. Extracts `app/chat/page.tsx` into:
   - `components/chat/ChatTranscript.tsx` (messages + typewriter + audio) → Role 2
   - `components/chat/ChatComposer.tsx` (input + mic + SSN field) → Role 2
   - `components/chat/DocumentPanel.tsx` (preview + answer list + form switcher) → Role 3
   - `lib/chat/useChatFlow.ts` (queue, currentGroup, activeForm, submit) → Role 4
   - `app/chat/page.tsx` becomes a thin shell wiring the four together.
2. Adds `lib/chat/contracts.ts` with the prop/return types each panel consumes.
3. Removes the `approved` field from `lib/profile.ts` and the `approved` branch from
   `fillEngine` usage (answers are always accepted now — L3/L5).
4. Deletes `components/chat/ApprovalPanel.tsx` (Role 3 replaces it with `AnswerList`).

After Phase 0 is on `main`, everyone runs `git pull` and branches.

## 3. File ownership matrix (one owner per file)
| Area | Files | Owner |
|---|---|---|
| Chat brain | `app/api/chat/route.ts`, `lib/chat/guideScript.ts`*, language-detect | **R1** |
| Voice/audio | `components/VoiceButton.tsx`, `lib/client/useSpeak.ts`, `components/chat/Typewriter.tsx`, `ChatTranscript.tsx`*, `ChatComposer.tsx`* | **R2** |
| Document/forms | `components/FormPreview.tsx`, `DocumentPanel.tsx`*, `AnswerList.tsx`*, `lib/docx/fillEngine.ts`, `app/api/fill/route.ts`, `scripts/preprocess.ts`, `data/**`, `app/print/**`, `app/sign/page.tsx`, signature block of `app/review/page.tsx` | **R3** |
| Flow/store/i18n | `app/chat/page.tsx`, `lib/chat/useChatFlow.ts`*, `lib/chat/contracts.ts`*, `lib/profile.ts`, `components/I18nProvider.tsx`, `app/language/page.tsx` | **R4** |
| Shared (read-mostly, **additive only**) | `lib/types.ts`, `lib/data.ts`, `lib/status.ts` | **R4** approves edits |

`*` = new file created in Phase 0 / by its owner. **If a file isn't yours, don't edit it —
request the change from its owner or via the contract.**

## 4. Task → role map (all of revisions_2.md)
| Line | Task | Role |
|---|---|---|
| L2 | Detect different-language replies, offer to switch | R1 detect · **R4** apply |
| L3 | Remove approve/disapprove; show clearly what changed in the doc | **R3** |
| L3 | Default to mic + big button; auto-start mic after TTS | **R2** |
| L4 | Audio starts with typewriting; single "Thank you… [next question]" turn | R2 audio · R1 phrase · **R4** compose |
| L5 | Replace approval with a list + Edit button | **R3** |
| L6 | Click the document to edit fields in real time | **R3** (uses R4 `setAnswer`) |
| L7 | Always scroll/highlight the field just answered | R3 mechanism · R4 target |
| L8 | Put the signature in the signature box | **R3** |
| L9 | Ask only what the active form needs; reuse cross-form; never ask missing | **R4** |
| L10 | Switching forms updates/continues the chat for that form | **R4** |
| L11 | Guide-like agent: intro, steps, CalWORKs-first (skip-to-housing stub) | R1 copy · R4 ordering |
| L12 | SSN as asterisks in chat; don't echo/confirm digits, ask user to look it over | R2 mask · **R1** prompt |

## 5. Shared contracts (`lib/chat/contracts.ts`, owned by R4)
The only file multiple roles depend on. Defined in Phase 0; changes are **additive** and
announced. Sketch:
```ts
// chat brain (R1 produces, R4 consumes)
interface ChatResult { type:"answer"|"question"|"unclear"; value:string; reply:string;
                       detectedLanguage?: { code:string; label:string } }
// transcript (R2)
interface ChatTranscriptProps { messages: Msg[]; hearMode:boolean; voice:string; onSpeakEnd:()=>void }
// composer (R2)
interface ChatComposerProps { currentGroup: QuestionGroup|null; sending:boolean;
                              onSubmit:(text:string)=>void; micFirst:boolean }
// document panel (R3)
interface DocumentPanelProps { formId:string; answers:Record<string,string>;
                               activeField?:string; onEditField:(g:string,v:string)=>void;
                               onSwitchForm:(id:string)=>void }
```
Roles 2 & 3 build to these props; Role 4 supplies them from `useChatFlow`.

## 6. Conventions that keep merges clean
- **Branch off `main` after Phase 0**; rebase on `main` before opening a PR.
- **Never edit another role's files.** Need a new store action / type? Ask R4 (they pre-add
  it in Phase 0 where possible).
- **Only R3 runs `npm run preprocess` and commits `data/`** — others never touch
  `data/**` or `*.docx` (binary-merge pain). R3 also owns `data/i18n/**`.
- **Additive edits to shared files** (`types.ts`, `data.ts`, `contracts.ts`): add, don't
  reorder/rename. No drive-by reformatting anywhere (keep diffs minimal — see CLAUDE.md).
- **Small, single-purpose PRs**, each green on `npm run build`.
- Commit style: end messages with the `Co-Authored-By` line; **commit, don't push to
  Vercel** — the integration lead handles `main`→deploy.

## 7. Merge order & integration
1. **Phase 0** (R4) → `main`.
2. R1, R2, R3 in **any order / parallel** (disjoint files → no conflicts).
3. R4's flow work (L9/L10/L2/L4 wiring) merges after R1/R3 land their contracts, then R4
   does the **integration pass** + final `npm run build` + click-through on the ngrok link.
4. Cross-role seams to verify at integration: language-switch (R1→R4→R2), combined turn
   (R1+R4+R2), click-to-edit + scroll (R3↔R4 `setAnswer`/`activeField`), form-switch
   (R4→R3 panel).

## 8. Per-task acceptance (smoke)
Build green; then on `/chat`: agent introduces itself + offers CalWORKs-first (L11); mic is
big and auto-starts after each spoken turn (L3); audio begins with typing and the
"Thank you… next question" plays whole (L4); answers list shows Edit, no approve buttons
(L5); clicking a field on the doc edits it (L6); the just-answered field always
scrolls+highlights (L7); SSN shows as `••••` and the bot never prints the digits (L12);
switching forms re-scopes the questions (L9/L10); a non-English reply offers a language
switch (L2); the signature lands in the signature box (L8).

## 9. Risks
- **Phase 0 is a hard prerequisite** — parallel work before it lands will conflict.
- `lib/chat/contracts.ts` is the one shared dependency; treat changes as an API (announce,
  additive). 
- `app/chat/page.tsx` stays thin and R4-only; resist adding logic there (put it in panels
  or the flow hook).

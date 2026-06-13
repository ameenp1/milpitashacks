# errors.md — gotchas from the Role 1 (Conversation Designer) pass

Things I hit or noticed while implementing R1's tasks (guide persona, language
detection, SSN-safe prompting, "Thank you" phrasing). Most are **seams to other
roles** — R1's output is inert until R4 wires it. Read before integrating.

## Cross-role seams (R4 must finish these — R1 only produced the inputs)

1. **`detectedLanguage` isn't surfaced by the consumer yet.**
   `/api/chat` now returns `{ ..., detectedLanguage?: {code,label} }`, but the
   `ChatResult` type lives in [lib/client/api.ts](lib/client/api.ts) (and the PLAN
   §5 sketch puts it in [lib/chat/contracts.ts](lib/chat/contracts.ts)) — **neither
   includes `detectedLanguage`**. The field arrives at runtime regardless, but R4
   must add it to the type and read it in `useChatFlow.submit` (R4's L2). I left
   both files untouched (not my lane).

2. **The combined "Thank you… [next question]" turn is NOT composed yet (L4).**
   Today [useChatFlow.ts](lib/chat/useChatFlow.ts) adds `r.reply` as its own bot
   turn (line ~169) **and then** the next question as a separate turn — that is
   exactly the "Thank you gets cut off" bug from revisions_2 L4. R1 provides
   `ACK = "Thank you."` in [guideScript.ts](lib/chat/guideScript.ts); R4 must
   build one turn = `t(ACK) + " " + nextQuestion` and **stop appending `r.reply`
   for answers** (otherwise you get a double acknowledgement: LLM reply + ACK).

3. **`detectedLanguage.label` is the English name** (e.g. `"Spanish"`), not the
   app's `langLabel`/native form. R4 should map by **`code`** to its own entry in
   [app/language/page.tsx](app/language/page.tsx), not pass `label` straight into
   `setLanguage` — the I18n target label may differ (e.g. "Español").

4. **Detection must stay an *offer*, never auto-apply.** The prompt guards against
   names/addresses/numbers/single words, but temperature-0 ≠ zero false positives.
   R4 should prompt "Switch to X?" (ROLES L2), never switch silently.

5. **guideScript strings need `ensure()` before display.** They are English
   *source* strings (R1 doesn't translate). R4 must run the exported
   `GUIDE_STRINGS` through I18n `ensure()` and only show once `ready()` — same
   no-flicker rule the question flow already uses.

6. **The greeting is currently hardcoded** in `useChatFlow` (the
   `"Hi! I'll help you fill out your forms…"` turn, ~line 121). R4 must replace it
   with `INTRO` + `CALWORKS_PROMPT` from guideScript, or the user sees two intros.

7. **CalWORKs skip-to-housing is a stub.** `CALWORKS_CHOICES` includes the skip
   option and `CALWORKS_PROMPT` explains it, but the actual queue re-scoping is
   R4's ordering work and intentionally not implemented ("you get the idea" — L11).

## R1-internal behavior notes

8. **SSN redaction is reply-only.** `value` still returns the cleaned SSN *with
   digits* (it must fill the form). R1 only guarantees the **spoken/typed `reply`
   has no digits** (prompt + a hard `replace(/[0-9]/g,"")` failsafe for
   `answerType==="ssn"`). The on-screen `••••` masking is R2's composer job (L12).

9. **No-key fallback bypasses the brain entirely.** In `useChatFlow.submit`, the
   `NoKeyError` path stores the raw user text and **never calls `/api/chat`** — so
   language detection, SSN-safe phrasing, and value-cleaning don't run without an
   `OPENAI_API_KEY`. Raw SSN text is stored as the value there (no reply is spoken,
   so no digit leak, but it's unprocessed). Acceptable fallback; just know it.

## Environment

10. **nvm path in CONTEXT.md is wrong on this machine.** `~/.nvm/nvm.sh` doesn't
    exist here; `node` (v25.2.1) is already on PATH via Homebrew. Also
    **`node_modules` is not installed**, so there's no local `tsc`/`next build` —
    run `npm install` first. I verified my two files with `node --check`
    (syntax) only; a full `npm run build` still needs to be run at integration.

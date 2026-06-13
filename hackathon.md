\# System prompt

## **Goal:**

Build the voice enabled app discussed in the core idea below. One-shot our MVP design, first plan and address and ask any ambiguities before starting.

## **2\. Start Here (before writing any code)**

1. Read every file in `context_docs/`.   
2. Read the core idea and internalize the full idea below along with the CLAUDE.md.  
3. Inspect `forms/`. All official PDFs you will have live here. Self-host these  
4. State your assumptions and a short build plan before implementing.

**Make an ordered checklist before you start to stay organized.**

\# Core Idea

\# \--------------------------------------------------------------------

## **Track**

Create accessible, human-centered tools that help people experiencing housing insecurity connect with essential resources, coordinate support, and navigate the path to sustainable housing with dignity.m

## **Core Idea**

Build a multilingual, voice-enabled form assistant that helps applicants complete CalWORKs Homeless Assistance forms faster, more accurately, and with less stress.

The MVP focuses on Santa Clara County applicants applying for CalWORKs Homeless Assistance. It starts with CW 42 and the most important adjacent forms needed for CalWORKs eligibility, apparent eligibility, housing search, or immediate aid.

The tool lets applicants answer common questions once, reuses those answers across forms, explains confusing form language in plain language, and generates completed PDFs for review.

## **Target User**

The user is the applicant experiencing homelessness or housing insecurity.

* Using an ipad or computer

## **Relevant Forms**

The MVP should focus on a small verified set of forms.

The files are in the folder \`\`\`forms/\`\`\`. Make sure you assess which forms are there.

Priority forms:

* CW 42: Statement of Facts — Homeless Assistance  
* SAWS 1: Initial application/request for aid  
* SAWS 2 PLUS: Main application for CalFresh, Cash Aid, and/or Medi-Cal  
* CW 74: Permanent Housing Search Document  
* SAWS 2A SAR or other SAWS forms required in the CalWORKs packet  
* Scd508: Voter registration

## **One-Shot MVP Plan**

The goal is a one-shot MVP.

Build first:

* Self-host the priority DOCXs  
* Ability to edit the DOCX files with tracked changes, reimplementing the logic of [https://github.com/dealfluence/adeu](https://github.com/dealfluence/adeu)  
  * The process is to extract mds from the docx, create a diff, and then apply the diff to change the text back to the docx  
* CW 42 field mapping  
* Extract questions from the adjacent forms  
* Group similar questions into reusable fields  
* Build a short applicant profile from the most common fields  
* Fill CW 42 automatically from profile answers  
* User side: Views translated questions if chosen language is non-English, use a map to map English questions to non-English counterparts.  
  * Use **GPT-4o Transcribe** for speech to text  
  * **GPT-4o** for question answering.  
* Generate missing-information checklist  
* Let the applicant review and fill the DOCX side by side using voice.  
* Prepare completed DOCXs  
* Offer to delete the applicant’s data at the end  
* Audio is used to read questions out. The idea is that from all the forms, we have a set of all the possible question groups, so the user just needs to answer each group once.

## **Models**

* Use **GPT-4o Transcribe \+ GPT-4o**   
* GPT-4o Transcribe asks each question group and processes the response, GPT-4o (or a smarter GPT-5 agent) is the core agent filling out forms and providing intelligence.

## **Data**

* Store locally for now  
* Use Json

## **Question Extraction and Grouping**

The system should extract all questions from the self-hosted DOCXs, then group similar questions.

Process:

* Extract DOCX fields, labels, and visible text  
* Use regex and text matching first for obvious repeats (‘what is your name’, ‘name’)  
* Use GPT after simpler matching to reduce unnecessary calls  
* Create a set of all extracted questions  
* Group similar questions into broad reusable categories  
* If a question does not fit an existing group, create a new group  
* Map each grouped question back to the exact DOCX fields it can fill

Example group:

* “What is your name?”

Each group should store:

* Plain-language questions  
* Original form wording  
* Answer type  
* Which forms use it  
* Which DOCX fields it fills  
* Always reused automatically if answer exists  
* Whether it needs applicant review

## **Core Profile Questions**

The core profile should come from the extracted questions, not just assumptions.

## **Applicant Flow**

1. Applicant opens the tool.  
2. Applicant chooses preferred language (voice for every step ask like “What is your preferred language”)  
3. Applicants answer the top 20 common questions through voice (in preferred language).  
4. Assistant builds a temporary profile.  
5. Applicants see all the forms they must fill out.  
6. Applicant opens a form task.  
7. Assistant pre-fills known fields.  
8. The assistant asks only missing or uncertain questions.  
9. Applicants review the form side by side with the DOCX.  
10. Applicant generates completed DOCX.  
11. Applicant downloads the form package.  
12. Applicant deletes their information.

## **Form Checklist**

Each form appears as a task:

* Not started  
* In progress  
* Needs human review (everything is filled)  
  * If the form is filled and they open it one last time, this is marked as good.  
* Complete

## **Form-Filling Experience**

The assistant should not force the applicant to read a government DOCX first.

Default view:

* Simple guided question (read through voice)  
* Original DOCX preview side by side  
* Highlight showing where the answer goes  
* Voice input  
* Skip-for-now option

As the applicant answers, the assistant fills the form.

Questions should support a text input if desired.

## **Visual Review System**

After the assistant fills a form, the applicant reviews it with labels.

Use color plus text, not color alone:

* Filled from your profile  
* Needs your review  
* Missing

Possible design:

* Blue label: Filled from your profile  
* Yellow label: Needs your review  
* Green outline: Missing

## **Completed Output**

At the end, the tool generates:

* Completed DOCX/PDF forms  
* Missing-information checklist  
* Supporting-document checklist  
* Applicant summary page  
* Final review screen before download or submission

The MVP should generate completed DOCX/PDFs first for exporting.

## **Language Support**

The applicant chooses a preferred language at the beginning.

The official DOCX should remain unchanged. The assistant translates the user-facing layer:

* Guided interview questions  
* Plain-language explanations  
* Help text  
* Error messages  
* Review labels  
* Checklist items  
* Document reminders

GPT API is used for translation in the MVP.

U.S.-specific terms should stay recognizable. For example, SSN should remain SSN.

**Privacy**

The product should be privacy-first.

* Provide a clear “Delete my information now” button at the end.

## **Human-Centered Risks**

Human help should be recommended when an error occurs, use a clear Toast.

\# \--------------------------------------------------------------------

\# For Claude’s coding later on.

\# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

\*\*Tradeoff:\*\* These guidelines bias toward caution over speed. For trivial tasks, use judgment.

\#\# 1\. Think Before Coding

\*\*Don't assume. Don't hide confusion. Surface tradeoffs.\*\*

Before implementing:

\- State your assumptions explicitly. If uncertain, ask.

\- If multiple interpretations exist, present them \- don't pick silently.

\- If a simpler approach exists, say so. Push back when warranted.

\- If something is unclear, stop. Name what's confusing. Ask.

\#\# 2\. Simplicity First

\*\*Minimum code that solves the problem. Nothing speculative.\*\*

\- No features beyond what was asked.

\- No abstractions for single-use code.

\- No "flexibility" or "configurability" that wasn't requested.

\- No error handling for impossible scenarios.

\- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

\#\# 3\. Surgical Changes

\*\*Touch only what you must. Clean up only your own mess.\*\*

When editing existing code:

\- Don't "improve" adjacent code, comments, or formatting.

\- Don't refactor things that aren't broken.

\- Match existing style, even if you'd do it differently.

\- If you notice unrelated dead code, mention it \- don't delete it.

When your changes create orphans:

\- Remove imports/variables/functions that YOUR changes made unused.

\- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

\#\# 4\. Goal-Driven Execution

\*\*Define success criteria. Loop until verified.\*\*

Transform tasks into verifiable goals:

\- "Add validation" → "Write tests for invalid inputs, then make them pass"

\- "Fix the bug" → "Write a test that reproduces it, then make it pass"

\- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

\`\`\`

1\. \[Step\] → verify: \[check\]

2\. \[Step\] → verify: \[check\]

3\. \[Step\] → verify: \[check\]

\`\`\`

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

\---

\*\*These guidelines are working if:\*\* fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
  
Next steps after MVP  
First fix the format issue, then address all of the other points. Once you do the formatting point, please let us know. We will then tell you to continue addressing the other points after we review the format part. But also make a good plan to address everything and expect more concerns to fix for formatting after this overhaul.

Also we have imported the github repo to vercel so after the format issue, deploy it and give us back the link for my whole group to test (we may need to push ourselves. You should treat this as a step from now on, after each revision, add and commit, and we will push manually so that it updates on vercel. Also build failed first time so address vercel errors.

- Implement full docx structure  
- Possibly implement more voice types.  
- Review MVP and list all inconsistencies or things to fix  
  - List:  
    - Do not automatically continue. Have person manually save and continue before going to the next question.  
    - No period after email question. Determinalistically check if the email is valid as well, prompt again if it is not.  
    - For responses like address, have another agent pass over after all questions to make sure each is formatted correctly, because people usually may say “uh” or other filler. Do not put period after each response.  
    - Agent should reformat.  
    - Also for form specific questions after the top 20, they should help fill other ones as well if they are part of a group if you answer them.  
    - Fix save and continue button in the form specific question menu.  
    - Cannot ask questions to it right now.  
    - Just typed answers for specific form will be a different color to see it update clearly.  
      - Also when you answer a question, it scrolls to the part in the pdf response to it  
    - Default to hear mode.  
    - Also have a failsafe for bullshit answers. I think once the form is done, it should check for the bullshit answers, not during, to prevent lag.  
    - When print, show the entire PDF not just the page it is displaying.  
    - Add a review button if we need, which pulls up the Review this form part.  
    - Social Security number is in \*\*\*\* and eye icon to view if needed.  
    - Add a signature tool at the start for E signature. Add DATE automatically.  
    - Add a privacy page. SOC 2 compliance (just kidding)  
    - Format  
      - The overall format needs to be very different: right now it is a website you navigate through with previously-determined questions.  
      - The format should instead be a literal chatbot that typewrites the question on the spot not like already there. It should have access to an md version of the form, ask questions, and fill out the md form after each question and apply a diff to the docx displayed on the right as a tracked change  
      - There should also be UI for the user to approve the tracked changes on the document and an approval all button  
    - PDF rendering in other languages is not working as expected. On the frontview it should render Chinese, but when you export/print, it puts all the Chinese answers into English using GPT so it is form.  
    - When you move onto the next question, cut the audio.  
    - Questions should not be rendered in English in the review area if the preferred language is Chinese. Once you preprocess it once for a language, you shouldn’t need to anymore, it is like a dataset for language as well for the questions, over time users will cover anything and new languages will be periodically added.

    - If vercel is too problematic, we can use Ngrk to make the server not locally hosted  
1. Auuthtoken : 3F5wmD8Mt31wwtkJCuoAPPiz5nw\_7R8VoWZakZpnGL83A86E3  
2. ngrok config add-authtoken $YOUR\_AUTHTOKEN


import { NextRequest, NextResponse } from "next/server";
import { getClient, MODELS, errorResponse } from "@/lib/openai";

export const runtime = "nodejs";

// POST { question, answerType, choices?, transcript, language }
//   -> { value, needsClarification, clarification }
// Turns a spoken (possibly non-English) reply into a clean answer for the
// English government form.
export async function POST(req: NextRequest) {
  try {
    const { question, answerType, choices, transcript, language } =
      (await req.json()) as {
        question: string;
        answerType: string;
        choices?: string[];
        transcript: string;
        language?: string;
      };

    const client = getClient();
    const system = [
      "You help an applicant fill out a US government form (CalWORKs Homeless Assistance).",
      "Convert the applicant's spoken reply into a clean, concise answer VALUE written in English for the form.",
      "Rules:",
      "- For answerType 'boolean', VALUE must be exactly 'Yes' or 'No'.",
      "- For answerType 'choice', VALUE must be exactly one of the provided choices.",
      "- For 'date', use MM/DD/YYYY when possible.",
      "- For 'ssn', return digits as said (keep dashes if given). Do not invent digits.",
      "- For names/addresses, clean capitalization but keep the applicant's information.",
      "- Keep US terms recognizable (SSN, ZIP).",
      "- If the reply does not actually answer the question, set needsClarification=true and write a short clarification question in the applicant's language.",
      'Respond ONLY as JSON: {"value": string, "needsClarification": boolean, "clarification": string}.',
    ].join("\n");

    const user = [
      `Question: ${question}`,
      `answerType: ${answerType}`,
      choices?.length ? `choices: ${choices.join(", ")}` : "",
      `Applicant's language: ${language || "English"}`,
      `Applicant said: "${transcript}"`,
    ]
      .filter(Boolean)
      .join("\n");

    const res = await client.chat.completions.create({
      model: MODELS.chat,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    const parsed = JSON.parse(res.choices[0]?.message?.content || "{}");
    return NextResponse.json({
      value: typeof parsed.value === "string" ? parsed.value : "",
      needsClarification: !!parsed.needsClarification,
      clarification:
        typeof parsed.clarification === "string" ? parsed.clarification : "",
    });
  } catch (err) {
    return errorResponse(err);
  }
}

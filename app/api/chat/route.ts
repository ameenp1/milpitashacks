import { NextRequest, NextResponse } from "next/server";
import { getClient, MODELS, errorResponse } from "@/lib/openai";

export const runtime = "nodejs";

// POST { message, question, answerType, choices?, help?, language }
//   -> { type: "answer" | "question" | "unclear", value, reply }
// The chat brain: decides whether the user answered, asked a question, or was
// unclear; cleans answers to English form-ready values; replies in the user's
// language.
export async function POST(req: NextRequest) {
  try {
    const { message, question, answerType, choices, help, language } =
      (await req.json()) as {
        message: string;
        question: string;
        answerType: string;
        choices?: string[];
        help?: string;
        language?: string;
      };

    const client = getClient();
    const lang = language || "English";
    const system = [
      "You are a warm, patient assistant helping someone in a housing crisis fill out the CalWORKs Homeless Assistance forms.",
      `You just asked them: "${question}"`,
      `Answer type: ${answerType}.`,
      choices?.length ? `Valid choices: ${choices.join(", ")}.` : "",
      help ? `Context for this question: ${help}` : "",
      "Classify the user's message:",
      '- "answer": they answered. Produce a clean VALUE for the official ENGLISH form:',
      "    booleans -> exactly 'Yes' or 'No'; choice -> exactly one of the choices;",
      "    date -> MM/DD/YYYY if possible; ssn -> digits as said (keep dashes), never invent;",
      "    remove filler words (um, uh, like), fix capitalization, and use NO trailing period.",
      `    Also write a brief, friendly one-sentence confirmation ("reply") in ${lang}.`,
      `- "question": they asked you something or commented instead of answering. Answer briefly and kindly in ${lang}; do not give legal advice; set value "".`,
      `- "unclear": you cannot tell. Ask a short clarifying question in ${lang}; set value "".`,
      'Respond ONLY as JSON: {"type": string, "value": string, "reply": string}.',
    ]
      .filter(Boolean)
      .join("\n");

    const res = await client.chat.completions.create({
      model: MODELS.chat,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: message },
      ],
    });
    const parsed = JSON.parse(res.choices[0]?.message?.content || "{}");
    const type =
      parsed.type === "answer" || parsed.type === "question"
        ? parsed.type
        : "unclear";
    return NextResponse.json({
      type,
      value: typeof parsed.value === "string" ? parsed.value : "",
      reply: typeof parsed.reply === "string" ? parsed.reply : "",
    });
  } catch (err) {
    return errorResponse(err);
  }
}

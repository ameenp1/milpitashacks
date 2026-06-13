import { NextRequest, NextResponse } from "next/server";
import { getClient, MODELS, errorResponse } from "@/lib/openai";

export const runtime = "nodejs";

// POST { message, question, answerType, choices?, help?, language }
//   -> { type: "answer" | "question" | "unclear", value, reply, detectedLanguage? }
// The chat brain: decides whether the user answered, asked a question, or was
// unclear; cleans answers to English form-ready values; replies in the user's
// language; and flags when the user wrote in a different language (Role 4 offers
// to switch). Never echoes SSN digits back (revisions_2 L12).
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
    const isSsn = answerType === "ssn";
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
      isSsn
        ? "    SSN PRIVACY: this is a Social Security Number. NEVER write any SSN digits in the reply, and NEVER read the number back or ask the user to confirm a specific number. The reply must contain NO digits. Instead, acknowledge briefly and invite the user to look over their own SSN shown on the form/screen to make sure it's right."
        : "",
      `- "question": they asked you something or commented instead of answering. Answer briefly and kindly in ${lang}; do not give legal advice; set value "".`,
      `- "unclear": you cannot tell. Ask a short clarifying question in ${lang}; set value "".`,
      "Language: the user's chosen language is " +
        lang +
        ". If the user's MESSAGE is clearly written in a DIFFERENT language than " +
        lang +
        " (a real sentence in that language, not just a name, place, number, or single ambiguous word), include detectedLanguage with its ISO 639-1 code and English name, e.g. {\"code\":\"es\",\"label\":\"Spanish\"}. Otherwise OMIT detectedLanguage entirely.",
      'Respond ONLY as JSON: {"type": string, "value": string, "reply": string, "detectedLanguage"?: {"code": string, "label": string}}.',
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
    let reply = typeof parsed.reply === "string" ? parsed.reply : "";
    // Failsafe: never let SSN digits leak into the spoken/typed reply, no matter
    // what the model produced. Strip any digit runs from the SSN reply.
    if (isSsn) reply = reply.replace(/[0-9]/g, "").replace(/\s{2,}/g, " ").trim();

    const dl = parsed.detectedLanguage;
    const detectedLanguage =
      dl && typeof dl.code === "string" && typeof dl.label === "string"
        ? { code: dl.code, label: dl.label }
        : undefined;

    return NextResponse.json({
      type,
      value: typeof parsed.value === "string" ? parsed.value : "",
      reply,
      ...(detectedLanguage ? { detectedLanguage } : {}),
    });
  } catch (err) {
    return errorResponse(err);
  }
}

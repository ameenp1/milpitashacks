import { NextRequest, NextResponse } from "next/server";
import { getClient, MODELS, errorResponse } from "@/lib/openai";
import { getContextDocs } from "@/lib/server/contextDocs";

export const runtime = "nodejs";

// POST { messages: {role, content}[], language? } -> { reply }
// Free-form guide for the BenefitsCal online application. Unlike /api/chat (which
// drives the fixed form-filling question queue), this answers whatever the user
// asks while they work through https://benefitscal.com, grounded in the local
// knowledge base (context_docs/). The website itself renders beside the chat.
const APPLY_URL = "https://benefitscal.com/ApplyForBenefits/begin/ABOVR?lang=en";

export async function POST(req: NextRequest) {
  try {
    const { messages, language } = (await req.json()) as {
      messages: { role: "user" | "assistant"; content: string }[];
      language?: string;
    };

    const client = getClient();
    const lang = language || "English";
    const system = [
      "You are a warm, patient guide helping someone apply for benefits (CalWORKs cash aid, CalFresh food benefits, and Homeless Assistance) in Santa Clara County.",
      `They are filling out the official online application at ${APPLY_URL}, which is open in a panel next to this chat. You guide them through it step by step.`,
      `Reply in ${lang}. Keep answers short, plain, and encouraging — a few sentences at most. Use simple words; many users are in a housing crisis and may be stressed.`,
      "When they ask what to do next, give one concrete step at a time and tell them what to click or type on the page.",
      "Answer their questions using ONLY the reference material below. If the answer is not covered, say you are not sure and suggest they call their county worker or 211 — never invent eligibility rules, dollar amounts, or deadlines.",
      "Do not give legal advice. Do not ask for or repeat their Social Security Number.",
      "",
      "=== REFERENCE MATERIAL (CalWORKs / Homeless Assistance / CalFresh) ===",
      getContextDocs(),
    ].join("\n");

    const history = (Array.isArray(messages) ? messages : [])
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && m.content?.trim())
      .slice(-12)
      .map((m) => ({ role: m.role, content: m.content }));

    const res = await client.chat.completions.create({
      model: MODELS.chat,
      temperature: 0.3,
      messages: [{ role: "system", content: system }, ...history],
    });

    return NextResponse.json({
      reply: res.choices[0]?.message?.content?.trim() || "",
    });
  } catch (err) {
    return errorResponse(err);
  }
}

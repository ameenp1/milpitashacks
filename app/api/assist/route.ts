import { NextRequest, NextResponse } from "next/server";
import { getClient, MODELS, errorResponse } from "@/lib/openai";
import { getContextDocs } from "@/lib/server/contextDocs";

export const runtime = "nodejs";

// POST { messages: {role, content}[], language?, image? } -> { reply }
// Free-form guide for the BenefitsCal online application. Unlike /api/chat (which
// drives the fixed form-filling question queue), this answers whatever the user
// asks while they work through https://benefitscal.com, grounded in the local
// knowledge base (context_docs/). The website itself renders beside the chat.
// `image` is an optional screenshot of the user's screen (data URL) attached to
// the latest question, so the model can see the page they're asking about.
const APPLY_URL = "https://benefitscal.com/ApplyForBenefits/begin/ABOVR?lang=en";

export async function POST(req: NextRequest) {
  try {
    const { messages, language, image } = (await req.json()) as {
      messages: { role: "user" | "assistant"; content: string }[];
      language?: string;
      image?: string;
    };

    const client = getClient();
    const lang = language || "English";
    const hasImage = typeof image === "string" && image.startsWith("data:image");
    const system = [
      "You are a warm, patient guide helping someone apply for benefits (CalWORKs cash aid, CalFresh food benefits, and Homeless Assistance) in Santa Clara County.",
      `They are filling out the official online application at ${APPLY_URL}, which is open in a panel next to this chat. You guide them through it step by step.`,
      `Reply in ${lang}. Keep answers short, plain, and encouraging — a few sentences at most. Use simple words; many users are in a housing crisis and may be stressed.`,
      "When they ask what to do next, give one concrete step at a time and tell them what to click or type on the page.",
      hasImage
        ? "A screenshot of the user's current screen is attached to their latest message. Look at it to see exactly which page, field, or question they are on, and tailor your guidance to what is actually shown."
        : "",
      "Answer their questions using ONLY the reference material below. If the answer is not covered, say you are not sure and suggest they call their county worker or 211 — never invent eligibility rules, dollar amounts, or deadlines.",
      "Do not give legal advice. Do not ask for or repeat their Social Security Number.",
      "",
      "=== REFERENCE MATERIAL (CalWORKs / Homeless Assistance / CalFresh) ===",
      getContextDocs(),
    ]
      .filter(Boolean)
      .join("\n");

    type Turn = { role: "user" | "assistant"; content: unknown };
    const history: Turn[] = (Array.isArray(messages) ? messages : [])
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && m.content?.trim())
      .slice(-12)
      .map((m) => ({ role: m.role, content: m.content }));

    // Attach the screenshot to the most recent user turn as multimodal content.
    const last = history[history.length - 1];
    if (hasImage && last?.role === "user") {
      last.content = [
        { type: "text", text: last.content as string },
        { type: "image_url", image_url: { url: image, detail: "high" } },
      ];
    }

    const res = await client.chat.completions.create({
      model: MODELS.chat,
      temperature: 0.3,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messages: [{ role: "system", content: system }, ...history] as any,
    });

    return NextResponse.json({
      reply: res.choices[0]?.message?.content?.trim() || "",
    });
  } catch (err) {
    return errorResponse(err);
  }
}

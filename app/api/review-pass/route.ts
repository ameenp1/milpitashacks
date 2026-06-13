import { NextRequest, NextResponse } from "next/server";
import { getClient, MODELS, errorResponse } from "@/lib/openai";

export const runtime = "nodejs";

// POST { items: [{group, question, answerType, value}] }
//   -> { fixes: {group: cleanedValue}, issues: [{group, reason}] }
// Runs ONCE after the interview (not per-answer, to avoid lag): a final reformat
// pass + a nonsense ("bullshit answer") failsafe.
export async function POST(req: NextRequest) {
  try {
    const { items } = (await req.json()) as {
      items: { group: string; question: string; answerType: string; value: string }[];
    };
    if (!items?.length) return NextResponse.json({ fixes: {}, issues: [] });

    const client = getClient();
    const system = [
      "You are reviewing a person's answers to a US government form before they submit it.",
      "Each item is {group, question, answerType, value}.",
      "1) Produce a CLEANED value for the official English form: strip filler (um, uh, like), fix capitalization and spacing, remove any trailing period, format dates as MM/DD/YYYY, keep SSNs as digits. If it is already clean, return it unchanged.",
      "2) Flag an item as an ISSUE only if the value clearly does NOT answer its question or is obvious nonsense/gibberish. Do not flag short-but-valid answers.",
      'Respond ONLY as JSON: {"fixes": {"<group>": "<cleanedValue>"}, "issues": [{"group":"<group>","reason":"<short reason>"}]}.',
      "Put a group in fixes only when the cleaned value differs from the input.",
    ].join("\n");

    const res = await client.chat.completions.create({
      model: MODELS.chat,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: JSON.stringify({ items }) },
      ],
    });
    const parsed = JSON.parse(res.choices[0]?.message?.content || "{}");
    return NextResponse.json({
      fixes: parsed.fixes && typeof parsed.fixes === "object" ? parsed.fixes : {},
      issues: Array.isArray(parsed.issues) ? parsed.issues : [],
    });
  } catch (err) {
    return errorResponse(err);
  }
}

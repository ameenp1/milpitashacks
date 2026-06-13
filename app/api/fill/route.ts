import { NextRequest, NextResponse } from "next/server";
import { fillDocx } from "@/lib/docx/fillEngine";

export const runtime = "nodejs";

// POST { formId, answers, mode? } -> completed .docx bytes.
//   mode="preview" -> plain colored answers (for in-browser docx-preview)
//   mode="export"  -> Word tracked-change insertions (for download)  [default]
export async function POST(req: NextRequest) {
  try {
    const { formId, answers, mode, approved } = (await req.json()) as {
      formId?: string;
      answers?: Record<string, string>;
      mode?: "preview" | "export";
      approved?: string[];
    };
    if (!formId) {
      return NextResponse.json({ error: "formId is required" }, { status: 400 });
    }
    const buf = fillDocx(formId, answers ?? {}, {
      mode: mode === "preview" ? "preview" : "export",
      approved,
    });
    const filename = `${formId}-completed.docx`;
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition":
          mode === "preview"
            ? "inline"
            : `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[/api/fill]", err);
    return NextResponse.json(
      { error: "Could not generate the document." },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

export async function GET() {
  try {
    const mdPath = join(process.cwd(), "public", "data", "dossier.md");
    const content = readFileSync(mdPath, "utf-8");
    return new NextResponse(content, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": 'attachment; filename="CTRLCELL_Tyrosinase_Dossier.md"',
        "Cache-Control": "no-cache",
      },
    });
  } catch {
    return NextResponse.json({ error: "Dossier not found" }, { status: 404 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { hasAccess } from "@/lib/access";
import { evaluate } from "@/lib/evaluate";

export async function POST(req: NextRequest) {
  const { expression } = (await req.json()) as { expression?: string };
  if (!expression?.trim()) {
    return NextResponse.json({ error: "Expression required" }, { status: 400 });
  }

  if (!(await hasAccess())) {
    return NextResponse.json({ requiresPayment: true });
  }

  try {
    const result = evaluate(expression);
    return NextResponse.json({ result: String(result) });
  } catch {
    return NextResponse.json({ error: "Invalid expression" }, { status: 400 });
  }
}

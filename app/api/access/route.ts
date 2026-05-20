import { NextResponse } from "next/server";
import { hasAccess } from "@/lib/access";

export async function GET() {
  return NextResponse.json({ hasAccess: await hasAccess() });
}

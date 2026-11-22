import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  ACADEMY_COOKIE,
  academyPlannerTicket,
  validateAcademySession,
} from "@/lib/academy-auth";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
async function session() {
  const token = (await cookies()).get(ACADEMY_COOKIE)?.value;
  if (!token) return null;
  const identity = await validateAcademySession(token);
  return identity && identity.role !== "STUDENT" ? token : null;
}
export async function GET() {
  try {
    const token = await session();
    if (!token)
      return NextResponse.json({ error: "session" }, { status: 401, headers });
    const { ticket } = await academyPlannerTicket(token, "academy-read");
    const r = await fetch(
      (process.env.LESSON_PLAN_INTERNAL_URL || "http://lessonplan_api:3001") +
        "/api/academy/plans",
      {
        method: "POST",
        cache: "no-store",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ticket }),
        signal: AbortSignal.timeout(15000),
      },
    );
    if (!r.ok) throw new Error("unavailable");
    return NextResponse.json(await r.json(), { headers });
  } catch {
    return NextResponse.json(
      { error: "unavailable" },
      { status: 503, headers },
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    const expected = new URL(process.env.ACADEMY_PUBLIC_URL || request.url)
      .origin;
    if (origin !== expected)
      return NextResponse.json({ error: "origin" }, { status: 403, headers });
    const token = await session();
    if (!token)
      return NextResponse.json({ error: "session" }, { status: 401, headers });
    const { url } = await academyPlannerTicket(token, "login");
    return NextResponse.json(
      { url: new URL(url, "https://kinshasachristianschool.org").toString() },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { error: "unavailable" },
      { status: 503, headers },
    );
  }
}

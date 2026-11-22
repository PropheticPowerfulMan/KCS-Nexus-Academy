import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  ACADEMY_COOKIE,
  getAcademyContext,
  validateAcademySession,
} from "@/lib/academy-auth";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const headers = { "Cache-Control": "private, no-store" };
  try {
    const token = (await cookies()).get(ACADEMY_COOKIE)?.value;
    if (!token)
      return NextResponse.json({ error: "session" }, { status: 401, headers });
    const identity = await validateAcademySession(token);
    if (!identity)
      return NextResponse.json({ error: "session" }, { status: 401, headers });
    const scope = {
      academicYear: request.nextUrl.searchParams.get("year") || undefined,
      semester:
        Number(request.nextUrl.searchParams.get("semester")) || undefined,
    };
    const context = await getAcademyContext(identity, scope);
    return NextResponse.json(
      context ? { data: context } : { error: "unavailable" },
      { status: context ? 200 : 503, headers },
    );
  } catch {
    return NextResponse.json(
      { error: "unavailable" },
      { status: 503, headers },
    );
  }
}

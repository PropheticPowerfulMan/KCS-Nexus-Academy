import { NextRequest, NextResponse } from "next/server";
import { ACADEMY_COOKIE, validateAcademySession } from "@/lib/academy-auth";
export const runtime = "nodejs";
export async function GET(request: NextRequest) { const token = request.cookies.get(ACADEMY_COOKIE)?.value; if (!token) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 }); const identity = await validateAcademySession(token); return identity ? NextResponse.json(identity) : NextResponse.json({ message: "Session expired or access denied" }, { status: 403 }); }

import { NextRequest, NextResponse } from "next/server";
import { ACADEMY_COOKIE, revokeAcademySession } from "@/lib/academy-auth";
export const runtime = "nodejs";
export async function POST(request: NextRequest) { const token = request.cookies.get(ACADEMY_COOKIE)?.value; if (token) await revokeAcademySession(token).catch(() => undefined); const response = NextResponse.json({ ok: true }); response.cookies.set(ACADEMY_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 }); return response; }

import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const identifier = String(form.get("identifier") || "").trim();
  const password = String(form.get("password") || "");
  if (!identifier || !password || identifier.length > 254 || password.length > 256) return NextResponse.redirect(new URL("/login?error=invalid", request.url), 303);
  const nexusApi = process.env.NEXUS_API_URL;
  if (!nexusApi) return NextResponse.redirect(new URL("/login?error=unavailable", request.url), 303);
  const login = await fetch(nexusApi.replace(/\/$/, "") + "/api/auth/login", {
    method: "POST", cache: "no-store",
    headers: { "content-type": "application/json", "x-kcs-local-auth-only": "true" },
    body: JSON.stringify({ identifier, password })
  });
  if (!login.ok) return NextResponse.redirect(new URL("/login?error=credentials", request.url), 303);
  const payload = await login.json() as { data?: { token?: string } };
  if (!payload.data?.token) return NextResponse.redirect(new URL("/login?error=session", request.url), 303);
  const launch = await fetch(nexusApi.replace(/\/$/, "") + "/api/academy/launch", {
    method: "POST", cache: "no-store", headers: { authorization: "Bearer " + payload.data.token }
  });
  if (!launch.ok) return NextResponse.redirect(new URL(launch.status === 403 ? "/forbidden" : "/login?error=access", request.url), 303);
  const launchPayload = await launch.json() as { data?: { url?: string } };
  if (!launchPayload.data?.url) return NextResponse.redirect(new URL("/login?error=launch", request.url), 303);
  return NextResponse.redirect(launchPayload.data.url, 303);
}

import { NextResponse } from "next/server";
export const runtime = "nodejs";
export function GET() { const configured = Boolean(process.env.ORBIT_API_URL && process.env.ACADEMY_INTEGRATION_KEY); return NextResponse.json({ status: configured ? "healthy" : "degraded", service: "kcs-nexus-academy", ssoConfigured: configured }, { status: configured ? 200 : 503 }); }

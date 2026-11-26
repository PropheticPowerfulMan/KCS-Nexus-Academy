import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const publicOrigin=process.env.ACADEMY_PUBLIC_URL || request.nextUrl.origin;
  const form = await request.formData();
  const identifier = String(form.get("identifier") || "").trim();
  const password = String(form.get("password") || "");
  const requestedWorkspace=String(form.get('workspace')||'');
  const workspace=['teacher','principal','senior','superadmin','student'].includes(requestedWorkspace)?requestedWorkspace:'';
  const returnToLogin=(error:string)=>{const url=new URL('/login',publicOrigin);url.searchParams.set('error',error);if(workspace)url.searchParams.set('workspace',workspace);return NextResponse.redirect(url,303)};
  const twoFactorCode=String(form.get("twoFactorCode")||"");
  if (!identifier || !password || identifier.length > 254 || password.length > 256) return returnToLogin('invalid');
  const nexusApi = process.env.NEXUS_API_URL;
  if (!nexusApi) return returnToLogin('unavailable');
  const login = await fetch(nexusApi.replace(/\/$/, "") + "/api/auth/application/login", {
    method: "POST", cache: "no-store",
    headers: { "content-type": "application/json", "x-kcs-local-auth-only": "true" },
    body: JSON.stringify({ identifier, password, twoFactorCode:twoFactorCode||undefined, application:"KCS_ACADEMY" })
  });
  if (!login.ok) return returnToLogin('credentials');
  const payload = await login.json() as { data?: { token?: string } };
  if (!payload.data?.token) return returnToLogin('session');
  const launch = await fetch(nexusApi.replace(/\/$/, "") + "/api/academy/launch", {
    method: "POST", cache: "no-store", headers: { authorization: "Bearer " + payload.data.token, ...(workspace?{"X-Nexus-Academic-Workspace":workspace}:{}) }
  });
  if (!launch.ok) return launch.status===403?NextResponse.redirect(new URL('/forbidden',publicOrigin),303):returnToLogin('access');
  const launchPayload = await launch.json() as { data?: { url?: string } };
  if (!launchPayload.data?.url) return returnToLogin('launch');
  return NextResponse.redirect(launchPayload.data.url, 303);
}

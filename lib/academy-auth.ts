import "server-only";
import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";
export const ACADEMY_COOKIE = "kcs_academy_session";
export type AcademyIdentity = { userId: string; orbitId: string; organizationId: string; role: string; expiresAt: string };
export const ACADEMY_ROLES = new Set(["STUDENT", "TEACHER", "ADMIN", "SUPER_ADMIN"]);
type LocalAccount = { email: string; accessCode: string; role: string; userId?: string; orbitId?: string; organizationId?: string; salt: string; passwordHash: string };
function config() { const orbitUrl = process.env.ORBIT_API_URL; const integrationKey = process.env.ACADEMY_INTEGRATION_KEY; if (!orbitUrl || !integrationKey) throw new Error("Academy SSO is not configured"); return { orbitUrl: orbitUrl.replace(/\/$/, ""), integrationKey }; }
function localSecret() { return process.env.ACADEMY_LOCAL_SESSION_SECRET || ""; }
function localAccounts(): LocalAccount[] { const raw = process.env.ACADEMY_LOCAL_ACCOUNTS; if (!raw) return []; const accounts = JSON.parse(raw) as LocalAccount[]; return Array.isArray(accounts) ? accounts.filter((account) => Boolean(account.email && account.accessCode && account.salt && account.passwordHash && ACADEMY_ROLES.has(account.role))) : []; }
function signature(value: string) { return createHmac("sha256", localSecret()).update(value).digest("base64url"); }
function validateLocalSession(token: string): AcademyIdentity | null {
  const parts = token.split("."); if (parts.length !== 3 || parts[0] !== "local" || !localSecret()) return null;
  const expected = Buffer.from(signature(parts[1]), "base64url"); const received = Buffer.from(parts[2], "base64url");
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
  try { const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as AcademyIdentity & { exp: number };
    if (!payload.exp || payload.exp <= Date.now() || !ACADEMY_ROLES.has(payload.role)) return null;
    const organization = process.env.ACADEMY_ORGANIZATION_ID; if (organization && payload.organizationId !== organization) return null;
    return { userId: payload.userId, orbitId: payload.orbitId, organizationId: payload.organizationId, role: payload.role, expiresAt: payload.expiresAt };
  } catch { return null; }
}
export function authenticateLocalAcademyAccount(identifier: string, password: string): LocalAccount | null {
  const normalized = identifier.trim().toLowerCase(); const account = localAccounts().find((candidate) => candidate.email.toLowerCase() === normalized || candidate.accessCode.toLowerCase() === normalized); if (!account) return null;
  const expected = Buffer.from(account.passwordHash, "hex"); const received = scryptSync(password, account.salt, expected.length);
  return expected.length === received.length && timingSafeEqual(expected, received) ? account : null;
}
export function createLocalAcademySession(account: LocalAccount) {
  if (!localSecret()) throw new Error("Academy local session secret is not configured"); const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);
  const identity: AcademyIdentity = { userId: account.userId || account.email, orbitId: account.orbitId || account.email, organizationId: account.organizationId || process.env.ACADEMY_ORGANIZATION_ID || "kcs", role: account.role, expiresAt: expiresAt.toISOString() };
  const payload = Buffer.from(JSON.stringify({ ...identity, exp: expiresAt.getTime() })).toString("base64url");
  return { token: `local.${payload}.${signature(payload)}`, identity, expiresAt };
}
async function orbitRequest(path: string, body: object) { const { orbitUrl, integrationKey } = config(); return fetch(orbitUrl + "/api/academy/sso/" + path, { method: "POST", cache: "no-store", headers: { "content-type": "application/json", "x-api-key": integrationKey }, body: JSON.stringify(body) }); }
export async function validateAcademySession(token: string): Promise<AcademyIdentity | null> { if (token.startsWith("local.")) return validateLocalSession(token); const response = await orbitRequest("validate", { token }); if (!response.ok) return null; const identity = await response.json() as AcademyIdentity; if (!ACADEMY_ROLES.has(identity.role)) return null; const organization = process.env.ACADEMY_ORGANIZATION_ID; return organization && identity.organizationId !== organization ? null : identity; }
export async function exchangeAcademyTicket(ticket: string) { const response = await orbitRequest("exchange", { ticket }); if (!response.ok) return { ok: false as const, status: response.status }; return { ok: true as const, data: await response.json() as { sessionToken: string; expiresAt: string; identity: AcademyIdentity } }; }
export async function revokeAcademySession(token: string) { if (token.startsWith("local.")) return; await orbitRequest("revoke", { token }); }

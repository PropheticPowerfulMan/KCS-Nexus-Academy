import "server-only";
export const ACADEMY_COOKIE = "kcs_academy_session";
export type AcademyIdentity = { userId: string; orbitId: string; organizationId: string; role: string; expiresAt: string };
export const ACADEMY_ROLES = new Set(["TEACHER", "ADMIN", "SUPER_ADMIN"]);
function config() { const orbitUrl = process.env.ORBIT_API_URL; const integrationKey = process.env.ACADEMY_INTEGRATION_KEY; if (!orbitUrl || !integrationKey) throw new Error("Academy SSO is not configured"); return { orbitUrl: orbitUrl.replace(/\/$/, ""), integrationKey }; }
async function orbitRequest(path: string, body: object) { const { orbitUrl, integrationKey } = config(); return fetch(orbitUrl + "/api/academy/sso/" + path, { method: "POST", cache: "no-store", headers: { "content-type": "application/json", "x-api-key": integrationKey }, body: JSON.stringify(body) }); }
export async function validateAcademySession(token: string): Promise<AcademyIdentity | null> { const response = await orbitRequest("validate", { token }); if (!response.ok) return null; const identity = await response.json() as AcademyIdentity; if (!ACADEMY_ROLES.has(identity.role)) return null; const organization = process.env.ACADEMY_ORGANIZATION_ID; return organization && identity.organizationId !== organization ? null : identity; }
export async function exchangeAcademyTicket(ticket: string) { const response = await orbitRequest("exchange", { ticket }); if (!response.ok) return { ok: false as const, status: response.status }; return { ok: true as const, data: await response.json() as { sessionToken: string; expiresAt: string; identity: AcademyIdentity } }; }
export async function revokeAcademySession(token: string) { await orbitRequest("revoke", { token }); }

import {applyAcademyAccess,type AcademicWorkspace} from './academy-role';
import "server-only";
export const ACADEMY_COOKIE = "kcs_academy_session";
export type AcademyIdentity = {
  userId: string;
  orbitId: string;
  sourceIdentityId?: string;
  organizationId: string;
  role: string;
  displayName?: string;
  email?: string;
  expiresAt: string;
  nexusUserId?: string;
  nexusWorkspace?: AcademicWorkspace;
  nexusReturnPath?: string;
};
export const ACADEMY_ROLES = new Set([
  "STUDENT",
  "TEACHER",
  "ADMIN",
  "SUPER_ADMIN",
]);
function config() {
  const orbitUrl = process.env.ORBIT_API_URL;
  const integrationKey = process.env.ACADEMY_INTEGRATION_KEY;
  if (!orbitUrl || !integrationKey)
    throw new Error("Academy SSO is not configured");
  return { orbitUrl: orbitUrl.replace(/\/$/, ""), integrationKey };
}
async function orbitRequest(path: string, body: object) {
  const { orbitUrl, integrationKey } = config();
  return fetch(orbitUrl + "/api/academy/sso/" + path, {
    method: "POST",
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
    headers: {
      "content-type": "application/json",
      "x-api-key": integrationKey,
    },
    body: JSON.stringify(body),
  });
}
async function nexusSession(operation:string,body:object){
 const base=process.env.NEXUS_API_URL,key=process.env.ACADEMY_INTEGRATION_KEY;if(!base||!key)throw new Error('Academy SSO unavailable');
 return fetch(base.replace(/\/$/,'')+'/api/academy/nexus-session/'+operation,{method:'POST',cache:'no-store',headers:{'content-type':'application/json','x-api-key':key},body:JSON.stringify(body),signal:AbortSignal.timeout(10000)});
}
export async function validateAcademySession(
  token: string,
): Promise<AcademyIdentity | null> {
  if(token.startsWith("nxacad_")){const r=await nexusSession("validate",{token});if(!r.ok)return null;const b=await r.json();return b.data as AcademyIdentity;}
  const response = await orbitRequest("validate", { token });
  if (!response.ok) return null;
  const identity = (await response.json()) as AcademyIdentity;
  if (!ACADEMY_ROLES.has(identity.role)) return null;
  const organization = process.env.ACADEMY_ORGANIZATION_ID;
  if (organization && identity.organizationId !== organization) return null;
  const nexusUrl=process.env.NEXUS_API_URL,key=process.env.ACADEMY_INTEGRATION_KEY;
  if(!nexusUrl||!key)return null;
  const access=await fetch(nexusUrl.replace(/\/$/,'')+'/api/academy/access',{
    method:'POST',cache:'no-store',signal:AbortSignal.timeout(10000),
    headers:{'content-type':'application/json','x-api-key':key},
    body:JSON.stringify({orbitId:identity.sourceIdentityId||identity.orbitId}),
  });
  if(!access.ok)return null;
  const payload=await access.json();
  return applyAcademyAccess(identity,payload.data);
}
export async function exchangeAcademyTicket(ticket: string, issuer?: string) {
  if(issuer==="nexus"){const r=await nexusSession("exchange",{ticket});return r.ok?{ok:true as const,data:(await r.json()).data as {sessionToken:string;expiresAt:string;identity:AcademyIdentity}}:{ok:false as const,status:r.status};}
  const response = await orbitRequest("exchange", { ticket });
  if (!response.ok) return { ok: false as const, status: response.status };
  return {
    ok: true as const,
    data: (await response.json()) as {
      sessionToken: string;
      expiresAt: string;
      identity: AcademyIdentity;
    },
  };
}
export async function revokeAcademySession(token: string) {
  if(token.startsWith("nxacad_")){await nexusSession("revoke",{token});return;}
  await orbitRequest("revoke", { token });
}
export type AcademyCourse = {
  id: string;
  name: string;
  code: string;
  description: string;
  grade: string;
  credits: number;
  updatedAt: string;
  enrolledStudents?: number;
  teacherName?: string;
  schedules: Array<{
    id: string;
    day: string;
    startTime: string;
    endTime: string;
    room: string;
  }>;
  assignments: Array<{
    id: string;
    title: string;
    description: string;
    dueDate: string;
    maxScore: number;
    type: string;
  }>;
};
export type AcademyScheduleEntry = {
  id: string;
  sourceKey: string;
  academicYear: string;
  semester: number;
  grade?: string;
  classGroup?: string | null;
  day: string;
  period: number;
  startTime: string;
  endTime: string;
  room: string;
  teacher: string;
  sourceDocument: string;
  course: { id: string; name: string; code: string; description: string };
};
export type PlannerPlan = {
  id: string;
  title: string;
  subject: string;
  grade: string;
  schoolYear: string;
  semester: string;
  quarter: string;
  date: string;
  status: string;
  updatedAt: string;
  objectives: string[];
  lessonNumber: string;
  planType: string;
};
export type PlannerContext = {
  source: string;
  state: "connected" | "not-linked";
  plans: PlannerPlan[];
  syncedAt: string;
  limit?: number;
};
export type AcademyContext = {
  source: string;
  displayName: string;
  syncedAt?: string;
  dashboardAvatar?: string | null;
  academicYear?: string;
  semester?: number;
  calendars?: Array<{
    name: string;
    isCurrent?: boolean;
    startDate: string;
    endDate: string;
    periods: Array<{
      type: string;
      sequence: number;
      startDate: string;
      endDate: string;
    }>;
  }>;
  courses?: Array<
    Omit<AcademyCourse, "assignments"> & {
      learners?: Array<{
        id: string;
        name: string;
        grade: string;
        section: string;
      }>;
      assignments: Array<
        AcademyCourse["assignments"][number] & {
          myStatus?: string;
          submittedAt?: string | null;
          submitted?: number;
          pendingReview?: number;
        }
      >;
    }
  >;
  dailySchedule?: AcademyScheduleEntry[];
  profile?: {
    id: string;
    studentNumber: string;
    grade: string;
    section: string;
  } | null;
  population?: {
    students: number;
    parents: number;
    teachers: number;
    courses: number;
  };
  communications?: { unreadNotifications: number; unreadMessages: number };
};
export async function getAcademyContext(
  identity: AcademyIdentity,
  scope: { academicYear?: string; semester?: number } = {},
): Promise<AcademyContext | null> {
  const nexusUrl = process.env.NEXUS_API_URL,
    key = process.env.ACADEMY_INTEGRATION_KEY;
  if (!nexusUrl || !key || !identity.email) return null;
  try {
    const response = await fetch(
      nexusUrl.replace(/\/$/, "") + "/api/academy/context",
      {
        method: "POST",
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
        headers: { "content-type": "application/json", "x-api-key": key },
        body: JSON.stringify({
          email: identity.email,
          role: identity.role,
          ...(identity.nexusUserId?{nexusUserId:identity.nexusUserId}:{orbitId: identity.sourceIdentityId || identity.orbitId}),
          ...scope,
        }),
      },
    );
    if (!response.ok) return null;
    const payload = (await response.json()) as { data?: AcademyContext };
    return payload.data ?? null;
  } catch {
    return null;
  }
}
export async function academyPlannerTicket(
  sessionToken: string,
  purpose: "login" | "academy-read",
) {
  const base = process.env.NEXUS_API_URL,
    key = process.env.ACADEMY_INTEGRATION_KEY;
  if (!base || !key) throw new Error("Integration unavailable");
  const response = await fetch(
    base.replace(/\/$/, "") + "/api/academy/eduplanner-ticket",
    {
      method: "POST",
      cache: "no-store",
      headers: { "content-type": "application/json", "x-api-key": key },
      body: JSON.stringify({ sessionToken, purpose }),
      signal: AbortSignal.timeout(12000),
    },
  );
  if (!response.ok) throw new Error("Eduplanner authorization is unavailable");
  return ((await response.json()) as { data: { ticket: string; url: string } })
    .data;
}

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Dashboard } from "@/components/dashboard";
import { RoleDashboard } from "@/components/role-dashboard";
import { ACADEMY_COOKIE, getAcademyContext, validateAcademySession } from "@/lib/academy-auth";
export const dynamic = "force-dynamic";
export default async function Home() {
  if (process.env.ACADEMY_DEMO_MODE === "true" && process.env.NODE_ENV !== "production") return <Dashboard />;
  const token = (await cookies()).get(ACADEMY_COOKIE)?.value;
  if (!token) redirect("/login");
  const identity = await validateAcademySession(token);
  if (!identity) redirect("/forbidden");
  const context = await getAcademyContext(identity);
  if (identity.role === "TEACHER") return <Dashboard serverAuthenticated identity={identity} context={context} />;
  return <RoleDashboard identity={identity} context={context} />;
}

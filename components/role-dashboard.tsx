"use client";
import { AcademyWorkspace } from "./live-workspace";
import type { AcademyContext, AcademyIdentity } from "@/lib/academy-auth";
export function RoleDashboard({
  identity,
  context,
}: {
  identity: AcademyIdentity;
  context: AcademyContext | null;
}) {
  return <AcademyWorkspace identity={identity} initialContext={context} />;
}

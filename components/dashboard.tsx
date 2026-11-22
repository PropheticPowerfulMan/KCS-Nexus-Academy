"use client";
import { AcademyWorkspace, AcademySignIn } from "./live-workspace";
import type { AcademyContext, AcademyIdentity } from "@/lib/academy-auth";
export function Dashboard({
  institutionalMode,
  identity,
  context,
}: {
  serverAuthenticated?: boolean;
  institutionalMode?: boolean;
  identity?: AcademyIdentity;
  context?: AcademyContext | null;
}) {
  return institutionalMode || !identity ? (
    <AcademySignIn />
  ) : (
    <AcademyWorkspace identity={identity} initialContext={context ?? null} />
  );
}

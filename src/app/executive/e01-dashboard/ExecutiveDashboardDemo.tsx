"use client";

import { ExecutiveDashboardView, type ExecutiveOverview } from "@/features/executive/views/ExecutiveDashboardView";
import type { Loadable } from "@/lib/loadable";
import { executiveFinal, executiveNow, executiveProvisional } from "@/mocks/executive";

// غلاف لصفحة الرسم: يحوّل الحالة المطلوبة إلى Loadable. في الإنتاج تحلّ محلّه حاوية تطلب GET /dashboard/executive وGET /me/pending-decisions
// وGET /scores (docs/backend-requests.md §56). لا يُنقل للإنتاج.

type ExecutiveDashboardDemoProps = { provisional?: boolean; mode?: "ready" | "loading" | "error" };

export function ExecutiveDashboardDemo({ provisional = false, mode = "ready" }: ExecutiveDashboardDemoProps) {
  const overview: Loadable<ExecutiveOverview> =
    mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: provisional ? executiveProvisional : executiveFinal };
  return <ExecutiveDashboardView overview={overview} now={executiveNow} onOpenPending={() => {}} onRetry={() => {}} />;
}

"use client";

import { SupervisorDashboardView, type SupervisorOverview } from "@/features/supervision/views/SupervisorDashboardView";
import type { Loadable } from "@/lib/loadable";
import { supervisionNow } from "@/mocks/supervision";

// غلاف لصفحة الرسم: يحوّل الحالة المطلوبة إلى Loadable. في الإنتاج تحلّ محلّه حاوية تجمع الأرقام من القوائم (docs/backend-requests.md §25.1)
// وتنقل «onOpen» إلى الشاشة المناسبة. لا يُنقل للإنتاج.

type SupervisorDashboardDemoProps = {
  overview: SupervisorOverview;
  /** حالة البيانات: جاهزة، أو تحميل، أو خطأ. */
  mode?: "ready" | "loading" | "error";
};

export function SupervisorDashboardDemo({ overview, mode = "ready" }: SupervisorDashboardDemoProps) {
  const loadable: Loadable<SupervisorOverview> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: overview };
  return <SupervisorDashboardView overview={loadable} now={supervisionNow} onOpen={() => {}} />;
}

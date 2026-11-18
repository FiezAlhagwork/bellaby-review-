"use client";

import { SalesManagerDashboardView, type SalesOverview } from "@/features/sales/views/SalesManagerDashboardView";
import type { Loadable } from "@/lib/loadable";
import { salesNow } from "@/mocks/sales";

// غلاف لصفحة الرسم: يحوّل الحالة المطلوبة إلى Loadable. في الإنتاج تحلّ محلّه حاوية تجمع الأرقام من الخطة والتحصيل والتغطية (docs/backend-requests.md §39)
// وتنقل «onOpen» إلى الشاشة المناسبة. لا يُنقل للإنتاج.

type SalesDashboardDemoProps = {
  overview: SalesOverview;
  /** حالة البيانات: جاهزة، أو تحميل، أو خطأ. */
  mode?: "ready" | "loading" | "error";
};

export function SalesDashboardDemo({ overview, mode = "ready" }: SalesDashboardDemoProps) {
  const loadable: Loadable<SalesOverview> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: overview };
  return <SalesManagerDashboardView overview={loadable} now={salesNow} onOpen={() => {}} />;
}

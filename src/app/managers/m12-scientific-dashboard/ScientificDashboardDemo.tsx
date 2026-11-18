"use client";

import { ScientificDashboardView, type ScientificOverview } from "@/features/scientific-office/views/ScientificDashboardView";
import type { Loadable } from "@/lib/loadable";
import { scientificNoPlan, scientificOverview } from "@/mocks/scientific";

// غلاف لصفحة الرسم: يحوّل الحالة المطلوبة إلى Loadable. في الإنتاج تحلّ محلّه حاوية تجمع الخطة والتغطية والزيارات (docs/backend-requests.md §50). لا يُنقل للإنتاج.

type ScientificDashboardDemoProps = {
  noPlan?: boolean;
  mode?: "ready" | "loading" | "error";
};

export function ScientificDashboardDemo({ noPlan = false, mode = "ready" }: ScientificDashboardDemoProps) {
  const overview: Loadable<ScientificOverview> =
    mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: noPlan ? scientificNoPlan : scientificOverview };
  return <ScientificDashboardView overview={overview} onRetry={() => {}} />;
}

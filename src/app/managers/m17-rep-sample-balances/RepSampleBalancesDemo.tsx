"use client";

import { useState } from "react";
import { noRepSampleBalanceFilters, RepSampleBalancesView, type RepSampleBalanceFilters } from "@/features/stock/views/RepSampleBalancesView";
import type { BalanceLine } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { repBalanceItems, repBalancesHealthy, repBalancesLow, repBalancesToday, repDistributed, repLocations, repLowBelow } from "@/mocks/rep-sample-balances";

// غلاف تفاعلي لصفحة الرسم (M17): يملك الفلاتر ويرشّح بيانات المعرض محلياً. في الإنتاج تحلّ محلّه حاوية تطلب
// GET /stock/balances?location_type=REP وتحسب «وزّع هذا الشهر» من زيارات الشهر. لا يُنقل للإنتاج.

type RepSampleBalancesDemoProps = {
  /** healthy: كل الأرصدة كافية. low: فيها منخفض وسالب. */
  dataset?: "healthy" | "low";
  /** حالة البيانات: جاهزة، أو تحميل، أو خطأ، أو لا أرصدة. */
  mode?: "ready" | "loading" | "error" | "empty";
};

export function RepSampleBalancesDemo({ dataset = "healthy", mode = "ready" }: RepSampleBalancesDemoProps) {
  const [filters, setFilters] = useState<RepSampleBalanceFilters>(noRepSampleBalanceFilters);

  const source: readonly BalanceLine[] = mode === "empty" ? [] : dataset === "low" ? repBalancesLow : repBalancesHealthy;
  const rows = source.filter((line) => (!filters.locationId || String(line.location?.id) === filters.locationId) && (!filters.itemId || String(line.item?.id) === filters.itemId));

  const balances: Loadable<readonly BalanceLine[]> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: rows };

  return (
    <RepSampleBalancesView
      balances={balances}
      distributed={mode === "loading" ? { status: "loading" } : { status: "ready", data: repDistributed }}
      reps={repLocations}
      items={repBalanceItems}
      filters={filters}
      onFiltersChange={setFilters}
      lowBelow={repLowBelow}
      today={repBalancesToday}
    />
  );
}

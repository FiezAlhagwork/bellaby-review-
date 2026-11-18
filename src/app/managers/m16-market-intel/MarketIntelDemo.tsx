"use client";

import { useState } from "react";
import { MarketIntelView, type MarketIntelFilters, type MarketIntelPage, defaultMarketIntelFilters } from "@/features/market-intel/views/MarketIntelView";
import type { IntelType } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { marketIntelGovernorates, marketIntelList, marketIntelToday } from "@/mocks/market-intel";

// غلاف تفاعلي لصفحة الرسم (M16): يملك النوع والمنطقة والفترة والصفحة ويرشّح ويرقّم بيانات المعرض محلياً (ما يفعله الخادم بـ type وgovernorate_id وfrom وto وpage).
// في الإنتاج تحلّ محلّه حاوية تطلب GET /market-intel. لا يُنقل للإنتاج.

type MarketIntelDemoProps = {
  /** النوع المعروض أولاً (التبويب). */
  type?: IntelType;
  /** حالة البيانات: جاهزة، أو تحميل، أو خطأ، أو لا تقارير. */
  mode?: "ready" | "loading" | "error" | "empty";
};

const dayOf = (value: string | undefined) => (value ?? "").slice(0, 10);

export function MarketIntelDemo({ type = defaultMarketIntelFilters.type, mode = "ready" }: MarketIntelDemoProps) {
  const [filters, setFilters] = useState<MarketIntelFilters>({ ...defaultMarketIntelFilters, type });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const { from, to } = filters.range;
  const matching =
    mode === "empty"
      ? []
      : marketIntelList.filter(
          (row) =>
            row.type === filters.type &&
            (!filters.governorateId || String(row.governorate?.id) === filters.governorateId) &&
            (from === null || dayOf(row.reported_at) >= from) &&
            (to === null || dayOf(row.reported_at) <= to),
        );
  const lastPage = Math.max(1, Math.ceil(matching.length / perPage));
  const current = Math.min(page, lastPage);
  const result: MarketIntelPage = {
    data: matching.slice((current - 1) * perPage, current * perPage),
    meta: { current_page: current, last_page: lastPage, per_page: perPage, total: matching.length },
  };
  const reports: Loadable<MarketIntelPage> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: result };

  return (
    <MarketIntelView
      reports={reports}
      governorates={marketIntelGovernorates}
      filters={filters}
      onFiltersChange={(next) => {
        setFilters(next);
        setPage(1);
      }}
      onPageChange={setPage}
      onPerPageChange={(next) => {
        setPerPage(next);
        setPage(1);
      }}
      today={marketIntelToday}
    />
  );
}

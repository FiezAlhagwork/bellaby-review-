"use client";

import { useState } from "react";
import { DeliveriesListView, noDeliveryFilters, type DeliveriesPage, type DeliveryFilters } from "@/features/deliveries/views/DeliveriesListView";
import type { Delivery } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { agentFilterOptions, salesDeliveries, salesToday } from "@/mocks/sales";

// غلاف تفاعلي لصفحة الرسم: يملك الفلاتر والصفحة، ويرشّح ويرقّم بيانات المعرض محلياً (ما يفعله الخادم بـ status وagent_id وpayment_overdue وfrom وto وpage).
// الأحدث أولاً. في الإنتاج تحلّ محلّه حاوية تطلب GET /deliveries. لا يُنقل للإنتاج.

type DeliveriesDemoProps = {
  /** حالة البيانات: جاهزة، أو تحميل، أو خطأ، أو لا تسليمات. */
  mode?: "ready" | "loading" | "error" | "empty";
  initialFilters?: DeliveryFilters;
};

function applyFilters(rows: readonly Delivery[], { status, agentId, overdueOnly, range }: DeliveryFilters): Delivery[] {
  return rows.filter((row) => {
    const day = (row.delivered_at ?? "").slice(0, 10);
    return (!status || row.status === status) && (!agentId || String(row.agent?.id) === agentId) && (!overdueOnly || row.is_payment_overdue) && (!range.from || day >= range.from) && (!range.to || day <= range.to);
  });
}

const newestFirst = (rows: readonly Delivery[]) => [...rows].sort((a, b) => (b.delivered_at ?? "").localeCompare(a.delivered_at ?? ""));

export function DeliveriesDemo({ mode = "ready", initialFilters = noDeliveryFilters }: DeliveriesDemoProps) {
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const matching = mode === "empty" ? [] : newestFirst(applyFilters(salesDeliveries, filters));
  const lastPage = Math.max(1, Math.ceil(matching.length / perPage));
  const current = Math.min(page, lastPage);
  const result: DeliveriesPage = {
    data: matching.slice((current - 1) * perPage, current * perPage),
    meta: { current_page: current, last_page: lastPage, per_page: perPage, total: matching.length },
  };
  const deliveries: Loadable<DeliveriesPage> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: result };

  return (
    <DeliveriesListView
      deliveries={deliveries}
      agents={agentFilterOptions}
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
      today={salesToday}
      onOpenDelivery={() => {}}
      onRetry={() => {}}
    />
  );
}

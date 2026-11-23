"use client";

import { useState } from "react";
import { DeliveriesListView, noDeliveryFilters, type DeliveryFilters } from "@/features/deliveries/views/DeliveriesListView";
import { agentDeliveries, deliveriesToday } from "@/mocks/agent-deliveries";

// غلاف تفاعلي لصفحة الرسم (A09): GET /deliveries بنطاق الوكيل، بلا فلتر وكيل. الأحدث أولاً. لا يُنقل للإنتاج.

export function AgentDeliveriesDemo({ unpaidOnly = false, mode = "ready" }: { unpaidOnly?: boolean; mode?: "ready" | "loading" | "error" | "empty" }) {
  const [filters, setFilters] = useState<DeliveryFilters>(unpaidOnly ? { ...noDeliveryFilters, status: "UNPAID" } : noDeliveryFilters);
  const rows = (mode === "empty" ? [] : agentDeliveries)
    .filter((row) => {
      const day = (row.delivered_at ?? "").slice(0, 10);
      return (!filters.status || row.status === filters.status) && (!filters.overdueOnly || row.is_payment_overdue) && (!filters.range.from || day >= filters.range.from) && (!filters.range.to || day <= filters.range.to);
    })
    .sort((a, b) => (b.delivered_at ?? "").localeCompare(a.delivered_at ?? ""));

  return (
    <DeliveriesListView
      deliveries={mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: { data: rows, meta: { current_page: 1, last_page: 1, per_page: 15, total: rows.length } } }}
      filters={filters}
      onFiltersChange={setFilters}
      onPageChange={() => {}}
      onPerPageChange={() => {}}
      today={deliveriesToday}
      onOpenDelivery={() => {}}
    />
  );
}

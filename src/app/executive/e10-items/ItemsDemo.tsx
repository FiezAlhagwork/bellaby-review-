"use client";

import { useState } from "react";
import { ItemsListView, noItemFilters, type ItemFilters, type ItemsPage } from "@/features/items/views/ItemsListView";
import type { Loadable } from "@/lib/loadable";
import { itemsList } from "@/mocks/items";

// غلاف تفاعلي لصفحة الرسم (E10): يملك الفلاتر والصفحة ويرشّح بيانات المعرض محلياً. في الإنتاج: GET /items بـq وtype وis_active. لا يُنقل للإنتاج.

type ItemsDemoProps = { initialFilters?: ItemFilters; mode?: "ready" | "loading" | "error" | "empty" };

export function ItemsDemo({ initialFilters = noItemFilters, mode = "ready" }: ItemsDemoProps) {
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  const q = filters.q.trim();
  const matching =
    mode === "empty"
      ? []
      : itemsList.filter(
          (row) =>
            (!q || (row.name ?? "").includes(q) || (row.sku ?? "").toLowerCase().includes(q.toLowerCase())) &&
            (!filters.type || row.type === filters.type) &&
            (!filters.status || row.is_active === (filters.status === "active")),
        );
  const lastPage = Math.max(1, Math.ceil(matching.length / perPage));
  const current = Math.min(page, lastPage);
  const result: ItemsPage = { data: matching.slice((current - 1) * perPage, current * perPage), meta: { current_page: current, last_page: lastPage, per_page: perPage, total: matching.length } };
  const items: Loadable<ItemsPage> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: result };

  return (
    <ItemsListView
      items={items}
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
      canCreate
      onNewItem={() => {}}
      onOpenItem={() => {}}
    />
  );
}

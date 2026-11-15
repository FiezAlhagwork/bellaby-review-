"use client";

import { useState } from "react";
import { BatchesListView, noBatchFilters, type BatchFilters, type BatchesPage } from "@/features/batches/views/BatchesListView";
import type { Batch } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { batchesList, batchItems } from "@/mocks/batches";

// غلاف تفاعلي لصفحة الرسم: يملك الفلاتر والصفحة ويرشّح ويرقّم بيانات المعرض محلياً (ما يفعله الخادم بـ item_id وstatus وin_stock وpage).
// في الإنتاج تحلّ محلّه حاوية تطلب GET /batches. لا يُنقل للإنتاج.

type BatchesDemoProps = {
  /** حالة البيانات: جاهزة، أو تحميل، أو خطأ، أو لا دفعات إطلاقاً. */
  mode?: "ready" | "loading" | "error" | "empty";
  initialFilters?: BatchFilters;
};

function applyFilters(rows: readonly Batch[], { itemId, status, inStock }: BatchFilters): Batch[] {
  return rows.filter((row) => (!itemId || String(row.item?.id) === itemId) && (!status || row.status === status) && (!inStock || (row.warehouse_on_hand ?? 0) > 0));
}

export function BatchesDemo({ mode = "ready", initialFilters = noBatchFilters }: BatchesDemoProps) {
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  const matching = mode === "empty" ? [] : applyFilters(batchesList, filters);
  const lastPage = Math.max(1, Math.ceil(matching.length / perPage));
  const current = Math.min(page, lastPage);
  const result: BatchesPage = {
    data: matching.slice((current - 1) * perPage, current * perPage),
    meta: { current_page: current, last_page: lastPage, per_page: perPage, total: matching.length },
  };

  const batches: Loadable<BatchesPage> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: result };

  return (
    <BatchesListView
      batches={batches}
      items={batchItems}
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
      onOpenBatch={() => {}}
    />
  );
}

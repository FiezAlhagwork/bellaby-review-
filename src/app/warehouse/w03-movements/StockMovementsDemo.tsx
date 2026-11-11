"use client";

import { useState } from "react";
import { noStockMovementFilters, StockMovementsView, type StockMovementFilters, type StockMovementsPage } from "@/features/stock/views/StockMovementsView";
import type { BatchRef, StockMovement } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { allLocations, balanceItems } from "@/mocks/stock-balances";
import { movementsToday, stockMovements } from "@/mocks/stock-movements";

// غلاف تفاعلي لصفحة الرسم: يملك الفلاتر والصفحة ويرشّح ويرقّم بيانات المعرض محلياً، فيجرّب الزبون الفلاتر والترقيم فعلاً.
// في الإنتاج تحلّ محلّه حاوية تطلب GET /stock/movements بالفلاتر والصفحة. لا يُنقل للإنتاج.

type StockMovementsDemoProps = {
  initialFilters?: StockMovementFilters;
  /** حالة البيانات: جاهزة، أو تحميل، أو خطأ، أو لا حركات إطلاقاً. */
  mode?: "ready" | "loading" | "error" | "empty";
};

/** يوم الحدث بتوقيت دمشق: أوقات المعرض بين 07:00 و14:00 UTC فيطابق يومها يوم UTC. */
const dayOf = (movement: StockMovement) => movement.occurred_at?.slice(0, 10) ?? "";

function applyFilters(rows: readonly StockMovement[], { locationId, itemId, batchId, range }: StockMovementFilters): StockMovement[] {
  return rows.filter(
    (row) =>
      (!locationId || String(row.from_location?.id) === locationId || String(row.to_location?.id) === locationId) &&
      (!itemId || String(row.item?.id) === itemId) &&
      (!batchId || String(row.batch?.id) === batchId) &&
      (range.from === null || dayOf(row) >= range.from) &&
      (range.to === null || dayOf(row) <= range.to),
  );
}

/** دفعات الصنف المختار (أو كل الدفعات) التي لها حركات، بلا تكرار. */
function batchesFor(itemId: string | null): BatchRef[] {
  const seen = new Map<number, BatchRef>();
  for (const row of stockMovements) {
    if (itemId && String(row.item?.id) !== itemId) continue;
    if (row.batch?.id !== undefined) seen.set(row.batch.id, row.batch);
  }
  return [...seen.values()];
}

export function StockMovementsDemo({ initialFilters = noStockMovementFilters, mode = "ready" }: StockMovementsDemoProps) {
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  // تغيير الفلاتر أو حجم الصفحة يعيد إلى الصفحة الأولى.
  const changeFilters = (next: StockMovementFilters) => {
    setFilters(next);
    setPage(1);
  };

  const matching = mode === "empty" ? [] : applyFilters(stockMovements, filters);
  const lastPage = Math.max(1, Math.ceil(matching.length / perPage));
  const current = Math.min(page, lastPage);
  const result: StockMovementsPage = {
    data: matching.slice((current - 1) * perPage, current * perPage),
    meta: { current_page: current, last_page: lastPage, per_page: perPage, total: matching.length },
  };

  const movements: Loadable<StockMovementsPage> =
    mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: result };

  return (
    <StockMovementsView
      movements={movements}
      locations={allLocations}
      items={balanceItems}
      batches={batchesFor(filters.itemId)}
      filters={filters}
      onFiltersChange={changeFilters}
      onPageChange={setPage}
      onPerPageChange={(next) => {
        setPerPage(next);
        setPage(1);
      }}
      today={movementsToday}
    />
  );
}

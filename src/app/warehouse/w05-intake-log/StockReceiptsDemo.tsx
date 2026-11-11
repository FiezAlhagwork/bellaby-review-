"use client";

import { useState } from "react";
import { noStockReceiptFilters, StockReceiptsView, type StockReceiptFilters, type StockReceiptsPage } from "@/features/stock/views/StockReceiptsView";
import type { StockReceipt } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { allLocations } from "@/mocks/stock-balances";
import { receiptsToday, stockReceipts } from "@/mocks/stock-receipts";

// غلاف تفاعلي لصفحة الرسم: يملك الفلاتر والصفحة والإدخال المفتوح في الدرج، ويرشّح ويرقّم بيانات المعرض محلياً.
// في الإنتاج تحلّ محلّه حاوية تطلب GET /stock-receipts بالفلاتر والصفحة. لا يُنقل للإنتاج.

type StockReceiptsDemoProps = {
  /** رقم الإدخال المفتوح في الدرج عند العرض (حالة «التفاصيل»). */
  initialSelectedId?: number;
  /** حالة البيانات: جاهزة، أو تحميل، أو خطأ، أو لا إدخالات إطلاقاً. */
  mode?: "ready" | "loading" | "error" | "empty";
};

/** يوم الإدخال بتوقيت دمشق: أوقات المعرض بين 07:00 و14:00 UTC فيطابق يومها يوم UTC. */
const dayOf = (receipt: StockReceipt) => receipt.received_at?.slice(0, 10) ?? "";

function applyFilters(rows: readonly StockReceipt[], { locationId, range }: StockReceiptFilters): StockReceipt[] {
  return rows.filter(
    (row) => (!locationId || String(row.location?.id) === locationId) && (range.from === null || dayOf(row) >= range.from) && (range.to === null || dayOf(row) <= range.to),
  );
}

export function StockReceiptsDemo({ initialSelectedId, mode = "ready" }: StockReceiptsDemoProps) {
  const [filters, setFilters] = useState(noStockReceiptFilters);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [selected, setSelected] = useState<StockReceipt | null>(stockReceipts.find((receipt) => receipt.id === initialSelectedId) ?? null);

  const matching = mode === "empty" ? [] : applyFilters(stockReceipts, filters);
  const lastPage = Math.max(1, Math.ceil(matching.length / perPage));
  const current = Math.min(page, lastPage);
  const result: StockReceiptsPage = {
    data: matching.slice((current - 1) * perPage, current * perPage),
    meta: { current_page: current, last_page: lastPage, per_page: perPage, total: matching.length },
  };

  const receipts: Loadable<StockReceiptsPage> =
    mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: result };

  return (
    <StockReceiptsView
      receipts={receipts}
      locations={allLocations.filter((location) => location.type === "WAREHOUSE")}
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
      selected={selected}
      onSelect={setSelected}
      today={receiptsToday}
      onNewReceipt={() => {}}
    />
  );
}

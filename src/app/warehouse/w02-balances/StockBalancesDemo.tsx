"use client";

import { useState } from "react";
import { noStockBalanceFilters, StockBalancesView, type StockBalanceFilters } from "@/features/stock/views/StockBalancesView";
import type { BalanceLine } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { allBalances, allLocations, balanceItems, balancesToday, pastWarehouseBalances, warehouseBalances, warehouseLocations } from "@/mocks/stock-balances";

// غلاف تفاعلي لصفحة الرسم: يملك حالة الفلاتر ويرشّح بيانات المعرض محلياً، فيجرّب الزبون الفلاتر فعلاً. في الإنتاج تحلّ محلّه حاوية
// تطلب GET /stock/balances بالفلاتر. لا يُنقل للإنتاج.

type StockBalancesDemoProps = {
  /** warehouse: مواقع المستودع (الافتراضي). all: كل المواقع. */
  scope: "warehouse" | "all";
  initialFilters?: StockBalanceFilters;
  canOpenMovements: boolean;
  /** حالة البيانات: جاهزة، أو تحميل، أو خطأ، أو لا أرصدة إطلاقاً. */
  mode?: "ready" | "loading" | "error" | "empty";
};

function applyFilters(lines: readonly BalanceLine[], filters: StockBalanceFilters): BalanceLine[] {
  return lines.filter(
    (line) =>
      (!filters.locationId || String(line.location?.id) === filters.locationId) &&
      (!filters.itemId || String(line.item?.id) === filters.itemId) &&
      (!filters.itemType || line.item?.type === filters.itemType),
  );
}

export function StockBalancesDemo({ scope, initialFilters = noStockBalanceFilters, canOpenMovements, mode = "ready" }: StockBalancesDemoProps) {
  const [filters, setFilters] = useState(initialFilters);

  // الرصيد في لحظة سابقة: مواقع المستودع بأرقام ذلك اليوم.
  const source = filters.at ? pastWarehouseBalances : scope === "all" ? allBalances : warehouseBalances;
  const locations = scope === "all" ? allLocations : warehouseLocations;

  const balances: Loadable<readonly BalanceLine[]> =
    mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: mode === "empty" ? [] : applyFilters(source, filters) };

  return (
    <StockBalancesView
      balances={balances}
      locations={locations}
      items={balanceItems}
      filters={filters}
      onFiltersChange={setFilters}
      canOpenMovements={canOpenMovements}
      today={balancesToday}
      onOpenMovements={canOpenMovements ? () => {} : undefined}
    />
  );
}

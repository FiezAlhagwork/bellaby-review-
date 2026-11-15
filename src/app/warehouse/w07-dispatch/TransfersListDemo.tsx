"use client";

import { useState } from "react";
import { noTransferFilters, TransfersListView, type TransferFilters, type TransfersPage } from "@/features/transfers/views/TransfersListView";
import type { Transfer } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { transferRecipients, transfersList, transfersToday } from "@/mocks/transfers-list";

// غلاف تفاعلي لصفحة الرسم: يملك الفلاتر والصفحة ويرشّح ويرقّم بيانات المعرض محلياً، فيجرّب الزبون البحث والفلاتر و«غير مؤكَّد» فعلاً.
// في الإنتاج تحلّ محلّه حاوية تطلب GET /transfers بالفلاتر والصفحة. لا يُنقل للإنتاج.

const OVERDUE_HOURS = 48;

type TransfersListDemoProps = {
  initialFilters?: TransferFilters;
  /** حالة البيانات: جاهزة، أو تحميل، أو خطأ، أو لا صرفيات إطلاقاً. */
  mode?: "ready" | "loading" | "error" | "empty";
};

/** يوم الإنشاء بتوقيت دمشق: أوقات المعرض بين 07:00 و14:00 UTC فيطابق يومها يوم UTC. */
const dayOf = (transfer: Transfer) => transfer.created_at?.slice(0, 10) ?? "";

function applyFilters(rows: readonly Transfer[], { q, status, toLocationId, overdue, range }: TransferFilters): Transfer[] {
  const needle = q.trim().toLowerCase();
  return rows.filter(
    (row) =>
      (needle === "" || (row.reference ?? "").toLowerCase().includes(needle) || (row.to_location?.name ?? "").toLowerCase().includes(needle)) &&
      (!status || row.status === status) &&
      (!toLocationId || String(row.to_location?.id) === toLocationId) &&
      // in_transit_over_hours: بالطريق ومضى عليه ساعات الحدّ فأكثر.
      (!overdue || (row.status === "IN_TRANSIT" && (row.hours_in_transit ?? 0) >= OVERDUE_HOURS)) &&
      (range.from === null || dayOf(row) >= range.from) &&
      (range.to === null || dayOf(row) <= range.to),
  );
}

export function TransfersListDemo({ initialFilters = noTransferFilters, mode = "ready" }: TransfersListDemoProps) {
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  const matching = mode === "empty" ? [] : applyFilters(transfersList, filters);
  const lastPage = Math.max(1, Math.ceil(matching.length / perPage));
  const current = Math.min(page, lastPage);
  const result: TransfersPage = {
    data: matching.slice((current - 1) * perPage, current * perPage),
    meta: { current_page: current, last_page: lastPage, per_page: perPage, total: matching.length },
  };

  const transfers: Loadable<TransfersPage> =
    mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: result };

  return (
    <TransfersListView
      transfers={transfers}
      recipients={transferRecipients}
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
      today={transfersToday}
      overdueHours={OVERDUE_HOURS}
      onOpenTransfer={() => {}}
      onNewTransfer={() => {}}
    />
  );
}

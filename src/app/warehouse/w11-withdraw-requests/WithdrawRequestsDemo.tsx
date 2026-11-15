"use client";

import { useState } from "react";
import { emptyWithdrawForm, WithdrawRequestFormView, type WithdrawForm } from "@/features/transfers/views/WithdrawRequestFormView";
import { noWithdrawRequestFilters, WithdrawRequestsListView, type WithdrawRequestFilters, type WithdrawRequestsPage } from "@/features/transfers/views/WithdrawRequestsListView";
import type { WithdrawRequest } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { damascus } from "@/mocks/stock-balances";
import { repBalances, withdrawFormOptions, withdrawReps, withdrawRequestsList, withdrawToday } from "@/mocks/withdraw-requests";

// غلاف تفاعلي لصفحة الرسم: يملك الفلاتر والصفحة ونافذة «طلب سحب»، ويرشّح ويرقّم بيانات المعرض محلياً.
// إرسال النموذج يضيف الطلب إلى أعلى القائمة. في الإنتاج تحلّ محلّه حاوية تطلب GET /withdraw-requests وترسل POST /withdraw-requests.
// لا يُنقل للإنتاج.

type WithdrawRequestsDemoProps = {
  /** حالة البيانات: جاهزة، أو تحميل، أو خطأ، أو لا طلبات إطلاقاً. */
  mode?: "ready" | "loading" | "error" | "empty";
  /** النافذة مفتوحة عند العرض (حالات «new-form»). */
  initialFormOpen?: boolean;
  initialForm?: WithdrawForm;
  /** أخطاء الخادم الثابتة للحالة المعروضة (تختفي بعد أول تعديل). */
  initialErrors?: Record<string, string>;
};

function applyFilters(rows: readonly WithdrawRequest[], { status, repUserId }: WithdrawRequestFilters): WithdrawRequest[] {
  return rows.filter((row) => (!status || row.status === status) && (!repUserId || String(row.rep?.id) === repUserId));
}

const blankForm = () => emptyWithdrawForm("1");

export function WithdrawRequestsDemo({ mode = "ready", initialFormOpen = false, initialForm, initialErrors }: WithdrawRequestsDemoProps) {
  const [rows, setRows] = useState<readonly WithdrawRequest[]>(withdrawRequestsList);
  const [filters, setFilters] = useState(noWithdrawRequestFilters);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [formOpen, setFormOpen] = useState(initialFormOpen);
  const [form, setForm] = useState<WithdrawForm>(initialForm ?? blankForm());
  const [errors, setErrors] = useState(initialErrors);

  const matching = mode === "empty" ? [] : applyFilters(rows, filters);
  const lastPage = Math.max(1, Math.ceil(matching.length / perPage));
  const current = Math.min(page, lastPage);
  const result: WithdrawRequestsPage = {
    data: matching.slice((current - 1) * perPage, current * perPage),
    meta: { current_page: current, last_page: lastPage, per_page: perPage, total: matching.length },
  };

  const requests: Loadable<WithdrawRequestsPage> =
    mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: result };

  // رصيد المندوب المختار: GET /stock/balances?location_id=<موقعه>&group_by=batch في الإنتاج.
  const balance: Loadable<(typeof repBalances)[string]> | null = form.repUserId === null ? null : { status: "ready", data: repBalances[form.repUserId] ?? { items: [], batches: {} } };

  const submit = () => {
    const rep = withdrawReps.find((candidate) => String(candidate.user.id) === form.repUserId);
    if (!rep || balance?.status !== "ready") return;
    const lines = form.lines.flatMap((line) => {
      const item = balance.data.items.find((candidate) => candidate.id === line.itemId);
      const batch = line.itemId === null ? undefined : balance.data.batches[String(line.itemId)]?.find((candidate) => candidate.id === line.batchId);
      if (!item || !batch || line.quantity === null) return [];
      return [{ item, batch: { id: batch.id, batch_no: batch.batch_no, expiry_date: batch.expiry_date, status: batch.status }, requested_quantity: line.quantity, actual_quantity: null }];
    });
    const created: WithdrawRequest = {
      id: Math.max(0, ...rows.map((row) => row.id ?? 0)) + 1,
      rep: rep.user,
      to_location: damascus,
      status: "REQUESTED",
      reason: form.reason.trim(),
      lines,
      created_by: { id: 3, name: "رامي السيد" },
      created_at: "2026-11-10T09:30:00Z",
      confirmed_by: null,
      confirmed_at: null,
      confirmed_on_behalf: false,
      cancelled_by: null,
      cancel_reason: null,
    };
    setRows([created, ...rows]);
    setFilters(noWithdrawRequestFilters);
    setPage(1);
    setFormOpen(false);
    setForm(blankForm());
    setErrors(undefined);
  };

  return (
    <>
      <WithdrawRequestsListView
        requests={requests}
        reps={withdrawReps}
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
        onCreate={() => setFormOpen(true)}
        onOpenRequest={() => {}}
      />
      <WithdrawRequestFormView
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setForm(blankForm());
            setErrors(undefined);
          }
        }}
        options={{ status: "ready", data: withdrawFormOptions }}
        balance={balance}
        form={form}
        onFormChange={(next) => {
          setForm(next);
          setErrors(undefined);
        }}
        errors={errors}
        today={withdrawToday}
        onSubmit={submit}
      />
    </>
  );
}

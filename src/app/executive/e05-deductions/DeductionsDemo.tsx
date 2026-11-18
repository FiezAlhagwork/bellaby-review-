"use client";

import { useState } from "react";
import { DeductionsView, noDeductionFilters, type DeductionForm, type DeductionFilters, type DeductionsPage } from "@/features/deductions/views/DeductionsView";
import type { Deduction } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { closedMonths, deductionUsers, deductionsList, financeToday } from "@/mocks/finance";

// غلاف تفاعلي لصفحة الرسم (E05): يملك الفلاتر والنافذتين. التسجيل والقيد المعاكس محلياً كما يفعل POST /deductions و/reverse،
// وشهر مغلق يرجع 409 month_closed. لا يُنقل للإنتاج.

type DeductionsDemoProps = {
  initialForm?: DeductionForm | null;
  /** يفتح نافذة القيد المعاكس لهذا الخصم. */
  initialReversingId?: number;
  mode?: "ready" | "loading" | "error" | "empty";
};

const ziad = { id: 1, name: "زياد المصري" };

export function DeductionsDemo({ initialForm = null, initialReversingId, mode = "ready" }: DeductionsDemoProps) {
  const [rows, setRows] = useState<readonly Deduction[]>(deductionsList);
  const [filters, setFilters] = useState<DeductionFilters>(noDeductionFilters);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [form, setForm] = useState<DeductionForm | null>(initialForm);
  const [reversing, setReversing] = useState<Deduction | null>(rows.find((row) => row.id === initialReversingId) ?? null);
  const [reason, setReason] = useState("");
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);

  const matching = mode === "empty" ? [] : rows.filter((row) => (!filters.userId || String(row.user?.id) === filters.userId) && (!filters.month || row.month === filters.month));
  const lastPage = Math.max(1, Math.ceil(matching.length / perPage));
  const current = Math.min(page, lastPage);
  const result: DeductionsPage = { data: matching.slice((current - 1) * perPage, current * perPage), meta: { current_page: current, last_page: lastPage, per_page: perPage, total: matching.length } };
  const deductions: Loadable<DeductionsPage> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: result };
  const nextId = () => Math.max(0, ...rows.map((row) => row.id ?? 0)) + 1;

  return (
    <DeductionsView
      deductions={deductions}
      users={deductionUsers}
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
      closedMonths={closedMonths}
      form={form}
      onFormChange={(next) => {
        setForm(next);
        setSubmitError(undefined);
      }}
      onSubmit={() => {
        if (!form || !form.month || !form.source) return;
        if (closedMonths.includes(form.month)) {
          setSubmitError("month_closed");
          return;
        }
        const user = deductionUsers.find((candidate) => String(candidate.id) === form.userId);
        const created: Deduction = { id: nextId(), user, month: form.month, amount: form.amount.trim(), source: form.source, reason: form.reason.trim(), task_id: null, investigation_id: null, reverses_id: null, reversed_by_id: null, created_by: ziad, created_at: `${financeToday}T10:00:00Z` };
        setRows([created, ...rows]);
        setForm(null);
      }}
      reversing={reversing}
      onReversingChange={(next) => {
        setReversing(next);
        setReason("");
      }}
      reverseReason={reason}
      onReverseReasonChange={setReason}
      onReverse={() => {
        if (!reversing) return;
        const id = nextId();
        const reverse: Deduction = { ...reversing, id, reason: `قيد معاكس: ${reason.trim()}`, reverses_id: reversing.id ?? null, reversed_by_id: null, created_by: ziad, created_at: `${financeToday}T10:30:00Z` };
        setRows([reverse, ...rows.map((row) => (row.id === reversing.id ? { ...row, reversed_by_id: id } : row))]);
        setReversing(null);
      }}
      submitError={submitError}
      today={financeToday}
    />
  );
}

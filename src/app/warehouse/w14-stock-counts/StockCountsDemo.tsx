"use client";

import { useState } from "react";
import { emptyStockCountForm, StockCountFormView, type StockCountForm } from "@/features/stock-counts/views/StockCountFormView";
import { noStockCountFilters, StockCountsListView, type StockCountFilters, type StockCountsPage } from "@/features/stock-counts/views/StockCountsListView";
import type { StockCount } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { rami, salim, stockCountLocations, stockCountsList, stockCountWorkers } from "@/mocks/stock-counts";

// غلاف تفاعلي لصفحة الرسم: يملك الفلاتر والصفحة ونافذة «جرد جديد»، ويرشّح ويرقّم بيانات المعرض محلياً. الإنشاء يضيف الجرد قيد العدّ إلى أعلى القائمة.
// «worker»: عامل المستودع (سليم القاسم) يرى المسنَد إليه فقط ولا ينشئ. في الإنتاج تحلّ محلّه حاوية تطلب GET /stock-counts وترسل POST /stock-counts. لا يُنقل للإنتاج.

type StockCountsDemoProps = {
  /** حالة البيانات: جاهزة، أو تحميل، أو خطأ، أو لا جرود إطلاقاً. */
  mode?: "ready" | "loading" | "error" | "empty";
  /** عامل المستودع: المسنَد إليه فقط، بلا إنشاء ولا فلتر مكلَّف. */
  worker?: boolean;
  /** النافذة مفتوحة عند العرض. */
  initialFormOpen?: boolean;
  initialForm?: StockCountForm;
  initialErrors?: Record<string, string>;
};

function applyFilters(rows: readonly StockCount[], { status, locationId, assignedToId }: StockCountFilters): StockCount[] {
  return rows.filter((row) => (!status || row.status === status) && (!locationId || String(row.location?.id) === locationId) && (!assignedToId || String(row.assigned_to?.id) === assignedToId));
}

const blankForm = () => emptyStockCountForm();

export function StockCountsDemo({ mode = "ready", worker = false, initialFormOpen = false, initialForm, initialErrors }: StockCountsDemoProps) {
  const [rows, setRows] = useState<readonly StockCount[]>(stockCountsList);
  const [filters, setFilters] = useState(noStockCountFilters);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [formOpen, setFormOpen] = useState(initialFormOpen);
  const [form, setForm] = useState<StockCountForm>(initialForm ?? blankForm());
  const [errors, setErrors] = useState(initialErrors);

  // عامل المستودع: الخادم يحصر القائمة بالمسنَد إليه (docs/backend-requests.md §17.2).
  const visible = worker ? rows.filter((row) => row.assigned_to?.id === salim.id) : rows;
  const matching = mode === "empty" ? [] : applyFilters(visible, filters);
  const lastPage = Math.max(1, Math.ceil(matching.length / perPage));
  const current = Math.min(page, lastPage);
  const result: StockCountsPage = {
    data: matching.slice((current - 1) * perPage, current * perPage),
    meta: { current_page: current, last_page: lastPage, per_page: perPage, total: matching.length },
  };

  const counts: Loadable<StockCountsPage> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: result };

  const submit = () => {
    const location = stockCountLocations.find((candidate) => String(candidate.id) === form.locationId);
    if (!location) return;
    const created: StockCount = {
      id: Math.max(0, ...rows.map((row) => row.id ?? 0)) + 1,
      location,
      status: "IN_PROGRESS",
      assigned_to: stockCountWorkers.find((candidate) => String(candidate.id) === form.assignedToId) ?? null,
      created_by: rami,
      created_at: "2026-11-10T09:30:00Z",
      submitted_at: null,
      approved_by: null,
      approved_at: null,
      on_behalf_of: null,
      return_history: [],
      cancel_reason: null,
      lines: [],
    };
    setRows([created, ...rows]);
    setFilters(noStockCountFilters);
    setPage(1);
    setFormOpen(false);
    setForm(blankForm());
    setErrors(undefined);
  };

  return (
    <>
      <StockCountsListView
        counts={counts}
        locations={stockCountLocations}
        workers={stockCountWorkers}
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
        canCreate={!worker}
        showAssigneeFilter={!worker}
        onCreate={() => setFormOpen(true)}
        onOpenCount={() => {}}
      />
      <StockCountFormView
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setForm(blankForm());
            setErrors(undefined);
          }
        }}
        options={{ status: "ready", data: { locations: stockCountLocations, workers: stockCountWorkers } }}
        form={form}
        onFormChange={(next) => {
          setForm(next);
          setErrors(undefined);
        }}
        errors={errors}
        onSubmit={submit}
      />
    </>
  );
}

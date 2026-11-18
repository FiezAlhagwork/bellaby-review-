"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SampleRequestFormView, emptySampleRequestForm, type SampleRequestForm } from "@/features/transfers/views/SampleRequestFormView";
import { noSampleRequestFilters, SampleRequestsListView, type SampleRequestFilters, type SampleRequestsPage } from "@/features/transfers/views/SampleRequestsListView";
import type { SampleRequest } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { myUserId, sampleFormItems, sampleRequestReps, sampleRequestsList, sampleRequestsToday } from "@/mocks/sample-requests";

// غلاف تفاعلي لصفحة الرسم (M18): يملك الفلاتر والصفحة ونافذة «طلب عينات» وتأكيد الإلغاء، ويرشّح ويرقّم بيانات المعرض محلياً.
// «طلباتي» = ما طلبه هذا المدير (`requested_by`): الترشيح هنا وفي الإنتاج في الحاوية (لا معامل له في العقد: docs/backend-requests.md §56).
// الإرسال يضيف الطلب «جديداً» أعلى القائمة، والإلغاء يحوّله «ملغى». في الإنتاج تحلّ محلّه حاوية تطلب GET /sample-requests وترسل POST /sample-requests و/cancel. لا يُنقل للإنتاج.

type SampleRequestsDemoProps = {
  /** حالة البيانات: جاهزة، أو تحميل، أو خطأ، أو لا طلبات إطلاقاً. */
  mode?: "ready" | "loading" | "error" | "empty";
  /** النافذة مفتوحة عند العرض (حالة «new-form»). */
  initialFormOpen?: boolean;
  /** تأكيد إلغاء هذا الطلب مفتوح عند العرض (حالة «cancel»). */
  initialCancelId?: number;
};

const mine = sampleRequestsList.filter((request) => request.requested_by?.id === myUserId);
const dayOf = (request: SampleRequest) => request.created_at?.slice(0, 10) ?? "";

export function SampleRequestsDemo({ mode = "ready", initialFormOpen = false, initialCancelId }: SampleRequestsDemoProps) {
  const [rows, setRows] = useState<readonly SampleRequest[]>(mine);
  const [filters, setFilters] = useState<SampleRequestFilters>(noSampleRequestFilters);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [formOpen, setFormOpen] = useState(initialFormOpen);
  const [form, setForm] = useState<SampleRequestForm>(emptySampleRequestForm);
  const [cancelId, setCancelId] = useState<number | null>(initialCancelId ?? null);

  const matching =
    mode === "empty"
      ? []
      : rows.filter(
          (row) =>
            (!filters.status || row.status === filters.status) &&
            (!filters.repUserId || String(row.rep?.id) === filters.repUserId) &&
            (filters.range.from === null || dayOf(row) >= filters.range.from) &&
            (filters.range.to === null || dayOf(row) <= filters.range.to),
        );
  const lastPage = Math.max(1, Math.ceil(matching.length / perPage));
  const current = Math.min(page, lastPage);
  const result: SampleRequestsPage = {
    data: matching.slice((current - 1) * perPage, current * perPage),
    meta: { current_page: current, last_page: lastPage, per_page: perPage, total: matching.length },
  };
  const requests: Loadable<SampleRequestsPage> =
    mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: result };

  const submit = () => {
    const rep = sampleRequestReps.find((candidate) => String(candidate.user.id) === form.repUserId);
    if (!rep) return;
    const lines = form.lines.flatMap((line) => {
      const item = sampleFormItems.find((candidate) => String(candidate.id) === line.itemId);
      return item && line.quantity !== null ? [{ item, requested_quantity: line.quantity, dispatched_quantity: null }] : [];
    });
    const created: SampleRequest = {
      id: Math.max(0, ...rows.map((row) => row.id ?? 0)) + 100,
      rep: rep.user,
      requested_by: { id: myUserId, name: "د. هبة الأحمد" },
      status: "NEW",
      reason: form.reason.trim(),
      lines,
      transfer_id: null,
      reject_reason: null,
      created_at: `${sampleRequestsToday}T10:00:00Z`,
      decided_at: null,
    };
    setRows([created, ...rows]);
    setFormOpen(false);
    setForm(emptySampleRequestForm());
    setPage(1);
  };

  const cancelling = cancelId === null ? null : rows.find((row) => row.id === cancelId) ?? null;

  return (
    <>
      <SampleRequestsListView
        requests={requests}
        reps={sampleRequestReps}
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
        today={sampleRequestsToday}
        ownRequests
        onNewRequest={() => setFormOpen(true)}
        onCancelRequest={(request) => setCancelId(request.id ?? null)}
      />

      <SampleRequestFormView
        open={formOpen}
        onOpenChange={setFormOpen}
        options={{ status: "ready", data: { reps: sampleRequestReps, items: sampleFormItems } }}
        form={form}
        onFormChange={setForm}
        onSubmit={submit}
      />

      <ConfirmDialog
        open={cancelling !== null}
        onOpenChange={(open) => {
          if (!open) setCancelId(null);
        }}
        title="إلغاء الطلب؟"
        description={cancelling ? `سيُلغى طلب العينات للمندوب ${cancelling.rep?.name ?? ""} قبل أن يُصرف، ولا يمكن التراجع عن الإلغاء.` : ""}
        confirmLabel="إلغاء الطلب"
        cancelLabel="تراجع"
        danger
        onConfirm={() => {
          setRows(rows.map((row) => (row.id === cancelId ? { ...row, status: "CANCELLED", decided_at: `${sampleRequestsToday}T10:30:00Z` } : row)));
          setCancelId(null);
        }}
      />
    </>
  );
}

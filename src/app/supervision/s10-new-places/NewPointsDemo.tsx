"use client";

import { useState } from "react";
import { NewVisitPointsView, type NewPointRow, type NewPointsPage, type PointBulkDialog, type PointRejectDialog } from "@/features/visit-points/views/NewVisitPointsView";
import type { Loadable } from "@/lib/loadable";
import { newPointRows } from "@/mocks/visit-points";

// غلاف تفاعلي لصفحة الرسم: يملك الصفوف والتحديد ونافذتي الرفض. «مقبولة» تغلق العلامة فتخرج الجهة من القائمة، و«مرفوضة» (بسبب) تعطّلها وتخرج، والرفض الجماعي يرفض زيارات
// الجهات المحدّدة ويعرض عددها (`rejected_count`). في الإنتاج تحلّ محلّه حاوية تطلب GET /qa-flags?type=NEW_VISIT_POINT وGET /visit-points وترسل POST /qa-flags/{id}/decision
// وPOST /visit-points/{id}/reject-visits (لكل جهة محدّدة). لا يُنقل للإنتاج.

type NewPointsDemoProps = {
  /** حالة البيانات: جاهزة، أو تحميل، أو خطأ، أو لا جهات. */
  mode?: "ready" | "loading" | "error" | "empty";
  /** الجهة التي نافذة رفضها مفتوحة عند العرض (معرّف الجهة). */
  initialRejectId?: number;
  /** الجهات المحدّدة عند العرض. */
  initialSelected?: readonly number[];
  /** نافذة الرفض الجماعي مفتوحة عند العرض. */
  initialBulkOpen?: boolean;
  /** رمز خطأ القرار الظاهر عند العرض. */
  initialActionError?: string;
};

export function NewPointsDemo({ mode = "ready", initialRejectId, initialSelected = [], initialBulkOpen = false, initialActionError }: NewPointsDemoProps) {
  const [rows, setRows] = useState<readonly NewPointRow[]>(newPointRows);
  const [selected, setSelected] = useState<readonly number[]>(initialSelected);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [rejectDialog, setRejectDialog] = useState<PointRejectDialog | null>(() => {
    const row = newPointRows.find((entry) => entry.point.id === initialRejectId);
    return row ? { row, reason: "" } : null;
  });
  const [bulkDialog, setBulkDialog] = useState<PointBulkDialog | null>(initialBulkOpen ? { reason: "" } : null);
  const [bulkResult, setBulkResult] = useState<{ rejectedCount: number } | null>(null);
  const [actionError, setActionError] = useState(initialActionError);

  const matching = mode === "empty" ? [] : rows;
  const lastPage = Math.max(1, Math.ceil(matching.length / perPage));
  const current = Math.min(page, lastPage);
  const result: NewPointsPage = {
    data: matching.slice((current - 1) * perPage, current * perPage),
    meta: { current_page: current, last_page: lastPage, per_page: perPage, total: matching.length },
  };
  const points: Loadable<NewPointsPage> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: result };

  const remove = (id: number | undefined) => {
    setRows(rows.filter((row) => row.point.id !== id));
    setSelected(selected.filter((entry) => entry !== id));
  };

  return (
    <NewVisitPointsView
      points={points}
      canDecide
      canRejectVisits
      selected={selected}
      onSelectedChange={(ids) => {
        setSelected(ids);
        setBulkResult(null);
      }}
      onPageChange={setPage}
      onPerPageChange={(next) => {
        setPerPage(next);
        setPage(1);
      }}
      actionError={actionError}
      onAccept={(row) => {
        remove(row.point.id);
        setActionError(undefined);
      }}
      rejectDialog={rejectDialog}
      onStartReject={(row) => {
        setActionError(undefined);
        setRejectDialog({ row, reason: "" });
      }}
      onRejectReasonChange={(reason) => setRejectDialog((dialog) => (dialog ? { ...dialog, reason } : dialog))}
      onConfirmReject={() => {
        if (rejectDialog) remove(rejectDialog.row.point.id);
        setRejectDialog(null);
      }}
      onDismissReject={() => setRejectDialog(null)}
      bulkDialog={bulkDialog}
      onStartBulk={() => setBulkDialog({ reason: "" })}
      onBulkReasonChange={(reason) => setBulkDialog((dialog) => (dialog ? { ...dialog, reason } : dialog))}
      onConfirmBulk={() => {
        const chosen = rows.filter((row) => row.point.id !== undefined && selected.includes(row.point.id));
        setBulkResult({ rejectedCount: chosen.reduce((sum, row) => sum + row.visits_count, 0) });
        setSelected([]);
        setBulkDialog(null);
      }}
      onDismissBulk={() => setBulkDialog(null)}
      bulkResult={bulkResult}
    />
  );
}

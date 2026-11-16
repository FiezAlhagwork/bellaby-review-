"use client";

import { useState } from "react";
import type { DailyReportRow } from "@/features/daily-reports/deadline";
import { DailyReportDetailsView, emptyRatingDraft, type RatingDraft, type ReportNoteDialog } from "@/features/daily-reports/views/DailyReportDetailsView";
import { ratingDeadline } from "@/lib/deadline";
import type { Loadable } from "@/lib/loadable";
import { findDailyReport } from "@/mocks/daily-reports";
import { supervisionNow, supervisor } from "@/mocks/supervision";
import { visitsOf } from "@/mocks/visits";

// غلاف تفاعلي لصفحة الرسم: يملك التقرير والمسودة ونوافذ التأكيد والملاحظة. التأكيد يقفل التقييم (الدرجة ومن قيّم ومتى وهل ضمن المهلة) فيظهر للقراءة،
// و«إضافة ملاحظة» تضيف الملاحظة إلى السجل. `initialSaveError` يحاكي 409 `rating_locked`. في الإنتاج تحلّ محلّه حاوية تجلب GET /daily-reports/{id}
// و/visits وترسل POST /daily-reports/{id}/rating و/notes. لا يُنقل للإنتاج.

type DailyReportDetailsDemoProps = {
  reportId: number;
  /** السوبرفايزر (true) أو للقراءة فقط (false). */
  canRate?: boolean;
  initialDraft?: RatingDraft;
  /** نافذة تأكيد القفل مفتوحة عند العرض (حالة «confirm»). */
  initialConfirming?: boolean;
  /** رمز خطأ الحفظ الظاهر عند العرض (حالة «rating-locked»). */
  initialSaveError?: string;
  /** حالة البيانات: جاهزة، أو تحميل، أو خطأ، أو غير موجود. */
  mode?: "ready" | "loading" | "error" | "not-found";
};

export function DailyReportDetailsDemo({ reportId, canRate = true, initialDraft = emptyRatingDraft, initialConfirming = false, initialSaveError, mode = "ready" }: DailyReportDetailsDemoProps) {
  const [report, setReport] = useState<DailyReportRow>(findDailyReport(reportId));
  const [draft, setDraft] = useState(initialDraft);
  const [confirming, setConfirming] = useState(initialConfirming);
  const [saveError, setSaveError] = useState(initialSaveError);
  const [noteDialog, setNoteDialog] = useState<ReportNoteDialog | null>(null);

  const loadable: Loadable<DailyReportRow> =
    mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : mode === "not-found" ? { status: "error", code: "not_found" } : { status: "ready", data: report };

  const confirmSave = () => {
    if (draft.score === null) return;
    const late = ratingDeadline(report.rating_due_at, supervisionNow)?.late ?? false;
    setReport({
      ...report,
      rating: { score: draft.score, comment: draft.comment.trim() || null, rated_by: supervisor, rated_at: supervisionNow, within_24_work_hours: !late },
      rating_due_at: null,
    });
    setConfirming(false);
    setSaveError(undefined);
  };

  const addNote = () => {
    if (!noteDialog) return;
    const next = { id: Math.max(0, ...(report.notes ?? []).map((note) => note.id ?? 0)) + 1, author: supervisor, text: noteDialog.text.trim(), created_at: supervisionNow };
    setReport({ ...report, notes: [...(report.notes ?? []), next] });
    setNoteDialog(null);
  };

  return (
    <DailyReportDetailsView
      report={loadable}
      visits={{ status: "ready", data: visitsOf(report.rep?.id ?? 0, report.work_date ?? "") }}
      canRate={canRate}
      now={supervisionNow}
      draft={draft}
      onDraftChange={(next) => {
        setDraft(next);
        setSaveError(undefined);
      }}
      onSave={() => setConfirming(true)}
      confirming={confirming}
      saveError={saveError}
      onConfirmSave={() => {
        // يحاكي 409 `rating_locked` حين تكون الحالة المعروضة «مقيَّم مسبقاً».
        if (initialSaveError) {
          setSaveError(initialSaveError);
          setConfirming(false);
          return;
        }
        confirmSave();
      }}
      onDismissConfirm={() => setConfirming(false)}
      noteDialog={noteDialog}
      onStartNote={() => setNoteDialog({ text: "" })}
      onNoteTextChange={(text) => setNoteDialog({ text })}
      onConfirmNote={addNote}
      onDismissNote={() => setNoteDialog(null)}
      onBack={() => {}}
    />
  );
}

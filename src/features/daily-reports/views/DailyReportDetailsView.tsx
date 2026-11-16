"use client";

import { NotePencil } from "@phosphor-icons/react";
import { ActivityLog, type ActivityEvent } from "@/components/data/ActivityLog";
import { DateTimeStackCell, StatusCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { DescriptionList } from "@/components/data/DescriptionList";
import { ratingScaleLabels, ratingScaleOrder } from "@/components/data/rating-scale";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Dialog } from "@/components/ui/Dialog";
import { ErrorState } from "@/components/ui/ErrorState";
import { Field } from "@/components/ui/Field";
import { NotFoundState } from "@/components/ui/NotFoundState";
import { Radio, RadioGroup } from "@/components/ui/Radio";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { errorMessage } from "@/lib/api/error-messages";
import type { RatingScale, Visit } from "@/lib/api/types";
import { dayLabel } from "@/lib/calendar";
import { formatDateTime, isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";
import { ratingDeadline } from "@/lib/deadline";
import type { DailyReportRow } from "../deadline";

/** مسودة التقييم قبل الحفظ: الدرجة (إلزامية) والملاحظة (اختيارية). */
export type RatingDraft = { score: RatingScale | null; comment: string };

export const emptyRatingDraft: RatingDraft = { score: null, comment: "" };

/** نافذة «إضافة ملاحظة» المفتوحة بعد القفل. null = مغلقة. */
export type ReportNoteDialog = { text: string; loading?: boolean; /** رمز خطأ العقد (validation_failed…). */ errorCode?: string };

const NOTE_MAX = 2000;
const COMMENT_MAX = 1000;

type DailyReportDetailsViewProps = {
  /** `GET /daily-reports/{id}`. خطأ `not_found` يعرض «غير موجود أو خارج نطاقك». */
  report: Loadable<DailyReportRow>;
  /** زيارات اليوم: `GET /visits?rep_id=&from=&to=` بيوم العمل نفسه. */
  visits: Loadable<readonly Visit[]>;
  /** `daily_reports.rate`: يقيّم ويضيف الملاحظة. مدير المكتب العلمي للقراءة فقط. */
  canRate: boolean;
  /** الآن (ISO UTC): للوقت المتبقي من المهلة. */
  now: string;
  draft: RatingDraft;
  onDraftChange?: (draft: RatingDraft) => void;
  /** «حفظ التقييم»: يفتح تأكيد القفل. */
  onSave?: () => void;
  /** نافذة تأكيد «التقييم يُقفل بعد الحفظ» مفتوحة. */
  confirming?: boolean;
  saving?: boolean;
  /** رمز خطأ `POST /rating` (rating_locked وvalidation_failed…): شريط فوق التقييم. */
  saveError?: string;
  onConfirmSave?: () => void;
  onDismissConfirm?: () => void;
  noteDialog?: ReportNoteDialog | null;
  onStartNote?: () => void;
  onNoteTextChange?: (text: string) => void;
  onConfirmNote?: () => void;
  onDismissNote?: () => void;
  onBack?: () => void;
  onRetry?: () => void;
};

type ReportNote = NonNullable<DailyReportRow["notes"]>[number];

/** أحداث ملاحظات ما بعد القفل: الأحدث أولاً. */
function noteEvents(notes: readonly ReportNote[]): ActivityEvent[] {
  return notes
    .flatMap((note) => (note.id !== undefined && note.created_at ? [{ id: note.id, icon: NotePencil, sentence: `أضاف ${note.author?.name ?? "—"} ملاحظة`, reason: note.text, at: note.created_at }] : []))
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}

/**
 * تقييم التقرير اليومي (S03): بيانات التقرير وملخصه وزيارات اليوم، ثم التقييم بالسلّم الموحّد (ممتاز 100 … ضعيف 20) وملاحظة اختيارية.
 * «حفظ التقييم» يطلب تأكيداً لأنه يُقفل، وبعده يبقى للقراءة مع «إضافة ملاحظة» (القرار 9). تجاوز مهلة 24 ساعة عمل يظهر «متأخر».
 */
export function DailyReportDetailsView({
  report,
  visits,
  canRate,
  now,
  draft,
  onDraftChange,
  onSave,
  confirming = false,
  saving = false,
  saveError,
  onConfirmSave,
  onDismissConfirm,
  noteDialog = null,
  onStartNote,
  onNoteTextChange,
  onConfirmNote,
  onDismissNote,
  onBack,
  onRetry,
}: DailyReportDetailsViewProps) {
  if (report.status === "loading") {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <div className="flex flex-col gap-2 pb-4">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-52 w-full" />
      </div>
    );
  }

  if (report.status === "error") {
    return report.code === "not_found" ? <NotFoundState onBack={onBack} /> : <ErrorState code={report.code} onRetry={onRetry} />;
  }

  const data = report.data;
  const rating = data.rating;
  const summary = data.summary;
  const deadline = rating ? null : ratingDeadline(data.rating_due_at, now);

  const visitColumns: DataTableColumn<Visit>[] = [
    { key: "point", header: "الجهة", cell: (row) => <TextCell value={row.visit_point?.name} />, priority: "high", role: "primary" },
    { key: "started", header: "البدء", cell: (row) => <DateTimeStackCell value={row.started_at} />, width: "w-28", priority: "high" },
    { key: "duration", header: "المدة", cell: (row) => (row.duration_minutes === null || row.duration_minutes === undefined ? <TextCell value={null} /> : <span dir="ltr">{`${row.duration_minutes} د`}</span>), width: "w-24", align: "end", priority: "high" },
    { key: "met", header: "اللقاء", cell: (row) => (row.met ? <Badge color="success">التُقي</Badge> : <Badge color="neutral">لم يُلتقَ</Badge>), width: "w-28" },
    { key: "verification", header: "التحقق", cell: (row) => (row.verification_status ? <StatusCell entity="visitVerification" status={row.verification_status} /> : <TextCell value={null} />), width: "w-32", priority: "high", role: "status" },
  ];

  const badge = rating ? <Badge color="success">مقيَّم</Badge> : deadline?.late ? <Badge color="danger">متأخر</Badge> : <Badge color="warning">بانتظار التقييم</Badge>;
  const scoreLabel = (score: RatingScale) => `${ratingScaleLabels[score]} · ${isolate(score)}`;
  const saveDisabledReason = draft.score === null ? "اختر درجة التقييم." : null;

  return (
    <>
      <PageHeader
        title={`تقرير ${data.rep?.name ?? "—"}`}
        badge={badge}
        description={`${data.work_date ? dayLabel(data.work_date) : "—"}${data.received_at ? ` · استُلم ${formatDateTime(data.received_at)}` : ""}`}
      />

      <div className="flex flex-col gap-4">
        <Card title="البيانات">
          <DescriptionList
            items={[
              { label: "المندوب", value: data.rep?.name },
              { label: "يوم العمل", value: data.work_date ? dayLabel(data.work_date) : null },
              { label: "المحافظة", value: data.basics?.governorate },
              { label: "المنطقة", value: data.basics?.region },
              { label: "الزيارات المخطط لها", value: data.basics?.planned_visits === undefined ? null : isolate(data.basics.planned_visits) },
              { label: "أُرسل من الجهاز", value: data.submitted_at_device ? formatDateTime(data.submitted_at_device) : null },
              { label: "استُلم في الخادم", value: data.received_at ? formatDateTime(data.received_at) : null },
              { label: "الإرسال", value: data.on_time === undefined ? null : data.on_time ? <Badge color="success">في الموعد</Badge> : <Badge color="warning">بعد الموعد</Badge> },
            ]}
          />
        </Card>

        <Card title="الزيارات">
          <DataTable
            label="زيارات اليوم"
            columns={visitColumns}
            rows={visits.status === "ready" ? visits.data : []}
            getRowKey={(row) => row.id ?? ""}
            loading={visits.status === "loading"}
            error={visits.status === "error" ? { code: visits.code, onRetry } : undefined}
          />
        </Card>

        <Card title="الملخص">
          <DescriptionList
            items={[
              { label: "إجمالي الزيارات", value: summary?.visits_total === undefined ? null : isolate(summary.visits_total) },
              { label: "التي التُقي فيها", value: summary?.met === undefined ? null : isolate(summary.met) },
              { label: "التي لم يُلتقَ فيها", value: summary?.not_met === undefined ? null : isolate(summary.not_met) },
              {
                label: "أسباب عدم اللقاء",
                value: summary?.not_met_reasons?.length ? (
                  <ul className="flex flex-col gap-1">
                    {summary.not_met_reasons.map((entry) => (
                      <li key={entry.reason}>{`${entry.reason}: ${isolate(entry.count ?? 0)}`}</li>
                    ))}
                  </ul>
                ) : null,
              },
              { label: "عينات موزَّعة", value: summary?.samples_distributed === undefined ? null : isolate(summary.samples_distributed) },
              { label: "مواد دعائية موزَّعة", value: summary?.promo_distributed === undefined ? null : isolate(summary.promo_distributed) },
              { label: "فرص البيع", value: summary?.sales_opportunities === undefined ? null : isolate(summary.sales_opportunities) },
            ]}
          />
          <DescriptionList items={[{ label: "أبرز نتيجة", value: data.top_result }, { label: "أبرز مشكلة", value: data.top_problem }, { label: "خطة الغد", value: data.next_day_plan }]} />
        </Card>

        {saveError ? (
          <Banner kind="danger" title="تعذّر حفظ التقييم">
            {errorMessage(saveError)}
          </Banner>
        ) : null}

        {rating?.score ? (
          <Card title="التقييم">
            <Banner kind="neutral" title="التقييم مقفل">
              حُفظ التقييم ولا يُعدَّل. يمكن إضافة ملاحظة عليه.
            </Banner>
            <DescriptionList
              items={[
                { label: "الدرجة", value: scoreLabel(rating.score) },
                { label: "قيّمه", value: rating.rated_by?.name },
                { label: "وقت التقييم", value: rating.rated_at ? formatDateTime(rating.rated_at) : null },
                { label: "المهلة", value: rating.within_24_work_hours === undefined ? null : rating.within_24_work_hours ? <Badge color="success">ضمن 24 ساعة عمل</Badge> : <Badge color="warning">بعد المهلة</Badge> },
                { label: "ملاحظة التقييم", value: rating.comment },
              ]}
            />
          </Card>
        ) : canRate ? (
          <Card title="التقييم">
            {deadline?.late ? (
              <Banner kind="warning" title="متأخر">
                تجاوز التقرير مهلة التقييم (24 ساعة عمل). يُسجَّل التقييم متأخراً.
              </Banner>
            ) : deadline ? (
              <Banner kind={deadline.urgent ? "warning" : "info"}>{`${deadline.label} من مهلة التقييم (24 ساعة عمل).`}</Banner>
            ) : null}
            <Field label="الدرجة" required>
              <RadioGroup aria-label="درجة التقييم" value={draft.score} onValueChange={(score) => onDraftChange?.({ ...draft, score })} disabled={saving}>
                {ratingScaleOrder.map((score) => (
                  <Radio key={score} value={score} label={scoreLabel(score)} />
                ))}
              </RadioGroup>
            </Field>
            <Field label="ملاحظة" optional hint={`حتى ${isolate(COMMENT_MAX)} حرفاً.`}>
              <Textarea aria-label="ملاحظة التقييم" maxLength={COMMENT_MAX} value={draft.comment} onChange={(event) => onDraftChange?.({ ...draft, comment: event.target.value })} disabled={saving} />
            </Field>
            <div className="flex flex-col gap-2">
              <div>
                <Button variant="primary" size="lg" disabled={saveDisabledReason !== null} onClick={onSave}>
                  حفظ التقييم
                </Button>
              </div>
              {saveDisabledReason ? <p className="text-label text-fg-muted">{saveDisabledReason}</p> : <p className="text-label text-fg-muted">يُقفل التقييم بعد الحفظ.</p>}
            </div>
          </Card>
        ) : (
          <Card title="التقييم">
            <Banner kind="info">بانتظار تقييم السوبرفايزر.</Banner>
          </Card>
        )}

        {rating?.score || (data.notes ?? []).length > 0 ? (
          <Card
            title="الملاحظات"
            action={
              canRate && rating?.score ? (
                <Button variant="secondary" size="sm" onClick={onStartNote}>
                  إضافة ملاحظة
                </Button>
              ) : undefined
            }
          >
            <ActivityLog events={noteEvents(data.notes ?? [])} />
          </Card>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirming}
        onOpenChange={(open) => (open ? undefined : onDismissConfirm?.())}
        title="حفظ التقييم؟"
        description={`التقييم ${draft.score ? `«${scoreLabel(draft.score)}» ` : ""}يُقفل بعد الحفظ ولا يُعدَّل. يمكنك إضافة ملاحظة عليه بعدها.`}
        confirmLabel="حفظ التقييم"
        cancelLabel="تراجع"
        loading={saving}
        onConfirm={() => onConfirmSave?.()}
      />

      <Dialog
        open={noteDialog !== null}
        onOpenChange={(open) => (open ? undefined : onDismissNote?.())}
        title="إضافة ملاحظة"
        description="تُضاف الملاحظة إلى التقرير بعد قفل تقييمه، ويراها من يقرأ التقرير."
        size="sm"
        dismissible={!noteDialog?.loading}
        actions={[
          <Button key="cancel" variant="secondary" disabled={noteDialog?.loading} className="flex-1 @tablet:flex-none" onClick={() => onDismissNote?.()}>
            تراجع
          </Button>,
          <Button key="add" variant="primary" loading={noteDialog?.loading} disabled={(noteDialog?.text.trim() ?? "") === ""} className="flex-1 @tablet:flex-none" onClick={() => onConfirmNote?.()}>
            إضافة
          </Button>,
        ]}
      >
        <Field label="الملاحظة" required hint={`حتى ${isolate(NOTE_MAX)} حرفاً.`} error={noteDialog?.errorCode ? errorMessage(noteDialog.errorCode) : undefined}>
          <Textarea aria-label="الملاحظة" maxLength={NOTE_MAX} value={noteDialog?.text ?? ""} onChange={(event) => onNoteTextChange?.(event.target.value)} disabled={noteDialog?.loading} />
        </Field>
      </Dialog>
    </>
  );
}

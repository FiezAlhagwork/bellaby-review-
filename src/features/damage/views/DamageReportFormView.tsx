"use client";

import { DescriptionList } from "@/components/data/DescriptionList";
import { LineItemsEditor, type EditorBatch, type EditorItem, type EditorLine } from "@/components/data/LineItemsEditor";
import { StatusBadge } from "@/components/data/StatusBadge";
import { StockLine } from "@/components/data/StockLine";
import { Grid } from "@/components/layout/Grid";
import { PageHeader } from "@/components/layout/PageHeader";
import { AttachmentList } from "@/components/ui/AttachmentList";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { Field } from "@/components/ui/Field";
import { FileUpload, type FileRejection, type UploadFile } from "@/components/ui/FileUpload";
import type { Option } from "@/components/ui/OptionList";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { errorMessage } from "@/lib/api/error-messages";
import type { DamageReport, ListEntry, Location } from "@/lib/api/types";
import type { IsoDate } from "@/lib/calendar";
import { CaptureRow } from "@/lib/design/CaptureMode";
import { formatQuantity, isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

/** حالة النموذج كما تُرسل إلى `POST /damage-reports` (الأسماء المختصرة للـ view، والحاوية تحوّلها لأسماء العقد). */
export type DamageReportForm = {
  locationId: string | null;
  /** `reason_id` من `damage_reasons`. */
  reasonId: string | null;
  note: string;
  lines: EditorLine[];
  /** المرفقات: كل ملف يُرفع بـ`POST /uploads` (`purpose=damage_photo`)، والمرفوعة تُرسل `upload_id`ها في `attachments`. */
  attachments: UploadFile[];
};

const emptyLines = (): EditorLine[] => [{ id: "line-1", itemId: null, batchId: null, quantity: null }];

// معرّف السطر الأول ثابت فلا يختلف بين الخادم والمتصفح.
export const emptyDamageReportForm = (locationId: string | null = null): DamageReportForm => ({ locationId, reasonId: null, note: "", lines: emptyLines(), attachments: [] });

/**
 * حدود المرفقات: العقد لا يحدّدها (غير `file_too_large`)، فهذه قيم مؤقتة للواجهة: docs/backend-requests.md §23.2.
 */
export const damageAttachmentLimits = { accept: "image/*", acceptLabel: "صور (JPG أو PNG)", maxSize: 10 * 1024 * 1024, maxFiles: 5 } as const;

export type DamageReportOptions = {
  /** مواقع المستودع: `GET /locations?type=WAREHOUSE`. */
  locations: readonly Location[];
  /** الأصناف الفعّالة (منتجات وعينات ومواد). */
  items: readonly EditorItem[];
  /** `damage_reasons` من `GET /lists`. */
  reasons: readonly ListEntry[];
};

type DamageReportFormViewProps = {
  options: Loadable<DamageReportOptions>;
  /** دفعات كل صنف بمفتاح `String(itemId)` ومتاحها في الموقع المختار (`GET /stock/balances?location_id=&group_by=batch`). */
  batches: Readonly<Record<string, Loadable<readonly EditorBatch[]>>>;
  form: DamageReportForm;
  onFormChange: (form: DamageReportForm) => void;
  /** `errors` من `validation_failed` كما هي: `{ reason_id: "نص", "lines.0.quantity": "نص" }`. */
  errors?: Readonly<Record<string, string>>;
  /** رمز خطأ 422 بلا حقل (insufficient_stock…). */
  submitError?: string;
  submitting?: boolean;
  /** خطأ منطقة المرفقات: رفض نوع أو حجم قبل الرفع (`fileRejectionMessage`) أو `file_too_large` من الخادم. */
  attachmentError?: string;
  /** الملفات الصالحة بعد الفحص: ابدأ رفعها وأضفها إلى `form.attachments`. */
  onFilesSelect?: (files: File[]) => void;
  onFilesReject?: (rejections: FileRejection[]) => void;
  onFileRemove?: (id: string) => void;
  /** بعد الرفع: ملخص التقرير بدل النموذج. */
  saved?: DamageReport | null;
  today: IsoDate;
  onSubmit?: () => void;
  onCancel?: () => void;
  onReportAnother?: () => void;
  onOpenReports?: () => void;
  onDownloadAttachment?: (id: string) => void;
  onRetry?: () => void;
};

const NOTE_MAX = 500;

/**
 * تقرير تالف المستودع (W20): الموقع، والسبب من قائمة الأسباب، وأسطر بدفعاتها (الموقوفة مسموحة: التوثيق لا يُبعد الكمية)،
 * وملاحظة، ومرفقات صور. بعد الرفع يبقى التقرير «بانتظار القرار» حتى يقرّره مدير المبيعات (M08).
 */
export function DamageReportFormView({
  options,
  batches,
  form,
  onFormChange,
  errors = {},
  submitError,
  submitting = false,
  attachmentError,
  onFilesSelect,
  onFilesReject,
  onFileRemove,
  saved = null,
  today,
  onSubmit,
  onCancel,
  onReportAnother,
  onOpenReports,
  onDownloadAttachment,
  onRetry,
}: DamageReportFormViewProps) {
  const header = <PageHeader title="تقرير تالف" description="بلّغ عن بضاعة تالفة في المستودع. يقرّر مدير المبيعات قبولها أو رفضها بعد الرفع." />;

  if (saved) {
    return (
      <>
        {header}
        <SavedSummary report={saved} today={today} onReportAnother={onReportAnother} onOpenReports={onOpenReports} onDownloadAttachment={onDownloadAttachment} />
      </>
    );
  }

  if (options.status === "loading") {
    return (
      <>
        {header}
        <div className="flex flex-col gap-4" aria-busy="true">
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      </>
    );
  }

  if (options.status === "error") {
    return (
      <>
        {header}
        <ErrorState code={options.code} onRetry={onRetry} />
      </>
    );
  }

  const { locations, items, reasons } = options.data;
  const locationOptions: Option[] = locations.filter((location) => location.is_active !== false).flatMap((location) => (location.id !== undefined && location.name ? [{ value: String(location.id), label: location.name }] : []));
  const reasonOptions: Option[] = [...reasons]
    .filter((reason) => reason.is_active !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .flatMap((reason) => (reason.id !== undefined && reason.name ? [{ value: String(reason.id), label: reason.name }] : []));

  const set = (patch: Partial<DamageReportForm>) => onFormChange({ ...form, ...patch });
  // أرصدة الدفعات تتبع الموقع: تبديله بعد اختيار أصناف يفرغ الأسطر (متاحها تغيّر).
  const changeLocation = (locationId: string | null) => set({ locationId, lines: form.lines.some((line) => line.itemId !== null) ? emptyLines() : form.lines });

  const batchOf = (line: EditorLine) => {
    const loadable = line.itemId === null ? undefined : batches[String(line.itemId)];
    return loadable?.status === "ready" ? loadable.data.find((batch) => batch.id === line.batchId) : undefined;
  };
  const complete = form.lines.length > 0 && form.lines.every((line) => line.itemId !== null && line.batchId !== null && line.quantity !== null && line.quantity >= 1);
  const hasOverflow = form.lines.some((line) => {
    const batch = batchOf(line);
    return batch !== undefined && line.quantity !== null && line.quantity > batch.available;
  });
  const hasSuspended = form.lines.some((line) => batchOf(line)?.status === "SUSPENDED");
  const uploading = form.attachments.some((file) => file.status === "uploading");
  const failedUpload = form.attachments.some((file) => file.status === "error");

  // سبب تعطيل «رفع التقرير»: يُعرض تحت الزر (الزر المعطّل بلا سبب ظاهر ممنوع).
  const disabledReason =
    form.locationId === null
      ? "اختر موقع المستودع."
      : form.reasonId === null
        ? "اختر سبب التالف."
        : !complete
          ? "أكمل الأسطر: الصنف والدفعة والكمية."
          : hasOverflow
            ? "في الأسطر كمية أكبر من المتاح. خفّضها."
            : uploading
              ? "انتظر اكتمال رفع المرفقات."
              : failedUpload
                ? "أزل المرفق الذي تعذّر رفعه أو أعد رفعه."
                : null;

  const { maxFiles } = damageAttachmentLimits;
  const remaining = Math.max(0, maxFiles - form.attachments.length);

  return (
    <>
      {header}

      <div className="flex flex-col gap-4">
        {submitError ? (
          <Banner kind="danger" title="تعذّر رفع التقرير">
            {errorMessage(submitError)}
          </Banner>
        ) : null}

        <Card title="التفاصيل">
          <Grid cols={{ base: 1, tablet: 2 }} gap={4}>
            <Field label="الموقع" required error={errors.location_id}>
              <Select aria-label="الموقع" placeholder="اختر المستودع" options={locationOptions} value={form.locationId} onValueChange={changeLocation} locked={locationOptions.length === 1} />
            </Field>
            <Field label="السبب" required error={errors.reason_id}>
              <Select aria-label="السبب" placeholder="اختر سبب التالف" options={reasonOptions} value={form.reasonId} onValueChange={(reasonId) => set({ reasonId })} />
            </Field>
          </Grid>
          <Field label="ملاحظة" optional hint={`حتى ${isolate(NOTE_MAX)} حرفاً.`} error={errors.note}>
            <Textarea aria-label="ملاحظة" maxLength={NOTE_MAX} value={form.note} onChange={(event) => set({ note: event.target.value })} />
          </Field>
        </Card>

        <Card title="الأصناف التالفة">
          {hasSuspended ? <Banner kind="info">في الأسطر دفعة موقوفة. يُسمح بتوثيق تلفها، فالإيقاف لا يمنع ما يوثّق الكمية.</Banner> : null}
          <LineItemsEditor lines={form.lines} onChange={(lines) => set({ lines })} items={items} batches={batches} errors={errors} allowSuspended today={today} readOnly={submitting} />
          {errors.lines ? (
            <p role="alert" className="text-label text-danger">
              {errors.lines}
            </p>
          ) : null}
        </Card>

        <Card title="المرفقات">
          <Field label="صور التالف" optional hint={`${remaining === 0 ? "بلغت الحد الأقصى" : `حتى ${isolate(maxFiles)} صور`}.`} error={errors.attachments ?? attachmentError}>
            <FileUpload
              files={form.attachments}
              onSelect={(files) => onFilesSelect?.(files.slice(0, remaining))}
              onReject={onFilesReject}
              onRemove={(id) => onFileRemove?.(id)}
              accept={damageAttachmentLimits.accept}
              acceptLabel={damageAttachmentLimits.acceptLabel}
              maxSize={damageAttachmentLimits.maxSize}
              multiple
              disabled={submitting || remaining === 0}
            />
          </Field>
        </Card>

        <div className="flex flex-col gap-2">
          <CaptureRow className="flex-wrap items-center gap-3">
            <Button variant="primary" size="lg" loading={submitting} disabled={disabledReason !== null} onClick={onSubmit}>
              رفع التقرير
            </Button>
            <Button variant="secondary" size="lg" disabled={submitting} onClick={onCancel}>
              إلغاء
            </Button>
          </CaptureRow>
          {disabledReason ? <p className="text-label text-fg-muted">{disabledReason}</p> : null}
        </div>
      </div>
    </>
  );
}

function SavedSummary({
  report,
  today,
  onReportAnother,
  onOpenReports,
  onDownloadAttachment,
}: {
  report: DamageReport;
  today: IsoDate;
  onReportAnother?: () => void;
  onOpenReports?: () => void;
  onDownloadAttachment?: (id: string) => void;
}) {
  const lines = report.lines ?? [];
  const total = lines.reduce((sum, line) => sum + (line.quantity ?? 0), 0);
  const attachments = (report.attachments ?? []).flatMap((file) => (file.upload_id && file.name ? [{ id: file.upload_id, name: file.name }] : []));

  return (
    <div className="flex flex-col gap-4">
      <Banner kind="success" title="رُفع التقرير">
        <div className="flex flex-col gap-1">
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span dir="ltr" className="tabular-nums">
              {`#${report.id}`}
            </span>
            {report.status ? <StatusBadge entity="damageReport" status={report.status} /> : null}
          </span>
          <p>يبقى التقرير بانتظار قرار مدير المبيعات: يقبله تالفاً بتحديد المسؤولية، أو يرفضه بسبب.</p>
        </div>
      </Banner>

      <Card title="ما أُبلغ عنه">
        <DescriptionList
          items={[
            { label: "الموقع", value: report.location?.name },
            { label: "السبب", value: report.reason?.name },
            { label: "ملاحظة", value: report.note },
          ]}
        />
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
          {lines.map((line, index) => (
            <StockLine key={`${line.batch?.id}-${index}`} item={line.item ?? {}} batch={line.batch} quantity={line.quantity ?? 0} today={today} />
          ))}
        </div>
        <p className="text-body text-fg-muted">{`المجموع: ${formatQuantity(total, "علبة")}`}</p>
        {attachments.length > 0 ? <AttachmentList attachments={attachments} onDownload={(id) => onDownloadAttachment?.(id)} /> : null}
      </Card>

      <CaptureRow className="flex-wrap items-center gap-3">
        <Button variant="primary" size="lg" onClick={onReportAnother}>
          تقرير آخر
        </Button>
        <Button variant="secondary" size="lg" onClick={onOpenReports}>
          تقارير التالف
        </Button>
      </CaptureRow>
    </div>
  );
}

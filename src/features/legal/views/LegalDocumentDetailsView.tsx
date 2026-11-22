"use client";

import { DescriptionList } from "@/components/data/DescriptionList";
import { legalCategoryLabels } from "@/components/data/legal-categories";
import { StatusBadge } from "@/components/data/StatusBadge";
import { Grid } from "@/components/layout/Grid";
import { PageHeader } from "@/components/layout/PageHeader";
import { AttachmentList } from "@/components/ui/AttachmentList";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DatePicker } from "@/components/ui/DatePicker";
import { Dialog } from "@/components/ui/Dialog";
import { ErrorState } from "@/components/ui/ErrorState";
import { Field } from "@/components/ui/Field";
import { FileUpload, type FileRejection, type UploadFile } from "@/components/ui/FileUpload";
import { NotFoundState } from "@/components/ui/NotFoundState";
import { ReasonDialog } from "@/components/ui/ReasonDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { errorMessage } from "@/lib/api/error-messages";
import type { LegalDocument } from "@/lib/api/types";
import { dayLabel, daysBetween, type IsoDate } from "@/lib/calendar";
import { countPhrase, formatDateTime, isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";
import { legalFileLimits } from "./LegalDocumentFormView";

/** نافذة «تجديد»: `POST /legal-documents/{id}/versions { reason, file_upload_id, starts_on, expires_on }`. */
export type RenewForm = { reason: string; file: readonly UploadFile[]; startsOn: IsoDate | null; expiresOn: IsoDate | null };

type LegalDocumentDetailsViewProps = {
  document: Loadable<LegalDocument>;
  today: IsoDate;
  /** `legal.manage`: «تجديد» و«منتهية بقصد». */
  canManage: boolean;
  /** null = النافذة مغلقة. */
  renew: RenewForm | null;
  onRenewChange: (form: RenewForm | null) => void;
  onRenewFileSelect: (files: File[]) => void;
  onRenewFileReject?: (rejections: FileRejection[]) => void;
  onRenewFileRemove: (id: string) => void;
  renewFileError?: string;
  onRenewSubmit: () => void;
  /** نافذة «منتهية بقصد». */
  expiring: boolean;
  onExpiringChange: (open: boolean) => void;
  expiryReason: string;
  onExpiryReasonChange: (reason: string) => void;
  onExpirySubmit: () => void;
  /** `errors` من `validation_failed` للنافذة المفتوحة. */
  errors?: Readonly<Record<string, string>>;
  /** رمز خطأ بلا حقل: `invalid_status` أو 409 «انتهت فعلاً» (§89). */
  actionError?: string;
  submitting?: boolean;
  onDownloadFile: (uploadId: string) => void;
  onBack?: () => void;
  onRetry?: () => void;
};

const dayForms = ["يوم", "يومين", "أيام"] as const;
const EXPIRY_REASON_MAX = 1000;

/**
 * صفحة الوثيقة (I17): بياناتها وحالتها، وكل نسخها بتواريخها وملفاتها (الأحدث أولاً). «تجديد» نسخة جديدة بانتهاء جديد، و«منتهية بقصد» قبل الانتهاء بسبب.
 * كل تعديل نسخة جديدة، ولا حذف (القرار 14).
 */
export function LegalDocumentDetailsView({
  document,
  today,
  canManage,
  renew,
  onRenewChange,
  onRenewFileSelect,
  onRenewFileReject,
  onRenewFileRemove,
  renewFileError,
  onRenewSubmit,
  expiring,
  onExpiringChange,
  expiryReason,
  onExpiryReasonChange,
  onExpirySubmit,
  errors = {},
  actionError,
  submitting = false,
  onDownloadFile,
  onBack,
  onRetry,
}: LegalDocumentDetailsViewProps) {
  if (document.status === "error") return document.code === "not_found" ? <NotFoundState onBack={onBack} /> : <ErrorState code={document.code} onRetry={onRetry} />;
  if (document.status === "loading") {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const doc = document.data;
  const ended = doc.status === "EXPIRED" || doc.status === "INTENTIONALLY_EXPIRED";
  const daysLeft = doc.expires_on ? daysBetween(today, doc.expires_on) : null;
  const versions = [...(doc.versions ?? [])].sort((a, b) => (b.version ?? 0) - (a.version ?? 0));

  const renewInverted = renew !== null && renew.startsOn !== null && renew.expiresOn !== null && renew.expiresOn < renew.startsOn;
  const renewReason =
    renew === null
      ? null
      : renew.reason.trim() === ""
        ? "اكتب سبب النسخة."
        : renew.file.length === 0
          ? "أرفق ملف النسخة الجديدة."
          : renew.expiresOn === null
            ? "اختر تاريخ الانتهاء الجديد."
            : renewInverted
              ? "تاريخ الانتهاء قبل تاريخ البدء."
              : null;

  const actions = canManage
    ? [
        { id: "expire", label: "منتهية بقصد", danger: true, disabled: ended, reason: ended ? "الوثيقة منتهية." : undefined, onSelect: () => onExpiringChange(true) },
        { id: "renew", label: "تجديد", primary: true, onSelect: () => onRenewChange({ reason: "", file: [], startsOn: doc.expires_on ?? null, expiresOn: null }) },
      ]
    : undefined;

  return (
    <>
      <PageHeader title={doc.title ?? ""} badge={doc.status ? <StatusBadge entity="legalDocument" status={doc.status} /> : undefined} description={`${doc.category ? legalCategoryLabels[doc.category] : ""} · النسخة ${isolate(doc.version ?? 1)}`} actions={actions} />

      <div className="flex flex-col gap-4">
        {actionError && renew === null && !expiring ? (
          <Banner kind="danger" title="تعذّر تنفيذ الإجراء">
            {errorMessage(actionError)}
          </Banner>
        ) : null}

        {doc.status === "EXPIRING" && daysLeft !== null ? (
          <Banner kind="warning" title="قريبة الانتهاء">
            {`تنتهي يوم ${dayLabel(doc.expires_on ?? today)}، بعد ${countPhrase(daysLeft, dayForms)}. جدّدها بنسخة جديدة أو اتركها تنتهي.`}
          </Banner>
        ) : null}
        {doc.status === "EXPIRED" ? (
          <Banner kind="danger" title="منتهية">
            {`انتهت يوم ${doc.expires_on ? dayLabel(doc.expires_on) : "—"}. التجديد نسخة جديدة بانتهاء جديد.`}
          </Banner>
        ) : null}
        {doc.status === "INTENTIONALLY_EXPIRED" ? (
          <Banner kind="info" title="منتهية بقصد">
            {doc.intentional_expiry_reason ?? "—"}
          </Banner>
        ) : null}

        <Card title="البيانات">
          <DescriptionList
            items={[
              { label: "الفئة", value: doc.category ? legalCategoryLabels[doc.category] : null },
              { label: "الأطراف", value: (doc.parties ?? []).join("، ") },
              { label: "البدء", value: doc.starts_on ? dayLabel(doc.starts_on) : null },
              { label: "الانتهاء", value: doc.expires_on ? dayLabel(doc.expires_on) : "بلا انتهاء" },
              { label: "مدة التنبيه", value: doc.alert_days ? `قبل ${countPhrase(doc.alert_days, dayForms)}` : null },
              { label: "النسخة الحالية", value: isolate(doc.version ?? 1) },
            ]}
          />
        </Card>

        <Card title="النسخ">
          <ol className="flex flex-col divide-y divide-border">
            {versions.map((version) => (
              <li key={version.version} className="flex flex-col gap-2 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-body text-fg">{`النسخة ${isolate(version.version ?? 0)}`}</span>
                  {version.version === doc.version ? <Badge color="accent">الحالية</Badge> : null}
                  <span className="text-caption text-fg-muted">{`${version.by?.name ?? ""} · ${version.created_at ? formatDateTime(version.created_at) : ""}`}</span>
                </div>
                {version.reason ? <p className="text-body text-fg">{version.reason}</p> : null}
                {version.file?.upload_id && version.file.name ? <AttachmentList attachments={[{ id: version.file.upload_id, name: version.file.name }]} onDownload={onDownloadFile} /> : null}
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <Dialog
        open={renew !== null}
        onOpenChange={(open) => {
          if (!open) onRenewChange(null);
        }}
        dismissible={!submitting}
        size="md"
        title="تجديد الوثيقة"
        description="يُضاف التجديد نسخةً جديدة بملفها وتواريخها، وتبقى النسخ السابقة."
        actions={[
          <Button key="cancel" variant="secondary" disabled={submitting} onClick={() => onRenewChange(null)}>
            إلغاء
          </Button>,
          <Button key="save" variant="primary" loading={submitting} disabled={renewReason !== null} onClick={onRenewSubmit}>
            حفظ النسخة
          </Button>,
        ]}
      >
        {renew ? (
          <div className="flex flex-col gap-4">
            {actionError ? (
              <Banner kind="danger" title="تعذّر التجديد">
                {errorMessage(actionError)}
              </Banner>
            ) : null}
            <Field label="السبب" required error={errors.reason}>
              <Textarea value={renew.reason} onChange={(event) => onRenewChange({ ...renew, reason: event.target.value })} placeholder="تجديد لسنة 2027." disabled={submitting} />
            </Field>
            <Grid cols={{ base: 1, tablet: 2 }} gap={4}>
              <Field label="تاريخ البدء" optional error={errors.starts_on}>
                <DatePicker aria-label="تاريخ البدء" value={renew.startsOn} onValueChange={(startsOn) => onRenewChange({ ...renew, startsOn })} today={today} disabled={submitting} />
              </Field>
              <Field label="تاريخ الانتهاء" required error={errors.expires_on ?? (renewInverted ? "قبل تاريخ البدء." : undefined)}>
                <DatePicker aria-label="تاريخ الانتهاء" value={renew.expiresOn} onValueChange={(expiresOn) => onRenewChange({ ...renew, expiresOn })} min={renew.startsOn ?? undefined} today={today} invalid={renewInverted || Boolean(errors.expires_on)} disabled={submitting} />
              </Field>
            </Grid>
            <Field label="ملف النسخة" required error={errors.file_upload_id ?? renewFileError}>
              <FileUpload files={renew.file} onSelect={onRenewFileSelect} onReject={onRenewFileReject} onRemove={onRenewFileRemove} accept={legalFileLimits.accept} acceptLabel={legalFileLimits.acceptLabel} maxSize={legalFileLimits.maxSize} disabled={submitting} />
            </Field>
            {renewReason ? <p className="text-label text-fg-muted">{renewReason}</p> : null}
          </div>
        ) : null}
      </Dialog>

      <ReasonDialog
        open={expiring}
        onOpenChange={onExpiringChange}
        title="منتهية بقصد؟"
        description={`تُعلَّم «${doc.title ?? ""}» منتهية بقصد قبل موعد انتهائها. اكتب السبب.`}
        confirmLabel="إنهاء الوثيقة"
        reason={expiryReason}
        onReasonChange={(reason) => onExpiryReasonChange(reason.slice(0, EXPIRY_REASON_MAX))}
        reasonLabel="السبب"
        error={errors.reason ?? (expiring && actionError ? errorMessage(actionError) : undefined)}
        danger
        loading={submitting}
        onConfirm={onExpirySubmit}
      />
    </>
  );
}

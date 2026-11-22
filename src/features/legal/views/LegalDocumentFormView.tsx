"use client";

import { Plus, Trash } from "@phosphor-icons/react";
import { legalCategoryLabels, legalCategoryOrder } from "@/components/data/legal-categories";
import { Grid } from "@/components/layout/Grid";
import { PageHeader } from "@/components/layout/PageHeader";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DatePicker } from "@/components/ui/DatePicker";
import { Field } from "@/components/ui/Field";
import { FileUpload, type FileRejection, type UploadFile } from "@/components/ui/FileUpload";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { NumberInput } from "@/components/ui/NumberInput";
import type { Option } from "@/components/ui/OptionList";
import { Select } from "@/components/ui/Select";
import { errorMessage } from "@/lib/api/error-messages";
import type { LegalDocumentCategory } from "@/lib/api/types";
import type { IsoDate } from "@/lib/calendar";
import { isolate } from "@/lib/format";

/** نموذج `POST /legal-documents`: `file` هو الملف المرفوع (منه `file_upload_id`)، والطرف الفارغ لا يُرسل. */
export type LegalDocumentForm = {
  title: string;
  category: LegalDocumentCategory | null;
  parties: readonly string[];
  startsOn: IsoDate | null;
  expiresOn: IsoDate | null;
  alertDays: number | null;
  file: readonly UploadFile[];
};

export const emptyLegalDocumentForm: LegalDocumentForm = { title: "", category: null, parties: ["شركة Trust", ""], startsOn: null, expiresOn: null, alertDays: null, file: [] };

/** حدود ملف الوثيقة. */
export const legalFileLimits = { accept: "application/pdf,image/*", acceptLabel: "PDF أو صورة", maxSize: 20 * 1024 * 1024 } as const;

type LegalDocumentFormViewProps = {
  form: LegalDocumentForm;
  onFormChange: (form: LegalDocumentForm) => void;
  onFileSelect: (files: File[]) => void;
  onFileReject?: (rejections: FileRejection[]) => void;
  onFileRemove: (id: string) => void;
  /** خطأ اختيار الملف (النوع أو الحجم). */
  fileError?: string;
  /** `errors` من `validation_failed` بأسماء حقول العقد. */
  errors?: Readonly<Record<string, string>>;
  submitError?: string;
  submitting?: boolean;
  today: IsoDate;
  onSubmit: () => void;
  onCancel: () => void;
};

const categoryOptions: Option<LegalDocumentCategory>[] = legalCategoryOrder.map((value) => ({ value, label: legalCategoryLabels[value] }));

/**
 * وثيقة جديدة (I16): العنوان والفئة والأطراف، والبدء والانتهاء، ومدة تنبيه خاصة اختيارية، والملف. الإلزامي: العنوان والفئة والملف.
 * تُضاف بنسختها الأولى. التعديل لاحقاً نسخة جديدة من صفحة الوثيقة.
 */
export function LegalDocumentFormView({ form, onFormChange, onFileSelect, onFileReject, onFileRemove, fileError, errors = {}, submitError, submitting = false, today, onSubmit, onCancel }: LegalDocumentFormViewProps) {
  const set = (patch: Partial<LegalDocumentForm>) => onFormChange({ ...form, ...patch });
  const setParty = (index: number, value: string) => set({ parties: form.parties.map((party, at) => (at === index ? value : party)) });
  const datesInverted = form.startsOn !== null && form.expiresOn !== null && form.expiresOn < form.startsOn;

  const disabledReason =
    form.title.trim() === ""
      ? "اكتب عنوان الوثيقة."
      : form.category === null
        ? "اختر الفئة."
        : form.file.length === 0
          ? "أرفق ملف الوثيقة."
          : datesInverted
            ? "تاريخ الانتهاء قبل تاريخ البدء."
            : null;

  return (
    <>
      <PageHeader title="وثيقة جديدة" description="تُضاف الوثيقة بنسختها الأولى. يُنبَّه قبل انتهائها بمدة التنبيه." />

      <div className="flex flex-col gap-4">
        {submitError ? (
          <Banner kind="danger" title="تعذّر إضافة الوثيقة">
            {errorMessage(submitError)}
          </Banner>
        ) : null}

        <Card title="الوثيقة">
          <div className="flex flex-col gap-4">
            <Grid cols={{ base: 1, tablet: 2 }} gap={4}>
              <Field label="العنوان" required error={errors.title}>
                <Input value={form.title} onChange={(event) => set({ title: event.target.value })} placeholder="عقد وكالة توزيع — حمص" disabled={submitting} />
              </Field>
              <Field label="الفئة" required error={errors.category}>
                <Select aria-label="الفئة" placeholder="اختر الفئة" options={categoryOptions} value={form.category} onValueChange={(category) => set({ category })} disabled={submitting} />
              </Field>
            </Grid>

            <Field label="الأطراف" optional error={errors.parties} hint="طرف في كل حقل.">
              <div className="flex flex-col gap-2">
                {form.parties.map((party, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <Input aria-label={`الطرف ${index + 1}`} value={party} onChange={(event) => setParty(index, event.target.value)} invalid={Boolean(errors[`parties.${index}`])} disabled={submitting} />
                    </div>
                    <IconButton icon={Trash} aria-label={`حذف الطرف ${index + 1}`} variant="ghost" disabled={submitting || form.parties.length === 1} onClick={() => set({ parties: form.parties.filter((_, at) => at !== index) })} />
                  </div>
                ))}
                <div>
                  <Button variant="ghost" size="sm" icon={Plus} disabled={submitting} onClick={() => set({ parties: [...form.parties, ""] })}>
                    إضافة طرف
                  </Button>
                </div>
              </div>
            </Field>
          </div>
        </Card>

        <Card title="المدة والتنبيه">
          <Grid cols={{ base: 1, tablet: 3 }} gap={4}>
            <Field label="تاريخ البدء" optional error={errors.starts_on}>
              <DatePicker aria-label="تاريخ البدء" value={form.startsOn} onValueChange={(startsOn) => set({ startsOn })} today={today} disabled={submitting} />
            </Field>
            <Field label="تاريخ الانتهاء" optional error={errors.expires_on ?? (datesInverted ? "قبل تاريخ البدء." : undefined)} hint="فارغ للوثيقة بلا انتهاء.">
              <DatePicker aria-label="تاريخ الانتهاء" value={form.expiresOn} onValueChange={(expiresOn) => set({ expiresOn })} min={form.startsOn ?? undefined} today={today} invalid={datesInverted || Boolean(errors.expires_on)} disabled={submitting} />
            </Field>
            <Field label="مدة التنبيه" optional error={errors.alert_days} hint="فارغ = «تنبيه انتهاء العقود» من الإعدادات.">
              <NumberInput aria-label="مدة التنبيه" value={form.alertDays} onValueChange={(alertDays) => set({ alertDays })} min={1} unit="يوم" disabled={submitting} />
            </Field>
          </Grid>
        </Card>

        <Card title="الملف">
          <Field label="ملف الوثيقة" required error={errors.file_upload_id ?? fileError} hint={`${legalFileLimits.acceptLabel} حتى ${isolate(20)} ميغابايت.`}>
            <FileUpload files={form.file} onSelect={onFileSelect} onReject={onFileReject} onRemove={onFileRemove} accept={legalFileLimits.accept} acceptLabel={legalFileLimits.acceptLabel} maxSize={legalFileLimits.maxSize} disabled={submitting} />
          </Field>
        </Card>

        <div className="flex flex-col gap-2">
          {disabledReason ? <p className="text-label text-fg-muted">{disabledReason}</p> : null}
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" loading={submitting} disabled={disabledReason !== null} onClick={onSubmit}>
              إضافة الوثيقة
            </Button>
            <Button variant="secondary" disabled={submitting} onClick={onCancel}>
              إلغاء
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

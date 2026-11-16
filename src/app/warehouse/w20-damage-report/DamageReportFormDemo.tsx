"use client";

import { useState } from "react";
import type { FileRejection, UploadFile } from "@/components/ui/FileUpload";
import { fileRejectionMessage } from "@/components/ui/FileUpload";
import { damageAttachmentLimits, DamageReportFormView, emptyDamageReportForm, type DamageReportForm, type DamageReportOptions } from "@/features/damage/views/DamageReportFormView";
import type { DamageReport } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { damageBatchesFor, damageItems, damageLocations, damageReasons, damageToday } from "@/mocks/damage-reports";
import { balanceItems } from "@/mocks/stock-balances";

// غلاف تفاعلي لصفحة الرسم: يملك النموذج ويحاكي رفع المرفقات (يبدأ «يُرفع» ثم «مرفوع») ويبني التقرير المعلّق من الأسطر عند الرفع.
// في الإنتاج تحلّ محلّه حاوية ترفع كل ملف بـ POST /uploads (purpose=damage_photo) ثم ترسل POST /damage-reports. لا يُنقل للإنتاج.

type DamageReportFormDemoProps = {
  initialForm?: DamageReportForm;
  initialSaved?: DamageReport | null;
  /** أخطاء الخادم الثابتة للحالة المعروضة (تختفي بعد أول تعديل). */
  initialErrors?: Record<string, string>;
  mode?: "ready" | "loading" | "error";
};

const defaultForm = () => emptyDamageReportForm("1");

export function DamageReportFormDemo({ initialForm, initialSaved = null, initialErrors, mode = "ready" }: DamageReportFormDemoProps) {
  const [form, setForm] = useState<DamageReportForm>(initialForm ?? defaultForm());
  const [saved, setSaved] = useState<DamageReport | null>(initialSaved);
  const [errors, setErrors] = useState(initialErrors);
  const [attachmentError, setAttachmentError] = useState<string | undefined>();

  const options: Loadable<DamageReportOptions> =
    mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: { locations: damageLocations, items: damageItems, reasons: damageReasons } };
  const batches = damageBatchesFor(form.locationId);

  const reset = () => {
    setForm(defaultForm());
    setSaved(null);
    setErrors(undefined);
    setAttachmentError(undefined);
  };

  const select = (files: File[]) => {
    setAttachmentError(undefined);
    const added: UploadFile[] = files.map((file) => ({ id: crypto.randomUUID(), name: file.name, size: file.size, status: "uploading", progress: 40 }));
    setForm((current) => ({ ...current, attachments: [...current.attachments, ...added] }));
    // يحاكي انتهاء الرفع بعد لحظة (POST /uploads).
    window.setTimeout(() => {
      setForm((current) => ({ ...current, attachments: current.attachments.map((file) => (added.some((a) => a.id === file.id) ? { ...file, status: "done", progress: 100 } : file)) }));
    }, 900);
  };

  const submit = () => {
    const location = damageLocations.find((candidate) => String(candidate.id) === form.locationId);
    const reason = damageReasons.find((candidate) => String(candidate.id) === form.reasonId);
    const lines = form.lines.flatMap((line) => {
      const item = balanceItems.find((candidate) => candidate.id === line.itemId);
      const known = batches[String(line.itemId)];
      const batch = known?.status === "ready" ? known.data.find((candidate) => candidate.id === line.batchId) : undefined;
      if (!item || !batch || line.quantity === null) return [];
      return [{ item, batch: { id: batch.id, batch_no: batch.batch_no, expiry_date: batch.expiry_date, status: batch.status }, quantity: line.quantity }];
    });
    setSaved({
      id: 26,
      location,
      status: "PENDING",
      reason,
      lines,
      note: form.note || null,
      attachments: form.attachments.filter((file) => file.status === "done").map((file) => ({ upload_id: file.id, url: `https://files.example.test/damage/${file.name}`, name: file.name, mime: "image/jpeg" })),
      responsibility: null,
      created_by: { id: 3, name: "رامي السيد" },
      created_at: "2026-11-10T09:40:00Z",
      decided_by: null,
      decided_at: null,
      decision_reason: null,
      on_behalf_of: null,
    });
  };

  return (
    <DamageReportFormView
      options={options}
      batches={batches}
      form={form}
      onFormChange={(next) => {
        setForm(next);
        setErrors(undefined);
      }}
      errors={errors}
      attachmentError={attachmentError}
      onFilesSelect={select}
      onFilesReject={(rejections: FileRejection[]) => setAttachmentError(rejections.map((rejection) => fileRejectionMessage(rejection, damageAttachmentLimits)).join(" "))}
      onFileRemove={(id) => setForm((current) => ({ ...current, attachments: current.attachments.filter((file) => file.id !== id) }))}
      saved={saved}
      today={damageToday}
      onSubmit={submit}
      onCancel={reset}
      onReportAnother={reset}
      onOpenReports={() => {}}
      onDownloadAttachment={() => {}}
    />
  );
}

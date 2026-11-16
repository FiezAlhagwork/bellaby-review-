"use client";

import { useState } from "react";
import { InvestigationFormView, emptyInvestigationForm, type InvestigationForm, type SourceFlag } from "@/features/investigations/views/InvestigationFormView";
import { findFlag } from "@/mocks/flags";
import { investigationEmployees } from "@/mocks/investigations";

// غلاف تفاعلي لصفحة الرسم: يملك النموذج. «فتح الملف» ينشئ الملف (في الإنتاج POST /investigations ثم الانتقال إلى S15 في المرحلة الأولى)، فيظهر هنا وضع الإرسال.
// مع `flagId` يُقفل الموظف على صاحب العلامة (ويُقترح عنوان). `initialErrors` يحاكي validation_failed بنص الخادم تحت حقله. لا يُنقل للإنتاج.

type InvestigationFormDemoProps = {
  /** العلامة المصدر (مفتوحة): يُقفل الموظف على صاحبها. */
  flagId?: number;
  initialForm?: InvestigationForm;
  initialErrors?: Readonly<Record<string, string>>;
  /** يعرض حالة الإرسال عند العرض. */
  initialSubmitting?: boolean;
};

export function InvestigationFormDemo({ flagId, initialForm, initialErrors, initialSubmitting = false }: InvestigationFormDemoProps) {
  const source: SourceFlag | null = flagId === undefined ? null : findFlag(flagId);
  const [form, setForm] = useState<InvestigationForm>(initialForm ?? (source ? { subjectId: String(source.subject_user?.id), title: "فرق عينات بعد المزامنة", description: "" } : emptyInvestigationForm));
  const [submitting, setSubmitting] = useState(initialSubmitting);
  const [errors, setErrors] = useState(initialErrors);

  return (
    <InvestigationFormView
      form={form}
      onFormChange={(next) => {
        setForm(next);
        setErrors(undefined);
      }}
      employees={investigationEmployees}
      sourceFlag={source}
      errors={errors}
      submitting={submitting}
      onSubmit={() => setSubmitting(true)}
      onCancel={() => {}}
    />
  );
}

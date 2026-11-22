"use client";

import { useState } from "react";
import { emptyLegalDocumentForm, LegalDocumentFormView, type LegalDocumentForm } from "@/features/legal/views/LegalDocumentFormView";
import { legalToday } from "@/mocks/legal";

// غلاف تفاعلي لصفحة الرسم (I16): يملك النموذج والملف. الرفع POST /uploads ثم POST /legal-documents، محلياً. لا يُنقل للإنتاج.

type NewLegalDocumentDemoProps = { initialForm?: LegalDocumentForm; errors?: Readonly<Record<string, string>> };

export function NewLegalDocumentDemo({ initialForm = emptyLegalDocumentForm, errors }: NewLegalDocumentDemoProps) {
  const [form, setForm] = useState(initialForm);

  return (
    <LegalDocumentFormView
      form={form}
      onFormChange={setForm}
      onFileSelect={(files) => setForm({ ...form, file: files.slice(0, 1).map((file) => ({ id: "new-file", name: file.name, size: file.size, status: "done" as const })) })}
      onFileRemove={() => setForm({ ...form, file: [] })}
      errors={errors}
      today={legalToday}
      onSubmit={() => {}}
      onCancel={() => {}}
    />
  );
}

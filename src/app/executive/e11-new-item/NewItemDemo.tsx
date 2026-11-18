"use client";

import { useState } from "react";
import { emptyItemForm, ItemFormView, type ItemForm } from "@/features/items/views/ItemFormView";

// غلاف تفاعلي لصفحة الرسم (E11): يملك النموذج. الصورة «تُرفع» محلياً كما يفعل POST /uploads، والحفظ يُظهر أخطاء الخادم الثابتة للحالة.
// في الإنتاج تحلّ محلّه حاوية ترسل POST /items ثم تنتقل لصفحة الصنف. لا يُنقل للإنتاج.

type NewItemDemoProps = { initialForm?: ItemForm; initialErrors?: Record<string, string> };

export function NewItemDemo({ initialForm = emptyItemForm, initialErrors }: NewItemDemoProps) {
  const [form, setForm] = useState<ItemForm>(initialForm);
  const [errors, setErrors] = useState(initialErrors);

  return (
    <ItemFormView
      form={form}
      onFormChange={(next) => {
        setForm(next);
        setErrors(undefined);
      }}
      errors={errors}
      onImageSelect={(files) => setForm({ ...form, image: files.slice(0, 1).map((file, index) => ({ id: `img-${index}`, name: file.name, size: file.size, status: "done" })) })}
      onImageRemove={() => setForm({ ...form, image: [] })}
      onSubmit={() => {}}
      onCancel={() => {}}
    />
  );
}

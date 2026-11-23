"use client";

import { useState } from "react";
import { CustomerFormView, emptyCustomerForm, type CustomerForm } from "@/features/customers/views/CustomerFormView";
import { agentGovernorates, linkSuggestion } from "@/mocks/agent-customers";

// غلاف تفاعلي لصفحة الرسم (A06): يجلب الاقتراح كما يفعل GET /customers/link-suggestions (الاسم يحوي «الزهراء» في دمشق)، ويتحقق كما يفعل POST /customers. لا يُنقل للإنتاج.

const damascusId = String(agentGovernorates[0]?.id ?? "");

type CustomerFormDemoProps = { initialForm?: CustomerForm; initialErrors?: Record<string, string> };

export function CustomerFormDemo({ initialForm = emptyCustomerForm, initialErrors = {} }: CustomerFormDemoProps) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState(initialErrors);
  const suggestions = form.name.includes("الزهراء") && form.governorateId === damascusId ? [linkSuggestion] : [];

  return (
    <CustomerFormView
      form={form}
      onFormChange={setForm}
      governorates={agentGovernorates}
      suggestions={suggestions}
      onSubmit={() => {
        const next: Record<string, string> = {};
        if (!form.name.trim()) next.name = "الاسم مطلوب.";
        if (!/^9\d{8}$/.test(form.phone.replace(/\s/g, ""))) next.phone = "رقم الهاتف غير صحيح.";
        if (!form.governorateId) next.governorate_id = "اختر المحافظة.";
        if (!form.address.trim()) next.address = "العنوان مطلوب.";
        setErrors(next);
      }}
      onCancel={() => {}}
      errors={errors}
    />
  );
}

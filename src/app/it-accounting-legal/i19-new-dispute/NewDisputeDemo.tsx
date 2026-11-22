"use client";

import { useState } from "react";
import { DisputeFormView, emptyDisputeForm, type DisputeForm } from "@/features/disputes/views/DisputeFormView";
import { disputeDeliveryOptions, referralNote, referredDelivery, salesManager } from "@/mocks/disputes";

// غلاف تفاعلي لصفحة الرسم (I19): يملك النموذج. الفتح POST /disputes محلياً. «محال» معبّأ بتسليم الإحالة وملاحظتها. لا يُنقل للإنتاج.

type NewDisputeDemoProps = { referral?: boolean; errors?: Readonly<Record<string, string>>; initialForm?: DisputeForm };

export function NewDisputeDemo({ referral = false, errors, initialForm }: NewDisputeDemoProps) {
  const [form, setForm] = useState<DisputeForm>(
    () => initialForm ?? (referral ? { title: `مطالبة ${referredDelivery.customer?.name ?? ""} بقيمة تسليم متأخر`, deliveryId: String(referredDelivery.id), description: referralNote } : emptyDisputeForm),
  );

  return (
    <DisputeFormView
      form={form}
      onFormChange={setForm}
      deliveries={disputeDeliveryOptions}
      referral={referral ? { by: salesManager.name ?? "مدير المبيعات", note: referralNote } : null}
      errors={errors}
      onSubmit={() => {}}
      onCancel={() => {}}
    />
  );
}

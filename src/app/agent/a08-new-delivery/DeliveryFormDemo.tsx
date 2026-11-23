"use client";

import { useState } from "react";
import { DeliveryFormView, emptyDeliveryForm, type DeliveryForm } from "@/features/deliveries/views/DeliveryFormView";
import type { Delivery } from "@/lib/api/types";
import { agentCustomers } from "@/mocks/agent-customers";
import { deliveriesToday, deliveryBatches, deliveryItems, deliveryPrices, maxPaymentDate, maxPaymentDays, savedDelivery } from "@/mocks/agent-deliveries";

// غلاف تفاعلي لصفحة الرسم (A08): يملك النموذج والخطوة. POST /deliveries محلياً يعيد التسليم المحفوظ. لا يُنقل للإنتاج.

type DeliveryFormDemoProps = {
  initialForm?: DeliveryForm;
  initialStep?: "edit" | "review";
  initialErrors?: Record<string, string>;
  saved?: boolean;
};

export function DeliveryFormDemo({ initialForm = emptyDeliveryForm, initialStep = "edit", initialErrors = {}, saved = false }: DeliveryFormDemoProps) {
  const [form, setForm] = useState(initialForm);
  const [step, setStep] = useState(initialStep);
  const [result, setResult] = useState<Delivery | null>(saved ? savedDelivery : null);

  return (
    <DeliveryFormView
      customers={agentCustomers}
      items={deliveryItems}
      batches={deliveryBatches}
      prices={deliveryPrices}
      form={form}
      onFormChange={setForm}
      step={step}
      onStepChange={setStep}
      today={deliveriesToday}
      maxPaymentDate={maxPaymentDate}
      maxPaymentDays={maxPaymentDays}
      errors={initialErrors}
      saved={result}
      onSubmit={() => setResult(savedDelivery)}
      onCancel={() => {}}
      onOpenDelivery={() => {}}
      onNewDelivery={() => {
        setResult(null);
        setForm(emptyDeliveryForm);
        setStep("edit");
      }}
    />
  );
}

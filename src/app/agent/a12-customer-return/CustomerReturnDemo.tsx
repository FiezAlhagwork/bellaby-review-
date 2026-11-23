"use client";

import { useState } from "react";
import { CustomerReturnFormView, emptyCustomerReturnForm, type CustomerReturnForm } from "@/features/returns/views/CustomerReturnFormView";
import type { CustomerReturn } from "@/lib/api/types";
import { customerReturnReasons, recallReasonId, returnableDeliveries, savedCustomerReturn } from "@/mocks/agent-own-returns";

// غلاف تفاعلي لصفحة الرسم (A12): POST /customer-returns محلياً، والتجاوز يعيد return_exceeds_delivered. لا يُنقل للإنتاج.

type CustomerReturnDemoProps = { preset?: "over" | "none"; saved?: boolean };

const over: CustomerReturnForm = { deliveryId: "2104", lineId: "21040", quantity: 12, reasonId: "11", note: "" };

export function CustomerReturnDemo({ preset = "none", saved = false }: CustomerReturnDemoProps) {
  const [form, setForm] = useState<CustomerReturnForm>(preset === "over" ? over : emptyCustomerReturnForm);
  const [result, setResult] = useState<CustomerReturn | null>(saved ? savedCustomerReturn : null);

  return (
    <CustomerReturnFormView
      deliveries={returnableDeliveries}
      reasons={customerReturnReasons}
      recallReasonId={recallReasonId}
      form={form}
      onFormChange={setForm}
      saved={result}
      onSubmit={() => setResult(savedCustomerReturn)}
      onCancel={() => {}}
      onOpenReturns={() => {}}
    />
  );
}

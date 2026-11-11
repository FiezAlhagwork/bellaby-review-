"use client";

import { useState } from "react";
import { emptyStockReceiptForm, StockReceiptFormView, type StockReceiptForm, type StockReceiptOptions } from "@/features/stock/views/StockReceiptFormView";
import type { StockReceipt } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { balanceItems, warehouseLocations } from "@/mocks/stock-balances";
import { knownBatches, receiptToday } from "@/mocks/stock-receipt-form";

// غلاف تفاعلي لصفحة الرسم: يملك النموذج ويبني نتيجة الإدخال من الأسطر (دفعة جديدة أو مضافة لموجودة)، فيجرّب الزبون الرحلة كلها.
// في الإنتاج تحلّ محلّه حاوية ترسل POST /stock-receipts وتعرض الرد. لا يُنقل للإنتاج.

type StockReceiptFormDemoProps = {
  initialForm?: StockReceiptForm;
  initialSaved?: StockReceipt | null;
  /** أخطاء `validation_failed` ثابتة للحالة المعروضة (تختفي بعد أول تعديل). */
  initialErrors?: Record<string, string>;
  mode?: "ready" | "loading" | "error";
};

const readyOptions: StockReceiptOptions = { locations: warehouseLocations, items: balanceItems };

export function StockReceiptFormDemo({ initialForm, initialSaved = null, initialErrors, mode = "ready" }: StockReceiptFormDemoProps) {
  const [form, setForm] = useState<StockReceiptForm>(initialForm ?? emptyStockReceiptForm());
  const [saved, setSaved] = useState<StockReceipt | null>(initialSaved);
  const [errors, setErrors] = useState(initialErrors);

  const options: Loadable<StockReceiptOptions> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: readyOptions };

  const reset = () => {
    setForm(emptyStockReceiptForm());
    setSaved(null);
    setErrors(undefined);
  };

  const submit = () => {
    const location = warehouseLocations.find((candidate) => String(candidate.id) === form.locationId);
    const lines = form.lines.flatMap((line) => {
      const item = balanceItems.find((candidate) => String(candidate.id) === line.itemId);
      if (!item || line.expiryDate === null || line.quantity === null) return [];
      const known = knownBatches[String(item.id)];
      const match = known?.status === "ready" ? known.data.find((batch) => batch.batch_no === line.batchNo.trim()) : undefined;
      return [{ item, batch: match ?? { id: 900 + form.lines.indexOf(line), batch_no: line.batchNo.trim(), expiry_date: line.expiryDate, status: "ACTIVE" as const }, quantity: line.quantity, batch_created: !match }];
    });
    setSaved({ id: 34, reference: "RCV-000034", location, received_at: "2026-11-10T09:30:00Z", note: form.note || null, created_by: { id: 3, name: "رامي السيد" }, lines });
  };

  return (
    <StockReceiptFormView
      options={options}
      batches={knownBatches}
      form={form}
      onFormChange={(next) => {
        setForm(next);
        setErrors(undefined);
      }}
      errors={errors}
      saved={saved}
      today={receiptToday}
      onSubmit={submit}
      onCancel={reset}
      onReceiveAnother={reset}
      onOpenLog={() => {}}
    />
  );
}

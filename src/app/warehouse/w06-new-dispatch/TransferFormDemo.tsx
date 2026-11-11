"use client";

import { useState } from "react";
import { emptyTransferForm, TransferFormView, type TransferForm, type TransferOptions } from "@/features/stock/views/TransferFormView";
import type { SampleRequest, Transfer } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { balanceItems, damascus } from "@/mocks/stock-balances";
import { transferBatches, transferOptions, transferToday } from "@/mocks/transfer-form";

// غلاف تفاعلي لصفحة الرسم: يملك النموذج ويبني نتيجة الاعتماد من الأسطر، فيجرّب الزبون الرحلة كلها.
// في الإنتاج تحلّ محلّه حاوية ترسل POST /transfers وتعرض الرد. لا يُنقل للإنتاج.

type TransferFormDemoProps = {
  initialForm?: TransferForm;
  sampleRequest?: SampleRequest | null;
  initialSaved?: Transfer | null;
  /** أخطاء الخادم الثابتة للحالة المعروضة (تختفي بعد أول تعديل). */
  initialErrors?: Record<string, string>;
  mode?: "ready" | "loading" | "error";
};

const readyOptions: Loadable<TransferOptions> = { status: "ready", data: transferOptions };
const defaultForm = () => emptyTransferForm("1");

export function TransferFormDemo({ initialForm, sampleRequest = null, initialSaved = null, initialErrors, mode = "ready" }: TransferFormDemoProps) {
  const [form, setForm] = useState<TransferForm>(initialForm ?? defaultForm());
  const [saved, setSaved] = useState<Transfer | null>(initialSaved);
  const [errors, setErrors] = useState(initialErrors);

  const options: Loadable<TransferOptions> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : readyOptions;

  const reset = () => {
    setForm(defaultForm());
    setSaved(null);
    setErrors(undefined);
  };

  const submit = () => {
    const recipients = form.recipientKind === "AGENT" ? transferOptions.agents : transferOptions.reps;
    const to = recipients.find((location) => String(location.id) === form.toLocationId);
    const lines = form.lines.flatMap((line) => {
      const item = balanceItems.find((candidate) => candidate.id === line.itemId);
      const known = transferBatches[String(line.itemId)];
      const batch = known?.status === "ready" ? known.data.find((candidate) => candidate.id === line.batchId) : undefined;
      if (!item || !batch || line.quantity === null) return [];
      return [{ item, batch: { id: batch.id, batch_no: batch.batch_no, expiry_date: batch.expiry_date, status: batch.status }, quantity: line.quantity }];
    });
    setSaved({
      id: 163,
      reference: "TRF-000163",
      from_location: damascus,
      to_location: to,
      status: "IN_TRANSIT",
      lines,
      total_quantity: lines.reduce((sum, line) => sum + line.quantity, 0),
      sample_request_id: sampleRequest?.id ?? null,
      note: form.note || null,
      created_by: { id: 3, name: "رامي السيد" },
      created_at: "2026-11-10T09:40:00Z",
      hours_in_transit: 0,
    });
  };

  return (
    <TransferFormView
      options={options}
      batches={transferBatches}
      form={form}
      onFormChange={(next) => {
        setForm(next);
        setErrors(undefined);
      }}
      sampleRequest={sampleRequest}
      errors={errors}
      saved={saved}
      today={transferToday}
      onSubmit={submit}
      onCancel={reset}
      onNewTransfer={reset}
      onOpenTransfers={() => {}}
    />
  );
}

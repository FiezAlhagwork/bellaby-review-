"use client";

import { DescriptionList } from "@/components/data/DescriptionList";
import { StatusBadge } from "@/components/data/StatusBadge";
import { PageHeader } from "@/components/layout/PageHeader";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Combobox } from "@/components/ui/Combobox";
import { Field } from "@/components/ui/Field";
import { NumberInput } from "@/components/ui/NumberInput";
import type { Option } from "@/components/ui/OptionList";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { errorMessage } from "@/lib/api/error-messages";
import type { CustomerReturn, Delivery, ListEntry } from "@/lib/api/types";
import { formatDateTime, isolate } from "@/lib/format";

/** حالة النموذج كما يرسلها `POST /customer-returns`. */
export type CustomerReturnForm = { deliveryId: string | null; lineId: string | null; quantity: number | null; reasonId: string | null; note: string };
export const emptyCustomerReturnForm: CustomerReturnForm = { deliveryId: null, lineId: null, quantity: null, reasonId: null, note: "" };

type CustomerReturnFormViewProps = {
  /** تسليماتي التي فيها قابل للإرجاع (`GET /deliveries`). */
  deliveries: readonly Delivery[];
  /** أسباب المرتجع من القائمة. */
  reasons: readonly ListEntry[];
  /** معرّف «سحب دفعة»: يُفرض حين تكون دفعة السطر موقوفة (§121). */
  recallReasonId?: string;
  form: CustomerReturnForm;
  onFormChange: (form: CustomerReturnForm) => void;
  /** `validation_failed` (`quantity`، `reason_id`). */
  errors?: Readonly<Record<string, string>>;
  /** `return_exceeds_delivered` وغيره بلا حقل. */
  submitError?: string;
  submitting?: boolean;
  saved?: CustomerReturn | null;
  onSubmit?: () => void;
  onCancel?: () => void;
  onOpenReturns?: () => void;
};

/**
 * مرتجع من صيدلية (A12): التسليم الأصلي وسطره، والكمية حتى القابل للإرجاع (المسلَّم − المقبول − المعلّق)، والسبب، والملاحظة.
 * يبقى معلّقاً حتى قرار الإدارة (إعادة للمخزون أو تالف أو رفض). الدفعة الموقوفة سببها «سحب دفعة» (القرار 7).
 */
export function CustomerReturnFormView({ deliveries, reasons, recallReasonId, form, onFormChange, errors = {}, submitError, submitting = false, saved = null, onSubmit, onCancel, onOpenReturns }: CustomerReturnFormViewProps) {
  const set = (patch: Partial<CustomerReturnForm>) => onFormChange({ ...form, ...patch });
  const delivery = deliveries.find((entry) => String(entry.id) === form.deliveryId);
  const line = delivery?.lines?.find((entry) => String(entry.id) === form.lineId);
  const returnable = line?.returnable_quantity ?? 0;
  const suspended = line?.batch?.status === "SUSPENDED";
  const over = form.quantity !== null && line !== undefined && form.quantity > returnable;

  const deliveryOptions: Option[] = deliveries.flatMap((entry) => (entry.id !== undefined ? [{ value: String(entry.id), label: `${entry.reference ?? ""} · ${entry.customer?.name ?? ""}` }] : []));
  const lineOptions: Option[] = (delivery?.lines ?? []).flatMap((entry): Option[] => {
    if (entry.id === undefined) return [];
    const label = `${entry.item?.name ?? ""} · ${entry.batch?.batch_no ?? ""}`;
    return [(entry.returnable_quantity ?? 0) === 0 ? { value: String(entry.id), label, disabled: true, reason: "أُرجع كله" } : { value: String(entry.id), label }];
  });
  const reasonOptions: Option[] = reasons.filter((reason) => reason.is_active !== false).flatMap((reason) => (reason.id !== undefined && reason.name ? [{ value: String(reason.id), label: reason.name }] : []));
  const allowance = line ? `المسموح ${isolate(returnable)} (المسلَّم ${isolate(line.quantity ?? 0)}، المقبول ${isolate(line.returned_accepted ?? 0)}، المعلّق ${isolate(line.returned_pending ?? 0)})` : undefined;
  const missing = !line ? "اختر التسليم وسطره." : !form.quantity ? "اكتب الكمية." : over ? "الكمية أكبر من المسموح." : !form.reasonId ? "اختر السبب." : null;

  if (saved) {
    return (
      <>
        <PageHeader title="مرتجع من صيدلية" />
        <div className="flex flex-col gap-4">
          <Banner kind="success" title="سُجّل المرتجع">
            يبقى معلّقاً بانتظار قرار الإدارة: يعود للمخزون، أو يُقبل تالفاً، أو يُرفض.
          </Banner>
          <Card title="المرتجع">
            <DescriptionList
              items={[
                { label: "العميل", value: saved.customer?.name },
                { label: "الصنف", value: saved.delivery_line?.item?.name },
                { label: "الكمية", value: saved.quantity !== undefined ? `${saved.quantity} علبة` : null },
                { label: "السبب", value: saved.reason?.name },
                { label: "الحالة", value: saved.status ? <StatusBadge entity="customerReturn" status={saved.status} /> : null },
                { label: "التاريخ", value: saved.created_at ? formatDateTime(saved.created_at) : null },
              ]}
            />
          </Card>
          <div>
            <Button variant="primary" onClick={onOpenReturns}>
              المرتجعات والتالف
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="مرتجع من صيدلية" description="بضاعة أعادتها صيدلية من تسليم سابق. تقرّر الإدارة مصيرها." />

      <div className="flex flex-col gap-4">
        {submitError ? (
          <Banner kind="danger" title="تعذّر تسجيل المرتجع">
            {errorMessage(submitError)}
          </Banner>
        ) : null}

        <Card title="التسليم الأصلي">
          <div className="flex flex-col gap-4">
            <Field label="التسليم" required error={errors.delivery_id}>
              <Combobox aria-label="التسليم" placeholder="ابحث برقم التسليم أو العميل" options={deliveryOptions} value={form.deliveryId} onValueChange={(deliveryId) => set({ deliveryId, lineId: null, quantity: null })} disabled={submitting} />
            </Field>
            <Field label="السطر" required error={errors.delivery_line_id}>
              <Select aria-label="السطر" placeholder={delivery ? "اختر الصنف والدفعة" : "اختر التسليم أولاً"} options={lineOptions} value={form.lineId} onValueChange={(lineId) => set({ lineId, quantity: null, reasonId: delivery?.lines?.find((entry) => String(entry.id) === lineId)?.batch?.status === "SUSPENDED" && recallReasonId ? recallReasonId : form.reasonId })} disabled={submitting || !delivery} />
            </Field>
          </div>
        </Card>

        <Card title="المرتجع">
          <div className="flex flex-col gap-4">
            <Field label="الكمية" required error={errors.quantity ?? (over ? `أكثر من المسموح. ${allowance}.` : undefined)} hint={over ? undefined : allowance}>
              <NumberInput aria-label="الكمية" value={form.quantity} onValueChange={(quantity) => set({ quantity })} min={1} unit="علبة" invalid={over || Boolean(errors.quantity)} disabled={submitting || !line} />
            </Field>
            {suspended ? <Banner kind="info">الدفعة موقوفة: السبب «سحب دفعة» مفروض.</Banner> : null}
            <Field label="السبب" required error={errors.reason_id}>
              <Select aria-label="السبب" placeholder="اختر السبب" options={reasonOptions} value={form.reasonId} onValueChange={(reasonId) => set({ reasonId })} locked={suspended && recallReasonId !== undefined} disabled={submitting} />
            </Field>
            <Field label="ملاحظة" optional error={errors.note}>
              <Textarea aria-label="ملاحظة" value={form.note} onChange={(event) => set({ note: event.target.value })} disabled={submitting} />
            </Field>
          </div>
        </Card>

        <div className="flex flex-col gap-2">
          {missing ? <p className="text-label text-fg-muted">{missing}</p> : null}
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" loading={submitting} disabled={missing !== null} onClick={onSubmit}>
              تسجيل المرتجع
            </Button>
            <Button variant="secondary" disabled={submitting} onClick={onCancel}>
              إلغاء
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

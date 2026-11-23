"use client";

import { DescriptionList } from "@/components/data/DescriptionList";
import { LineItemsEditor, type EditorBatch, type EditorItem, type EditorLine } from "@/components/data/LineItemsEditor";
import { StatusBadge } from "@/components/data/StatusBadge";
import { Grid } from "@/components/layout/Grid";
import { PageHeader } from "@/components/layout/PageHeader";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Combobox } from "@/components/ui/Combobox";
import { DatePicker } from "@/components/ui/DatePicker";
import { Field } from "@/components/ui/Field";
import type { Option } from "@/components/ui/OptionList";
import { Textarea } from "@/components/ui/Textarea";
import { errorMessage } from "@/lib/api/error-messages";
import type { Customer, Delivery, Money } from "@/lib/api/types";
import { dayLabel, type IsoDate } from "@/lib/calendar";
import { formatDateTime, formatMoney, formatQuantity, isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

/** حالة النموذج كما يرسلها `POST /deliveries` (`DeliveryInput`). */
export type DeliveryForm = { customerId: string | null; expectedPaymentDate: IsoDate | null; note: string; lines: EditorLine[] };
export const emptyDeliveryForm: DeliveryForm = { customerId: null, expectedPaymentDate: null, note: "", lines: [{ id: "line-1", itemId: null, batchId: null, quantity: null }] };

const NOTE_MAX = 500;

type DeliveryFormViewProps = {
  /** عملائي (`GET /customers`). */
  customers: readonly Customer[];
  /** أصناف PRODUCT فقط. */
  items: readonly EditorItem[];
  /** دفعات كل صنف من رصيدي بالمتاح، مرتبة بالأقرب انتهاءً (`GET /stock/fefo-suggestion` أو `GET /stock/balances`). الموقوفة معطّلة. */
  batches: Readonly<Record<string, Loadable<readonly EditorBatch[]>>>;
  /** سعر الصنف الحالي للمراجعة، بمفتاح `String(itemId)` (§117). للعرض فقط: يُنسخ في السطر عند التأكيد. */
  prices: Readonly<Record<string, Money>>;
  form: DeliveryForm;
  onFormChange: (form: DeliveryForm) => void;
  /** «edit» النموذج، «review» المراجعة قبل التأكيد. */
  step: "edit" | "review";
  onStepChange: (step: "edit" | "review") => void;
  today: IsoDate;
  /** آخر يوم مسموح للسداد: اليوم + `max_payment_term_days` (من `GET /settings`). */
  maxPaymentDate: IsoDate;
  maxPaymentDays: number;
  /** `validation_failed` كما هي: `customer_id` و`expected_payment_date` و`lines.0.quantity`. */
  errors?: Readonly<Record<string, string>>;
  submitError?: string;
  submitting?: boolean;
  /** بعد الحفظ: التسليم كما أعاده الخادم. */
  saved?: Delivery | null;
  onSubmit?: () => void;
  onCancel?: () => void;
  onOpenDelivery?: (delivery: Delivery) => void;
  onNewDelivery?: () => void;
};

/**
 * تسجيل تسليم (A08): العميل، والأسطر (الصنف، والدفعة الأقرب انتهاءً، والكمية بالمتاح)، وتاريخ السداد المتوقع ضمن المهلة، ثم مراجعة بالأسعار
 * للعرض فقط و«تأكيد التسليم». لا حقل سعر: يُنسخ في كل سطر. التاريخ لحظة التسجيل ولا يُعدَّل. الدفعة الموقوفة لا تُسلَّم (القراران 2 و7).
 */
export function DeliveryFormView({ customers, items, batches, prices, form, onFormChange, step, onStepChange, today, maxPaymentDate, maxPaymentDays, errors = {}, submitError, submitting = false, saved = null, onSubmit, onCancel, onOpenDelivery, onNewDelivery }: DeliveryFormViewProps) {
  const set = (patch: Partial<DeliveryForm>) => onFormChange({ ...form, ...patch });
  const customerOptions: Option[] = customers.flatMap((customer) => (customer.id !== undefined && customer.name ? [{ value: String(customer.id), label: customer.name }] : []));
  const customer = customers.find((entry) => String(entry.id) === form.customerId);
  const filledLines = form.lines.filter((line) => line.itemId !== null && line.batchId !== null && line.quantity);
  const lineErrors = Object.fromEntries(Object.entries(errors).filter(([key]) => key.startsWith("lines.")));
  const missing = !form.customerId ? "اختر العميل." : filledLines.length === 0 ? "أضف سطراً واحداً على الأقل." : !form.expectedPaymentDate ? "اختر تاريخ السداد المتوقع." : null;
  const itemName = (id: number | null) => items.find((item) => item.id === id)?.name ?? "—";
  const batchNo = (line: EditorLine) => {
    const list = line.itemId !== null ? batches[String(line.itemId)] : undefined;
    return list?.status === "ready" ? (list.data.find((batch) => batch.id === line.batchId)?.batch_no ?? "—") : "—";
  };

  if (saved) {
    return (
      <>
        <PageHeader title="تسليم جديد" />
        <div className="flex flex-col gap-4">
          <Banner kind="success" title={`حُفظ التسليم ${saved.reference ?? ""}`}>
            {`سُجّل ${saved.delivered_at ? formatDateTime(saved.delivered_at) : ""} «غير مسدد». أكّد التحصيل من صفحته عند السداد.`}
          </Banner>
          <Card title="التسليم">
            <DescriptionList
              items={[
                { label: "العميل", value: saved.customer?.name },
                { label: "الحالة", value: saved.status ? <StatusBadge entity="delivery" status={saved.status} /> : null },
                { label: "القيمة التقديرية", value: saved.estimated_value ? <span dir="ltr">{formatMoney(saved.estimated_value)}</span> : null },
                { label: "موعد السداد", value: saved.expected_payment_date ? dayLabel(saved.expected_payment_date) : null },
              ]}
            />
          </Card>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => onOpenDelivery?.(saved)}>
              فتح التسليم
            </Button>
            <Button variant="secondary" onClick={onNewDelivery}>
              تسليم آخر
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="تسليم جديد" description="يُسجَّل لحظة التأكيد ولا يُعدَّل. السعر يُنسخ في كل سطر." />

      <div className="flex flex-col gap-4">
        {submitError ? (
          <Banner kind="danger" title="تعذّر حفظ التسليم">
            {errorMessage(submitError)}
          </Banner>
        ) : null}

        {step === "edit" ? (
          <>
            <Card title="العميل والسداد">
              <div className="flex flex-col gap-4">
                <Grid cols={{ base: 1, tablet: 2 }} gap={4}>
                  <Field label="العميل" required error={errors.customer_id}>
                    <Combobox aria-label="العميل" placeholder="ابحث في عملائي" options={customerOptions} value={form.customerId} onValueChange={(customerId) => set({ customerId })} invalid={Boolean(errors.customer_id)} disabled={submitting} />
                  </Field>
                  <Field label="تاريخ السداد المتوقع" required error={errors.expected_payment_date} hint={`حتى ${isolate(maxPaymentDays)} يوماً: آخره ${dayLabel(maxPaymentDate)}.`}>
                    <DatePicker aria-label="تاريخ السداد المتوقع" value={form.expectedPaymentDate} onValueChange={(expectedPaymentDate) => set({ expectedPaymentDate })} min={today} max={maxPaymentDate} today={today} invalid={Boolean(errors.expected_payment_date)} disabled={submitting} />
                  </Field>
                </Grid>
                <Field label="ملاحظة" optional error={errors.note}>
                  <Textarea aria-label="ملاحظة" value={form.note} maxLength={NOTE_MAX} onChange={(event) => set({ note: event.target.value })} disabled={submitting} />
                </Field>
              </div>
            </Card>

            <Card title="الأصناف">
              <div className="flex flex-col gap-3">
                <p className="text-label text-fg-muted">الدفعة المقترحة الأقرب انتهاءً، والموقوفة لا تُسلَّم. الكمية حتى المتاح في رصيدك.</p>
                <LineItemsEditor lines={form.lines} onChange={(lines) => set({ lines })} items={items} batches={batches} errors={lineErrors} today={today} readOnly={submitting} />
              </div>
            </Card>

            <div className="flex flex-col gap-2">
              {missing ? <p className="text-label text-fg-muted">{missing}</p> : null}
              <div className="flex flex-wrap gap-2">
                <Button variant="primary" disabled={missing !== null} onClick={() => onStepChange("review")}>
                  مراجعة
                </Button>
                <Button variant="secondary" onClick={onCancel}>
                  إلغاء
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <Card title="المراجعة">
              <div className="flex flex-col gap-4">
                <DescriptionList
                  items={[
                    { label: "العميل", value: customer?.name },
                    { label: "تاريخ السداد المتوقع", value: form.expectedPaymentDate ? dayLabel(form.expectedPaymentDate) : null },
                    { label: "ملاحظة", value: form.note },
                  ]}
                />
                <ul className="flex flex-col divide-y divide-border">
                  {filledLines.map((line) => (
                    <li key={line.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-body text-fg">{itemName(line.itemId)}</span>
                        <span className="text-label text-fg-muted">{`${batchNo(line)} · سعر العلبة ${line.itemId !== null && prices[String(line.itemId)] ? formatMoney(prices[String(line.itemId)]) : "—"}`}</span>
                      </span>
                      <span className="text-body text-fg tabular-nums">{`${formatQuantity(line.quantity ?? 0)} علبة`}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
            <Banner kind="info" title="القيمة التقديرية عند التأكيد">
              تُنسخ الأسعار في الأسطر ويحسب الخادم القيمة لحظة التأكيد. السعر هنا للعرض فقط.
            </Banner>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" loading={submitting} onClick={onSubmit}>
                تأكيد التسليم
              </Button>
              <Button variant="secondary" disabled={submitting} onClick={() => onStepChange("edit")}>
                تعديل
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

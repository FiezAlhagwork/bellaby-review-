"use client";

import { ConfidentialBanner } from "@/components/data/ConfidentialBanner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Combobox } from "@/components/ui/Combobox";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import type { Option } from "@/components/ui/OptionList";
import { Textarea } from "@/components/ui/Textarea";
import { errorMessage } from "@/lib/api/error-messages";
import type { Delivery } from "@/lib/api/types";
import { formatMoney } from "@/lib/format";

/** نموذج `POST /disputes { title, delivery_id, description }`. */
export type DisputeForm = { title: string; deliveryId: string | null; description: string };
export const emptyDisputeForm: DisputeForm = { title: "", deliveryId: null, description: "" };

/** الإحالة من مدير المبيعات (`POST /deliveries/{id}/refer-dispute { note }`): من أحال وملاحظته. */
export type DisputeReferral = { by: string; note: string | null };

type DisputeFormViewProps = {
  form: DisputeForm;
  onFormChange: (form: DisputeForm) => void;
  /** خيارات التسليم: التسليمات غير المسدّدة (§91). */
  deliveries: readonly Delivery[];
  referral?: DisputeReferral | null;
  errors?: Readonly<Record<string, string>>;
  submitError?: string;
  submitting?: boolean;
  onSubmit: () => void;
  onCancel: () => void;
};

/**
 * فتح نزاع (I19): العنوان، والتسليم (اختياري، ومنه العميل)، والوصف. يبدأ الملف في المرحلة الأولى.
 * المحال من مدير المبيعات يصل معبّأً بالتسليم وملاحظة الإحالة.
 */
export function DisputeFormView({ form, onFormChange, deliveries, referral = null, errors = {}, submitError, submitting = false, onSubmit, onCancel }: DisputeFormViewProps) {
  const set = (patch: Partial<DisputeForm>) => onFormChange({ ...form, ...patch });
  const options: Option[] = deliveries.flatMap((delivery) =>
    delivery.id === undefined ? [] : [{ value: String(delivery.id), label: `${delivery.reference ?? ""} · ${delivery.customer?.name ?? ""}${delivery.estimated_value ? ` · ${formatMoney(delivery.estimated_value)}` : ""}` }],
  );
  const selected = deliveries.find((delivery) => String(delivery.id) === form.deliveryId);
  const disabledReason = form.title.trim() === "" ? "اكتب عنوان النزاع." : null;

  return (
    <>
      <PageHeader title="فتح نزاع" description="يبدأ الملف في المرحلة الأولى «جمع المعلومات»." />

      <div className="flex flex-col gap-4">
        <ConfidentialBanner />

        {referral ? (
          <Banner kind="info" title={`محال من ${referral.by}`}>
            {referral.note ? `ملاحظة الإحالة: ${referral.note}` : "أحال مدير المبيعات هذا الدين المتعثر بلا ملاحظة."}
          </Banner>
        ) : null}

        {submitError ? (
          <Banner kind="danger" title="تعذّر فتح النزاع">
            {errorMessage(submitError)}
          </Banner>
        ) : null}

        <Card title="النزاع">
          <div className="flex flex-col gap-4">
            <Field label="العنوان" required error={errors.title}>
              <Input value={form.title} onChange={(event) => set({ title: event.target.value })} placeholder="مطالبة صيدلية الشفاء بقيمة تسليم متأخر" disabled={submitting} />
            </Field>
            <Field label="التسليم" optional error={errors.delivery_id} hint={selected?.customer?.name ? `العميل: ${selected.customer.name}` : "للنزاع على دين تسليم. العميل يؤخذ منه."}>
              <Combobox aria-label="التسليم" placeholder="اختر التسليم" options={options} value={form.deliveryId} onValueChange={(deliveryId) => set({ deliveryId })} clearable disabled={submitting || referral !== null} />
            </Field>
            <Field label="الوصف" optional error={errors.description}>
              <Textarea value={form.description} onChange={(event) => set({ description: event.target.value })} placeholder="ما الخلاف ومنذ متى." disabled={submitting} />
            </Field>
          </div>
        </Card>

        <div className="flex flex-col gap-2">
          {disabledReason ? <p className="text-label text-fg-muted">{disabledReason}</p> : null}
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" loading={submitting} disabled={disabledReason !== null} onClick={onSubmit}>
              فتح النزاع
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

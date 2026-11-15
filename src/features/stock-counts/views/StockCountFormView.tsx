"use client";

import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { Dialog } from "@/components/ui/Dialog";
import { ErrorState } from "@/components/ui/ErrorState";
import { Field } from "@/components/ui/Field";
import type { Option } from "@/components/ui/OptionList";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { errorMessage } from "@/lib/api/error-messages";
import type { Location, UserRef } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";

/** حالة النموذج كما تُرسل إلى `POST /stock-counts` (`location_id` و`assigned_to` و`note`). */
export type StockCountForm = {
  locationId: string | null;
  /** معرّف عامل المستودع. null = بلا إسناد (يعدّه اللوجستي بنفسه). */
  assignedToId: string | null;
  note: string;
};

export const emptyStockCountForm = (locationId: string | null = null): StockCountForm => ({ locationId, assignedToId: null, note: "" });

export type StockCountFormOptions = {
  /** مواقع المستودع `GET /locations?type=WAREHOUSE`. */
  locations: readonly Location[];
  /** عمال المستودع. */
  workers: readonly UserRef[];
};

type StockCountFormViewProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: Loadable<StockCountFormOptions>;
  form: StockCountForm;
  onFormChange: (form: StockCountForm) => void;
  /** `errors` من `validation_failed` كما هي: `{ location_id: "نص" }`. */
  errors?: Readonly<Record<string, string>>;
  /** رمز خطأ بلا حقل. */
  submitError?: string;
  submitting?: boolean;
  onSubmit?: () => void;
  onRetry?: () => void;
};

/**
 * نافذة «جرد جديد» (W14): موقع المستودع المجرود، وإسناد لعامل (اختياري). بعد الإنشاء يُفتح الجرد قيد العدّ (W15).
 * الملاحظة اختيارية والعقد يقبلها في الطلب ولا يعيدها في الجرد (docs/backend-requests.md §17.4). الزر معطّل وسببه ظاهر.
 */
export function StockCountFormView({ open, onOpenChange, options, form, onFormChange, errors = {}, submitError, submitting = false, onSubmit, onRetry }: StockCountFormViewProps) {
  const set = (patch: Partial<StockCountForm>) => onFormChange({ ...form, ...patch });

  const close = (
    <Button key="cancel" variant="secondary" disabled={submitting} onClick={() => onOpenChange(false)}>
      إلغاء
    </Button>
  );

  if (options.status !== "ready") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange} size="md" title="جرد جديد" description="ابدأ جرداً لموقع من مواقع المستودع." actions={[close]}>
        {options.status === "loading" ? (
          <div className="flex flex-col gap-4" aria-busy="true">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <ErrorState code={options.code} onRetry={onRetry} />
        )}
      </Dialog>
    );
  }

  const locationOptions: Option[] = options.data.locations.filter((location) => location.is_active !== false).flatMap((location) => (location.id !== undefined && location.name ? [{ value: String(location.id), label: location.name }] : []));
  const workerOptions: Option[] = options.data.workers.flatMap((worker) => (worker.id !== undefined && worker.name ? [{ value: String(worker.id), label: worker.name }] : []));

  // سبب تعطيل «إنشاء الجرد»: يظهر تحت الحقول (الزر المعطّل بلا سبب ظاهر ممنوع).
  const disabledReason = form.locationId === null ? "اختر موقع المستودع." : null;

  const submit = (
    <Button key="submit" variant="primary" loading={submitting} disabled={disabledReason !== null} onClick={onSubmit}>
      إنشاء الجرد
    </Button>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      dismissible={!submitting}
      size="md"
      title="جرد جديد"
      description="ابدأ جرداً لموقع من مواقع المستودع. يعدّ العامل الأصناف سطراً بسطر، ثم يرسله للاعتماد."
      actions={[close, submit]}
    >
      <div className="flex flex-col gap-4">
        {submitError ? (
          <Banner kind="danger" title="تعذّر إنشاء الجرد">
            {errorMessage(submitError)}
          </Banner>
        ) : null}

        <Field label="الموقع" required error={errors.location_id}>
          <Select aria-label="الموقع" placeholder="اختر موقع المستودع" options={locationOptions} value={form.locationId} onValueChange={(locationId) => set({ locationId })} locked={locationOptions.length === 1} />
        </Field>

        <Field label="إسناد لعامل" optional hint="بلا إسناد يعدّه اللوجستي بنفسه." error={errors.assigned_to}>
          <Combobox aria-label="إسناد لعامل" placeholder="بلا إسناد" options={workerOptions} value={form.assignedToId} onValueChange={(assignedToId) => set({ assignedToId })} clearable />
        </Field>

        <Field label="ملاحظة" optional error={errors.note}>
          <Textarea aria-label="ملاحظة" value={form.note} onChange={(event) => set({ note: event.target.value })} />
        </Field>

        {disabledReason ? <p className="text-label text-fg-muted">{disabledReason}</p> : null}
      </div>
    </Dialog>
  );
}

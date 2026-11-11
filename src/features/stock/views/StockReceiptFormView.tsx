"use client";

import { BatchEntryEditor, type BatchEntryLine } from "@/components/data/BatchEntryEditor";
import { Grid } from "@/components/layout/Grid";
import { PageHeader } from "@/components/layout/PageHeader";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { ErrorState } from "@/components/ui/ErrorState";
import { Field } from "@/components/ui/Field";
import type { Option } from "@/components/ui/OptionList";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { errorMessage } from "@/lib/api/error-messages";
import type { ItemRef, Location, StockReceipt } from "@/lib/api/types";
import type { IsoDate } from "@/lib/calendar";
import { CaptureRow } from "@/lib/design/CaptureMode";
import { isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";
import { ReceiptLinesList } from "../components/ReceiptLinesList";
import { analyzeReceiptLines, type KnownBatches } from "../components/receipt-notices";

/** حالة النموذج كما تُرسل إلى `POST /stock-receipts` (الأسماء المختصرة للـ view، والحاوية تحوّلها لأسماء العقد). */
export type StockReceiptForm = {
  locationId: string | null;
  note: string;
  lines: BatchEntryLine[];
  /** `confirm_near_expiry`: تأكيد إدخال دفعات ضمن مهلة تنبيه الصلاحية. */
  confirmNearExpiry: boolean;
};

// معرّف السطر الأول ثابت فلا يختلف بين الخادم والمتصفح.
export const emptyStockReceiptForm = (): StockReceiptForm => ({
  locationId: null,
  note: "",
  lines: [{ id: "line-1", itemId: null, batchNo: "", expiryDate: null, quantity: null }],
  confirmNearExpiry: false,
});

export type StockReceiptOptions = { locations: readonly Location[]; items: readonly ItemRef[] };

type StockReceiptFormViewProps = {
  /** خيارات الموقع والصنف: `GET /locations?type=WAREHOUSE` و`GET /items`. */
  options: Loadable<StockReceiptOptions>;
  /** دفعات كل صنف مختار بمفتاح `String(itemId)` (`GET /batches?item_id=`)، للتحقق من وجود الرقم قبل الإرسال. */
  batches: KnownBatches;
  form: StockReceiptForm;
  onFormChange: (form: StockReceiptForm) => void;
  /** `errors` من `validation_failed` كما هي: `{ location_id: "نص", "lines.0.quantity": "نص" }`. */
  errors?: Readonly<Record<string, string>>;
  /** رمز خطأ 422 آخر من العقد (batch_expired وbatch_expiry_mismatch وnear_expiry_confirmation_required…). */
  submitError?: string;
  submitting?: boolean;
  /** بعد الإدخال: ملخص النتيجة بدل النموذج. */
  saved?: StockReceipt | null;
  today: IsoDate;
  /** `expiry_alert_days` من الإعدادات. */
  expiryAlertDays?: number;
  onSubmit?: () => void;
  onCancel?: () => void;
  onReceiveAnother?: () => void;
  onOpenLog?: () => void;
  onRetry?: () => void;
};

const NOTE_MAX = 500;

/** «في الإدخال سطر واحد ينتهي» · «سطران ينتهيان» · «3 أسطر تنتهي». */
function nearExpiryPhrase(count: number): string {
  if (count === 1) return "في الإدخال سطر واحد ينتهي";
  if (count === 2) return "في الإدخال سطران ينتهيان";
  return `في الإدخال ${isolate(count)} أسطر تنتهي`;
}

/**
 * إدخال بضاعة (W04): الموقع، وأسطر (صنف ورقم دفعة وتاريخ انتهاء وكمية)، وملاحظة. القواعد تظهر قبل الإرسال:
 * المنتهي لا يُدخل، والقريب الانتهاء يحتاج تأكيداً، والدفعة الموجودة بالتاريخ نفسه تُضاف كميتها، وبتاريخ مختلف تعارض.
 * بعد الإدخال يظهر ملخص بما أُنشئ وما أُضيف لدفعة موجودة.
 */
export function StockReceiptFormView({
  options,
  batches,
  form,
  onFormChange,
  errors = {},
  submitError,
  submitting = false,
  saved = null,
  today,
  expiryAlertDays = 60,
  onSubmit,
  onCancel,
  onReceiveAnother,
  onOpenLog,
  onRetry,
}: StockReceiptFormViewProps) {
  const header = <PageHeader title="إدخال بضاعة" description="سجّل بضاعة وصلت إلى المستودع برقم الدفعة وتاريخ الانتهاء." />;

  if (saved) {
    return (
      <>
        {header}
        <SavedSummary receipt={saved} today={today} expiryAlertDays={expiryAlertDays} onReceiveAnother={onReceiveAnother} onOpenLog={onOpenLog} />
      </>
    );
  }

  if (options.status === "loading") {
    return (
      <>
        {header}
        <div className="flex flex-col gap-4" aria-busy="true">
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      </>
    );
  }

  if (options.status === "error") {
    return (
      <>
        {header}
        <ErrorState code={options.code} onRetry={onRetry} />
      </>
    );
  }

  const { locations, items } = options.data;
  const locationOptions: Option[] = locations.flatMap((location) => (location.id !== undefined && location.name ? [{ value: String(location.id), label: location.name }] : []));
  const itemOptions: Option[] = items.flatMap((item) => (item.id !== undefined && item.name ? [{ value: String(item.id), label: item.name }] : []));

  const set = (patch: Partial<StockReceiptForm>) => onFormChange({ ...form, ...patch });
  const analysis = analyzeReceiptLines(form.lines, batches, today, expiryAlertDays);
  const needsConfirmation = analysis.nearExpiryCount > 0;

  // سبب تعطيل «إدخال»: يُعرض تحت الزر (الزر المعطّل بلا سبب ظاهر ممنوع).
  const disabledReason =
    form.locationId === null
      ? "اختر الموقع."
      : !analysis.complete
        ? "أكمل بيانات كل الأسطر: الصنف ورقم الدفعة وتاريخ الانتهاء والكمية."
        : analysis.blocked
          ? "صحّح الأسطر المعلّمة بالأحمر قبل الإدخال."
          : needsConfirmation && !form.confirmNearExpiry
            ? "أكّد الدفعات القريبة الانتهاء ثم أدخل."
            : null;

  return (
    <>
      {header}

      <div className="flex flex-col gap-4">
        {submitError ? (
          <Banner kind="danger" title="تعذّر الإدخال">
            {errorMessage(submitError)}
          </Banner>
        ) : null}

        <Card title="التفاصيل">
          <Grid cols={{ base: 1, tablet: 2 }} gap={4}>
            <Field label="الموقع" required error={errors.location_id}>
              <Select aria-label="الموقع" placeholder="اختر المستودع" options={locationOptions} value={form.locationId} onValueChange={(locationId) => set({ locationId })} />
            </Field>
            <Field label="ملاحظة" optional hint={`حتى ${isolate(NOTE_MAX)} حرفاً.`} error={errors.note}>
              <Textarea aria-label="ملاحظة" maxLength={NOTE_MAX} value={form.note} onChange={(event) => set({ note: event.target.value })} />
            </Field>
          </Grid>
        </Card>

        <Card title="الأسطر">
          <BatchEntryEditor lines={form.lines} onChange={(lines) => set({ lines })} itemOptions={itemOptions} errors={errors} notices={analysis.notices} today={today} disabled={submitting} />
          {errors.lines ? (
            <p role="alert" className="text-label text-danger">
              {errors.lines}
            </p>
          ) : null}
        </Card>

        {needsConfirmation ? (
          <Banner kind="warning" title="دفعات قريبة الانتهاء">
            <div className="flex flex-col gap-3">
              <p>{`${nearExpiryPhrase(analysis.nearExpiryCount)} خلال ${isolate(expiryAlertDays)} يوماً. راجع تاريخ الانتهاء على العلبة قبل المتابعة.`}</p>
              <Checkbox label="راجعت التواريخ وأؤكد إدخال هذه الدفعات" checked={form.confirmNearExpiry} onCheckedChange={(confirmNearExpiry) => set({ confirmNearExpiry })} disabled={submitting} />
            </div>
          </Banner>
        ) : null}

        <div className="flex flex-col gap-2">
          <CaptureRow className="flex-wrap items-center gap-3">
            <Button variant="primary" size="lg" loading={submitting} disabled={disabledReason !== null} onClick={onSubmit}>
              إدخال
            </Button>
            <Button variant="secondary" size="lg" disabled={submitting} onClick={onCancel}>
              إلغاء
            </Button>
          </CaptureRow>
          {disabledReason ? <p className="text-label text-fg-muted">{disabledReason}</p> : null}
        </div>
      </div>
    </>
  );
}

function SavedSummary({
  receipt,
  today,
  expiryAlertDays,
  onReceiveAnother,
  onOpenLog,
}: {
  receipt: StockReceipt;
  today: IsoDate;
  expiryAlertDays: number;
  onReceiveAnother?: () => void;
  onOpenLog?: () => void;
}) {
  const lines = receipt.lines ?? [];

  return (
    <div className="flex flex-col gap-4">
      <Banner kind="success" title="تم الإدخال">
        <span className="flex flex-wrap items-center gap-x-2">
          <span>{`سُجّل الإدخال في ${receipt.location?.name ?? "المستودع"}`}</span>
          <span dir="ltr" className="tabular-nums text-fg-muted">
            {receipt.reference}
          </span>
        </span>
      </Banner>

      <Card title="ما أُدخل">
        <ReceiptLinesList lines={lines} today={today} expiryAlertDays={expiryAlertDays} />
        {receipt.note ? <p className="text-body text-fg-muted">{`ملاحظة: ${receipt.note}`}</p> : null}
      </Card>

      <CaptureRow className="flex-wrap items-center gap-3">
        <Button variant="primary" size="lg" onClick={onReceiveAnother}>
          إدخال آخر
        </Button>
        <Button variant="secondary" size="lg" onClick={onOpenLog}>
          سجل الإدخال
        </Button>
      </CaptureRow>
    </div>
  );
}

"use client";

import { Package } from "@phosphor-icons/react";
import { LineItemsEditor, type EditorBatch, type EditorItem, type EditorLine } from "@/components/data/LineItemsEditor";
import { Grid } from "@/components/layout/Grid";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Field } from "@/components/ui/Field";
import type { Option } from "@/components/ui/OptionList";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { errorMessage } from "@/lib/api/error-messages";
import type { Location } from "@/lib/api/types";
import type { IsoDate } from "@/lib/calendar";
import type { Loadable } from "@/lib/loadable";

/** حالة النموذج كما تُرسل إلى `POST /withdraw-requests` (الأسماء المختصرة للـ view، والحاوية تحوّلها لأسماء العقد). */
export type WithdrawForm = {
  /** معرّف **المستخدم** (`rep_id`) لا الموقع. */
  repUserId: string | null;
  /** `to_location_id`: مستودع الاستلام. */
  toLocationId: string | null;
  reason: string;
  lines: EditorLine[];
};

// معرّف السطر الأول ثابت فلا يختلف بين الخادم والمتصفح.
const firstLine = (): EditorLine => ({ id: "line-1", itemId: null, batchId: null, quantity: null });

export const emptyWithdrawForm = (toLocationId: string | null = null): WithdrawForm => ({ repUserId: null, toLocationId, reason: "", lines: [firstLine()] });

export type WithdrawFormOptions = {
  /** مواقع المندوبين `GET /locations?type=REP`: خيارات المندوب بقيمة `location.user.id`. المعطَّل منهم لا يُختار. */
  reps: readonly Location[];
  /** مستودعات الاستلام `GET /locations?type=WAREHOUSE`. */
  destinations: readonly Location[];
};

/** رصيد المندوب الذي يُسحب منه: أصنافه ودفعاته بمتاح كل دفعة (`GET /stock/balances?location_id=<موقع المندوب>&group_by=batch`). */
export type RepBalance = {
  items: readonly EditorItem[];
  /** دفعات كل صنف بمفتاح `String(itemId)`. */
  batches: Readonly<Record<string, readonly EditorBatch[]>>;
};

type WithdrawRequestFormViewProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: Loadable<WithdrawFormOptions>;
  /** رصيد المندوب المختار. null = لم يُختر مندوب بعد. */
  balance: Loadable<RepBalance> | null;
  form: WithdrawForm;
  onFormChange: (form: WithdrawForm) => void;
  /** `errors` من `validation_failed` كما هي: `{ reason: "نص", "lines.0.quantity": "نص" }`. */
  errors?: Readonly<Record<string, string>>;
  /** رمز خطأ بلا حقل. */
  submitError?: string;
  submitting?: boolean;
  today: IsoDate;
  onSubmit?: () => void;
  onRetry?: () => void;
};

/**
 * نافذة «طلب سحب» (W11): يطلب المستودع استلام عينات أو مواد من رصيد مندوب بدفعاتها. الأصناف من رصيد المندوب نفسه.
 * العقد يسمح بالسحب على دفعة موقوفة، فتظهر معلّمة ولا تُمنع. لا ينقص رصيد المندوب حتى يسلّم من التطبيق.
 * زر الإرسال معطّل وسببه ظاهر تحت الحقول.
 */
export function WithdrawRequestFormView({ open, onOpenChange, options, balance, form, onFormChange, errors = {}, submitError, submitting = false, today, onSubmit, onRetry }: WithdrawRequestFormViewProps) {
  const set = (patch: Partial<WithdrawForm>) => onFormChange({ ...form, ...patch });

  const close = (
    <Button key="cancel" variant="secondary" disabled={submitting} onClick={() => onOpenChange(false)}>
      إلغاء
    </Button>
  );

  if (options.status !== "ready") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange} size="lg" title="طلب سحب" description="اطلب استلام عينات أو مواد من رصيد مندوب." actions={[close]}>
        {options.status === "loading" ? (
          <div className="flex flex-col gap-4" aria-busy="true">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <ErrorState code={options.code} onRetry={onRetry} />
        )}
      </Dialog>
    );
  }

  const { reps, destinations } = options.data;
  const repOptions: Option[] = reps.filter((rep) => rep.is_active !== false).flatMap((rep) => (rep.user?.id !== undefined && rep.name ? [{ value: String(rep.user.id), label: rep.name }] : []));
  const destinationOptions: Option[] = destinations.flatMap((location) => (location.id !== undefined && location.name ? [{ value: String(location.id), label: location.name }] : []));

  // أسطر المندوب السابق لا تصلح لغيره: تغيير المندوب يفرّغ الأسطر.
  const changeRep = (repUserId: string | null) => set({ repUserId, lines: [firstLine()] });

  const ready = balance?.status === "ready" ? balance.data : null;
  const batches: Record<string, Loadable<readonly EditorBatch[]>> = {};
  if (ready) for (const [itemId, list] of Object.entries(ready.batches)) batches[itemId] = { status: "ready", data: list };

  const batchOf = (line: EditorLine) => (line.itemId === null ? undefined : ready?.batches[String(line.itemId)]?.find((batch) => batch.id === line.batchId));
  const complete = form.lines.length > 0 && form.lines.every((line) => line.itemId !== null && line.batchId !== null && line.quantity !== null && line.quantity >= 1);
  const hasOverflow = form.lines.some((line) => {
    const batch = batchOf(line);
    return batch !== undefined && line.quantity !== null && line.quantity > batch.available;
  });

  // سبب تعطيل «إرسال الطلب»: يظهر تحت الحقول (الزر المعطّل بلا سبب ظاهر ممنوع).
  const disabledReason =
    form.repUserId === null
      ? "اختر المندوب."
      : form.toLocationId === null
        ? "اختر مستودع الاستلام."
        : form.reason.trim() === ""
          ? "اكتب سبب السحب."
          : balance?.status !== "ready"
            ? "انتظر تحميل رصيد المندوب."
            : ready && ready.items.length === 0
              ? "لا رصيد عند هذا المندوب."
              : !complete
                ? "أكمل الأسطر: الصنف والدفعة والكمية."
                : hasOverflow
                  ? "في الأسطر كمية أكبر من رصيد المندوب. خفّضها."
                  : null;

  const submit = (
    <Button key="submit" variant="primary" loading={submitting} disabled={disabledReason !== null} onClick={onSubmit}>
      إرسال الطلب
    </Button>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      dismissible={!submitting}
      size="lg"
      title="طلب سحب"
      description="اطلب استلام عينات أو مواد من رصيد مندوب. لا ينقص رصيده حتى يسلّمها من التطبيق."
      actions={[close, submit]}
    >
      <div className="flex flex-col gap-4">
        {submitError ? (
          <Banner kind="danger" title="تعذّر إرسال الطلب">
            {errorMessage(submitError)}
          </Banner>
        ) : null}

        <Grid cols={{ base: 1, tablet: 2 }} gap={4}>
          <Field label="المندوب" required error={errors.rep_id}>
            <Combobox aria-label="المندوب" placeholder="اختر المندوب" options={repOptions} value={form.repUserId} onValueChange={changeRep} />
          </Field>
          <Field label="مستودع الاستلام" required error={errors.to_location_id}>
            <Select aria-label="مستودع الاستلام" placeholder="اختر المستودع" options={destinationOptions} value={form.toLocationId} onValueChange={(toLocationId) => set({ toLocationId })} locked={destinationOptions.length === 1} />
          </Field>
        </Grid>

        <Field label="السبب" required error={errors.reason}>
          <Textarea aria-label="السبب" placeholder="اكتب سبب السحب" value={form.reason} onChange={(event) => set({ reason: event.target.value })} />
        </Field>

        <div className="flex flex-col gap-3">
          <h3 className="text-h3 font-semibold text-fg">الأصناف</h3>
          {balance === null ? (
            <p className="rounded-lg border border-dashed border-border-strong px-4 py-6 text-center text-body text-fg-muted">اختر المندوب لتظهر أصنافه المتاحة للسحب.</p>
          ) : balance.status === "loading" ? (
            <div className="flex flex-col gap-3" aria-busy="true">
              <Skeleton className="h-28 w-full" />
            </div>
          ) : balance.status === "error" ? (
            <ErrorState code={balance.code} onRetry={onRetry} />
          ) : balance.data.items.length === 0 ? (
            <EmptyState icon={Package} title="لا رصيد عند هذا المندوب" description="لا توجد عينات أو مواد في رصيده لتُسحب." />
          ) : (
            // المحرّر يقيس عرضه هو لا عرض الشاشة: داخل النافذة (880 كحدّ أقصى) تبقى أسطره بطاقات حتى على الشاشات الواسعة، فلا يضيق حقل الدفعة.
            <div className="@container">
              <LineItemsEditor lines={form.lines} onChange={(lines) => set({ lines })} items={balance.data.items} batches={batches} errors={errors} allowSuspended today={today} readOnly={submitting} />
            </div>
          )}
          {errors.lines ? (
            <p role="alert" className="text-label text-danger">
              {errors.lines}
            </p>
          ) : null}
        </div>

        {disabledReason ? <p className="text-label text-fg-muted">{disabledReason}</p> : null}
      </div>
    </Dialog>
  );
}

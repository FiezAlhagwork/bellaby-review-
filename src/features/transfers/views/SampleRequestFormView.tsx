"use client";

import { Plus, Trash } from "@phosphor-icons/react";
import { itemTypeLabels } from "@/components/data/item-types";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { Dialog } from "@/components/ui/Dialog";
import { ErrorState } from "@/components/ui/ErrorState";
import { Field } from "@/components/ui/Field";
import { IconButton } from "@/components/ui/IconButton";
import { NumberInput } from "@/components/ui/NumberInput";
import type { Option } from "@/components/ui/OptionList";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { errorMessage } from "@/lib/api/error-messages";
import type { ItemRef, Location } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";

/** سطر في النموذج: صنف وكمية (`lines[].item_id` و`quantity`). `id` مفتاح العرض فقط. */
export type SampleRequestFormLine = { id: string; itemId: string | null; quantity: number | null };

/** حالة النموذج كما تُرسل إلى `POST /sample-requests` (الحاوية تحوّلها لأسماء العقد: `rep_id`، `reason`، `lines`). */
export type SampleRequestForm = {
  /** معرّف **المستخدم** (`rep_id`) لا الموقع. */
  repUserId: string | null;
  reason: string;
  lines: SampleRequestFormLine[];
};

export const emptySampleRequestForm = (): SampleRequestForm => ({ repUserId: null, reason: "", lines: [{ id: "line-1", itemId: null, quantity: null }] });

export type SampleRequestFormOptions = {
  /** مواقع المندوبين `GET /locations?type=REP`: خيارات المندوب بقيمة `location.user.id`. المعطَّل منهم لا يُختار. */
  reps: readonly Location[];
  /** الأصناف من نوع `SAMPLE` أو `PROMO` فقط (العقد يرفض غيرها): `GET /items` بـ`type`. */
  items: readonly ItemRef[];
};

type SampleRequestFormViewProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: Loadable<SampleRequestFormOptions>;
  form: SampleRequestForm;
  onFormChange: (form: SampleRequestForm) => void;
  /** `errors` من `validation_failed` كما هي: `{ reason: "نص", "lines.0.quantity": "نص" }`. */
  errors?: Readonly<Record<string, string>>;
  /** رمز خطأ بلا حقل. */
  submitError?: string;
  submitting?: boolean;
  onSubmit?: () => void;
  onRetry?: () => void;
};

/**
 * نافذة «طلب عينات» (M18): يطلب مدير المكتب العلمي عينات أو مواد دعائية لمندوب، فيصرفها اللوجستي (W06) أو يرفضها (W10).
 * الأصناف من العينات والمواد فقط وبلا دفعة (يختارها المستودع عند الصرف). زر الإرسال معطّل وسببه ظاهر تحت الحقول.
 */
export function SampleRequestFormView({ open, onOpenChange, options, form, onFormChange, errors = {}, submitError, submitting = false, onSubmit, onRetry }: SampleRequestFormViewProps) {
  const set = (patch: Partial<SampleRequestForm>) => onFormChange({ ...form, ...patch });

  const close = (
    <Button key="cancel" variant="secondary" disabled={submitting} onClick={() => onOpenChange(false)}>
      إلغاء
    </Button>
  );

  if (options.status !== "ready") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange} size="lg" title="طلب عينات" description="اطلب عينات أو مواد دعائية لمندوب." actions={[close]}>
        {options.status === "loading" ? (
          <div className="flex flex-col gap-4" aria-busy="true">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <ErrorState code={options.code} onRetry={onRetry} />
        )}
      </Dialog>
    );
  }

  const { reps, items } = options.data;
  const repOptions: Option[] = reps.filter((rep) => rep.is_active !== false).flatMap((rep) => (rep.user?.id !== undefined && rep.name ? [{ value: String(rep.user.id), label: rep.name }] : []));
  const itemOptions: Option[] = items.flatMap((item) => (item.id !== undefined && item.name ? [{ value: String(item.id), label: item.type ? `${item.name} · ${itemTypeLabels[item.type]}` : item.name }] : []));

  const updateLine = (id: string, patch: Partial<SampleRequestFormLine>) => set({ lines: form.lines.map((line) => (line.id === id ? { ...line, ...patch } : line)) });
  const addLine = () => set({ lines: [...form.lines, { id: `line-${form.lines.length + 1}-${form.lines.at(-1)?.id ?? ""}`, itemId: null, quantity: null }] });
  const removeLine = (id: string) => set({ lines: form.lines.filter((line) => line.id !== id) });

  const complete = form.lines.length > 0 && form.lines.every((line) => line.itemId !== null && line.quantity !== null && line.quantity >= 1);
  const duplicate = new Set(form.lines.flatMap((line) => (line.itemId === null ? [] : [line.itemId]))).size !== form.lines.filter((line) => line.itemId !== null).length;

  // سبب تعطيل «إرسال الطلب»: يظهر تحت الحقول (الزر المعطّل بلا سبب ظاهر ممنوع).
  const disabledReason =
    form.repUserId === null ? "اختر المندوب." : form.reason.trim() === "" ? "اكتب سبب الطلب." : !complete ? "أكمل الأسطر: الصنف والكمية." : duplicate ? "صنف مكرر في الأسطر. ادمج كمياته في سطر واحد." : null;

  const submit = (
    <Button key="submit" variant="primary" loading={submitting} disabled={disabledReason !== null} onClick={onSubmit}>
      إرسال الطلب
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange} dismissible={!submitting} size="lg" title="طلب عينات" description="اطلب عينات أو مواد دعائية لمندوب. يصرفها اللوجستي من المستودع بدفعاتها." actions={[close, submit]}>
      <div className="flex flex-col gap-4">
        {submitError ? (
          <Banner kind="danger" title="تعذّر إرسال الطلب">
            {errorMessage(submitError)}
          </Banner>
        ) : null}

        <Field label="المندوب" required error={errors.rep_id}>
          <Combobox aria-label="المندوب" placeholder="اختر المندوب" options={repOptions} value={form.repUserId} onValueChange={(repUserId) => set({ repUserId })} />
        </Field>

        <Field label="السبب" required error={errors.reason}>
          <Textarea aria-label="السبب" placeholder="اكتب سبب الطلب" value={form.reason} onChange={(event) => set({ reason: event.target.value })} />
        </Field>

        <div className="flex flex-col gap-3">
          <h3 className="text-h3 font-semibold text-fg">الأصناف</h3>
          {form.lines.map((line, index) => (
            <div key={line.id} className="flex flex-col gap-2 rounded-lg border border-border p-3">
              <Field label="الصنف" required error={errors[`lines.${index}.item_id`]} className="min-w-0 flex-1">
                <Combobox aria-label={`الصنف ${index + 1}`} placeholder="اختر عينة أو مادة" options={itemOptions} value={line.itemId} onValueChange={(itemId) => updateLine(line.id, { itemId })} />
              </Field>
              <Field label="الكمية" required error={errors[`lines.${index}.quantity`]}>
                <NumberInput aria-label={`الكمية ${index + 1}`} value={line.quantity} onValueChange={(quantity) => updateLine(line.id, { quantity })} min={1} unit="علبة" />
              </Field>
              {form.lines.length > 1 ? (
                <IconButton icon={Trash} aria-label={`حذف السطر ${index + 1}`} variant="ghost" className="self-end" onClick={() => removeLine(line.id)} />
              ) : null}
            </div>
          ))}
          <div>
            <Button variant="secondary" icon={Plus} onClick={addLine}>
              إضافة صنف
            </Button>
          </div>
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

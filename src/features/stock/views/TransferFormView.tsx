"use client";

import { LineItemsEditor, type EditorBatch, type EditorItem, type EditorLine } from "@/components/data/LineItemsEditor";
import { StatusBadge } from "@/components/data/StatusBadge";
import { StockLine } from "@/components/data/StockLine";
import { Grid } from "@/components/layout/Grid";
import { PageHeader } from "@/components/layout/PageHeader";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Combobox } from "@/components/ui/Combobox";
import { ErrorState } from "@/components/ui/ErrorState";
import { Field } from "@/components/ui/Field";
import type { Option } from "@/components/ui/OptionList";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { errorMessage } from "@/lib/api/error-messages";
import type { ItemType, Location, SampleRequest, Transfer } from "@/lib/api/types";
import type { IsoDate } from "@/lib/calendar";
import { CaptureRow } from "@/lib/design/CaptureMode";
import { formatQuantity, isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

export type RecipientKind = "AGENT" | "REP";

/** حالة النموذج كما تُرسل إلى `POST /transfers` (الأسماء المختصرة للـ view، والحاوية تحوّلها لأسماء العقد). */
export type TransferForm = {
  fromLocationId: string | null;
  recipientKind: RecipientKind;
  toLocationId: string | null;
  note: string;
  lines: EditorLine[];
};

// معرّف السطر الأول ثابت فلا يختلف بين الخادم والمتصفح.
export const emptyTransferForm = (fromLocationId: string | null = null): TransferForm => ({
  fromLocationId,
  recipientKind: "AGENT",
  toLocationId: null,
  note: "",
  lines: [{ id: "line-1", itemId: null, batchId: null, quantity: null }],
});

export type TransferOptions = {
  /** مستودعات المصدر: `GET /locations?type=WAREHOUSE`. */
  sources: readonly Location[];
  /** المستلمون: `GET /locations?type=AGENT` و`type=REP`. */
  agents: readonly Location[];
  reps: readonly Location[];
  /** كل الأصناف الفعّالة. تُصفّى في الشاشة بنوع المستلم. */
  items: readonly EditorItem[];
};

type TransferFormViewProps = {
  options: Loadable<TransferOptions>;
  /** دفعات كل صنف بمفتاح `String(itemId)` ومتاحها في المستودع المختار (`GET /stock/balances?group_by=batch`). */
  batches: Readonly<Record<string, Loadable<readonly EditorBatch[]>>>;
  form: TransferForm;
  onFormChange: (form: TransferForm) => void;
  /** يملأ المستلم ويقفله: «معبّأ من طلب عينات» (W10). */
  sampleRequest?: SampleRequest | null;
  /** `errors` من `validation_failed` أو من 422 بسطر معيّن كما هي: `{ "lines.0.batch_id": "نص" }`. */
  errors?: Readonly<Record<string, string>>;
  /** رمز خطأ 422 بلا حقل (item_type_not_allowed_here وinsufficient_stock…). */
  submitError?: string;
  submitting?: boolean;
  /** بعد الاعتماد: ملخص الصرف بدل النموذج. */
  saved?: Transfer | null;
  today: IsoDate;
  onSubmit?: () => void;
  onCancel?: () => void;
  onNewTransfer?: () => void;
  onOpenTransfers?: () => void;
  onRetry?: () => void;
};

const NOTE_MAX = 500;

/** للوكيل المنتجات وحدها، وللمندوب العينات والمواد وحدها (`item_type_not_allowed_here`). */
const allowedTypes: Record<RecipientKind, readonly ItemType[]> = { AGENT: ["PRODUCT"], REP: ["SAMPLE", "PROMO"] };

const mismatchMessage: Record<RecipientKind, string> = {
  AGENT: "هذا الصنف لا يُصرف للوكيل: المنتجات فقط.",
  REP: "هذا الصنف لا يُصرف للمندوب: العينات والمواد الدعائية فقط.",
};

/**
 * صرف جديد (W06): من أي مستودع، وإلى وكيل (منتجات) أو مندوب (عينات ومواد)، وأسطر بدفعاتها (الأقرب انتهاءً مقترحة).
 * يعلّم الأصناف التي لا تناسب المستلم، والدفعة الموقوفة، وتجاوز المتاح، ولا يُفعَّل الاعتماد حتى تُصحَّح.
 * بعد الاعتماد: ملخص بالمرجع وحالة «بالطريق». ينقص رصيد المستودع ولا يزيد رصيد المستلم حتى يؤكد الاستلام.
 */
export function TransferFormView({
  options,
  batches,
  form,
  onFormChange,
  sampleRequest = null,
  errors = {},
  submitError,
  submitting = false,
  saved = null,
  today,
  onSubmit,
  onCancel,
  onNewTransfer,
  onOpenTransfers,
  onRetry,
}: TransferFormViewProps) {
  const header = <PageHeader title="صرف جديد" description="اصرف بضاعة من المستودع إلى وكيل أو مندوب. يبقى الصرف «بالطريق» حتى يؤكد المستلم." />;

  if (saved) {
    return (
      <>
        {header}
        <SavedSummary transfer={saved} today={today} onNewTransfer={onNewTransfer} onOpenTransfers={onOpenTransfers} />
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

  const { sources, agents, reps, items } = options.data;
  const set = (patch: Partial<TransferForm>) => onFormChange({ ...form, ...patch });

  const locationOption = (location: Location): Option[] => (location.id !== undefined && location.name ? [{ value: String(location.id), label: location.name }] : []);
  const sourceOptions = sources.flatMap(locationOption);
  const recipientOptions = (form.recipientKind === "AGENT" ? agents : reps).flatMap(locationOption);

  // أصناف النوع المناسب، ومعها ما اختير سابقاً (ليبقى اسمه ظاهراً وسطره معلّماً).
  const allowed = allowedTypes[form.recipientKind];
  const chosenIds = new Set(form.lines.map((line) => line.itemId));
  const editorItems = items.filter((item) => allowed.includes(item.type) || chosenIds.has(item.id));

  const mismatchErrors: Record<string, string> = {};
  form.lines.forEach((line, index) => {
    const item = items.find((candidate) => candidate.id === line.itemId);
    if (item && !allowed.includes(item.type)) mismatchErrors[`lines.${index}.item_id`] = mismatchMessage[form.recipientKind];
  });
  const lineErrors = { ...mismatchErrors, ...errors };

  const batchOf = (line: EditorLine) => {
    const loadable = line.itemId === null ? undefined : batches[String(line.itemId)];
    return loadable?.status === "ready" ? loadable.data.find((batch) => batch.id === line.batchId) : undefined;
  };
  const complete = form.lines.length > 0 && form.lines.every((line) => line.itemId !== null && line.batchId !== null && line.quantity !== null && line.quantity >= 1);
  const hasMismatch = Object.keys(mismatchErrors).length > 0;
  const hasOverflow = form.lines.some((line) => {
    const batch = batchOf(line);
    return batch !== undefined && line.quantity !== null && line.quantity > batch.available;
  });
  const hasSuspended = form.lines.some((line) => batchOf(line)?.status === "SUSPENDED");

  // سبب تعطيل «اعتماد الصرف»: يُعرض تحت الزر (الزر المعطّل بلا سبب ظاهر ممنوع).
  const disabledReason =
    form.fromLocationId === null
      ? "اختر المستودع."
      : form.toLocationId === null
        ? "اختر المستلم."
        : !complete
          ? "أكمل الأسطر: الصنف والدفعة والكمية."
          : hasMismatch
            ? "في الأسطر أصناف لا تناسب المستلم. غيّرها أو غيّر المستلم."
            : hasSuspended
              ? "في الأسطر دفعة موقوفة. اختر دفعة أخرى."
              : hasOverflow
                ? "في الأسطر كمية أكبر من المتاح. خفّضها."
                : null;

  const recipientLocked = sampleRequest !== null;

  return (
    <>
      {header}

      <div className="flex flex-col gap-4">
        {sampleRequest ? (
          <Banner kind="info" title={`معبّأ من طلب عينات ${isolate(`#${sampleRequest.id}`)}`}>
            <div className="flex flex-col gap-1">
              <p>{`للمندوب ${sampleRequest.rep?.name ?? ""}${sampleRequest.reason ? ` · السبب: ${sampleRequest.reason}` : ""}. يجوز صرف أقل من المطلوب.`}</p>
              <ul className="flex flex-col text-label text-fg-muted">
                {(sampleRequest.lines ?? []).map((line, index) => (
                  <li key={`${line.item?.id}-${index}`}>{`${line.item?.name}: المطلوب ${isolate(formatQuantity(line.requested_quantity ?? 0))}`}</li>
                ))}
              </ul>
            </div>
          </Banner>
        ) : null}

        {submitError ? (
          <Banner kind="danger" title="تعذّر اعتماد الصرف">
            {errorMessage(submitError)}
          </Banner>
        ) : null}

        <Card title="التفاصيل">
          <Grid cols={{ base: 1, tablet: 2 }} gap={4}>
            <Field label="من" required error={errors.from_location_id}>
              <Select aria-label="من" placeholder="اختر المستودع" options={sourceOptions} value={form.fromLocationId} onValueChange={(fromLocationId) => set({ fromLocationId })} />
            </Field>
            <Field label="إلى" required error={errors.to_location_id}>
              <div className="flex flex-col gap-2">
                <SegmentedControl
                  aria-label="نوع المستلم"
                  options={[
                    { value: "AGENT", label: "وكيل" },
                    { value: "REP", label: "مندوب" },
                  ]}
                  value={form.recipientKind}
                  onValueChange={(recipientKind) => set({ recipientKind, toLocationId: null })}
                  disabled={recipientLocked}
                  fullWidth
                />
                <Combobox
                  aria-label="المستلم"
                  placeholder={form.recipientKind === "AGENT" ? "اختر الوكيل" : "اختر المندوب"}
                  options={recipientOptions}
                  value={form.toLocationId}
                  onValueChange={(toLocationId) => set({ toLocationId })}
                  locked={recipientLocked}
                />
              </div>
            </Field>
          </Grid>
          <Field label="ملاحظة" optional hint={`حتى ${isolate(NOTE_MAX)} حرفاً.`} error={errors.note}>
            <Textarea aria-label="ملاحظة" maxLength={NOTE_MAX} value={form.note} onChange={(event) => set({ note: event.target.value })} />
          </Field>
        </Card>

        <Card title="الأصناف">
          <LineItemsEditor lines={form.lines} onChange={(lines) => set({ lines })} items={editorItems} batches={batches} errors={lineErrors} today={today} readOnly={submitting} />
          {errors.lines ? (
            <p role="alert" className="text-label text-danger">
              {errors.lines}
            </p>
          ) : null}
        </Card>

        <div className="flex flex-col gap-2">
          <CaptureRow className="flex-wrap items-center gap-3">
            <Button variant="primary" size="lg" loading={submitting} disabled={disabledReason !== null} onClick={onSubmit}>
              اعتماد الصرف
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

function SavedSummary({ transfer, today, onNewTransfer, onOpenTransfers }: { transfer: Transfer; today: IsoDate; onNewTransfer?: () => void; onOpenTransfers?: () => void }) {
  const lines = transfer.lines ?? [];

  return (
    <div className="flex flex-col gap-4">
      <Banner kind="success" title="تم اعتماد الصرف">
        <div className="flex flex-col gap-1">
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span dir="ltr" className="tabular-nums">
              {transfer.reference}
            </span>
            {transfer.status ? <StatusBadge entity="transfer" status={transfer.status} /> : null}
          </span>
          <p>{`نقص رصيد ${transfer.from_location?.name ?? "المستودع"}. لا يزيد رصيد ${transfer.to_location?.name ?? "المستلم"} حتى يؤكد الاستلام.`}</p>
        </div>
      </Banner>

      <Card title="ما صُرف">
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
          {lines.map((line, index) => (
            <StockLine key={`${line.batch?.id}-${index}`} item={line.item ?? {}} batch={line.batch} quantity={line.quantity ?? 0} today={today} />
          ))}
        </div>
        <p className="text-body text-fg-muted">{`المجموع: ${formatQuantity(transfer.total_quantity ?? 0, "علبة")} · إلى ${transfer.to_location?.name ?? ""}`}</p>
        {transfer.note ? <p className="text-body text-fg-muted">{`ملاحظة: ${transfer.note}`}</p> : null}
      </Card>

      <CaptureRow className="flex-wrap items-center gap-3">
        <Button variant="primary" size="lg" onClick={onNewTransfer}>
          صرف آخر
        </Button>
        <Button variant="secondary" size="lg" onClick={onOpenTransfers}>
          الصرفيات
        </Button>
      </CaptureRow>
    </div>
  );
}

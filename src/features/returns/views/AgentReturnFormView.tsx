"use client";

import { DescriptionList } from "@/components/data/DescriptionList";
import { LineItemsEditor, type EditorBatch, type EditorItem, type EditorLine } from "@/components/data/LineItemsEditor";
import { StatusBadge } from "@/components/data/StatusBadge";
import { StockLine } from "@/components/data/StockLine";
import { PageHeader } from "@/components/layout/PageHeader";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { Field } from "@/components/ui/Field";
import type { Option } from "@/components/ui/OptionList";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { errorMessage } from "@/lib/api/error-messages";
import type { AgentRef, AgentReturn, ListEntry } from "@/lib/api/types";
import type { IsoDate } from "@/lib/calendar";
import { CaptureRow } from "@/lib/design/CaptureMode";
import { formatQuantity, isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

/** حالة النموذج كما تُرسل إلى `POST /agent-returns` (أسماء مختصرة للـ view، والحاوية تحوّلها لأسماء العقد: `reason_id` و`note` و`lines`). */
export type AgentReturnForm = {
  /** `reason_id` من قائمة أسباب الإرجاع. */
  reasonId: string | null;
  note: string;
  lines: EditorLine[];
};

const emptyLines = (): EditorLine[] => [{ id: "line-1", itemId: null, batchId: null, quantity: null }];

// معرّف السطر الأول ثابت فلا يختلف بين الخادم والمتصفح.
export const emptyAgentReturnForm = (): AgentReturnForm => ({ reasonId: null, note: "", lines: emptyLines() });

export type AgentReturnOptions = {
  /** منتجات رصيد الوكيل (المنتجات وحدها). */
  items: readonly EditorItem[];
  /** أسباب إرجاع الوكيل من `GET /lists`. */
  reasons: readonly ListEntry[];
};

type AgentReturnFormViewProps = {
  options: Loadable<AgentReturnOptions>;
  /** دفعات كل منتج بمفتاح `String(itemId)` ومتاحها في رصيد الوكيل (`GET /stock/balances?location_id=<موقع الوكيل>&group_by=batch`). */
  batches: Readonly<Record<string, Loadable<readonly EditorBatch[]>>>;
  form: AgentReturnForm;
  onFormChange: (form: AgentReturnForm) => void;
  /** الوكيل الذي يُنشأ الإرجاع عنه (لمدير المبيعات: `agent_id`). null = الوكيل يرفع طلبه بنفسه (A15). */
  onBehalfOf: AgentRef | null;
  /** `errors` من `validation_failed` كما هي: `{ reason_id: "نص", "lines.0.quantity": "نص" }`. */
  errors?: Readonly<Record<string, string>>;
  /** رمز خطأ 422 بلا حقل (insufficient_stock…). */
  submitError?: string;
  submitting?: boolean;
  /** بعد الإنشاء: ملخص الطلب بدل النموذج. */
  saved?: AgentReturn | null;
  today: IsoDate;
  onSubmit?: () => void;
  onCancel?: () => void;
  onOpenAgent?: () => void;
  onRetry?: () => void;
};

const NOTE_MAX = 500;

/**
 * طلب إرجاع للمستودع (النموذج المشترك لـ A15 وM03): السبب، وأسطر بمنتجاتها ودفعاتها من رصيد الوكيل (الموقوفة مسموحة: تُرجع ولا تُوزَّع)، وملاحظة.
 * مدير المبيعات ينشئه عن وكيل معطَّل (`onBehalfOf`): يُعلَّم الطلب «أُنشئ عن الوكيل»، ويبقى بانتظار القرار في «قرارات المرتجع والتالف».
 */
export function AgentReturnFormView({ options, batches, form, onFormChange, onBehalfOf, errors = {}, submitError, submitting = false, saved = null, today, onSubmit, onCancel, onOpenAgent, onRetry }: AgentReturnFormViewProps) {
  const header = (
    <PageHeader
      title="طلب إرجاع للمستودع"
      description={onBehalfOf ? `إنشاء الإرجاع عن ${onBehalfOf.name}، وحسابه معطّل.` : "أرجع بضاعة من رصيدك إلى المستودع. يقرّر مدير المبيعات اعتماده."}
    />
  );

  if (saved) {
    return (
      <>
        {header}
        <SavedSummary item={saved} today={today} onOpenAgent={onOpenAgent} />
      </>
    );
  }

  if (options.status === "loading") {
    return (
      <>
        {header}
        <div className="flex flex-col gap-4" aria-busy="true">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
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

  const { items, reasons } = options.data;
  const reasonOptions: Option[] = [...reasons]
    .filter((reason) => reason.is_active !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .flatMap((reason) => (reason.id !== undefined && reason.name ? [{ value: String(reason.id), label: reason.name }] : []));

  const set = (patch: Partial<AgentReturnForm>) => onFormChange({ ...form, ...patch });

  const batchOf = (line: EditorLine) => {
    const loadable = line.itemId === null ? undefined : batches[String(line.itemId)];
    return loadable?.status === "ready" ? loadable.data.find((batch) => batch.id === line.batchId) : undefined;
  };
  const complete = form.lines.length > 0 && form.lines.every((line) => line.itemId !== null && line.batchId !== null && line.quantity !== null && line.quantity >= 1);
  const hasOverflow = form.lines.some((line) => {
    const batch = batchOf(line);
    return batch !== undefined && line.quantity !== null && line.quantity > batch.available;
  });
  const hasSuspended = form.lines.some((line) => batchOf(line)?.status === "SUSPENDED");

  // سبب تعطيل «إنشاء الإرجاع»: يُعرض تحت الزر (الزر المعطّل بلا سبب ظاهر ممنوع).
  const disabledReason =
    form.reasonId === null ? "اختر سبب الإرجاع." : !complete ? "أكمل الأسطر: المنتج والدفعة والكمية." : hasOverflow ? "في الأسطر كمية أكبر من رصيد الوكيل. خفّضها." : null;

  return (
    <>
      {header}

      <div className="flex flex-col gap-4">
        {onBehalfOf ? (
          <Banner kind="info" title="إنشاء بالنيابة عن الوكيل">
            الوكيل معطّل فلا يرفع طلباً بنفسه. يُسجَّل الطلب باسمك ويُعلَّم «أُنشئ عن الوكيل».
          </Banner>
        ) : null}

        {submitError ? (
          <Banner kind="danger" title="تعذّر إنشاء الإرجاع">
            {errorMessage(submitError)}
          </Banner>
        ) : null}

        <Card title="التفاصيل">
          <Field label="السبب" required error={errors.reason_id}>
            <Select aria-label="السبب" placeholder="اختر سبب الإرجاع" options={reasonOptions} value={form.reasonId} onValueChange={(reasonId) => set({ reasonId })} />
          </Field>
          <Field label="ملاحظة" optional hint={`حتى ${isolate(NOTE_MAX)} حرفاً.`} error={errors.note}>
            <Textarea aria-label="ملاحظة" maxLength={NOTE_MAX} value={form.note} onChange={(event) => set({ note: event.target.value })} />
          </Field>
        </Card>

        <Card title="المنتجات المُرجَعة">
          {hasSuspended ? <Banner kind="info">في الأسطر دفعة موقوفة. تُرجع إلى المستودع ولا تُوزَّع.</Banner> : null}
          <LineItemsEditor lines={form.lines} onChange={(lines) => set({ lines })} items={items} batches={batches} errors={errors} allowSuspended today={today} readOnly={submitting} />
          {errors.lines ? (
            <p role="alert" className="text-label text-danger">
              {errors.lines}
            </p>
          ) : null}
        </Card>

        <div className="flex flex-col gap-2">
          <CaptureRow className="flex-wrap items-center gap-3">
            <Button variant="primary" size="lg" loading={submitting} disabled={disabledReason !== null} onClick={onSubmit}>
              إنشاء الإرجاع
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

function SavedSummary({ item, today, onOpenAgent }: { item: AgentReturn; today: IsoDate; onOpenAgent?: () => void }) {
  const lines = item.lines ?? [];
  const total = lines.reduce((sum, line) => sum + (line.quantity ?? 0), 0);

  return (
    <div className="flex flex-col gap-4">
      <Banner kind="success" title="أُنشئ طلب الإرجاع">
        <div className="flex flex-col gap-1">
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span dir="ltr" className="tabular-nums">
              {`#${item.id}`}
            </span>
            {item.status ? <StatusBadge entity="agentReturn" status={item.status} /> : null}
          </span>
          <p>يبقى الطلب بانتظار القرار في «قرارات المرتجع والتالف»: يُعتمد فيصير بالطريق إلى المستودع، أو يُرفض بسبب.</p>
        </div>
      </Banner>

      <Card title="ما أُنشئ">
        <DescriptionList
          items={[
            { label: "الوكيل", value: item.agent?.name },
            { label: "السبب", value: item.reason?.name },
            { label: "المنشئ", value: item.created_on_behalf_of_agent ? `${item.created_by?.name ?? ""} (عن الوكيل)` : item.created_by?.name },
            { label: "ملاحظة", value: item.note },
          ]}
        />
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
          {lines.map((line, index) => (
            <StockLine key={`${line.batch?.id}-${index}`} item={line.item ?? {}} batch={line.batch} quantity={line.quantity ?? 0} today={today} />
          ))}
        </div>
        <p className="text-body text-fg-muted">{`المجموع: ${formatQuantity(total, "علبة")}`}</p>
      </Card>

      <CaptureRow className="flex-wrap items-center gap-3">
        <Button variant="primary" size="lg" onClick={onOpenAgent}>
          صفحة الوكيل
        </Button>
      </CaptureRow>
    </div>
  );
}

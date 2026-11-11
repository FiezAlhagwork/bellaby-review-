"use client";

import { Plus, Trash } from "@phosphor-icons/react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { IconButton } from "@/components/ui/IconButton";
import { NumberInput } from "@/components/ui/NumberInput";
import type { Option, OptionsState } from "@/components/ui/OptionList";
import { cn } from "@/lib/cn";
import { damascusToday, dayLabel, type IsoDate } from "@/lib/calendar";
import { CaptureRow } from "@/lib/design/CaptureMode";
import { formatQuantity, isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";
import type { ItemType } from "@/lib/api/types";
import { StockLine } from "./StockLine";

// محرّر أسطر الصرف والتسليم والإرجاع والتالف والجرد وطلبات العينات (DESIGN.md 10.11).
// controlled بالكامل: الأسطر وأخطاؤها props، والتغيير `onChange`. لا يجلب دفعات ولا يتصل بشيء.

/** سطر محرَّر. `id` مفتاح العرض فقط (لا يُرسل). `null` = لم يُختر بعد. */
export type EditorLine = { id: string; itemId: number | null; batchId: number | null; quantity: number | null };
export type EditorItem = { id: number; name: string; type: ItemType };
/** دفعة صنف مع المتاح منها لهذا الموقع. */
export type EditorBatch = { id: number; batch_no: string; expiry_date: IsoDate; status: "ACTIVE" | "SUSPENDED"; available: number };

type LineItemsEditorProps = {
  lines: readonly EditorLine[];
  onChange: (lines: EditorLine[]) => void;
  items: readonly EditorItem[];
  /** دفعات كل صنف بمفتاح `String(itemId)`. غائب أو loading = تحميل، error = خطأ في قائمة الدفعات. */
  batches: Readonly<Record<string, Loadable<readonly EditorBatch[]>>>;
  /** أخطاء الخادم `errors` كما هي: `{ "lines.0.quantity": "الكمية أكبر من الرصيد المتاح" }`. تظهر تحت السطر نفسه. */
  errors?: Readonly<Record<string, string>>;
  /** حقل الكمية في العقد: `quantity` (الافتراضي) أو `actual_quantity` في الجرد. */
  quantityField?: string;
  /** الدفعات الموقوفة قابلة للاختيار (القرار 2: الإرجاع والتالف والجرد). الافتراضي معطّلة بسببها. */
  allowSuspended?: boolean;
  /** بعد الإرسال: عرض عادي بلا حقول. */
  readOnly?: boolean;
  unit?: string;
  /** أصغر كمية: 1 (الافتراضي) أو 0 في الجرد. */
  minQuantity?: number;
  today?: IsoDate;
};

const COLUMN = { item: "min-w-0 flex-1", batch: "min-w-0 flex-1", available: "w-24 shrink-0", quantity: "w-40 shrink-0", remove: "w-10 shrink-0" };

/** الدفعات مرتبة بالأقرب انتهاءً (FEFO). المقترحة: أول دفعة شغّالة غير منتهية. */
function sortedBatches(list: readonly EditorBatch[]) {
  return [...list].sort((a, b) => (a.expiry_date < b.expiry_date ? -1 : a.expiry_date > b.expiry_date ? 1 : 0));
}

function suggestedBatch(list: readonly EditorBatch[], today: IsoDate): EditorBatch | undefined {
  return sortedBatches(list).find((batch) => batch.status === "ACTIVE" && batch.expiry_date >= today);
}

export function LineItemsEditor({
  lines,
  onChange,
  items,
  batches,
  errors = {},
  quantityField = "quantity",
  allowSuspended = false,
  readOnly = false,
  unit = "علبة",
  minQuantity = 1,
  today: todayProp,
}: LineItemsEditorProps) {
  const [clock] = useState(damascusToday);
  const today = todayProp ?? clock;

  const itemOptions: Option[] = items.map((item) => ({ value: String(item.id), label: item.name }));
  const batchesOf = (itemId: number | null): Loadable<readonly EditorBatch[]> | undefined => (itemId === null ? undefined : batches[String(itemId)]);
  const readyBatches = (itemId: number | null) => {
    const loadable = batchesOf(itemId);
    return loadable?.status === "ready" ? loadable.data : [];
  };
  const selectedBatch = (line: EditorLine) => readyBatches(line.itemId).find((batch) => batch.id === line.batchId);

  const batchOptions = (itemId: number | null): { options: Option[]; state?: OptionsState } => {
    const loadable = batchesOf(itemId);
    if (itemId === null) return { options: [] };
    if (!loadable || loadable.status === "loading") return { options: [], state: { status: "loading" } };
    if (loadable.status === "error") return { options: [], state: { status: "error", code: loadable.code } };
    const suggested = suggestedBatch(loadable.data, today);
    return {
      options: sortedBatches(loadable.data).map((batch): Option => {
        const label = `${batch.batch_no} · ${dayLabel(batch.expiry_date)}${batch.id === suggested?.id ? " · مقترحة" : ""}`;
        // الموقوفة والمنتهية معطّلة بسببها (batch_suspended وbatch_expired في العقد)، إلا في حركات القرار 2.
        if (!allowSuspended && batch.status === "SUSPENDED") return { value: String(batch.id), label, disabled: true, reason: "موقوفة" };
        if (!allowSuspended && batch.expiry_date < today) return { value: String(batch.id), label, disabled: true, reason: "منتهية" };
        return { value: String(batch.id), label };
      }),
    };
  };

  const update = (index: number, patch: Partial<EditorLine>) => onChange(lines.map((line, i) => (i === index ? { ...line, ...patch } : line)));

  const changeItem = (index: number, value: string | null) => {
    const itemId = value === null ? null : Number(value);
    const loadable = batchesOf(itemId);
    // الدفعة المقترحة (الأقرب انتهاءً) تُختار تلقائياً، والاختيار حر بعدها.
    const suggested = loadable?.status === "ready" ? suggestedBatch(loadable.data, today) : undefined;
    update(index, { itemId, batchId: suggested?.id ?? null, quantity: null });
  };

  const addLine = () => onChange([...lines, { id: crypto.randomUUID(), itemId: null, batchId: null, quantity: null }]);
  const removeLine = (index: number) => onChange(lines.filter((_, i) => i !== index));

  const fieldError = (index: number, field: string) => errors[`lines.${index}.${field}`];
  const rowMessages = (index: number, line: EditorLine): string[] => {
    const batch = selectedBatch(line);
    const overflow = batch && line.quantity !== null && line.quantity > batch.available ? [`أكبر من المتاح (${isolate(formatQuantity(batch.available))})`] : [];
    const server = ["item_id", "batch_id", quantityField].map((field) => fieldError(index, field)).filter((message): message is string => Boolean(message));
    return server.length > 0 ? server : overflow;
  };

  const distinctItems = new Set(lines.map((line) => line.itemId).filter((id): id is number => id !== null)).size;
  const totalQuantity = lines.reduce((sum, line) => sum + (line.quantity ?? 0), 0);
  const total = (
    <p className="text-body text-fg-muted">{`المجموع: ${isolate(distinctItems)} أصناف · ${formatQuantity(totalQuantity, unit)}`}</p>
  );

  if (readOnly) {
    return (
      <div className="flex flex-col gap-3">
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
          {lines.map((line) => {
            const item = items.find((candidate) => candidate.id === line.itemId);
            const batch = selectedBatch(line);
            if (!item) return null;
            return (
              <StockLine
                key={line.id}
                item={{ id: item.id, name: item.name, type: item.type }}
                batch={batch ? { id: batch.id, batch_no: batch.batch_no, expiry_date: batch.expiry_date, status: batch.status } : null}
                quantity={line.quantity ?? 0}
                unit={unit}
                today={today}
              />
            );
          })}
        </div>
        {total}
      </div>
    );
  }

  const controls = (line: EditorLine, index: number) => {
    const batch = selectedBatch(line);
    const { options, state } = batchOptions(line.itemId);
    const suggested = line.itemId === null ? undefined : (() => {
      const loadable = batchesOf(line.itemId);
      return loadable?.status === "ready" ? suggestedBatch(loadable.data, today) : undefined;
    })();
    const messages = rowMessages(index, line);
    const itemInvalid = Boolean(fieldError(index, "item_id"));
    const batchInvalid = Boolean(fieldError(index, "batch_id"));
    const quantityInvalid = Boolean(fieldError(index, quantityField)) || (batch !== undefined && line.quantity !== null && line.quantity > batch.available);

    return {
      messages,
      item: (
        <Combobox
          aria-label="الصنف"
          placeholder="ابحث عن صنف"
          options={itemOptions}
          value={line.itemId === null ? null : String(line.itemId)}
          onValueChange={(value) => changeItem(index, value)}
          invalid={itemInvalid}
        />
      ),
      batch: (
        <div className="flex flex-col gap-1">
          <Combobox
            aria-label="الدفعة"
            placeholder={line.itemId === null ? "اختر الصنف أولاً" : "اختر الدفعة"}
            options={options}
            optionsState={state}
            value={line.batchId === null ? null : String(line.batchId)}
            onValueChange={(value) => update(index, { batchId: value === null ? null : Number(value) })}
            disabled={line.itemId === null}
            invalid={batchInvalid}
          />
          {suggested && line.batchId === suggested.id ? <p className="text-caption text-fg-muted">مقترحة: الأقرب انتهاءً</p> : null}
        </div>
      ),
      available: batch ? <span dir="ltr" className="tabular-nums">{formatQuantity(batch.available)}</span> : <span className="text-fg-muted">—</span>,
      quantity: (
        <NumberInput
          aria-label="الكمية"
          min={minQuantity}
          value={line.quantity}
          onValueChange={(value) => update(index, { quantity: value })}
          invalid={quantityInvalid}
          disabled={line.batchId === null}
        />
      ),
      remove: <IconButton variant="danger-ghost" icon={Trash} aria-label="حذف السطر" onClick={() => removeLine(index)} />,
    };
  };

  const message = (messages: string[]): ReactNode =>
    messages.length > 0 ? (
      <p role="alert" className="text-label text-danger">
        {messages.join(" ")}
      </p>
    ) : null;

  return (
    <div className="flex flex-col gap-4">
      {/* تابلت وما فوق */}
      <div className="hidden flex-col gap-3 @tablet:flex">
        {lines.length > 0 ? (
          <CaptureRow className="items-center gap-3 px-1 text-label font-medium text-fg-muted">
            <span className={cn(COLUMN.item, "text-start")}>الصنف</span>
            <span className={cn(COLUMN.batch, "text-start")}>الدفعة</span>
            <span className={cn(COLUMN.available, "text-end")}>المتاح</span>
            <span className={cn(COLUMN.quantity, "text-start")}>الكمية</span>
            <span className={COLUMN.remove} />
          </CaptureRow>
        ) : null}
        {lines.map((line, index) => {
          const c = controls(line, index);
          return (
            <div key={line.id} className="flex flex-col gap-1">
              <CaptureRow className="items-start gap-3">
                <div className={COLUMN.item}>{c.item}</div>
                <div className={COLUMN.batch}>{c.batch}</div>
                <div className={cn(COLUMN.available, "flex h-10 items-center justify-end text-body text-fg")}>{c.available}</div>
                <div className={COLUMN.quantity}>{c.quantity}</div>
                <div className={cn(COLUMN.remove, "flex h-10 items-center justify-center")}>{c.remove}</div>
              </CaptureRow>
              {message(c.messages)}
            </div>
          );
        })}
      </div>

      {/* موبايل: كل سطر بطاقة، والحقول تحت بعضها */}
      <div className="flex flex-col gap-3 @tablet:hidden">
        {lines.map((line, index) => {
          const c = controls(line, index);
          return (
            <div key={line.id} className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
              <CaptureRow className="items-center gap-2">
                <span className="min-w-0 flex-1 text-label font-medium text-fg-muted">{`السطر ${isolate(index + 1)}`}</span>
                {c.remove}
              </CaptureRow>
              {c.item}
              {c.batch}
              <CaptureRow className="items-center gap-3">
                <span className="text-label text-fg-muted">المتاح</span>
                <span className="flex-1 text-start text-body text-fg">{c.available}</span>
              </CaptureRow>
              {c.quantity}
              {message(c.messages)}
            </div>
          );
        })}
      </div>

      {lines.length === 0 ? <p className="rounded-lg border border-dashed border-border-strong px-4 py-6 text-center text-body text-fg-muted">لا أسطر بعد. أضف أول سطر.</p> : null}

      <CaptureRow className="items-center gap-4">
        <Button variant="ghost" icon={Plus} onClick={addLine}>
          إضافة سطر
        </Button>
        <div className="min-w-0 flex-1 text-end">{total}</div>
      </CaptureRow>
    </div>
  );
}

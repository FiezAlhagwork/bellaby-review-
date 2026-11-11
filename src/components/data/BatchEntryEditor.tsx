"use client";

import { Plus, Trash } from "@phosphor-icons/react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { DatePicker } from "@/components/ui/DatePicker";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { NumberInput } from "@/components/ui/NumberInput";
import type { Option } from "@/components/ui/OptionList";
import { cn } from "@/lib/cn";
import { damascusToday, type IsoDate } from "@/lib/calendar";
import { CaptureRow } from "@/lib/design/CaptureMode";
import { formatQuantity, isolate } from "@/lib/format";

// محرّر أسطر إدخال البضاعة (W04): كل سطر صنف + رقم دفعة يكتبه المستخدم + تاريخ انتهاء + كمية.
// يختلف عن LineItemsEditor الذي يختار من دفعات موجودة. controlled بالكامل: الأسطر وأخطاؤها وملاحظاتها props.
// الملاحظات (منتهٍ، قريب الانتهاء، دفعة موجودة، تعارض تاريخ) يحسبها الأب ويمرّرها فلا يعرف المحرّر قاعدة العمل.

/** سطر محرَّر. `id` مفتاح العرض فقط (لا يُرسل). `null` أو نص فارغ = لم يُملأ بعد. */
export type BatchEntryLine = { id: string; itemId: string | null; batchNo: string; expiryDate: IsoDate | null; quantity: number | null };

/** ملاحظة تحت السطر: خطر يمنع الإدخال، أو تحذير يحتاج تأكيداً، أو معلومة. */
export type BatchEntryNotice = { kind: "danger" | "warning" | "info"; text: string };

type BatchEntryEditorProps = {
  lines: readonly BatchEntryLine[];
  onChange: (lines: BatchEntryLine[]) => void;
  /** خيارات الصنف. */
  itemOptions: readonly Option[];
  /** أخطاء الخادم `errors` كما هي: `{ "lines.0.batch_no": "نص عربي" }`. تظهر تحت السطر نفسه. */
  errors?: Readonly<Record<string, string>>;
  /** ملاحظات محسوبة لكل سطر بمفتاح `line.id`. */
  notices?: Readonly<Record<string, BatchEntryNotice>>;
  /** أطول رقم دفعة في العقد: 50. */
  batchNoMaxLength?: number;
  unit?: string;
  disabled?: boolean;
  today?: IsoDate;
};

const COLUMN = { item: "min-w-0 flex-1", batchNo: "w-40 shrink-0", expiry: "w-56 shrink-0", quantity: "w-36 shrink-0", remove: "w-10 shrink-0" };

const noticeClass: Record<BatchEntryNotice["kind"], string> = { danger: "text-danger", warning: "text-warning", info: "text-fg-muted" };

export function newBatchEntryLine(): BatchEntryLine {
  return { id: crypto.randomUUID(), itemId: null, batchNo: "", expiryDate: null, quantity: null };
}

export function BatchEntryEditor({
  lines,
  onChange,
  itemOptions,
  errors = {},
  notices = {},
  batchNoMaxLength = 50,
  unit = "علبة",
  disabled = false,
  today: todayProp,
}: BatchEntryEditorProps) {
  const [clock] = useState(damascusToday);
  const today = todayProp ?? clock;

  const update = (index: number, patch: Partial<BatchEntryLine>) => onChange(lines.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  const addLine = () => onChange([...lines, newBatchEntryLine()]);
  const removeLine = (index: number) => onChange(lines.filter((_, i) => i !== index));

  const fieldError = (index: number, field: string) => errors[`lines.${index}.${field}`];
  const totalQuantity = lines.reduce((sum, line) => sum + (line.quantity ?? 0), 0);

  const controls = (line: BatchEntryLine, index: number) => {
    const notice = notices[line.id];
    const serverMessages = ["item_id", "batch_no", "expiry_date", "quantity"].map((field) => fieldError(index, field)).filter((message): message is string => Boolean(message));
    return {
      messages: (
        <>
          {serverMessages.map((message) => (
            <p key={message} role="alert" className="text-label text-danger">
              {message}
            </p>
          ))}
          {notice ? (
            <p role={notice.kind === "info" ? "status" : "alert"} className={cn("text-label", noticeClass[notice.kind])}>
              {notice.text}
            </p>
          ) : null}
        </>
      ),
      item: (
        <Combobox
          aria-label="الصنف"
          placeholder="ابحث عن صنف"
          options={itemOptions}
          value={line.itemId}
          onValueChange={(itemId) => update(index, { itemId })}
          invalid={Boolean(fieldError(index, "item_id"))}
          disabled={disabled}
        />
      ),
      batchNo: (
        <Input
          aria-label="رقم الدفعة"
          placeholder="LOT-0000-A"
          dir="ltr"
          maxLength={batchNoMaxLength}
          value={line.batchNo}
          onChange={(event) => update(index, { batchNo: event.target.value })}
          invalid={Boolean(fieldError(index, "batch_no")) || notice?.kind === "danger"}
          disabled={disabled}
        />
      ),
      expiry: (
        <DatePicker
          aria-label="تاريخ الانتهاء"
          placeholder="تاريخ الانتهاء"
          value={line.expiryDate}
          onValueChange={(expiryDate) => update(index, { expiryDate })}
          today={today}
          invalid={Boolean(fieldError(index, "expiry_date")) || notice?.kind === "danger"}
          disabled={disabled}
        />
      ),
      quantity: (
        <NumberInput
          aria-label="الكمية"
          min={1}
          value={line.quantity}
          onValueChange={(quantity) => update(index, { quantity })}
          invalid={Boolean(fieldError(index, "quantity"))}
          disabled={disabled}
        />
      ),
      remove: <IconButton variant="danger-ghost" icon={Trash} aria-label="حذف السطر" onClick={() => removeLine(index)} disabled={disabled || lines.length === 1} />,
    };
  };

  // اسم ظاهر فوق الحقل في البطاقة (في صف المكتب الاسم في رأس الأعمدة).
  const labeled = (label: string, field: ReactNode) => (
    <div className="flex flex-col gap-1">
      <span className="text-label font-medium text-fg-muted">{label}</span>
      {field}
    </div>
  );

  const message = (content: ReactNode) => <div className="flex flex-col gap-1">{content}</div>;

  return (
    <div className="flex flex-col gap-4">
      {/* مكتب (من 1280): صف واحد بأعمدة */}
      <div className="hidden flex-col gap-3 @desktop:flex">
        {lines.length > 0 ? (
          <CaptureRow className="items-center gap-3 px-1 text-label font-medium text-fg-muted">
            <span className={cn(COLUMN.item, "text-start")}>الصنف</span>
            <span className={cn(COLUMN.batchNo, "text-start")}>رقم الدفعة</span>
            <span className={cn(COLUMN.expiry, "text-start")}>تاريخ الانتهاء</span>
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
                <div className={COLUMN.batchNo}>{c.batchNo}</div>
                <div className={COLUMN.expiry}>{c.expiry}</div>
                <div className={COLUMN.quantity}>{c.quantity}</div>
                <div className={cn(COLUMN.remove, "flex h-10 items-center justify-center")}>{c.remove}</div>
              </CaptureRow>
              {message(c.messages)}
            </div>
          );
        })}
      </div>

      {/* تابلت وموبايل: كل سطر بطاقة. الصنف بعرض كامل، وتحته الدفعة والتاريخ والكمية: تحت بعضها على الموبايل وفي صف على التابلت */}
      <div className="flex flex-col gap-3 @desktop:hidden">
        {lines.map((line, index) => {
          const c = controls(line, index);
          return (
            <div key={line.id} className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
              <CaptureRow className="items-center gap-2">
                <span className="min-w-0 flex-1 text-label font-medium text-fg-muted">{`السطر ${isolate(index + 1)}`}</span>
                {c.remove}
              </CaptureRow>
              {labeled("الصنف", c.item)}
              <div className="flex flex-col gap-3 @tablet:hidden">
                {labeled("رقم الدفعة", c.batchNo)}
                {labeled("تاريخ الانتهاء", c.expiry)}
                {labeled("الكمية", c.quantity)}
              </div>
              <CaptureRow className="hidden items-start gap-3 @tablet:flex">
                <div className="min-w-0 flex-1">{labeled("رقم الدفعة", c.batchNo)}</div>
                <div className="min-w-52 flex-1">{labeled("تاريخ الانتهاء", c.expiry)}</div>
                <div className="min-w-0 flex-1">{labeled("الكمية", c.quantity)}</div>
              </CaptureRow>
              {message(c.messages)}
            </div>
          );
        })}
      </div>

      <CaptureRow className="items-center gap-4">
        <Button variant="ghost" icon={Plus} onClick={addLine} disabled={disabled}>
          إضافة سطر
        </Button>
        <p className="min-w-0 flex-1 text-end text-body text-fg-muted">{`المجموع: ${formatQuantity(totalQuantity, unit)}`}</p>
      </CaptureRow>
    </div>
  );
}

"use client";

import { WarningCircle } from "@phosphor-icons/react";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/cn";
import { CaptureRow } from "@/lib/design/CaptureMode";
import { formatQuantity } from "@/lib/format";
import type { BatchRef, ItemRef } from "@/lib/api/types";
import { BatchChip } from "./BatchChip";
import { itemTypeLabels } from "./item-types";
import type { IsoDate } from "@/lib/calendar";

type StockLineProps = {
  item: ItemRef;
  /** بلا دفعة (رصيد صنف مجمّع). */
  batch?: BatchRef | null;
  /** الكمية. السالبة (رصيد مندوب بعد تعارض مزامنة، القرار 5) بلون danger مع أيقونة وtooltip. */
  quantity: number;
  /** الموقع إن لزم: «مستودع دمشق الرئيسي». */
  location?: string;
  /**
   * يحجز عمود الموقع حتى في الصف الذي بلا موقع. مرّره لكل صفوف القائمة نفسها إن كان بعضها فيه موقع،
   * وإلا انزاحت الكمية يساراً في الصفوف التي بلا موقع وتبعثرت الأعمدة.
   */
  locationColumn?: boolean;
  unit?: string;
  today?: IsoDate;
  expiryAlertDays?: number;
  className?: string;
};

function Quantity({ quantity, unit }: { quantity: number; unit: string }) {
  const negative = quantity < 0;
  const text = (
    <span dir="ltr" className={cn("tabular-nums", negative && "text-danger")}>
      {formatQuantity(quantity, unit)}
    </span>
  );
  if (!negative) return text;
  return (
    <Tooltip label="رصيد سالب نتيجة تعارض مزامنة">
      <span tabIndex={0} className="inline-flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-focus">
        <WarningCircle size={16} aria-hidden="true" className="text-danger" />
        {text}
        <span className="sr-only">رصيد سالب نتيجة تعارض مزامنة</span>
      </span>
    </Tooltip>
  );
}

/**
 * صف الرصيد (DESIGN.md 10.11): الصنف (الاسم والنوع: منتج · عينة · مادة دعائية)، والدفعة (BatchChip)، والكمية، والموقع إن لزم.
 * على الموبايل يتكدّس: الصنف والكمية في سطر، ثم الدفعة، ثم الموقع.
 */
export function StockLine({ item, batch, quantity, location, locationColumn = false, unit = "علبة", today, expiryAlertDays, className }: StockLineProps) {
  const itemCell = (
    <div className="flex min-w-0 flex-col">
      <span className="truncate text-start text-body text-fg">{item.name}</span>
      <span className="text-start text-caption text-fg-muted">{item.type ? itemTypeLabels[item.type] : ""}</span>
    </div>
  );
  const batchCell = batch ? <BatchChip batch={batch} today={today} expiryAlertDays={expiryAlertDays} /> : null;

  return (
    <div className={cn("px-4 py-3", className)}>
      {/* تابلت وما فوق: صف */}
      <CaptureRow className="hidden items-center gap-4 @tablet:flex">
        <div className="min-w-0 flex-1">{itemCell}</div>
        <div className="min-w-0 flex-1">{batchCell}</div>
        <div className="w-36 shrink-0 text-end text-body">
          <Quantity quantity={quantity} unit={unit} />
        </div>
        {location || locationColumn ? <span className="w-44 shrink-0 truncate text-start text-label text-fg-muted">{location}</span> : null}
      </CaptureRow>

      {/* موبايل: تكدّس */}
      <div className="flex flex-col gap-2 @tablet:hidden">
        <CaptureRow className="items-start gap-3">
          <div className="min-w-0 flex-1">{itemCell}</div>
          <div className="shrink-0 text-body">
            <Quantity quantity={quantity} unit={unit} />
          </div>
        </CaptureRow>
        {batchCell}
        {location ? <span className="text-start text-label text-fg-muted">{location}</span> : null}
      </div>
    </div>
  );
}

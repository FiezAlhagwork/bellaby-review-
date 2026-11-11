"use client";

import { CaretLeft, CaretRight, LockSimple } from "@phosphor-icons/react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { CaptureRow, useCaptureClass } from "@/lib/design/CaptureMode";
import { damascusToday, monthLabel, monthName, monthOf, parseMonth, toIsoMonth, type IsoDate, type IsoMonth } from "@/lib/calendar";
import { IconButton } from "./IconButton";
import { PickerField, type PickerControlProps } from "./PickerField";

type MonthGridProps = {
  value: IsoMonth | null;
  onSelect: (month: IsoMonth) => void;
  min?: IsoMonth;
  max?: IsoMonth;
  /** أشهر مغلقة (month_closed): تُعلَّم بقفل وتبقى قابلة للاختيار للعرض. */
  closedMonths?: readonly IsoMonth[];
  /** الشهر الحالي بتوقيت دمشق، يُعلَّم بحد. */
  currentMonth: IsoMonth;
  /** السنة المعروضة أولاً. الافتراضي سنة `value` ثم السنة الحالية. */
  initialYear?: number;
  autoFocus?: boolean;
  className?: string;
};

/** شبكة الأشهر 3 × 4 مع تنقل بين السنوات (DESIGN.md 9.6). تصلح وحدها داخل أي لوحة. */
export function MonthGrid({ value, onSelect, min, max, closedMonths = [], currentMonth, initialYear, autoFocus = false, className }: MonthGridProps) {
  const [year, setYear] = useState(initialYear ?? parseMonth(value ?? currentMonth).year);
  const flip = useCaptureClass("rtl:-scale-x-100", "-scale-x-100");

  const isDisabled = (month: IsoMonth) => (min !== undefined && month < min) || (max !== undefined && month > max);
  const prevDisabled = min !== undefined && toIsoMonth(year - 1, 12) < min;
  const nextDisabled = max !== undefined && toIsoMonth(year + 1, 1) > max;

  return (
    <div className={cn("flex w-72 flex-col gap-2", className)}>
      <CaptureRow className="items-center gap-1">
        <IconButton variant="ghost" size="sm" icon={CaretLeft} aria-label="السنة السابقة" className={flip} disabled={prevDisabled} onClick={() => setYear(year - 1)} />
        <span aria-live="polite" className="min-w-0 flex-1 text-center text-body font-medium text-fg tabular-nums">
          {year}
        </span>
        <IconButton variant="ghost" size="sm" icon={CaretRight} aria-label="السنة التالية" className={flip} disabled={nextDisabled} onClick={() => setYear(year + 1)} />
      </CaptureRow>
      <div role="group" aria-label={`أشهر ${year}`} className="flex flex-col gap-1">
        {[0, 1, 2, 3].map((row) => (
          <CaptureRow key={row} className="gap-1">
            {[1, 2, 3].map((column) => {
              const number = row * 3 + column;
              const month = toIsoMonth(year, number);
              const selected = month === value;
              const disabled = isDisabled(month);
              const closed = closedMonths.includes(month);
              return (
                <button
                  key={month}
                  type="button"
                  autoFocus={autoFocus && (selected || (value === null && month === currentMonth))}
                  aria-label={`${monthLabel(month)}${closed ? "، مغلق" : ""}`}
                  aria-pressed={selected}
                  aria-disabled={disabled || undefined}
                  aria-current={month === currentMonth ? "date" : undefined}
                  onClick={() => {
                    if (!disabled) onSelect(month);
                  }}
                  className={cn(
                    "flex h-10 min-w-0 flex-1 items-center justify-center gap-1 rounded-md text-body outline-none transition-colors duration-120 ease-out",
                    "focus-visible:ring-2 focus-visible:ring-focus",
                    disabled ? "cursor-not-allowed text-fg-disabled" : selected ? "bg-primary text-on-primary" : "text-fg hover:bg-surface-sunken",
                    month === currentMonth && !selected && !disabled && "border border-border-strong",
                  )}
                >
                  <span className="truncate">{monthName(number)}</span>
                  {closed ? <LockSimple size={12} aria-hidden="true" className="shrink-0" /> : null}
                </button>
              );
            })}
          </CaptureRow>
        ))}
      </div>
    </div>
  );
}

type MonthPickerProps = PickerControlProps & {
  /** `2026-11` (Month في العقد). null = فارغ. */
  value: IsoMonth | null;
  onValueChange: (value: IsoMonth) => void;
  min?: IsoMonth;
  max?: IsoMonth;
  closedMonths?: readonly IsoMonth[];
  /** يُمرَّر في المعرض والاختبار لتثبيت اليوم. الافتراضي اليوم بتوقيت دمشق. */
  today?: IsoDate;
};

/**
 * حقل الشهر للمؤشرات والتقارير الشهرية والميزانية (DESIGN.md 9.6): الأشهر في شبكة 3 × 4، والشهر المغلق بأيقونة قفل.
 * controlled بـ `value` و`onValueChange`.
 */
export function MonthPicker({ value, onValueChange, min, max, closedMonths, today: todayProp, placeholder = "اختر الشهر", ...field }: MonthPickerProps) {
  const [open, setOpen] = useState(false);
  const [clock] = useState(damascusToday);
  const currentMonth = monthOf(todayProp ?? clock);

  return (
    <PickerField {...field} open={open} onOpenChange={setOpen} placeholder={placeholder} display={value === null ? null : monthLabel(value)}>
      <MonthGrid
        autoFocus
        value={value}
        currentMonth={currentMonth}
        min={min}
        max={max}
        closedMonths={closedMonths}
        onSelect={(month) => {
          onValueChange(month);
          setOpen(false);
        }}
      />
    </PickerField>
  );
}

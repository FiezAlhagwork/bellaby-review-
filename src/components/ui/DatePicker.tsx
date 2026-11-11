"use client";

import { useState } from "react";
import { damascusToday, dayLabel, type IsoDate } from "@/lib/calendar";
import { Calendar, type Holiday } from "./Calendar";
import { PickerField, type PickerControlProps } from "./PickerField";

type DatePickerProps = PickerControlProps & {
  /** `2026-11-09` (format: date في العقد). null = فارغ. */
  value: IsoDate | null;
  onValueChange: (value: IsoDate) => void;
  /** الأيام خارج [min, max] معطّلة: السعر لا يبدأ قبل اليوم، والإجازة لا تبدأ قبل أول الشهر الحالي. */
  min?: IsoDate;
  max?: IsoDate;
  holidays?: readonly Holiday[];
  /** يُمرَّر في المعرض والاختبار لتثبيت اليوم. الافتراضي اليوم بتوقيت دمشق. */
  today?: IsoDate;
};

/**
 * حقل التاريخ (DESIGN.md 9.6): نص التاريخ وأيقونة CalendarBlank، يفتح تقويماً في popover. controlled بـ `value` و`onValueChange`.
 * الأسبوع يبدأ بالسبت، والجمعة والعطل بـ fg-muted ونقطة، والأيام خارج min وmax معطّلة.
 */
export function DatePicker({ value, onValueChange, min, max, holidays, today: todayProp, placeholder = "اختر التاريخ", ...field }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [clock] = useState(damascusToday);
  const today = todayProp ?? clock;

  return (
    <PickerField {...field} open={open} onOpenChange={setOpen} placeholder={placeholder} display={value === null ? null : dayLabel(value)}>
      <Calendar
        autoFocus
        from={value}
        today={today}
        min={min}
        max={max}
        holidays={holidays}
        onSelect={(date) => {
          onValueChange(date);
          setOpen(false);
        }}
      />
    </PickerField>
  );
}

"use client";

import { useState } from "react";
import {
  addDays,
  addMonths,
  damascusToday,
  daysInMonth,
  monthOf,
  parseDate,
  shortDayLabel,
  startOfWeek,
  toIsoDate,
  type IsoDate,
} from "@/lib/calendar";
import { CaptureRow } from "@/lib/design/CaptureMode";
import { isolate } from "@/lib/format";
import { Button } from "./Button";
import { Calendar, type Holiday } from "./Calendar";
import { PickerField, type PickerControlProps } from "./PickerField";

/** فترة من يوم إلى يوم. بعد الضغطة الأولى تكون `to` فارغة حتى تُختار النهاية. */
export type DateRange = { from: IsoDate | null; to: IsoDate | null };

type DateRangePickerProps = PickerControlProps & {
  value: DateRange;
  onValueChange: (value: DateRange) => void;
  min?: IsoDate;
  max?: IsoDate;
  holidays?: readonly Holiday[];
  /** يُمرَّر في المعرض والاختبار لتثبيت اليوم. الافتراضي اليوم بتوقيت دمشق. */
  today?: IsoDate;
};

function endOfMonth(date: IsoDate): IsoDate {
  const { year, month } = parseDate(date);
  return toIsoDate(year, month, daysInMonth(year, month));
}

/** الاختصارات (DESIGN.md 9.6): اليوم، هذا الأسبوع، هذا الشهر، الشهر الماضي. الأسبوع من السبت إلى الجمعة. */
function shortcuts(today: IsoDate): { label: string; range: { from: IsoDate; to: IsoDate } }[] {
  const lastMonth = addMonths(`${monthOf(today)}-01`, -1);
  return [
    { label: "اليوم", range: { from: today, to: today } },
    { label: "هذا الأسبوع", range: { from: startOfWeek(today), to: addDays(startOfWeek(today), 6) } },
    { label: "هذا الشهر", range: { from: `${monthOf(today)}-01`, to: endOfMonth(today) } },
    { label: "الشهر الماضي", range: { from: lastMonth, to: endOfMonth(lastMonth) } },
  ];
}

function display({ from, to }: DateRange) {
  if (from === null) return null;
  return `من ${isolate(shortDayLabel(from))} إلى ${to === null ? "…" : isolate(shortDayLabel(to))}`;
}

type DateRangePanelProps = {
  value: DateRange;
  onValueChange: (value: DateRange) => void;
  /** يُستدعى حين تكتمل الفترة (نهاية أو اختصار): الأب يغلق القائمة. */
  onDone?: () => void;
  min?: IsoDate;
  max?: IsoDate;
  holidays?: readonly Holiday[];
  today: IsoDate;
  autoFocus?: boolean;
};

/** محتوى قائمة الفترة: الاختصارات (صفّان) وتقويم واحد. يصلح وحده داخل أي لوحة (ورقة سفلية على الموبايل). */
export function DateRangePanel({ value, onValueChange, onDone, min, max, holidays, today, autoFocus = false }: DateRangePanelProps) {
  const select = (date: IsoDate) => {
    if (value.from === null || value.to !== null || date < value.from) {
      onValueChange({ from: date, to: null });
      return;
    }
    onValueChange({ from: value.from, to: date });
    onDone?.();
  };

  const outside = (range: { from: IsoDate; to: IsoDate }) => (min !== undefined && range.from < min) || (max !== undefined && range.to > max);

  const list = shortcuts(today);
  const button = ({ label, range }: (typeof list)[number]) => (
    <Button
      key={label}
      variant="ghost"
      size="sm"
      className="flex-1"
      disabled={outside(range)}
      onClick={() => {
        onValueChange(range);
        onDone?.();
      }}
    >
      {label}
    </Button>
  );

  // الاختصارات صفّان بزرّين فوق التقويم: تتسع في popover وفي الورقة السفلية على الموبايل بلا فرع حسب المقاس.
  return (
    <div className="flex w-70 flex-col gap-2">
      <div className="flex flex-col gap-1">
        <CaptureRow className="gap-1">{list.slice(0, 2).map(button)}</CaptureRow>
        <CaptureRow className="gap-1">{list.slice(2).map(button)}</CaptureRow>
      </div>
      <div aria-hidden="true" className="h-px bg-border" />
      <Calendar mode="range" autoFocus={autoFocus} from={value.from} to={value.to} today={today} min={min} max={max} holidays={holidays} onSelect={select} className="w-full" />
    </div>
  );
}

/**
 * حقل الفترة للفلاتر والإجازات (DESIGN.md 9.6): من · إلى بتقويم واحد، مع اختصارات. controlled بـ `value` و`onValueChange`.
 * الضغطة الأولى تحدد البداية فيُستدعى `onValueChange({ from, to: null })`، والثانية النهاية فتُغلق القائمة. ضغطة قبل البداية تبدّلها.
 */
export function DateRangePicker({ value, onValueChange, min, max, holidays, today: todayProp, placeholder = "اختر الفترة", ...field }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [clock] = useState(damascusToday);

  return (
    <PickerField {...field} open={open} onOpenChange={setOpen} placeholder={placeholder} display={display(value)}>
      <DateRangePanel
        autoFocus
        value={value}
        onValueChange={onValueChange}
        onDone={() => setOpen(false)}
        min={min}
        max={max}
        holidays={holidays}
        today={todayProp ?? clock}
      />
    </PickerField>
  );
}

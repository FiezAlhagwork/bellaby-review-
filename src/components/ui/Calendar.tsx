"use client";

import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { CaptureRow, useCaptureClass } from "@/lib/design/CaptureMode";
import {
  WEEKDAY_SHORT,
  addDays,
  addMonths,
  addMonthsToMonth,
  fullDayLabel,
  isFriday,
  monthLabel,
  monthOf,
  monthWeeks,
  startOfWeek,
  type IsoDate,
} from "@/lib/calendar";
import { IconButton } from "./IconButton";

/** عطلة رسمية (Holiday في العقد): تاريخها واسمها. */
export type Holiday = { date: IsoDate; name: string };

type CalendarProps = {
  /** single: يوم واحد. range: من يوم إلى يوم (الضغطة الأولى تحدد البداية، والثانية النهاية). */
  mode?: "single" | "range";
  /** اليوم المحدّد، أو بداية الفترة. */
  from: IsoDate | null;
  /** نهاية الفترة (range فقط). */
  to?: IsoDate | null;
  onSelect: (date: IsoDate) => void;
  /** الأيام خارج [min, max] معطّلة. مثال: السعر لا يبدأ قبل اليوم. */
  min?: IsoDate;
  max?: IsoDate;
  /** عطل رسمية (من GET /holidays): تُعلَّم بلون fg-muted ونقطة. الجمعة تُعلَّم دائماً. */
  holidays?: readonly Holiday[];
  /** اليوم بتوقيت دمشق (`damascusToday()`). يُمرَّر من الخارج فلا يقرأ المكوّن الساعة أثناء العرض. */
  today: IsoDate;
  /** الشهر المعروض أولاً. الافتراضي شهر `from` ثم شهر اليوم. */
  initialMonth?: string;
  /** يأخذ التركيز عند ظهوره (داخل popover). */
  autoFocus?: boolean;
  className?: string;
};

const cellClass = "size-10 shrink-0";

/**
 * التقويم (DESIGN.md 9.6): شهر بأسبوع يبدأ بالسبت، والجمعة والعطل بـ fg-muted ونقطة، والأيام خارج min وmax معطّلة.
 * لوحة المفاتيح: الأسهم تنقل يوماً ويوماً أسبوعاً (في RTL السهم الأيمن اليوم السابق)، وHome وEnd أول الأسبوع وآخره، وPageUp وPageDown شهراً.
 * لا يحمل قيمة: الأب يحدّد ما يحدث عند الاختيار. يُستعمل في DatePicker وDateRangePicker ويصلح وحده داخل أي لوحة.
 */
export function Calendar({ mode = "single", from, to = null, onSelect, min, max, holidays = [], today, initialMonth, autoFocus = false, className }: CalendarProps) {
  const [focused, setFocused] = useState<IsoDate>(() => from ?? (initialMonth ? `${initialMonth}-01` : today));
  const [hover, setHover] = useState<IsoDate | null>(null);
  const grid = useRef<HTMLDivElement>(null);
  const shouldFocus = useRef(autoFocus);
  const flip = useCaptureClass("rtl:-scale-x-100", "-scale-x-100");

  const month = monthOf(focused);
  const holidayByDate = new Map(holidays.map((holiday) => [holiday.date, holiday.name]));

  useEffect(() => {
    if (!shouldFocus.current) return;
    shouldFocus.current = false;
    grid.current?.querySelector<HTMLElement>(`[data-date="${focused}"]`)?.focus();
  });

  const isDisabled = (date: IsoDate) => (min !== undefined && date < min) || (max !== undefined && date > max);

  const moveFocus = (next: IsoDate) => {
    shouldFocus.current = true;
    setFocused(next);
  };

  // التنقل بالأزرار لا يسرق التركيز من الزر.
  const shiftMonth = (months: number) => setFocused(addMonths(focused, months));

  const handleKeyDown = (event: React.KeyboardEvent) => {
    // في RTL اليمين = السابق. في وضع الالتقاط (LTR) لا يُستعمل التقويم بلوحة المفاتيح.
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
    const horizontal = rtl ? -1 : 1;
    const moves: Record<string, IsoDate> = {
      ArrowLeft: addDays(focused, -horizontal),
      ArrowRight: addDays(focused, horizontal),
      ArrowUp: addDays(focused, -7),
      ArrowDown: addDays(focused, 7),
      Home: startOfWeek(focused),
      End: addDays(startOfWeek(focused), 6),
      PageUp: addMonths(focused, -1),
      PageDown: addMonths(focused, 1),
    };
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    moveFocus(next);
  };

  // طرف الفترة الجاري: النهاية المحدّدة، أو يوم التمرير إن لم تُحدَّد بعد (معاينة).
  const previewEnd = mode === "range" ? (to ?? (from !== null && hover !== null && hover >= from ? hover : null)) : null;

  const prevDisabled = min !== undefined && addMonthsToMonth(month, -1) < monthOf(min);
  const nextDisabled = max !== undefined && addMonthsToMonth(month, 1) > monthOf(max);

  return (
    <div className={cn("flex w-70 flex-col gap-2", className)}>
      <CaptureRow className="items-center gap-1">
        <IconButton
          variant="ghost"
          size="sm"
          icon={CaretLeft}
          aria-label="الشهر السابق"
          className={flip}
          disabled={prevDisabled}
          onClick={() => shiftMonth(-1)}
        />
        <span aria-live="polite" className="min-w-0 flex-1 text-center text-body font-medium text-fg">
          {monthLabel(month)}
        </span>
        <IconButton
          variant="ghost"
          size="sm"
          icon={CaretRight}
          aria-label="الشهر التالي"
          className={flip}
          disabled={nextDisabled}
          onClick={() => shiftMonth(1)}
        />
      </CaptureRow>

      <div ref={grid} role="grid" aria-label={monthLabel(month)} onKeyDown={handleKeyDown} onMouseLeave={() => setHover(null)} className="flex flex-col">
        <CaptureRow role="row">
          {WEEKDAY_SHORT.map((name) => (
            <span key={name} role="columnheader" className="flex h-8 w-10 shrink-0 items-center justify-center text-caption text-fg-muted">
              {name}
            </span>
          ))}
        </CaptureRow>
        {monthWeeks(month).map((week, row) => (
          <CaptureRow key={row} role="row">
            {week.map((date, column) => {
              if (date === null) return <span key={column} role="gridcell" aria-hidden="true" className={cellClass} />;

              const holiday = holidayByDate.get(date);
              const muted = holiday !== undefined || isFriday(date);
              const disabled = isDisabled(date);
              const isFrom = date === from;
              const isEnd = mode === "range" ? date === previewEnd : false;
              const edge = mode === "single" ? isFrom : isFrom || isEnd;
              const inRange = mode === "range" && from !== null && previewEnd !== null && date > from && date < previewEnd;
              const label = holiday ? `${fullDayLabel(date)}، ${holiday}` : fullDayLabel(date);

              return (
                <button
                  key={date}
                  type="button"
                  role="gridcell"
                  data-date={date}
                  title={holiday}
                  aria-label={label}
                  aria-selected={edge || inRange}
                  aria-disabled={disabled || undefined}
                  aria-current={date === today ? "date" : undefined}
                  tabIndex={date === focused ? 0 : -1}
                  onClick={() => {
                    if (disabled) return;
                    setFocused(date);
                    onSelect(date);
                  }}
                  onMouseEnter={() => setHover(date)}
                  className={cn(
                    "relative flex items-center justify-center text-body tabular-nums outline-none transition-colors duration-120 ease-out focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-focus",
                    cellClass,
                    inRange ? "rounded-none" : "rounded-md",
                    disabled
                      ? "cursor-not-allowed text-fg-disabled"
                      : edge
                        ? "bg-primary text-on-primary"
                        : cn(inRange ? "bg-primary-soft" : "hover:bg-surface-sunken", muted ? "text-fg-muted" : "text-fg"),
                    date === today && !edge && !disabled && "border border-border-strong",
                  )}
                >
                  <span>{Number(date.slice(8))}</span>
                  {muted ? (
                    <span aria-hidden="true" className="absolute inset-x-0 bottom-1 flex justify-center">
                      <span className={cn("size-1 rounded-full", edge ? "bg-on-primary" : disabled ? "bg-fg-disabled" : "bg-fg-subtle")} />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </CaptureRow>
        ))}
      </div>
    </div>
  );
}

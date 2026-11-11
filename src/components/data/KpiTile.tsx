"use client";

import { ArrowDown, ArrowUp, Info } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/IconButton";
import { Popover } from "@/components/ui/Popover";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { CaptureRow } from "@/lib/design/CaptureMode";
import { isolate } from "@/lib/format";

type KpiChange = {
  /** النسبة المطلقة: 12 لـ «↑ 12%». الاتجاه من `direction`. */
  percent: number;
  direction: "up" | "down";
  /** المقارنة: «عن الشهر الماضي». */
  comparedTo: string;
};

type KpiTileProps = {
  label: string;
  /** القيمة منسّقة جاهزة (`formatMoney` وأخواتها): `$48,250.00`. */
  value: string;
  /** السياق تحت القيمة (الهدف أو المقارنة): «من هدف $60,000 · 80%». */
  context?: string;
  /** شريط تقدم نحو الهدف: 0–100. */
  progress?: number;
  change?: KpiChange;
  /** يشرح طريقة الحساب في popover من زر ⓘ. */
  info?: string;
  /** شارة «مبدئي» قبل إغلاق الشهر (القرار 13). */
  provisional?: boolean;
  /** loading: Skeleton بشكلها. empty: «لا بيانات لهذا الشهر». */
  state?: "ready" | "loading" | "empty";
  /** القيمة text-display (الأهم، الافتراضي) أو text-h1. */
  size?: "lg" | "md";
  /** قابلة للضغط حين تقود لقائمة: «12 بانتظار قراري» ← القرارات. */
  onClick?: () => void;
  className?: string;
};

/** خلية الإحصاء (DESIGN.md 10.9): التسمية ثم القيمة ثم السياق، وشريط تقدم ومؤشر تغيّر وزر معلومات اختيارية. */
export function KpiTile({ label, value, context, progress, change, info, provisional = false, state = "ready", size = "lg", onClick, className }: KpiTileProps) {
  const body: ReactNode =
    state === "loading" ? (
      <div aria-hidden="true" className="flex flex-col gap-3">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className={size === "lg" ? "h-11 w-3/4" : "h-9 w-3/4"} />
        <Skeleton className="h-3 w-2/3" />
      </div>
    ) : (
      <div className="flex flex-col gap-2">
        <CaptureRow className="items-center gap-2">
          <span className="min-w-0 flex-1 text-label text-fg-muted">{label}</span>
          {provisional ? <Badge>مبدئي</Badge> : null}
          {info ? (
            <span onClick={(event) => event.stopPropagation()} className="flex shrink-0">
              <Popover trigger={<IconButton variant="ghost" size="sm" icon={Info} aria-label={`كيف تُحسب: ${label}`} />}>
                <p className="w-64 text-body text-fg">{info}</p>
              </Popover>
            </span>
          ) : null}
        </CaptureRow>
        {state === "empty" ? (
          <p className="text-body text-fg-muted">لا بيانات لهذا الشهر</p>
        ) : (
          <>
            <p dir="ltr" className={cn("text-end font-bold tabular-nums text-fg", size === "lg" ? "text-display" : "text-h1")}>
              {value}
            </p>
            {context ? <p className="text-caption text-fg-muted">{context}</p> : null}
            {progress !== undefined ? (
              <div
                role="progressbar"
                aria-label={label}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.min(100, Math.max(0, progress))}
                className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken"
              >
                <CaptureRow className="h-full w-full">
                  <div style={{ inlineSize: `${Math.min(100, Math.max(0, progress))}%` }} className="h-full rounded-full bg-primary" />
                </CaptureRow>
              </div>
            ) : null}
            {change ? (
              <CaptureRow className={cn("items-center gap-1 text-caption", change.direction === "up" ? "text-success" : "text-danger")}>
                {change.direction === "up" ? <ArrowUp size={12} weight="bold" aria-hidden="true" /> : <ArrowDown size={12} weight="bold" aria-hidden="true" />}
                <span className="font-medium">{isolate(`${change.percent}%`)}</span>
                <span className="text-fg-muted">{change.comparedTo}</span>
              </CaptureRow>
            ) : null}
          </>
        )}
      </div>
    );

  const classes = cn("flex w-full flex-col rounded-lg border border-border bg-surface p-4 text-start @tablet:p-6", className);

  // div بدور button لا <button>: قد يحوي زر معلومات (تداخل أزرار غير صالح).
  const clickable = onClick !== undefined && state === "ready";
  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-busy={state === "loading" || undefined}
      onClick={clickable ? onClick : undefined}
      onKeyDown={
        clickable
          ? (event) => {
              if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={cn(
        classes,
        clickable &&
          "cursor-pointer outline-none transition-colors duration-120 ease-out hover:border-border-hover hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2",
      )}
    >
      {body}
    </div>
  );
}

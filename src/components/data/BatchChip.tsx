"use client";

import { Clock, Prohibit } from "@phosphor-icons/react";
import { useState } from "react";
import { Badge, type BadgeColor } from "@/components/ui/Badge";
import { damascusToday, dayLabel, daysBetween, type IsoDate } from "@/lib/calendar";
import { CaptureRow } from "@/lib/design/CaptureMode";
import { isolate } from "@/lib/format";
import type { BatchRef } from "@/lib/api/types";

export type BatchChipState = "normal" | "near-expiry" | "suspended" | "expired";

/**
 * حالة الدفعة للعرض (DESIGN.md 10.11): الموقوفة ثم المنتهية ثم القريبة من الانتهاء (ضمن `expiryAlertDays` من الإعدادات) ثم العادية.
 * دالة نقية: اليوم يُمرَّر.
 */
export function batchChipState(batch: BatchRef, today: IsoDate, expiryAlertDays: number): { state: BatchChipState; daysToExpiry: number | null } {
  const daysToExpiry = batch.expiry_date ? daysBetween(today, batch.expiry_date) : null;
  if (batch.status === "SUSPENDED") return { state: "suspended", daysToExpiry };
  if (daysToExpiry !== null && daysToExpiry < 0) return { state: "expired", daysToExpiry };
  if (daysToExpiry !== null && daysToExpiry <= expiryAlertDays) return { state: "near-expiry", daysToExpiry };
  return { state: "normal", daysToExpiry };
}

type BatchChipProps = {
  batch: BatchRef;
  /** مهلة تنبيه الصلاحية من الإعدادات (`expiry_alert_days`). الافتراضي 60. */
  expiryAlertDays?: number;
  /** يُمرَّر في المعرض والاختبار لتثبيت اليوم. الافتراضي اليوم بتوقيت دمشق. */
  today?: IsoDate;
  /** يخفي تاريخ الانتهاء (حين يكون في عمود آخر). */
  hideExpiry?: boolean;
};

/**
 * رقم الدفعة (لاتيني بأرقام متساوية العرض) وتاريخ الانتهاء بجانبه، وشارة الحالة:
 * عادية neutral بلا شارة · قريبة الانتهاء warning بأيقونة Clock و«تنتهي بعد 34 يوماً» · موقوفة danger بأيقونة Prohibit · منتهية danger.
 */
export function BatchChip({ batch, expiryAlertDays = 60, today: todayProp, hideExpiry = false }: BatchChipProps) {
  const [clock] = useState(damascusToday);
  const { state, daysToExpiry } = batchChipState(batch, todayProp ?? clock, expiryAlertDays);

  const badge: { color: BadgeColor; text: string; icon?: typeof Clock } | null =
    state === "suspended"
      ? { color: "danger", text: "موقوفة", icon: Prohibit }
      : state === "expired"
        ? { color: "danger", text: "منتهية" }
        : state === "near-expiry"
          ? { color: "warning", text: `تنتهي بعد ${isolate(daysToExpiry ?? 0)} يوماً`, icon: Clock }
          : null;

  return (
    <CaptureRow className="min-w-0 items-center gap-2">
      <span dir="ltr" className="shrink-0 text-body tabular-nums text-fg">
        {batch.batch_no}
      </span>
      {!hideExpiry && batch.expiry_date ? <span className="truncate text-caption text-fg-muted">{dayLabel(batch.expiry_date)}</span> : null}
      {badge ? (
        <Badge color={badge.color} icon={badge.icon}>
          {badge.text}
        </Badge>
      ) : null}
    </CaptureRow>
  );
}

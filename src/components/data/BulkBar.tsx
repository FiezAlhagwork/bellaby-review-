"use client";

import type { ReactElement } from "react";
import { Button } from "@/components/ui/Button";
import { CaptureRow } from "@/lib/design/CaptureMode";
import { isolate } from "@/lib/format";

type BulkBarProps = {
  /** عدد المحدّد. */
  count: number;
  /** أزرار الإجراء الجماعي (مصفوفة بمفاتيح). */
  actions: readonly ReactElement[];
  onClear: () => void;
};

/**
 * شريط الإجراء الجماعي فوق الجدول (DESIGN.md 10.6): «تحديد 12 · [الإجراء] · إلغاء التحديد».
 * يظهر حين يكون في الجدول تحديد فقط (حين يدعم العقد إجراءً جماعياً).
 */
export function BulkBar({ count, actions, onClear }: BulkBarProps) {
  return (
    <CaptureRow role="region" aria-label="الإجراء الجماعي" className="min-h-12 items-center gap-3 rounded-lg border border-border bg-primary-soft px-4 py-2">
      <span className="text-body font-medium text-fg">{`تحديد ${isolate(count)}`}</span>
      <CaptureRow className="min-w-0 flex-1 items-center gap-2">{actions}</CaptureRow>
      <Button key="clear" variant="ghost" size="sm" onClick={onClear}>
        إلغاء التحديد
      </Button>
    </CaptureRow>
  );
}

"use client";

import { Minus, Plus } from "@phosphor-icons/react";
import type { ChangeEvent } from "react";
import { cn } from "@/lib/cn";
import { CaptureRow } from "@/lib/design/CaptureMode";
import { formatQuantity, isolate } from "@/lib/format";
import { FieldShell, FieldSlot, useControlState } from "./FieldShell";
import { IconButton } from "./IconButton";

type NumberInputProps = {
  /** الكمية. null = فارغ. */
  value: number | null;
  onValueChange: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  /** الوحدة بعد الرقم: «علبة». */
  unit?: string;
  /** الرصيد المتاح: يظهر تحت الحقل، وتجاوزه خطأ فوري «أكبر من المتاح (240)». */
  available?: number;
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  id?: string;
  placeholder?: string;
  "aria-label"?: string;
  className?: string;
};

/**
 * حقل الكمية (DESIGN.md 9.4): عدد صحيح بزرّي − و+ على جانبيه. controlled بـ `value` و`onValueChange`.
 * الأرقام متساوية العرض ومحاذاتها إلى الوسط. الأرقام لاتينية، فالزر + يمين والزر − يسار كما في ترتيب الأعداد.
 */
export function NumberInput({
  value,
  onValueChange,
  min,
  max,
  step = 1,
  unit,
  available,
  invalid: invalidProp,
  disabled: disabledProp,
  readOnly: readOnlyProp,
  id: idProp,
  placeholder,
  "aria-label": ariaLabel,
  className,
}: NumberInputProps) {
  const control = useControlState({ id: idProp, invalid: invalidProp, disabled: disabledProp, readOnly: readOnlyProp });
  const exceedsAvailable = available !== undefined && value !== null && value > available;
  const invalid = control.invalid || exceedsAvailable;
  const locked = control.disabled || control.readOnly;

  const clamp = (n: number) => Math.min(max ?? n, Math.max(min ?? n, n));
  const stepBy = (direction: 1 | -1) => onValueChange(clamp((value ?? min ?? 0) + direction * step));

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const digits = event.target.value.replace(/\D/g, "");
    onValueChange(digits === "" ? null : Number(digits));
  };

  const availableText = available === undefined ? null : formatQuantity(available);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <FieldShell invalid={invalid} disabled={control.disabled} readOnly={control.readOnly} className="px-1">
        <FieldSlot>
          <IconButton
            variant="ghost"
            size="sm"
            icon={Plus}
            aria-label="زيادة"
            disabled={locked || (max !== undefined && value !== null && value >= max)}
            onClick={() => stepBy(1)}
          />
        </FieldSlot>
        <CaptureRow className="min-w-0 flex-1 items-center justify-center gap-1">
          <input
            id={control.id}
            type="text"
            inputMode="numeric"
            role="spinbutton"
            value={value === null ? "" : String(value)}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={control.disabled}
            readOnly={control.readOnly}
            aria-label={ariaLabel}
            aria-invalid={invalid || undefined}
            aria-describedby={control.describedBy}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={value ?? undefined}
            className="min-w-8 max-w-full bg-transparent text-center tabular-nums outline-none field-sizing-content placeholder:text-fg-disabled disabled:cursor-not-allowed"
          />
          {unit ? <span className="shrink-0 text-fg-muted">{unit}</span> : null}
        </CaptureRow>
        <FieldSlot>
          <IconButton
            variant="ghost"
            size="sm"
            icon={Minus}
            aria-label="إنقاص"
            disabled={locked || (min !== undefined && (value ?? min) <= min)}
            onClick={() => stepBy(-1)}
          />
        </FieldSlot>
      </FieldShell>
      {availableText ? (
        <p className={cn("text-label", exceedsAvailable ? "text-danger" : "text-fg-muted")}>
          {exceedsAvailable
            ? `أكبر من المتاح (${isolate(availableText)})`
            : `المتاح: ${isolate(availableText)}${unit ? ` ${unit}` : ""}`}
        </p>
      ) : null}
    </div>
  );
}

"use client";

import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";
import { FieldShell, useControlState } from "./FieldShell";

export type TextareaProps = ComponentPropsWithoutRef<"textarea"> & {
  /** حد danger وأيقونة WarningCircle. داخل Field تأتي من `error`. */
  invalid?: boolean;
  /** للقراءة فقط بقاعدة: بلا حد، وأيقونة قفل صغيرة. */
  locked?: boolean;
};

/**
 * الحقل متعدد الأسطر (DESIGN.md 9.3): من 3 أسطر ويكبر بالمحتوى حتى 8 ثم يتمرر.
 * الأسطر 24 (text-body): 3 × 24 = 72 (min-h-18)، و8 × 24 = 192 (max-h-48).
 */
export function Textarea({
  invalid: invalidProp,
  locked = false,
  disabled: disabledProp,
  readOnly: readOnlyProp,
  required: requiredProp,
  id: idProp,
  className,
  ...rest
}: TextareaProps) {
  const { id, describedBy, invalid, disabled, required, readOnly } = useControlState({
    id: idProp,
    invalid: invalidProp,
    disabled: disabledProp,
    readOnly: readOnlyProp || locked,
    required: requiredProp,
  });

  return (
    <FieldShell multiline invalid={invalid} disabled={disabled} readOnly={readOnly} locked={locked} className={className}>
      <textarea
        {...rest}
        id={id}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={cn(
          "max-h-48 min-h-18 min-w-0 flex-1 resize-none overflow-y-auto bg-transparent text-start outline-none field-sizing-content placeholder:text-fg-disabled disabled:cursor-not-allowed",
        )}
      />
    </FieldShell>
  );
}

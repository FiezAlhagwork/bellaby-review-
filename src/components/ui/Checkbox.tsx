"use client";

import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { Check, Minus } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CaptureRow } from "@/lib/design/CaptureMode";

type CheckboxLabelProps =
  | { label: ReactNode; "aria-label"?: string }
  /** بلا نص ظاهر (تحديد الكل في رأس الجدول): الاسم المقروء إلزامي. */
  | { label?: undefined; "aria-label": string };

type CheckboxProps = CheckboxLabelProps & {
  checked: boolean;
  /** «جزئي»: بعض الأبناء محدّد، لتحديد الكل في الجدول. يظهر بدل علامة الصح، والنقر يحدّد الكل. */
  indeterminate?: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** سطر شرح تحت النص. */
  description?: string;
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
  /** على المربع نفسه (لا على الصف). */
  className?: string;
};

/**
 * مربع الاختيار (DESIGN.md 9.7): 16 × 16 على الويب و20 × 20 على الموبايل. النص بعد المربع (على يساره في RTL).
 * controlled بـ `checked` و`onCheckedChange`. ما يسري فوراً دون حفظ هو Switch، وهذا لما يحتاج حفظاً.
 */
export function Checkbox({
  checked,
  indeterminate = false,
  onCheckedChange,
  label,
  description,
  invalid = false,
  disabled = false,
  readOnly = false,
  required = false,
  id,
  name,
  "aria-label": ariaLabel,
  className,
}: CheckboxProps) {
  const marked = checked || indeterminate;

  const box = (
    <BaseCheckbox.Root
      id={id}
      name={name}
      checked={checked}
      indeterminate={indeterminate}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      readOnly={readOnly}
      required={required}
      aria-label={label === undefined ? ariaLabel : undefined}
      aria-invalid={invalid || undefined}
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-sm border transition-colors duration-120 ease-out @tablet:size-4",
        "outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2",
        disabled
          ? "cursor-not-allowed border-border-strong bg-surface-sunken text-fg-disabled"
          : cn(
              readOnly ? "cursor-default" : "cursor-pointer",
              marked ? "border-primary bg-primary text-on-primary" : "border-border-strong bg-surface",
              invalid ? "border-danger" : !readOnly && !marked && "hover:border-border-hover",
            ),
        className,
      )}
    >
      <BaseCheckbox.Indicator keepMounted={false} className="flex">
        {indeterminate ? (
          <Minus weight="bold" aria-hidden="true" className="size-3.5 @tablet:size-3" />
        ) : (
          <Check weight="bold" aria-hidden="true" className="size-3.5 @tablet:size-3" />
        )}
      </BaseCheckbox.Indicator>
    </BaseCheckbox.Root>
  );

  if (label === undefined) return box;

  return (
    // الصف كله هدف النقر. min-h 44 على الموبايل (DESIGN.md 9.2)، والمربع في منتصف أول سطر.
    <CaptureRow as="label" className={cn("min-h-11 items-start gap-2 @tablet:min-h-6", disabled ? "cursor-not-allowed" : "cursor-pointer")}>
      <span className="flex h-6 shrink-0 items-center">{box}</span>
      <span className="flex min-w-0 flex-col">
        <span className={cn("text-body", disabled ? "text-fg-disabled" : "text-fg")}>{label}</span>
        {description ? <span className="text-label text-fg-muted">{description}</span> : null}
      </span>
    </CaptureRow>
  );
}

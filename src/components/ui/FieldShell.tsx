"use client";

import { LockSimple, WarningCircle } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CaptureRow } from "@/lib/design/CaptureMode";
import { useFieldControl } from "./Field";

// الغلاف المشترك لكل الحقول (DESIGN.md 9.3): هو وحده يحمل الحد والخلفية، والعنصر الداخلي بلا حد ولا خلفية (FIGMA.md 1.2).
// يستعمله Input وTextarea وNumberInput، فتتطابق حالاتها (تمرير، تركيز، خطأ، معطّل، للقراءة فقط) حرفياً.

type ControlStateInput = {
  id?: string;
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
};

/** حالة الحقل: ما يُمرَّر صراحة يتغلّب على ما يأتي من Field المحيط. */
export function useControlState({ id, invalid, disabled, readOnly, required }: ControlStateInput) {
  const field = useFieldControl();
  return {
    id: id ?? field?.id,
    describedBy: field?.describedBy,
    invalid: invalid ?? field?.invalid ?? false,
    disabled: disabled ?? field?.disabled ?? false,
    required: required ?? field?.required ?? false,
    readOnly: Boolean(readOnly),
  };
}

type FieldShellProps = {
  invalid: boolean;
  disabled: boolean;
  readOnly: boolean;
  /** أيقونة قفل صغيرة: الحقل مقفل بقاعدة (للقراءة فقط بلا حد). */
  locked?: boolean;
  /** حقل متعدد الأسطر: الارتفاع بالمحتوى، والأيقونات على السطر الأول. */
  multiline?: boolean;
  className?: string;
  children: ReactNode;
};

type ShellStyleInput = {
  invalid: boolean;
  disabled: boolean;
  readOnly: boolean;
  multiline?: boolean;
};

/**
 * صنف الغلاف وحده (الحد والخلفية والحالات). يستعمله FieldShell، ويستعمله Select وCombobox
 * على الزر نفسه، فتتطابق كل الحقول بالتمرير والتركيز والخطأ والتعطيل.
 */
export function fieldShellClass({ invalid, disabled, readOnly, multiline = false }: ShellStyleInput) {
  const state = disabled
    ? "cursor-not-allowed border-border-strong bg-surface-sunken text-fg-disabled"
    : readOnly
      ? "border-transparent bg-surface-muted text-fg"
      : cn(
          "bg-surface text-fg focus-within:ring-2 focus-within:ring-focus",
          invalid ? "border-danger" : "border-border-strong hover:border-border-hover focus-within:border-focus",
        );

  // ارتفاع 48 على الموبايل (الأساس) و40 من التابلت.
  const layout = multiline ? "items-start py-2" : "h-12 items-center @tablet:h-10";

  return cn("gap-2 rounded-md border px-3 text-body", layout, state);
}

export function FieldShell({ invalid, disabled, readOnly, locked = false, multiline = false, className, children }: FieldShellProps) {
  const slot = cn("flex shrink-0 items-center", multiline && "h-6");

  return (
    <CaptureRow className={cn(fieldShellClass({ invalid, disabled, readOnly, multiline }), className)}>
      {children}
      {invalid ? (
        <span className={slot}>
          <WarningCircle size={20} aria-hidden="true" className="text-danger" />
        </span>
      ) : null}
      {locked ? (
        <span className={slot}>
          <LockSimple size={16} aria-hidden="true" className="text-fg-subtle" />
        </span>
      ) : null}
    </CaptureRow>
  );
}

/** عنصر في بداية الغلاف أو نهايته: أيقونة، بادئة (`$`)، زر. */
export function FieldSlot({ multiline = false, children }: { multiline?: boolean; children: ReactNode }) {
  return <span className={cn("flex shrink-0 items-center", multiline && "h-6")}>{children}</span>;
}

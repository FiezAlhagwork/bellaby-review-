"use client";

import { DirectionProvider } from "@base-ui/react/direction-provider";
import { Popover } from "@base-ui/react/popover";
import { CalendarBlank, LockSimple, WarningCircle } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CaptureRow } from "@/lib/design/CaptureMode";
import { fieldShellClass, useControlState } from "./FieldShell";
import { BottomSheet } from "./Dialog";
import { floatingPanelClass } from "./OptionList";
import { useOverlay } from "./OverlayHost";

// حقل المنتقيات (DatePicker وDateRangePicker وMonthPicker): زر بشكل الحقل نفسه، بأيقونة CalendarBlank في البداية ونص القيمة،
// يفتح popover بالتقويم، وورقة سفلية (BottomSheet) حين يكون عرض OverlayHost أقل من التابلت (DESIGN.md 9.6).

export type PickerFieldProps = {
  /** نص القيمة المعروضة. null = فارغ فيظهر placeholder. */
  display: ReactNode | null;
  placeholder: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  /** للقراءة فقط بقاعدة: بلا حد وأيقونة قفل. */
  locked?: boolean;
  required?: boolean;
  id?: string;
  "aria-label"?: string;
  className?: string;
  /** محتوى الـ popover. */
  children: ReactNode;
};

/** خصائص الحقل المشتركة بين المنتقيات الثلاثة. */
export type PickerControlProps = Pick<
  PickerFieldProps,
  "invalid" | "disabled" | "readOnly" | "locked" | "required" | "id" | "aria-label" | "className"
> & {
  placeholder?: string;
};

export function PickerField({
  display,
  placeholder,
  open,
  onOpenChange,
  invalid: invalidProp,
  disabled: disabledProp,
  readOnly: readOnlyProp,
  locked = false,
  required: requiredProp,
  id: idProp,
  "aria-label": ariaLabel,
  className,
  children,
}: PickerFieldProps) {
  const control = useControlState({
    id: idProp,
    invalid: invalidProp,
    disabled: disabledProp,
    readOnly: readOnlyProp || locked,
    required: requiredProp,
  });
  const { invalid, disabled, readOnly } = control;

  const { compact } = useOverlay();

  // مصفوفة لا Fragment: CaptureRow يعكس أبناءه المباشرين، وFragment يُعدّ ابناً واحداً فيبقى ترتيب ما بداخله.
  const triggerContent = [
    <CalendarBlank key="icon" size={20} aria-hidden="true" className={cn("shrink-0", disabled ? "text-fg-disabled" : "text-fg-subtle")} />,
    <span key="text" className={cn("min-w-0 flex-1 truncate text-start", display === null && "text-fg-disabled")}>
      {display ?? placeholder}
    </span>,
    invalid ? <WarningCircle key="invalid" size={20} aria-hidden="true" className="shrink-0 text-danger" /> : null,
    locked ? <LockSimple key="locked" size={16} aria-hidden="true" className="shrink-0 text-fg-subtle" /> : null,
  ];

  const triggerClass = cn(
    fieldShellClass({ invalid, disabled, readOnly }),
    "w-full text-start data-popup-open:border-focus data-popup-open:ring-2 data-popup-open:ring-focus",
    readOnly && "cursor-default",
    className,
  );

  if (compact) {
    return (
      <>
        <CaptureRow
          as="button"
          type="button"
          id={control.id}
          aria-label={ariaLabel}
          aria-invalid={invalid || undefined}
          aria-describedby={control.describedBy}
          aria-haspopup="dialog"
          disabled={disabled}
          onClick={() => {
            if (!readOnly) onOpenChange(true);
          }}
          className={triggerClass}
        >
          {triggerContent}
        </CaptureRow>
        <BottomSheet open={open && !disabled && !readOnly} onOpenChange={onOpenChange} title={placeholder}>
          <div className="flex justify-center">{children}</div>
        </BottomSheet>
      </>
    );
  }

  return (
    <DirectionProvider direction="rtl">
      <Popover.Root open={open && !disabled && !readOnly} onOpenChange={onOpenChange}>
        <Popover.Trigger
          id={control.id}
          aria-label={ariaLabel}
          aria-invalid={invalid || undefined}
          aria-describedby={control.describedBy}
          disabled={disabled}
          render={<CaptureRow as="button" />}
          className={triggerClass}
        >
          {triggerContent}
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner sideOffset={4} align="start" className="z-50 outline-none">
            <Popover.Popup initialFocus={false} className={cn(floatingPanelClass, "p-3")}>
              {children}
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </DirectionProvider>
  );
}

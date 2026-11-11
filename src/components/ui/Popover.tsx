"use client";

import { DirectionProvider } from "@base-ui/react/direction-provider";
import { Popover as BasePopover } from "@base-ui/react/popover";
import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { floatingPanelClass } from "./OptionList";

type PopoverProps = {
  /** الزر المحفّز. */
  trigger: ReactElement;
  children: ReactNode;
  /** controlled اختيارياً: بدونهما يدير Base UI الفتح. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
};

/**
 * المحتوى الصغير التفاعلي (DESIGN.md 9.14): فلتر، ملخص. يفتح من زر ويغلق بـ Esc والضغط خارجه.
 * لوحة بـ shadow-raised كباقي ما يطفو. المنتقيات لها PickerField.
 */
export function Popover({ trigger, children, open, onOpenChange, className }: PopoverProps) {
  return (
    <DirectionProvider direction="rtl">
      <BasePopover.Root open={open} onOpenChange={onOpenChange}>
        <BasePopover.Trigger render={trigger} />
        <BasePopover.Portal>
          <BasePopover.Positioner sideOffset={4} align="start" className="z-50 outline-none">
            <BasePopover.Popup className={cn(floatingPanelClass, "p-4", className)}>{children}</BasePopover.Popup>
          </BasePopover.Positioner>
        </BasePopover.Portal>
      </BasePopover.Root>
    </DirectionProvider>
  );
}

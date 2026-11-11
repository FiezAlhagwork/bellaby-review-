"use client";

import { DirectionProvider } from "@base-ui/react/direction-provider";
import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import type { ReactElement } from "react";

/** شكل التلميح (يستعمله المعرض ثابتاً). */
export const tooltipClass =
  "max-w-60 rounded-md bg-fg px-2 py-1 text-caption text-fg-inverse shadow-raised transition-opacity duration-120 ease-out data-starting-style:opacity-0 data-ending-style:opacity-0";

type TooltipProps = {
  /** نص قصير غير تفاعلي. */
  label: string;
  /** العنصر المحفّز: يحمل خصائص الـ tooltip نفسه (زر، IconButton). */
  children: ReactElement;
  /** ms قبل الظهور. الافتراضي 400 (DESIGN.md 9.14). */
  delay?: number;
  /** جهة الظهور. inline-end نحو النهاية (يسار في RTL). */
  side?: "top" | "bottom" | "inline-start" | "inline-end";
  /** يعطّل الظهور (قائمة جانبية موسّعة فيها النص ظاهر). */
  disabled?: boolean;
};

/**
 * التلميح (DESIGN.md 9.14): نص قصير غير تفاعلي بعد 400ms من التمرير، بخلفية fg ونص fg-inverse وحجم text-caption.
 * IconButton يحتاج tooltip بنص aria-label نفسه: `<Tooltip label="تعديل"><IconButton aria-label="تعديل" … /></Tooltip>`.
 * يظهر أيضاً عند التركيز بلوحة المفاتيح.
 */
export function Tooltip({ label, children, delay = 400, side = "top", disabled = false }: TooltipProps) {
  return (
    <DirectionProvider direction="rtl">
      <BaseTooltip.Provider delay={delay}>
        <BaseTooltip.Root disabled={disabled}>
          <BaseTooltip.Trigger render={children} />
          <BaseTooltip.Portal>
            <BaseTooltip.Positioner side={side} sideOffset={6} className="z-50">
              <BaseTooltip.Popup className={tooltipClass}>
                {label}
              </BaseTooltip.Popup>
            </BaseTooltip.Positioner>
          </BaseTooltip.Portal>
        </BaseTooltip.Root>
      </BaseTooltip.Provider>
    </DirectionProvider>
  );
}

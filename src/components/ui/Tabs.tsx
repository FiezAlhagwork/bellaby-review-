"use client";

import { DirectionProvider } from "@base-ui/react/direction-provider";
import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import { cn } from "@/lib/cn";
import { CaptureRow } from "@/lib/design/CaptureMode";
import { Badge } from "./Badge";

export type TabItem<V extends string = string> = {
  value: V;
  label: string;
  /** عدد بجانب النص في Badge neutral (عدد الأسطر مثلاً). */
  count?: number;
  disabled?: boolean;
};

type TabsProps<V extends string> = {
  tabs: readonly TabItem<V>[];
  value: V;
  onValueChange: (value: V) => void;
  /** إلزامي: القائمة بلا تسمية ظاهرة. */
  "aria-label": string;
  className?: string;
};

/**
 * التبويبات (DESIGN.md 9.15): أفقية تحت رأس الصفحة لأقسام الكيان الواحد: «التفاصيل · الأسطر · السجل».
 * المؤشر خط بعرض 2 تحت النشط بلون primary، ونص النشط fg بوزن 600 والباقي fg-muted. على الموبايل تتمرر أفقياً.
 * لا يرسم المحتوى: الأب يعرض اللوحة حسب `value`. الأسهم تنقل (Base UI).
 */
export function Tabs<V extends string>({ tabs, value, onValueChange, "aria-label": ariaLabel, className }: TabsProps<V>) {
  return (
    <DirectionProvider direction="rtl">
      <BaseTabs.Root value={value} onValueChange={(next) => onValueChange(next as V)} className={className}>
        <BaseTabs.List
          aria-label={ariaLabel}
          activateOnFocus
          render={<CaptureRow />}
          className="items-end gap-6 overflow-x-auto border-b border-border"
        >
          {tabs.map((tab) => {
            const active = tab.value === value;
            return (
              <BaseTabs.Tab
                key={tab.value}
                value={tab.value}
                disabled={tab.disabled}
                render={<CaptureRow as="button" />}
                className={cn(
                  "-mb-px h-11 shrink-0 items-center gap-2 border-b-2 text-body whitespace-nowrap outline-none transition-colors duration-120 ease-out @tablet:h-10",
                  "focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-inset",
                  tab.disabled
                    ? "cursor-not-allowed border-transparent text-fg-disabled"
                    : active
                      ? "cursor-default border-primary font-semibold text-fg"
                      : "cursor-pointer border-transparent text-fg-muted hover:text-fg",
                )}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined ? <Badge>{String(tab.count)}</Badge> : null}
              </BaseTabs.Tab>
            );
          })}
        </BaseTabs.List>
      </BaseTabs.Root>
    </DirectionProvider>
  );
}

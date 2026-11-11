"use client";

import { DirectionProvider } from "@base-ui/react/direction-provider";
import { Radio as BaseRadio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import type { Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { CaptureRow } from "@/lib/design/CaptureMode";

type Segment<V extends string> = {
  value: V;
  label: string;
  /** أيقونة 16 قبل النص (جدول · بطاقات). */
  icon?: Icon;
  disabled?: boolean;
};

type SegmentedControlProps<V extends string> = {
  /** 2 إلى 4 عروض للمحتوى نفسه. */
  options: readonly Segment<V>[];
  value: V;
  onValueChange: (value: V) => void;
  /** إلزامي: المجموعة بلا تسمية ظاهرة. */
  "aria-label": string;
  disabled?: boolean;
  /** الأجزاء بعرض متساوٍ تملأ عرض الحاوية. */
  fullWidth?: boolean;
  className?: string;
};

/**
 * التبديل بين 2–4 عروض للمحتوى نفسه (DESIGN.md 9.7): جدول · بطاقات، يومي · شهري. اختيار واحد دائماً (لا إلغاء).
 * هو مجموعة radio بشكل أجزاء: الأسهم تنقل، والتركيز على الجزء. الارتفاع 48 على الموبايل و40 من التابلت كالحقول.
 */
export function SegmentedControl<V extends string>({
  options,
  value,
  onValueChange,
  "aria-label": ariaLabel,
  disabled = false,
  fullWidth = false,
  className,
}: SegmentedControlProps<V>) {
  return (
    <DirectionProvider direction="rtl">
      {/* صف خارجي: المجموعة بعرض محتواها تبقى عند البداية (يمين) في الوضعين، لا تنزاح يساراً في LTR. */}
      <CaptureRow className={cn(fullWidth && "w-full")}>
        <BaseRadioGroup<V>
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          aria-label={ariaLabel}
          render={<CaptureRow />}
          className={cn("items-center gap-1 rounded-md bg-surface-sunken p-1", fullWidth ? "w-full" : "w-fit", className)}
        >
          {options.map((option) => {
            const checked = option.value === value;
            const off = disabled || option.disabled;
            const OptionIcon = option.icon;
            return (
              <BaseRadio.Root
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                render={<CaptureRow />}
                className={cn(
                  "h-10 items-center justify-center gap-2 rounded-sm px-4 text-body whitespace-nowrap transition-colors duration-120 ease-out @tablet:h-8",
                  "outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2",
                  fullWidth && "flex-1",
                  off
                    ? "cursor-not-allowed text-fg-disabled"
                    : checked
                      ? "cursor-default border border-border-strong bg-surface font-medium text-fg"
                      : "cursor-pointer border border-transparent text-fg-muted hover:text-fg",
                )}
              >
                {OptionIcon ? <OptionIcon size={16} aria-hidden="true" /> : null}
                <span>{option.label}</span>
              </BaseRadio.Root>
            );
          })}
        </BaseRadioGroup>
      </CaptureRow>
    </DirectionProvider>
  );
}

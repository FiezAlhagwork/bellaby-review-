"use client";

import type { Icon } from "@phosphor-icons/react";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";
import { CaptureRow } from "@/lib/design/CaptureMode";
import { Spinner } from "./Spinner";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "danger-ghost";
export type ButtonSize = "sm" | "md" | "lg";

// hover وpressed بـ enabled: فلا يتحرك زر معطّل أو يحمّل.
const variantClass: Record<ButtonVariant, string> = {
  primary: "bg-primary text-on-primary enabled:hover:bg-primary-hover enabled:active:bg-primary-pressed",
  secondary:
    "border border-border-strong bg-surface text-fg enabled:hover:border-border-hover enabled:hover:bg-surface-muted enabled:active:bg-surface-sunken",
  ghost: "text-fg enabled:hover:bg-surface-sunken enabled:active:bg-border",
  danger: "bg-danger text-fg-inverse enabled:hover:bg-danger-hover enabled:active:bg-danger-pressed",
  "danger-ghost": "text-danger enabled:hover:bg-danger-soft enabled:active:bg-danger-soft",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "h-8 gap-1 px-3 text-label font-medium",
  md: "h-10 gap-2 px-4 text-body font-medium",
  lg: "h-12 gap-2 px-6 text-body-lg font-semibold",
};

const iconSize: Record<ButtonSize, 16 | 20> = { sm: 16, md: 20, lg: 20 };

type ButtonProps = Omit<ComponentPropsWithoutRef<"button">, "children"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** قبل النص. */
  icon?: Icon;
  /** بعد النص. */
  iconEnd?: Icon;
  /** الدوار فوق الزر في الوسط والمحتوى شفاف (يبقى في مكانه ويحدد العرض)، فلا يتغيّر عرض الزر، والزر لا يستجيب. */
  loading?: boolean;
  fullWidth?: boolean;
  /** اسم الإجراء بصيغة المصدر: «اعتماد»، «رفض»، «حفظ». */
  children: string;
};

/**
 * الزر (DESIGN.md 9.1). primary واحد فقط في كل منطقة. المعطّل يظهر معه دائماً سبب في الشاشة (نص مساعد أو tooltip).
 * danger لإجراء لا رجعة فيه أو قرار سلبي.
 */
export function Button({
  variant = "primary",
  size = "md",
  icon: StartIcon,
  iconEnd: EndIcon,
  loading = false,
  fullWidth = false,
  disabled = false,
  type = "button",
  className,
  children,
  ...rest
}: ButtonProps) {
  const glyphSize = iconSize[size];

  return (
    <CaptureRow
      as="button"
      {...rest}
      type={type}
      // المعطّل فعلاً يأخذ شكل المعطّل. والتحميل يبقى بلون المتغيّر وبلا استجابة.
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-md whitespace-nowrap transition-colors duration-120 ease-out",
        "focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:outline-none",
        sizeClass[size],
        variantClass[variant],
        fullWidth && "w-full",
        loading && "cursor-progress",
        disabled && "cursor-not-allowed border-transparent bg-surface-sunken text-fg-disabled",
        className,
      )}
    >
      {loading ? (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner size={glyphSize} />
        </span>
      ) : null}
      {StartIcon ? <StartIcon size={glyphSize} aria-hidden="true" className={loading ? "opacity-0" : undefined} /> : null}
      {/* opacity لا visibility: يبقى الاسم في شجرة الوصول أثناء التحميل. */}
      <span className={loading ? "opacity-0" : undefined}>{children}</span>
      {EndIcon ? <EndIcon size={glyphSize} aria-hidden="true" className={loading ? "opacity-0" : undefined} /> : null}
    </CaptureRow>
  );
}

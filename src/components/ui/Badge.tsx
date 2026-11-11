"use client";

import type { Icon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CaptureRow } from "@/lib/design/CaptureMode";

export type BadgeColor = "neutral" | "success" | "warning" | "danger" | "info" | "accent";

// الشكل دائماً خلفية *-soft مع * نصاً. neutral نصه fg لأن fg-muted لا يوضع على surface-sunken (DESIGN.md 3.6).
const colorClass: Record<BadgeColor, string> = {
  neutral: "bg-surface-sunken text-fg",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  accent: "bg-accent-soft text-accent",
};

type BadgeProps = {
  color?: BadgeColor;
  /** أيقونة 12 قبل النص. */
  icon?: Icon;
  children: ReactNode;
};

/** الشارة (DESIGN.md 9.9): نص قصير بخلفية خفيفة. الحالة تُقرأ بالنص لا باللون وحده. */
export function Badge({ color = "neutral", icon: BadgeIcon, children }: BadgeProps) {
  return (
    <CaptureRow
      as="span"
      className={cn("h-5.5 items-center gap-1 rounded-sm px-2 text-label whitespace-nowrap", "inline-flex", colorClass[color])}
    >
      {BadgeIcon ? <BadgeIcon size={12} aria-hidden="true" /> : null}
      <span>{children}</span>
    </CaptureRow>
  );
}

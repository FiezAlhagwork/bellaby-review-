"use client";

import { CheckCircle, Info, Warning, WarningCircle, X, type Icon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CaptureRow, useCaptureClass } from "@/lib/design/CaptureMode";
import { IconButton } from "./IconButton";

export type BannerKind = "info" | "success" | "warning" | "danger" | "neutral";

// خلفية *-soft وحد بداية بعرض 3 بلون * (DESIGN.md 9.10). neutral بلا درجة soft في الثيم فيأخذ surface-sunken.
const kindClass: Record<BannerKind, { box: string; accent: string }> = {
  info: { box: "bg-info-soft", accent: "text-info" },
  success: { box: "bg-success-soft", accent: "text-success" },
  warning: { box: "bg-warning-soft", accent: "text-warning" },
  danger: { box: "bg-danger-soft", accent: "text-danger" },
  neutral: { box: "bg-surface-sunken", accent: "text-fg-muted" },
};

const kindEdge: Record<BannerKind, string> = {
  info: "border-info",
  success: "border-success",
  warning: "border-warning",
  danger: "border-danger",
  neutral: "border-border-hover",
};

const kindIcon: Record<BannerKind, Icon> = {
  info: Info,
  success: CheckCircle,
  warning: Warning,
  danger: WarningCircle,
  neutral: Info,
};

type BannerProps = {
  kind?: BannerKind;
  /** عنوان قصير بخط عريض فوق النص. */
  title?: string;
  /** النص: ما حدث وما أثره. */
  children: ReactNode;
  /** إجراء اختياري في النهاية (زر ghost صغير مثلاً). */
  action?: ReactNode;
  /** يظهر زر الإغلاق حين يُمرَّر. */
  onClose?: () => void;
  className?: string;
};

/**
 * التنبيه (DESIGN.md 9.10): شريط بعرض المحتوى لحالة تخص الصفحة كلها: دفعة موقوفة، شهر مغلق، سجل مقفل، تفويض نشط، قرار سبقك.
 * لا يُستعمل لخطأ في حقل (تحت الحقل) ولا لتأكيد نجاح عابر (Toast).
 */
export function Banner({ kind = "info", title, children, action, onClose, className }: BannerProps) {
  const BannerIcon = kindIcon[kind];
  const edge = useCaptureClass("border-s-3", "border-e-3");

  return (
    <CaptureRow
      role={kind === "danger" || kind === "warning" ? "alert" : "status"}
      className={cn("items-start gap-3 rounded-lg px-4 py-3", edge, kindEdge[kind], kindClass[kind].box, className)}
    >
      <span className="flex h-6 shrink-0 items-center">
        <BannerIcon size={20} aria-hidden="true" className={kindClass[kind].accent} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        {title ? <p className="text-label font-semibold text-fg">{title}</p> : null}
        <div className="text-body text-fg">{children}</div>
      </div>
      {action ? <div className="flex shrink-0 items-center">{action}</div> : null}
      {onClose ? <IconButton variant="ghost" size="sm" icon={X} aria-label="إغلاق التنبيه" onClick={onClose} /> : null}
    </CaptureRow>
  );
}

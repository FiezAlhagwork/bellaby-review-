import type { Icon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type EmptyStateProps = {
  /** أيقونة 40 في دائرة surface-sunken. */
  icon: Icon;
  title: string;
  /** جملة fg-muted تحت العنوان. */
  description?: string;
  /** الإجراء: الذي ينشئ أول عنصر («لا شيء بعد»)، أو «مسح الفلاتر» («لا نتائج للفلتر»). */
  action?: ReactNode;
  /** danger للأيقونة في حالة الخطأ. */
  tone?: "neutral" | "danger";
  /** alert لحالة خطأ تُعلن لقارئ الشاشة. */
  role?: "status" | "alert";
  /** ارتفاع الجدول الفارغ: `min-h-80` (320). */
  className?: string;
};

/**
 * حالة الفراغ (DESIGN.md 9.18) وأساس حالات الخطأ وعدم الصلاحية وعدم الوجود.
 * نوعان: «لا يوجد شيء بعد» (مع الإجراء الذي ينشئ أول عنصر) و«لا نتائج للفلتر» (مع «مسح الفلاتر»).
 */
export function EmptyState({ icon: StateIcon, title, description, action, tone = "neutral", role, className }: EmptyStateProps) {
  return (
    <div role={role} className={cn("flex flex-col items-center justify-center gap-6 px-6 py-12 text-center", className)}>
      <div className="flex size-20 items-center justify-center rounded-full bg-surface-sunken">
        <StateIcon size={40} aria-hidden="true" className={tone === "danger" ? "text-danger" : "text-fg-muted"} />
      </div>
      <div className="flex max-w-md flex-col items-center gap-2">
        <h3 className="text-h3 font-semibold text-fg">{title}</h3>
        {description ? <p className="text-body text-fg-muted">{description}</p> : null}
      </div>
      {action ? <div className="flex items-center">{action}</div> : null}
    </div>
  );
}

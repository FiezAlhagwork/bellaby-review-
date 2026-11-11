import { CircleNotch } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/cn";

type SpinnerProps = {
  /** 16 داخل الأزرار الصغيرة، و20 الافتراضي. */
  size?: 16 | 20;
  /** يجعله حالة مقروءة لقارئ الشاشة. بدونه يكون زخرفة (داخل زر مثلاً). */
  label?: string;
  className?: string;
};

/**
 * المؤشر الدوار (DESIGN.md 9.18): داخل الأزرار والقوائم الصغيرة فقط.
 * لا يُستعمل لصفحة كاملة (هناك Skeleton). لونه من النص (currentColor).
 */
export function Spinner({ size = 20, label, className }: SpinnerProps) {
  return (
    <CircleNotch
      size={size}
      role={label ? "status" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("shrink-0 motion-safe:animate-spin", className)}
    />
  );
}

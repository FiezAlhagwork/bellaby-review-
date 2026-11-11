import { cn } from "@/lib/cn";

/**
 * هيكل التحميل (DESIGN.md 9.18): مستطيل surface-sunken بنبض خفيف.
 * يُركَّب بشكل المحتوى الحقيقي (أسطر جدول، بطاقات، أرقام) بتحديد الحجم من الخارج: <Skeleton className="h-6 w-40" />.
 * لا مؤشر دوار لصفحة كاملة.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("rounded-md bg-surface-sunken motion-safe:animate-pulse", className)} />;
}

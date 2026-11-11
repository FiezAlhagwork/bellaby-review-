import { CaretLeft } from "@phosphor-icons/react";
import Link from "next/link";
import { CaptureRow } from "@/lib/design/CaptureMode";

export type BreadcrumbItem = {
  label: string;
  /** بدونه نص عادي (العنصر الأخير هو الصفحة الحالية دائماً). */
  href?: string;
};

type BreadcrumbsProps = {
  items: readonly BreadcrumbItem[];
};

/**
 * مسار التنقل (DESIGN.md 10.3): الرئيسية › المستودع › الصرف. الفاصل يشير إلى اليسار في RTL (اتجاه التعمّق)،
 * وهو الشكل نفسه في وضع الالتقاط فلا يحتاج قلباً. الأخير هو الصفحة الحالية.
 */
export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="مسار التنقل">
      <CaptureRow as="ol" className="items-center gap-2 text-label">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <CaptureRow as="li" key={`${index}-${item.label}`} className="items-center gap-2">
              {last || !item.href ? (
                <span aria-current={last ? "page" : undefined} className={last ? "font-medium text-fg" : "text-fg-muted"}>
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className="text-fg-muted hover:text-fg hover:underline">
                  {item.label}
                </Link>
              )}
              {last ? null : <CaretLeft size={12} aria-hidden="true" className="text-fg-subtle" />}
            </CaptureRow>
          );
        })}
      </CaptureRow>
    </nav>
  );
}

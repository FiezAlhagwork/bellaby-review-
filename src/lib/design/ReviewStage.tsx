"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

// منصّة عرض الشاشة للزبون. الشاشة تأخذ عرضاً حقيقياً (لا تصغيراً بصرياً)، فتتجاوب مكوّناتها بـ container queries
// مع عرضها: تحت 768 موبايل، وبين 768 و1280 تابلت، وفوق 1280 مكتب.
//   auto    يتبع عرض النافذة حتى 1440، فيرى الزبون التجاوب حياً بتصغير المتصفح.
//   tablet  768 ثابتة، و mobile 390 ثابتة: لمعاينة المقاس على شاشة كبيرة دون تصغير النافذة.
// على نافذة ضيقة (هاتف الزبون) تُحذف زخرفة الإطار فتكون الشاشة هي الصفحة. لا يُنقل للإنتاج.

export type ReviewSize = "auto" | "tablet" | "mobile";

/** أقل من هذا العرض لا زخرفة حول الشاشة. */
const COMPACT_HOST = 640;

// مقاس الإطار المثبَّت = عرض الشاشة (768 أو 390) + حدّان 2 + حشوتان 24.
const frameClass: Record<ReviewSize, string> = {
  auto: "w-full max-w-360",
  tablet: "w-198.5 max-w-full",
  mobile: "w-104 max-w-full",
};

type ReviewStageProps = {
  size: ReviewSize;
  /** عنوان الصفحة في شريط المتصفح. */
  title: string;
  children: ReactNode;
};

export function ReviewStage({ size, title, children }: ReviewStageProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [hostWidth, setHostWidth] = useState<number | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const observer = new ResizeObserver(([entry]) => setHostWidth(entry.contentRect.width));
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  // قبل القياس لا نعرف إن كانت النافذة ضيقة: أخفِ بدل أن تومض الزخرفة.
  const measured = hostWidth !== null;
  const compact = measured && hostWidth < COMPACT_HOST;

  return (
    <div ref={hostRef} className={cn("flex w-full justify-center", !measured && "invisible")}>
      {compact ? (
        <div className="w-full">{children}</div>
      ) : size === "auto" ? (
        <div className={cn("flex flex-col overflow-hidden rounded-lg border border-border-strong bg-surface shadow-raised", frameClass[size])}>
          <div className="flex h-9 shrink-0 items-center gap-3 border-b border-border bg-surface-muted px-3">
            <span aria-hidden="true" className="flex gap-1.5">
              <span className="size-2.5 rounded-full bg-border-strong" />
              <span className="size-2.5 rounded-full bg-border-strong" />
              <span className="size-2.5 rounded-full bg-border-strong" />
            </span>
            <span className="min-w-0 flex-1 truncate rounded-sm bg-surface px-3 text-caption text-fg-muted">{title}</span>
          </div>
          {children}
        </div>
      ) : (
        <div className={cn("rounded-xl border border-border-strong bg-surface p-3 shadow-raised", frameClass[size])}>{children}</div>
      )}
    </div>
  );
}

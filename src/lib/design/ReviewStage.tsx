"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { OverlayPortalContext } from "@/components/ui/OverlayHost";
import { cn } from "@/lib/cn";

// منصّة عرض الشاشة للزبون. الشاشة تأخذ عرضاً حقيقياً (لا تصغيراً بصرياً)، فتتجاوب مكوّناتها بـ container queries
// مع عرضها: تحت 768 موبايل، وبين 768 و1280 تابلت، وفوق 1280 مكتب.
//   auto    يتبع عرض النافذة حتى 1440، فيرى الزبون التجاوب حياً بتصغير المتصفح.
//   tablet  768 ثابتة، و mobile 390 ثابتة: لمعاينة المقاس على شاشة كبيرة دون تصغير النافذة.
// على نافذة ضيقة (هاتف الزبون) تُحذف زخرفة الإطار فتكون الشاشة هي الصفحة. لا يُنقل للإنتاج.
//
// النوافذ العائمة (أوراق الفلاتر، الأدراج، الحوارات): الشاشة هنا بطول الصفحة كلها، فلو رُسمت الطبقة fixed داخلها لصارت بطول الصفحة
// وظهرت الورقة السفلية في نهايتها بعيداً عن الشاشة (خلل ظهر على الهاتف). لذلك تُرسم في عنصر ثابت بالنافذة طولاً، وبموضع الشاشة وعرضها أفقياً:
// تبقى النافذة داخل «إطار» الشاشة المثبّت (موبايل/تابلت) وتظهر في مكان نظر الزبون مهما تمرّر.

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
  // عنصر الشاشة نفسه (بلا الزخرفة) لقياس موضعها، وعنصر الطبقات الثابت.
  const [screen, setScreen] = useState<HTMLDivElement | null>(null);
  const [portal, setPortal] = useState<HTMLDivElement | null>(null);
  const [area, setArea] = useState<{ left: number; width: number } | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const observer = new ResizeObserver(([entry]) => setHostWidth(entry.contentRect.width));
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  // موضع الشاشة الأفقي وعرضها (مقاييس فعلية بالبكسل). يتغيران بتغيّر عرض النافذة أو مقاس الإطار فقط.
  useEffect(() => {
    if (!screen) return;
    const measure = () => {
      const rect = screen.getBoundingClientRect();
      setArea({ left: rect.left, width: rect.width });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(screen);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [screen]);

  // قبل القياس لا نعرف إن كانت النافذة ضيقة: أخفِ بدل أن تومض الزخرفة.
  const measured = hostWidth !== null;
  const compact = measured && hostWidth < COMPACT_HOST;

  const screenNode = (
    <div ref={setScreen} className="w-full">
      {children}
    </div>
  );

  return (
    <OverlayPortalContext.Provider value={portal}>
      <div ref={hostRef} className={cn("flex w-full justify-center", !measured && "invisible")}>
        {compact ? (
          screenNode
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
            {screenNode}
          </div>
        ) : (
          <div className={cn("rounded-xl border border-border-strong bg-surface p-3 shadow-raised", frameClass[size])}>{screenNode}</div>
        )}
      </div>
      {/* طبقات الشاشة: ثابت بالنافذة طولاً وبعرض الشاشة. فارغ = لا يلتقط نقراً. */}
      {/* على الهاتف الطبقة بعرض النافذة كله (الورقة تلامس الحافتين)، وفي غيره بموضع الشاشة وعرضها. */}
      {area ? (
        <div
          ref={setPortal}
          style={compact ? undefined : { left: area.left, width: area.width }}
          className={cn("fixed inset-y-0 z-50 contain-layout empty:pointer-events-none", compact && "inset-x-0")}
        />
      ) : null}
    </OverlayPortalContext.Provider>
  );
}

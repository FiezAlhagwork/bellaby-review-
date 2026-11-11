"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

// مضيف الطبقات العائمة (النوافذ والأوراق السفلية والإشعارات العابرة). يحمل @container (DESIGN.md 2.1)، فتقيس طبقاته عرض الإطار الذي
// يحتويه لا عرض النافذة: إطار 390 داخل نافذة عريضة يعرض النوافذ أوراقاً سفلية. العنصر الذي يحمل @container يُنشئ كتلة احتواء
// للعناصر fixed داخله، فتبقى الطبقات داخل إطارها ولا تغطي الصفحة كلها.
// DashboardShell وScreenFrame جذرهما OverlayHost. بلا مضيف تُرسم الطبقات في body على عرض النافذة (الحالة المباشرة في الإنتاج).

/** 48rem و80rem: `--container-tablet` و`--container-desktop` في globals.css. */
const TABLET_WIDTH = 768;
const DESKTOP_WIDTH = 1280;

export type Breakpoint = "mobile" | "tablet" | "desktop";

type OverlayContextValue = {
  /** العنصر الذي تُرسم فيه الطبقات. null = body. */
  container: HTMLElement | null;
  /** عرض المضيف أقل من التابلت: المنتقيات تفتح أوراقاً سفلية بدل popover. */
  compact: boolean;
  /** مقاس المضيف الحالي. للسلوك التفاعلي (فتح درج أو توسيع قائمة)؛ الشكل نفسه يُحسم بـ @tablet: و@desktop: لا بهذا. */
  breakpoint: Breakpoint;
};

const OverlayContext = createContext<OverlayContextValue>({ container: null, compact: false, breakpoint: "desktop" });

export const useOverlay = () => useContext(OverlayContext);

type OverlayHostProps = {
  id?: string;
  /** بلا padding ولا border: @container يقيس المحتوى الداخلي. */
  className?: string;
  children: ReactNode;
};

export function OverlayHost({ id, className, children }: OverlayHostProps) {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [breakpoint, setBreakpoint] = useState<Breakpoint>("desktop");

  useEffect(() => {
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      setBreakpoint(width < TABLET_WIDTH ? "mobile" : width < DESKTOP_WIDTH ? "tablet" : "desktop");
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  return (
    <OverlayContext.Provider value={{ container: element, compact: breakpoint === "mobile", breakpoint }}>
      <div ref={setElement} id={id} className={cn("@container contain-layout", className)}>
        {children}
      </div>
    </OverlayContext.Provider>
  );
}

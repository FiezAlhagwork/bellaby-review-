import type { ReactNode } from "react";
import { OverlayHost } from "@/components/ui/OverlayHost";
import { cn } from "@/lib/cn";

export type ScreenFrameKind = "desktop" | "mobile";

type ScreenFrameProps = {
  frame: ScreenFrameKind;
  /** `screen` للجذر الذي يُلتقط. واحد فقط في الصفحة. */
  id?: string;
  /** نسخة المراجعة: العرض يتبع الحاوية (`w-full`) بدل 1440 أو 390 الثابتة، فتتجاوب المكوّنات مع عرضها الحقيقي. الالتقاط بلا fluid. */
  fluid?: boolean;
  children: ReactNode;
};

/**
 * إطار الشاشة بمقاس Figma: 1440 × 900 للمكتب و390 × 844 للموبايل (DESIGN.md 2).
 * الارتفاع حدّ أدنى: المحتوى الأطول يطوّل الإطار ويبقى العرض (FIGMA.md 3.7).
 * جذره OverlayHost: يحمل @container بلا padding ولا border، فالمكوّنات داخله تقيس عرضه هو لا عرض النافذة (DESIGN.md 2.1).
 */
export function ScreenFrame({ frame, id, fluid = false, children }: ScreenFrameProps) {
  const width = fluid ? "w-full" : frame === "mobile" ? "w-97.5" : "w-360";
  return (
    <OverlayHost id={id} className={cn("flex flex-col bg-bg", frame === "mobile" ? "min-h-211" : "min-h-225", width)}>
      {children}
    </OverlayHost>
  );
}

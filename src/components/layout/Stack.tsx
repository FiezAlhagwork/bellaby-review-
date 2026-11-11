import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CaptureRow } from "@/lib/design/CaptureMode";

/** سلّم المسافات (DESIGN.md 5.1): 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48. */
export type Gap = 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;

export const gapClass: Record<Gap, string> = {
  1: "gap-1",
  2: "gap-2",
  3: "gap-3",
  4: "gap-4",
  5: "gap-5",
  6: "gap-6",
  8: "gap-8",
  10: "gap-10",
  12: "gap-12",
};

const alignClass = { start: "items-start", center: "items-center", end: "items-end", stretch: "items-stretch" } as const;

type StackProps = {
  /** column الافتراضي. row صف أفقي: أول عنصر في الكود هو الأيمن في الوضعين (CaptureRow). */
  direction?: "column" | "row";
  gap?: Gap;
  align?: keyof typeof alignClass;
  className?: string;
  children: ReactNode;
};

/** عمود أو صف بمسافة من السلّم. لا ترتيب بالمقاس: ذلك لـ Grid. */
export function Stack({ direction = "column", gap = 4, align = "stretch", className, children }: StackProps) {
  const classes = cn(gapClass[gap], alignClass[align], className);
  return direction === "row" ? (
    <CaptureRow className={classes}>{children}</CaptureRow>
  ) : (
    <div className={cn("flex flex-col", classes)}>{children}</div>
  );
}

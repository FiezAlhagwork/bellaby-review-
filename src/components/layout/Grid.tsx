"use client";

import { Children, type ReactNode } from "react";
import { useOverlay, type Breakpoint } from "@/components/ui/OverlayHost";
import { cn } from "@/lib/cn";
import { CaptureRow, useCaptureMode } from "@/lib/design/CaptureMode";
import { gapClass, type Gap } from "./Stack";

type Cols = 1 | 2 | 3 | 4 | 5 | 6;

/** أعمدة كل مقاس. ما لم يُذكر يرث من الأصغر منه. */
export type GridCols = { base: Cols; tablet?: Cols; desktop?: Cols };

// أسماء الـ classes كاملة ليراها Tailwind (لا تُركَّب نصاً).
const base: Record<Cols, string> = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4", 5: "grid-cols-5", 6: "grid-cols-6" };
const tablet: Record<Cols, string> = {
  1: "@tablet:grid-cols-1",
  2: "@tablet:grid-cols-2",
  3: "@tablet:grid-cols-3",
  4: "@tablet:grid-cols-4",
  5: "@tablet:grid-cols-5",
  6: "@tablet:grid-cols-6",
};
const desktop: Record<Cols, string> = {
  1: "@desktop:grid-cols-1",
  2: "@desktop:grid-cols-2",
  3: "@desktop:grid-cols-3",
  4: "@desktop:grid-cols-4",
  5: "@desktop:grid-cols-5",
  6: "@desktop:grid-cols-6",
};

function colsFor(cols: GridCols, breakpoint: Breakpoint): Cols {
  if (breakpoint === "desktop") return cols.desktop ?? cols.tablet ?? cols.base;
  if (breakpoint === "tablet") return cols.tablet ?? cols.base;
  return cols.base;
}

type GridProps = {
  /** `cols={{ base: 1, tablet: 2, desktop: 3 }}`: المكان الوحيد الذي يُكتب فيه تخطيط @tablet و@desktop للشاشات. */
  cols: GridCols;
  gap?: Gap;
  /** دور الحاوية (list لقائمة تفاصيل). */
  role?: string;
  className?: string;
  children: ReactNode;
};

/**
 * شبكة متجاوبة بالـ props (DESIGN.md 10.5). الخلية الأولى يمين في RTL.
 * وضع الالتقاط: CSS grid يضع الخلية الأولى يساراً في LTR، فتُرسم الصفوف بـ CaptureRow (خلايا متساوية وترتيب معكوس)
 * بعدد الأعمدة الحالي من عرض المضيف. الشكل في الوضعين متطابق.
 */
export function Grid({ cols, gap = 6, role, className, children }: GridProps) {
  const capture = useCaptureMode();
  const { breakpoint } = useOverlay();

  if (!capture) {
    return (
      <div role={role} className={cn("grid", base[cols.base], cols.tablet && tablet[cols.tablet], cols.desktop && desktop[cols.desktop], gapClass[gap], className)}>
        {children}
      </div>
    );
  }

  const count = colsFor(cols, breakpoint);
  const cells = Children.toArray(children);
  const rows: ReactNode[][] = [];
  for (let i = 0; i < cells.length; i += count) rows.push(cells.slice(i, i + count));

  return (
    <div role={role} className={cn("flex flex-col", gapClass[gap], className)}>
      {rows.map((row, rowIndex) => (
        <CaptureRow key={rowIndex} className={cn("items-stretch", gapClass[gap])}>
          {row.map((cell, index) => (
            <div key={index} className="grid min-w-0 flex-1">
              {cell}
            </div>
          ))}
          {Array.from({ length: count - row.length }, (_, index) => (
            <div key={`filler-${index}`} aria-hidden="true" className="min-w-0 flex-1" />
          ))}
        </CaptureRow>
      ))}
    </div>
  );
}

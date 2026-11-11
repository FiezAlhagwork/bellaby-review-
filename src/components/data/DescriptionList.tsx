import type { ReactNode } from "react";
import { Grid } from "@/components/layout/Grid";

export type DescriptionItem = {
  label: string;
  /** القيمة. null أو فارغة تُعرض «—» لا خانة فارغة. */
  value: ReactNode;
};

type DescriptionListProps = {
  items: readonly DescriptionItem[];
  className?: string;
};

const isEmpty = (value: ReactNode) => value === null || value === undefined || value === "" || value === false;

/** قائمة التفاصيل (DESIGN.md 10.14): أزواج «تسمية: قيمة» في عمودين (تابلت وما فوق) أو عمود (موبايل). التسمية text-label بـ fg-muted، والقيمة text-body. */
export function DescriptionList({ items, className }: DescriptionListProps) {
  return (
    <Grid role="list" cols={{ base: 1, tablet: 2 }} gap={4} className={className}>
      {items.map((item) => (
        <div key={item.label} role="listitem" className="flex min-w-0 flex-col gap-1">
          <span className="text-start text-label text-fg-muted">{item.label}</span>
          <div className="min-w-0 text-start text-body text-fg">{isEmpty(item.value) ? <span className="text-fg-muted">—</span> : item.value}</div>
        </div>
      ))}
    </Grid>
  );
}

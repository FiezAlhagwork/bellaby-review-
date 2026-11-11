import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type SectionProps = {
  /** عنوان text-h2. بدونه قسم بلا رأس. */
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

/** قسم من الصفحة (DESIGN.md 10.5): عنوان text-h2 اختياري، ووصف، ومحتوى، ومسافة 32 بعده. */
export function Section({ title, description, children, className }: SectionProps) {
  return (
    <section className={cn("flex flex-col gap-4 pb-8 last:pb-0", className)}>
      {title || description ? (
        <div className="flex flex-col gap-1">
          {title ? <h2 className="text-h2 font-semibold text-fg">{title}</h2> : null}
          {description ? <p className="text-body text-fg-muted">{description}</p> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

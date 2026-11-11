import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CaptureRow } from "@/lib/design/CaptureMode";

type CardProps = {
  /** عنوان الرأس (text-h3). بدونه لا رأس. */
  title?: string;
  /** إجراء في نهاية الرأس. */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * البطاقة (DESIGN.md 9.16): surface وحد border وrounded-lg، padding 24 على التابلت وما فوقه و16 على الموبايل.
 * رأس اختياري بعنوان وإجراء وفاصل تحته. **لا بطاقة داخل بطاقة**: داخلها تُستعمل الفواصل والمجموعات.
 */
export function Card({ title, action, children, className }: CardProps) {
  return (
    <section className={cn("flex flex-col gap-4 rounded-lg border border-border bg-surface p-4 @tablet:p-6", className)}>
      {title ? (
        <CaptureRow className="items-center gap-3 border-b border-border pb-4">
          <h3 className="min-w-0 flex-1 text-h3 font-semibold text-fg">{title}</h3>
          {action ? <div className="flex shrink-0 items-center">{action}</div> : null}
        </CaptureRow>
      ) : null}
      {children}
    </section>
  );
}

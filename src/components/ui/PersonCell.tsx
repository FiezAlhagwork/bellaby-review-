import { cn } from "@/lib/cn";
import { CaptureRow } from "@/lib/design/CaptureMode";
import { Avatar, type AvatarSize } from "./Avatar";

type PersonCellProps = {
  name: string;
  /** الدور أو المحافظة: سطر text-caption تحت الاسم. */
  subtitle?: string;
  size?: Extract<AvatarSize, 32 | 40>;
  className?: string;
};

/** خلية الشخص (DESIGN.md 9.17): أفاتار، والاسم، وتحته الدور أو المحافظة. للمنفّذ والمكلَّف والمندوب والوكيل. */
export function PersonCell({ name, subtitle, size = 32, className }: PersonCellProps) {
  return (
    <CaptureRow className={cn("min-w-0 items-center gap-3", className)}>
      <Avatar name={name} size={size} decorative />
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-start text-body text-fg">{name}</span>
        {subtitle ? <span className="truncate text-start text-caption text-fg-muted">{subtitle}</span> : null}
      </div>
    </CaptureRow>
  );
}

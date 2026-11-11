import { cn } from "@/lib/cn";

export type AvatarSize = 24 | 32 | 40;

const sizeClass: Record<AvatarSize, string> = {
  24: "size-6 text-caption",
  32: "size-8 text-label",
  40: "size-10 text-body",
};

type AvatarProps = {
  /** الاسم الكامل: يُؤخذ حرفه الأول. */
  name: string;
  size?: AvatarSize;
  /** true داخل خلية تعرض الاسم نصاً بجانبه (PersonCell): تُخفى عن قارئ الشاشة. */
  decorative?: boolean;
  className?: string;
};

/** الأفاتار (DESIGN.md 9.17): دائرة بالحرف الأول من الاسم على surface-sunken. لا صور أشخاص في النظام. */
export function Avatar({ name, size = 32, decorative = false, className }: AvatarProps) {
  const initial = Array.from(name.trim())[0] ?? "";

  return (
    <span
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : name}
      aria-hidden={decorative || undefined}
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full bg-surface-sunken font-medium text-fg-muted select-none", sizeClass[size], className)}
    >
      {initial}
    </span>
  );
}

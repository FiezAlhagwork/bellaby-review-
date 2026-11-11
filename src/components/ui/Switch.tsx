"use client";

import { Switch as BaseSwitch } from "@base-ui/react/switch";
import { cn } from "@/lib/cn";
import { CaptureRow, useCaptureClass } from "@/lib/design/CaptureMode";

type SwitchLabelProps =
  | { label: string; "aria-label"?: string }
  /** بلا نص ظاهر: الاسم المقروء إلزامي. */
  | { label?: undefined; "aria-label": string };

type SwitchProps = SwitchLabelProps & {
  checked: boolean;
  /** يُستدعى فوراً: المفتاح لإعداد يسري دون زر حفظ. */
  onCheckedChange: (checked: boolean) => void;
  /** سطر شرح تحت النص. */
  description?: string;
  disabled?: boolean;
  readOnly?: boolean;
  id?: string;
  name?: string;
  /** على المفتاح نفسه (لا على الصف). */
  className?: string;
};

/**
 * المفتاح (DESIGN.md 9.7): لإعداد يسري فوراً دون حفظ فقط. ما يحتاج حفظاً فهو Checkbox.
 * 44 × 24 على الموبايل و36 × 20 من التابلت. controlled بـ `checked` و`onCheckedChange`.
 * مع نص: النص في البداية والمفتاح في النهاية (صف إعداد).
 */
export function Switch({
  checked,
  onCheckedChange,
  label,
  description,
  disabled = false,
  readOnly = false,
  id,
  name,
  "aria-label": ariaLabel,
  className,
}: SwitchProps) {
  // الإزاحة فيزيائية (translate)، فتُعكس في وضع الالتقاط (LTR) حيث يبدأ المقبض من اليسار.
  const rest = "translate-x-0";
  const thumbOffset = useCaptureClass(
    checked ? "-translate-x-5 @tablet:-translate-x-4" : rest,
    checked ? rest : "translate-x-5 @tablet:translate-x-4",
  );

  const control = (
    <BaseSwitch.Root
      id={id}
      name={name}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      readOnly={readOnly}
      aria-label={label === undefined ? ariaLabel : undefined}
      className={cn(
        "flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors duration-120 ease-out @tablet:h-5 @tablet:w-9",
        "outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2",
        disabled
          ? cn("cursor-not-allowed", checked ? "bg-border-hover" : "bg-surface-sunken")
          : cn(
              readOnly ? "cursor-default" : "cursor-pointer",
              checked ? "bg-primary" : "bg-border-strong",
              !readOnly && (checked ? "hover:bg-primary-hover" : "hover:bg-border-hover"),
            ),
        className,
      )}
    >
      <BaseSwitch.Thumb
        className={cn("size-5 rounded-full bg-surface transition-transform duration-120 ease-out @tablet:size-4", thumbOffset)}
      />
    </BaseSwitch.Root>
  );

  if (label === undefined) return control;

  return (
    <CaptureRow as="label" className={cn("min-h-11 items-center gap-3 @tablet:min-h-6", disabled ? "cursor-not-allowed" : "cursor-pointer")}>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={cn("text-body", disabled ? "text-fg-disabled" : "text-fg")}>{label}</span>
        {description ? <span className="text-label text-fg-muted">{description}</span> : null}
      </span>
      {control}
    </CaptureRow>
  );
}

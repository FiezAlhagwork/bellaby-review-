"use client";

import { DirectionProvider } from "@base-ui/react/direction-provider";
import { Radio as BaseRadio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import { createContext, useContext, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CaptureRow } from "@/lib/design/CaptureMode";
import { useFieldControl } from "./Field";

// مجموعة الاختيار الواحد (DESIGN.md 9.7): RadioGroup يحمل القيمة، وبداخله Radio (2–5 خيارات) أو RadioCard (قرار مهم بعنوان ووصف).
// أكثر من 5 خيارات: Select. السلوك (الأسهم، التركيز، اختيار واحد) من Base UI.

type GroupState<V extends string = string> = {
  value: V | null;
  disabled: boolean;
  readOnly: boolean;
  invalid: boolean;
};

const GroupContext = createContext<GroupState | null>(null);

/** حالة المجموعة للخيار وللـ SegmentedControl الذي يبني عليها. يُستعمل داخل RadioGroup فقط. */
export function useRadioGroup(): GroupState {
  const group = useContext(GroupContext);
  if (!group) throw new Error("Radio و RadioCard و SegmentedControl تُستعمل داخل RadioGroup.");
  return group;
}

type RadioGroupProps<V extends string> = {
  value: V | null;
  onValueChange: (value: V) => void;
  /** vertical الافتراضي. horizontal لخيارين أو ثلاثة قصيرة. */
  orientation?: "vertical" | "horizontal";
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  name?: string;
  /** إن لم يكن داخل Field تظهر فيه التسمية. */
  "aria-label"?: string;
  "aria-labelledby"?: string;
  className?: string;
  children: ReactNode;
};

export function RadioGroup<V extends string>({
  value,
  onValueChange,
  orientation = "vertical",
  invalid: invalidProp,
  disabled: disabledProp,
  readOnly = false,
  required,
  name,
  "aria-label": ariaLabel,
  "aria-labelledby": labelledByProp,
  className,
  children,
}: RadioGroupProps<V>) {
  const field = useFieldControl();
  const invalid = invalidProp ?? field?.invalid ?? false;
  const disabled = disabledProp ?? field?.disabled ?? false;
  const labelledBy = labelledByProp ?? (ariaLabel ? undefined : field?.labelId);

  return (
    <DirectionProvider direction="rtl">
      <GroupContext.Provider value={{ value, disabled, readOnly, invalid }}>
        <BaseRadioGroup<V | null>
          value={value}
          onValueChange={(next) => {
            if (next !== null) onValueChange(next);
          }}
          disabled={disabled}
          readOnly={readOnly}
          required={required ?? field?.required}
          name={name}
          aria-label={ariaLabel}
          aria-labelledby={labelledBy}
          aria-invalid={invalid || undefined}
          aria-describedby={field?.describedBy}
          render={orientation === "horizontal" ? <CaptureRow /> : undefined}
          className={cn(orientation === "horizontal" ? "items-center gap-6" : "flex flex-col gap-3", className)}
        >
          {children}
        </BaseRadioGroup>
      </GroupContext.Provider>
    </DirectionProvider>
  );
}

// الدائرة: 20 على الموبايل و16 من التابلت. المختار بحد primary ونقطة داخلها.
function circleClass({ checked, disabled, readOnly, invalid }: { checked: boolean; disabled: boolean; readOnly: boolean; invalid: boolean }) {
  return cn(
    "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-120 ease-out @tablet:size-4",
    "outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2",
    disabled
      ? "cursor-not-allowed border-border-strong bg-surface-sunken"
      : cn(
          "bg-surface",
          readOnly ? "cursor-default" : "cursor-pointer",
          invalid ? "border-danger" : checked ? "border-primary" : cn("border-border-strong", !readOnly && "hover:border-border-hover"),
        ),
  );
}

function dotClass(disabled: boolean) {
  return cn("size-2.5 rounded-full @tablet:size-2", disabled ? "bg-border-hover" : "bg-primary");
}

type RadioProps<V extends string> = {
  value: V;
  label: string;
  description?: string;
  disabled?: boolean;
  /** على الدائرة نفسها (لا على الصف). */
  className?: string;
};

/** خيار بدائرة ونص بعدها (على يساره في RTL). داخل RadioGroup. */
export function Radio<V extends string>({ value, label, description, disabled: disabledProp = false, className }: RadioProps<V>) {
  const group = useRadioGroup();
  const disabled = group.disabled || disabledProp;
  const checked = group.value === value;

  return (
    <CaptureRow as="label" className={cn("min-h-11 items-start gap-2 @tablet:min-h-6", disabled ? "cursor-not-allowed" : "cursor-pointer")}>
      <span className="flex h-6 shrink-0 items-center">
        <BaseRadio.Root
          value={value}
          disabled={disabledProp}
          className={cn(circleClass({ checked, disabled, readOnly: group.readOnly, invalid: group.invalid }), className)}
        >
          <BaseRadio.Indicator className={dotClass(disabled)} />
        </BaseRadio.Root>
      </span>
      <span className="flex min-w-0 flex-col">
        <span className={cn("text-body", disabled ? "text-fg-disabled" : "text-fg")}>{label}</span>
        {description ? <span className="text-label text-fg-muted">{description}</span> : null}
      </span>
    </CaptureRow>
  );
}

type RadioCardProps<V extends string> = {
  value: V;
  title: string;
  description: string;
  disabled?: boolean;
  /** سبب التعطيل: يظهر مكان الوصف حين يكون الخيار معطّلاً. */
  reason?: string;
  /** على البطاقة نفسها. */
  className?: string;
};

/**
 * خيار بعنوان ووصف داخل بطاقة، للقرارات المهمة (DESIGN.md 9.7). مثال: قرار المدير التنفيذي على المهمة المتأخرة.
 * البطاقة كلها هدف النقر، والمختارة بحد primary وخلفية primary-soft.
 */
export function RadioCard<V extends string>({ value, title, description, disabled: disabledProp = false, reason, className }: RadioCardProps<V>) {
  const group = useRadioGroup();
  const disabled = group.disabled || disabledProp;
  const checked = group.value === value;

  return (
    <CaptureRow
      as="label"
      className={cn(
        "items-start gap-3 rounded-lg border p-4 transition-colors duration-120 ease-out has-focus-visible:ring-2 has-focus-visible:ring-focus has-focus-visible:ring-offset-2",
        disabled
          ? "cursor-not-allowed border-border bg-surface-sunken"
          : cn(
              group.readOnly ? "cursor-default" : "cursor-pointer",
              group.invalid ? "border-danger" : checked ? "border-primary" : cn("border-border-strong", !group.readOnly && "hover:border-border-hover"),
              checked ? "bg-primary-soft" : "bg-surface",
            ),
        className,
      )}
    >
      <span className="flex h-6 shrink-0 items-center">
        <BaseRadio.Root
          value={value}
          disabled={disabledProp}
          className={circleClass({ checked, disabled, readOnly: group.readOnly, invalid: group.invalid })}
        >
          <BaseRadio.Indicator className={dotClass(disabled)} />
        </BaseRadio.Root>
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className={cn("text-body font-medium", disabled ? "text-fg-disabled" : "text-fg")}>{title}</span>
        <span className="text-label text-fg-muted">{disabled && reason ? reason : description}</span>
      </span>
    </CaptureRow>
  );
}

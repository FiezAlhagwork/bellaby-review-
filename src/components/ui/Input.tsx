"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useCaptureMode } from "@/lib/design/CaptureMode";
import { FieldShell, FieldSlot, useControlState } from "./FieldShell";

export type InputProps = Omit<ComponentPropsWithoutRef<"input">, "size" | "prefix"> & {
  /** أيقونة في البداية (يمين). */
  icon?: ReactNode;
  /** في النهاية (يسار) قبل أيقونة الخطأ: زر مسح مثلاً. */
  endAdornment?: ReactNode;
  /**
   * بادئة لاتينية ملتصقة بالقيمة (دولار أو رمز الدولة، مثل +963): تُقرأ من اليسار فتقع يسار الرقم، والاثنان معاً
   * يلتصقان بالبداية البصرية للحقل (يمين) كما في DESIGN.md 8.6. تفترض `dir="ltr"`.
   */
  prefixText?: string;
  /** حد danger وأيقونة WarningCircle في النهاية. داخل Field تأتي من `error`. */
  invalid?: boolean;
  /** للقراءة فقط بقاعدة: بلا حد، خلفية surface-muted، وأيقونة قفل صغيرة. */
  locked?: boolean;
};

/**
 * الإدخال النصي (DESIGN.md 9.3): controlled بـ `value` و`onChange` كـ <input>.
 * الغلاف يحمل الحد والخلفية، والـ <input> بلا حد ولا خلفية (FIGMA.md 1.2).
 */
export function Input({
  icon,
  endAdornment,
  invalid: invalidProp,
  locked = false,
  prefixText,
  disabled: disabledProp,
  readOnly: readOnlyProp,
  required: requiredProp,
  id: idProp,
  className,
  dir,
  ...rest
}: InputProps) {
  const { id, describedBy, invalid, disabled, required, readOnly } = useControlState({
    id: idProp,
    invalid: invalidProp,
    disabled: disabledProp,
    readOnly: readOnlyProp || locked,
    required: requiredProp,
  });

  // الالتقاط إلى Figma: لا تحترم dir، وخطها قد يكون أعرض من المقيس في المتصفح. الحقل tight العرض (field-sizing) فيلتف نصه.
  // pe-6 مع me-6 السالب يوسّع صندوق النص 24 دون أن يتحرك شيء. وLRM قبل البادئة يمنع قلب «+963» إلى «963+» (فقرة RTL).
  const capture = useCaptureMode();

  // dir="ltr" بلا بادئة: حقل لاتيني يحاذى إلى البداية البصرية (يمين) بـ text-end (DESIGN.md 8.6).
  const control = (
    <input
      {...rest}
      id={id}
      dir={dir}
      disabled={disabled}
      readOnly={readOnly}
      required={required}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      className={cn(
        "bg-transparent outline-none placeholder:text-fg-disabled disabled:cursor-not-allowed",
        prefixText ? cn("min-w-0 text-start field-sizing-content", capture && "pe-6 -me-6") : cn("min-w-0 flex-1", dir === "ltr" ? "text-end" : "text-start"),
      )}
    />
  );

  return (
    <FieldShell invalid={invalid} disabled={disabled} readOnly={readOnly} locked={locked} className={className}>
      {icon ? (
        <FieldSlot>
          <span aria-hidden="true" className="flex text-fg-subtle">
            {icon}
          </span>
        </FieldSlot>
      ) : null}
      {prefixText ? (
        // الحقل كله وحدة LTR صريحة (البادئة ثم الرقم)، ملتصقة بيمين الغلاف. لا تُعكس في وضع الالتقاط لأنها LTR في الوضعين.
        <div dir="ltr" className="flex min-w-0 flex-1 items-center justify-end gap-2">
          <span dir="ltr" className="shrink-0 text-fg-muted tabular-nums">
            {capture ? "‎" : ""}
            {prefixText}
          </span>
          {control}
        </div>
      ) : (
        control
      )}
      {endAdornment ? <FieldSlot>{endAdornment}</FieldSlot> : null}
    </FieldShell>
  );
}

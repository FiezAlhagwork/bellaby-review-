"use client";

import { Input, type InputProps } from "./Input";

type PhoneInputProps = Omit<InputProps, "icon" | "endAdornment" | "prefixText" | "type" | "dir" | "inputMode" | "locked" | "maxLength">;

/**
 * حقل الهاتف (DESIGN.md 9.3): `+963` ثابتة يسار الرقم، و9 أرقام `9XX XXX XXX`، والاثنان ملتصقان بالبداية البصرية للحقل (يمين).
 * القيمة الأرقام الوطنية وحدها. التحويل من E.164 (`+963944123456`) وإليه من شأن من يستعمل الحقل.
 */
export function PhoneInput({ placeholder = "9XX XXX XXX", ...rest }: PhoneInputProps) {
  return (
    <Input
      {...rest}
      type="tel"
      dir="ltr"
      inputMode="tel"
      prefixText="+963"
      maxLength={9}
      placeholder={placeholder}
    />
  );
}

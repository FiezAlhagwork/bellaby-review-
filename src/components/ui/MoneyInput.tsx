"use client";

import { Input, type InputProps } from "./Input";

type MoneyInputProps = Omit<InputProps, "icon" | "endAdornment" | "prefixText" | "type" | "dir" | "inputMode" | "locked">;

/**
 * حقل المبلغ بالدولار (DESIGN.md 9.3). القيمة نص عشري كما في العقد (`"125.50"`): لا حساب ولا تقريب هنا.
 * `"use client";

import { Input, type InputProps } from "./Input";

type MoneyInputProps = Omit<InputProps, "icon" | "endAdornment" | "prefixText" | "type" | "dir" | "inputMode" | "locked">;

/**
 * حقل المبلغ بالدولار (DESIGN.md 9.3). القيمة نص عشري كما في العقد (`"125.50"`): لا حساب ولا تقريب هنا.
 يسار الرقم، والاثنان ملتصقان بالبداية البصرية للحقل (يمين).
 */
export function MoneyInput({ placeholder = "0.00", ...rest }: MoneyInputProps) {
  return (
    <Input
      {...rest}
      type="text"
      dir="ltr"
      inputMode="decimal"
      prefixText="$"
      placeholder={placeholder}
    />
  );
}

"use client";

import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { IconButton } from "./IconButton";
import { Input, type InputProps } from "./Input";

type SearchInputProps = Omit<InputProps, "icon" | "endAdornment" | "type" | "locked"> & {
  /** يظهر زر المسح حين يكون في الحقل نص. يمسح الأب القيمة. */
  onClear?: () => void;
};

/** حقل البحث (DESIGN.md 9.3): أيقونة بحث في البداية وزر مسح في النهاية. controlled بـ `value` و`onChange`. */
export function SearchInput({ onClear, value, disabled, readOnly, ...rest }: SearchInputProps) {
  const hasText = value !== undefined && String(value).length > 0;

  return (
    <Input
      {...rest}
      type="text"
      role="searchbox"
      value={value}
      disabled={disabled}
      readOnly={readOnly}
      icon={<MagnifyingGlass size={20} />}
      endAdornment={
        onClear && hasText && !disabled && !readOnly ? (
          <IconButton variant="ghost" size="sm" icon={X} aria-label="مسح البحث" onClick={onClear} />
        ) : null
      }
    />
  );
}

"use client";

import type { Icon } from "@phosphor-icons/react";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./Spinner";

export type IconButtonVariant = "secondary" | "ghost" | "danger-ghost";
export type IconButtonSize = "sm" | "md";

const variantClass: Record<IconButtonVariant, string> = {
  secondary:
    "border border-border-strong bg-surface text-fg enabled:hover:border-border-hover enabled:hover:bg-surface-muted enabled:active:bg-surface-sunken",
  ghost: "text-fg enabled:hover:bg-surface-sunken enabled:active:bg-border",
  "danger-ghost": "text-danger enabled:hover:bg-danger-soft enabled:active:bg-danger-soft",
};

// md: 44 على الموبايل (الأساس) و40 من التابلت.
const sizeClass: Record<IconButtonSize, string> = {
  sm: "size-8",
  md: "size-11 @tablet:size-10",
};

type IconButtonProps = Omit<ComponentPropsWithoutRef<"button">, "children" | "aria-label"> & {
  icon: Icon;
  /** إلزامي: الزر بلا نص. يصير tooltip بالنص نفسه حين يُبنى Tooltip. */
  "aria-label": string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  loading?: boolean;
};

/** زر الأيقونة (DESIGN.md 9.2): مربع بأيقونة وحدها. الأيقونة 16 في sm و20 في md. */
export function IconButton({
  icon: ButtonIcon,
  variant = "ghost",
  size = "md",
  loading = false,
  disabled = false,
  type = "button",
  className,
  ...rest
}: IconButtonProps) {
  const iconSize = size === "sm" ? 16 : 20;

  return (
    <button
      {...rest}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md transition-colors duration-120 ease-out",
        "focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:outline-none",
        sizeClass[size],
        variantClass[variant],
        loading && "cursor-progress",
        disabled && "cursor-not-allowed border-transparent bg-surface-sunken text-fg-disabled",
        className,
      )}
    >
      {loading ? <Spinner size={iconSize} /> : <ButtonIcon size={iconSize} aria-hidden="true" />}
    </button>
  );
}

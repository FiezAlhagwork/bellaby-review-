import type { ButtonVariant } from "@/components/ui/Button";

// حالات hover وpressed وfocus لا تُرسم في المعرض إلا بإجبارها بـ className، لأن الـ pseudo-class لا يُلتقط.
// هذه القيم يجب أن تطابق ما في المكوّن حرفياً. اختبار /components يقارن الإجبار بالـ hover الحقيقي بكسل ببكسل.

export const forcedButton = {
  hover: {
    primary: "bg-primary-hover",
    secondary: "border-border-hover bg-surface-muted",
    ghost: "bg-surface-sunken",
    danger: "bg-danger-hover",
    "danger-ghost": "bg-danger-soft",
  },
  pressed: {
    primary: "bg-primary-pressed",
    secondary: "border-border-hover bg-surface-sunken",
    ghost: "bg-border",
    danger: "bg-danger-pressed",
    "danger-ghost": "bg-danger-soft",
  },
  focus: "ring-2 ring-focus ring-offset-2",
} satisfies {
  hover: Record<ButtonVariant, string>;
  pressed: Record<ButtonVariant, string>;
  focus: string;
};

/** الحقول: hover وfocus على الغلاف (يطابق FieldShell). */
export const forcedField = {
  hover: "border-border-hover",
  focus: "border-focus ring-2 ring-focus",
} as const;

/** مربع الاختيار والدائرة (غير المحدّدة): hover على الحد، وfocus بحلقة. يطابق Checkbox وRadio. */
export const forcedChoice = {
  hover: "border-border-hover",
  focus: "ring-2 ring-focus ring-offset-2",
} as const;

/** المفتاح: hover يغمّق المسار (مطفأ: border-hover، مشغّل: primary-hover). يطابق Switch. */
export const forcedSwitch = {
  hoverOff: "bg-border-hover",
  hoverOn: "bg-primary-hover",
  focus: "ring-2 ring-focus ring-offset-2",
} as const;

/** بطاقة الخيار (RadioCard) غير المحدّدة. */
export const forcedCard = {
  hover: "border-border-hover",
  focus: "ring-2 ring-focus ring-offset-2",
} as const;

/** منطقة رفع الملفات: hover بحد أغمق، وسحب ملف فوقها (حالة داخلية) بحد primary وخلفية primary-soft. يطابق FileUpload. */
export const forcedDrop = {
  hover: "border-border-hover",
  dragging: "border-primary bg-primary-soft",
  focus: "ring-2 ring-focus ring-offset-2",
} as const;

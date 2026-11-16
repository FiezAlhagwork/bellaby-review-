import type { Classification } from "@/lib/api/types";

/**
 * تصنيفات دليل المراقبة الخمسة (`Classification`): العقد يعرّف القيم بلا نص عربي، فالأسماء هنا مقترحة وتُؤكَّد مع الباك (docs/backend-requests.md §38.8).
 * مرتَّبة من الأخف إلى الأشد، وتُستعمل في رفع ملف التحقيق للقرار (S15) وفي قراءته.
 */
export const classificationLabels = {
  UNINTENTIONAL_ERROR: "خطأ غير مقصود",
  NEGLIGENCE: "إهمال",
  REPEATED_NEGLIGENCE: "إهمال متكرر",
  DELIBERATE_VIOLATION: "مخالفة متعمدة",
  FRAUD: "احتيال",
} satisfies Record<Classification, string>;

export const classificationOrder = ["UNINTENTIONAL_ERROR", "NEGLIGENCE", "REPEATED_NEGLIGENCE", "DELIBERATE_VIOLATION", "FRAUD"] as const satisfies readonly Classification[];

/** وصف قصير لكل تصنيف يظهر في خيار الرفع. */
export const classificationHints = {
  UNINTENTIONAL_ERROR: "وقع الخطأ دون قصد أو علم.",
  NEGLIGENCE: "تقصير في أداء الواجب.",
  REPEATED_NEGLIGENCE: "إهمال تكرّر رغم التنبيه.",
  DELIBERATE_VIOLATION: "مخالفة للتعليمات عن علم وقصد.",
  FRAUD: "تحايل أو تزوير لمنفعة.",
} satisfies Record<Classification, string>;

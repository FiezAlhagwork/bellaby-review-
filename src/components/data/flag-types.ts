import type { Flag, FlagType } from "@/lib/api/types";

/**
 * أسماء أنواع العلامات (`Flag.type`). العقد يعرّف القيم بلا نص عربي، فالنصوص هنا مقترحة وتُؤكَّد مع الباك (docs/backend-requests.md §29.4).
 * تُعاد في S08 (العلامات) وS09 (معالجة العلامة).
 */
export const flagTypeLabels = {
  OUT_OF_RANGE: "خارج نطاق الجهة",
  MOCK_LOCATION: "موقع مزوَّر",
  CLOCK_SKEW: "انحراف ساعة الجهاز",
  DUPLICATE_VISIT: "زيارة مكررة",
  AUTO_CLOSED: "إغلاق آلي",
  DUPLICATE_POINT: "جهة مكررة",
  NEW_VISIT_POINT: "جهة جديدة",
  STOCK_DISCREPANCY: "فرق مخزون",
  ATTENDANCE: "دوام",
  PHOTO_PENDING: "صورة معلّقة",
} satisfies Record<FlagType, string>;

/** نوع السجل المرتبط بالعلامة (`Flag.ref_type`): نصوص مقترحة (docs/backend-requests.md §31.4). */
export const flagRefLabels = {
  visit: "زيارة",
  attendance_session: "جلسة دوام",
  visit_point: "جهة زيارة",
  stock_discrepancy: "فرق مخزون",
  sync_batch: "دفعة مزامنة",
} satisfies Record<NonNullable<Flag["ref_type"]>, string>;

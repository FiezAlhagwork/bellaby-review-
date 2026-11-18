import type { ListKey, RegionClass } from "@/lib/api/types";

// أسماء مفاتيح القوائم المرجعية (`GET /lists/{key}`) وتصنيف المناطق (`RegionClass`) في مكان واحد. العقد لا يسمّيها بالعربية (docs/backend-requests.md §68 و§71).
export const listKeyLabels = {
  visit_point_types: "أنواع الجهات",
  specialties: "الاختصاصات",
  visit_purposes: "أهداف الزيارة",
  visit_outcomes: "نتائج الزيارة",
  not_met_reasons: "أسباب عدم المقابلة",
  return_reasons: "أسباب المرتجع",
  damage_reasons: "أسباب التالف",
} as const satisfies Record<ListKey, string>;

export const listKeyOrder = ["return_reasons", "damage_reasons", "visit_purposes", "visit_outcomes", "not_met_reasons", "specialties", "visit_point_types"] as const satisfies readonly ListKey[];

/** من وصف `RegionClass` في العقد: «استراتيجية / نمو / اختبار / غير اقتصادية حالياً». */
export const regionClassLabels = {
  A: "استراتيجية",
  B: "نمو",
  C: "اختبار",
  D: "غير اقتصادية حالياً",
} as const satisfies Record<RegionClass, string>;

export const regionClassOrder = ["A", "B", "C", "D"] as const satisfies readonly RegionClass[];

import type { Department } from "@/lib/api/types";

// أسماء الأقسام (`Department` في العقد) في مكان واحد. SCIENTIFIC_OFFICE = التسويق والدعاية العلمية قسماً واحداً.
export const departmentLabels = {
  EXECUTIVE: "الإدارة التنفيذية",
  SALES: "المبيعات",
  SCIENTIFIC_OFFICE: "المكتب العلمي",
  ACCOUNTING: "المحاسبة",
  LOGISTICS: "اللوجستيات",
  MONITORING: "المراقبة",
  LEGAL: "القانوني",
  IT: "IT",
} as const satisfies Record<Department, string>;

export const departmentOrder = ["EXECUTIVE", "SALES", "SCIENTIFIC_OFFICE", "ACCOUNTING", "LOGISTICS", "MONITORING", "LEGAL", "IT"] as const satisfies readonly Department[];

/** نوع الحساب (`User.type`). */
export const userTypeLabels = { WEB: "ويب", REP: "مندوب" } as const satisfies Record<"WEB" | "REP", string>;

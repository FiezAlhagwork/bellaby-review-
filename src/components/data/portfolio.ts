import type { Portfolio } from "@/lib/api/types";

// محفظة الصنف (`Portfolio` في العقد: أساسي / نمو / تجريبي) في مكان واحد. لا تُكتب في أي شاشة.
export const portfolioLabels = {
  CORE: "أساسي",
  GROWTH: "نمو",
  TRIAL: "تجريبي",
} as const satisfies Record<Portfolio, string>;

export const portfolioOrder = ["CORE", "GROWTH", "TRIAL"] as const satisfies readonly Portfolio[];

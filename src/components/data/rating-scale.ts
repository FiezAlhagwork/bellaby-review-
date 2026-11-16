import type { components } from "@/lib/api/schema";

// السلّم الموحّد للتقييم (القرار 9) من العقد في مكان واحد: التقرير اليومي والتقييم اليدوي الشهري. لا يُكتب في أي شاشة.
type RatingScale = components["schemas"]["RatingScale"];

export const ratingScaleLabels = {
  "100": "ممتاز",
  "80": "جيد جداً",
  "60": "جيد",
  "40": "مقبول",
  "20": "ضعيف",
} as const satisfies Record<RatingScale, string>;

/** من الأعلى إلى الأدنى، كما يُعرض في الاختيار. */
export const ratingScaleOrder: readonly RatingScale[] = ["100", "80", "60", "40", "20"];

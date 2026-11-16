import type { components } from "@/lib/api/schema";

// ترجمة «مسؤولية التالف» من العقد في مكان واحد (كجدول الحالات). للعلم لا ذمة مالية (وصف العقد). لا تُكتب في أي شاشة.
type Responsibility = components["schemas"]["Responsibility"];

export const responsibilityLabels = {
  AGENT: "الوكيل",
  WAREHOUSE: "المستودع",
  MANUFACTURER: "المصنّع",
  OTHER: "جهة أخرى",
} as const satisfies Record<Responsibility, string>;

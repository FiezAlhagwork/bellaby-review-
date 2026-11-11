import type { components } from "@/lib/api/schema";

// ترجمة نوع الصنف من العقد في مكان واحد (كجدول الحالات). لا تُكتب في أي شاشة.
type ItemType = components["schemas"]["ItemType"];

export const itemTypeLabels = {
  PRODUCT: "منتج",
  SAMPLE: "عينة",
  PROMO: "مادة دعائية",
} as const satisfies Record<ItemType, string>;

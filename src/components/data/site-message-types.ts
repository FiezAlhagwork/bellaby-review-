import type { SiteMessageType } from "@/lib/api/types";

// أنواع رسائل موقع الشركة (`SiteMessage.type`). الأسماء العربية مقترحة منا لأن العقد يعطي القيم الإنجليزية فقط (docs/backend-requests.md §44).
export const siteMessageTypeLabels = {
  INQUIRY: "استفسار",
  PHARMACY_PURCHASE: "شراء صيدلية",
  COMPLAINT: "شكوى",
} satisfies Record<SiteMessageType, string>;

/** ترتيب العرض في الفلاتر. */
export const siteMessageTypeOrder = ["INQUIRY", "PHARMACY_PURCHASE", "COMPLAINT"] as const satisfies readonly SiteMessageType[];

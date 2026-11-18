import type { IntelType } from "@/lib/api/types";

// أنواع معلومات السوق (`IntelType`) وحقول كل نوع (`MarketIntelFields` في العقد، وصفه: «تُثبَّت مع الشركة»). الأسماء العربية مقترحة منا لأن العقد يعطي المفاتيح بالإنجليزية فقط (docs/backend-requests.md §54).
export const intelTypeLabels = {
  COMPETITOR_PRICE: "سعر منافس",
  NEW_PRODUCT: "منتج جديد",
  COMPETITOR_OFFER: "عرض منافس",
  REQUESTED_PRODUCT: "منتج مطلوب",
  STAGNANT_PRODUCT: "منتج راكد",
} satisfies Record<IntelType, string>;

/** ترتيب العرض في التبويبات. */
export const intelTypeOrder = ["COMPETITOR_PRICE", "NEW_PRODUCT", "COMPETITOR_OFFER", "REQUESTED_PRODUCT", "STAGNANT_PRODUCT"] as const satisfies readonly IntelType[];

/** عمود من حقول النوع: مفتاح الحقل في `fields` وعنوانه. */
export type IntelColumn = { key: string; header: string; kind?: "price" | "date" };

/** أعمدة كل نوع بمفاتيح `MarketIntelFields` حرفياً (`item_id` لا يُعرض: رقم داخلي). */
export const intelColumns = {
  COMPETITOR_PRICE: [
    { key: "competitor_brand", header: "الماركة المنافسة" },
    { key: "product_name", header: "المنتج" },
    { key: "price_syp", header: "السعر (ل.س)", kind: "price" },
    { key: "place", header: "المكان" },
  ],
  NEW_PRODUCT: [
    { key: "brand", header: "الماركة" },
    { key: "product_name", header: "المنتج" },
    { key: "details", header: "التفاصيل" },
  ],
  COMPETITOR_OFFER: [
    { key: "competitor_brand", header: "الماركة المنافسة" },
    { key: "offer", header: "العرض" },
    { key: "valid_until", header: "ساري حتى", kind: "date" },
  ],
  REQUESTED_PRODUCT: [
    { key: "product_name", header: "المنتج" },
    { key: "requested_by", header: "طُلب من" },
    { key: "frequency", header: "تكرار الطلب" },
  ],
  STAGNANT_PRODUCT: [
    { key: "product_name", header: "المنتج" },
    { key: "place", header: "المكان" },
    { key: "details", header: "التفاصيل" },
  ],
} satisfies Record<IntelType, readonly IntelColumn[]>;

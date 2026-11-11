import type { EditorBatch, EditorItem } from "@/components/data/LineItemsEditor";
import type { Loadable } from "@/lib/loadable";

// بيانات المعرض للمخزون: أصناف ودفعات بأنواع المحرّر. اليوم الثابت في المعرض 10 تشرين الثاني 2026.
export const stockItems: EditorItem[] = [
  { id: 1, name: "حليب أطفال المرحلة الأولى 400غ", type: "PRODUCT" },
  { id: 2, name: "حليب أطفال المرحلة الثانية 800غ", type: "PRODUCT" },
  { id: 3, name: "سيريلاك أرز 250غ", type: "PRODUCT" },
  { id: 4, name: "عينة حليب أطفال 50غ", type: "SAMPLE" },
  { id: 5, name: "كتيّب توعية الرضاعة", type: "PROMO" },
];

export const stockBatches: Record<string, Loadable<readonly EditorBatch[]>> = {
  "1": {
    status: "ready",
    data: [
      { id: 31, batch_no: "LOT-2611-A", expiry_date: "2026-12-14", status: "ACTIVE", available: 240 },
      { id: 32, batch_no: "LOT-2701-B", expiry_date: "2027-03-01", status: "ACTIVE", available: 600 },
      { id: 33, batch_no: "LOT-2609-C", expiry_date: "2027-06-10", status: "SUSPENDED", available: 120 },
      { id: 30, batch_no: "LOT-2510-D", expiry_date: "2026-10-30", status: "ACTIVE", available: 0 },
    ],
  },
  "2": {
    status: "ready",
    data: [
      { id: 41, batch_no: "LOT-2612-A", expiry_date: "2027-01-20", status: "ACTIVE", available: 480 },
      { id: 42, batch_no: "LOT-2703-B", expiry_date: "2027-05-02", status: "ACTIVE", available: 960 },
    ],
  },
  "3": { status: "ready", data: [{ id: 51, batch_no: "LOT-2611-S", expiry_date: "2027-02-11", status: "ACTIVE", available: 300 }] },
  // 4 غير موجود هنا: يعني قيد التحميل في المحرّر. 5 خطأ في تحميل الدفعات.
  "5": { status: "error", code: "too_many_requests" },
};

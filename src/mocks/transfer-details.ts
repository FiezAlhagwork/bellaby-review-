import type { LocationRef, Transfer, UserRef } from "@/lib/api/types";
import { balanceItems, batchB, batchBooklet, batchCereal, batchInf2A, batchInf2B, batchSample } from "./stock-balances";
import { transferRecipients } from "./transfers-list";

// تفاصيل الصرف (W08): خمس صرفيات بأسطرها تتسق مع قائمة الصرف (W07) بالأرقام والمستلمين والكميات. «الآن» الثابت 10 تشرين الثاني 2026 09:00 UTC.
// لا يُنقل للإنتاج.

export const transferDetailsToday = "2026-11-10";

const warehouse: LocationRef = { id: 1, type: "WAREHOUSE", name: "مستودع دمشق الرئيسي" };
const [infant1, infant2, cereal, sample, booklet] = balanceItems;
const [yasmeen, nour, sahel, , , furat, samer] = transferRecipients;

const ramy: UserRef = { id: 3, name: "رامي السيد" };
const laila: UserRef = { id: 4, name: "ليلى الأحمد" };

/** بالطريق منذ 21 ساعة: لم يؤكّد الوكيل بعد. */
export const inTransitTransfer: Transfer = {
  id: 154,
  reference: "TRF-000154",
  from_location: warehouse,
  to_location: yasmeen,
  status: "IN_TRANSIT",
  lines: [
    { item: infant1, batch: batchB, quantity: 200 },
    { item: infant2, batch: batchInf2A, quantity: 160 },
  ],
  total_quantity: 360,
  sample_request_id: null,
  note: "طلبية الأسبوع.",
  created_by: ramy,
  created_at: "2026-11-09T11:05:00Z",
  hours_in_transit: 21,
};

/** بالطريق منذ 72 ساعة: تجاوز عتبة التنبيه (48). */
export const overdueTransfer: Transfer = {
  id: 158,
  reference: "TRF-000158",
  from_location: warehouse,
  to_location: sahel,
  status: "IN_TRANSIT",
  lines: [
    { item: infant1, batch: batchB, quantity: 1200 },
    { item: cereal, batch: batchCereal, quantity: 600 },
    { item: infant2, batch: batchInf2B, quantity: 600 },
  ],
  total_quantity: 2400,
  sample_request_id: null,
  note: null,
  created_by: ramy,
  created_at: "2026-11-07T09:00:00Z",
  hours_in_transit: 72,
};

/** صرف عينات لمندوب من طلب عينات، أكّد المندوب استلامه (عبر المزامنة). */
export const receivedTransfer: Transfer = {
  id: 156,
  reference: "TRF-000156",
  from_location: warehouse,
  to_location: samer,
  status: "RECEIVED",
  lines: [
    { item: sample, batch: batchSample, quantity: 40 },
    { item: booklet, batch: batchBooklet, quantity: 8 },
  ],
  total_quantity: 48,
  sample_request_id: 17,
  note: null,
  created_by: laila,
  created_at: "2026-11-08T07:15:00Z",
  received_by: { id: 31, name: "سامر الحلبي" },
  received_at: "2026-11-08T12:00:00Z",
  hours_in_transit: null,
};

/** استلمه وكيل (للتجربة التفاعلية). */
export const receivedByAgentTransfer: Transfer = {
  id: 155,
  reference: "TRF-000155",
  from_location: warehouse,
  to_location: nour,
  status: "RECEIVED",
  lines: [
    { item: infant1, batch: batchB, quantity: 600 },
    { item: infant2, batch: batchInf2B, quantity: 600 },
  ],
  total_quantity: 1200,
  sample_request_id: null,
  note: null,
  created_by: ramy,
  created_at: "2026-11-08T08:40:00Z",
  received_by: { id: 41, name: "نبيل العمر" },
  received_at: "2026-11-08T14:20:00Z",
  hours_in_transit: null,
};

/** ألغاه اللوجستي لخطأ في اختيار الوكيل: عادت الكمية للمستودع. */
export const cancelledTransfer: Transfer = {
  id: 157,
  reference: "TRF-000157",
  from_location: warehouse,
  to_location: furat,
  status: "CANCELLED",
  lines: [{ item: infant2, batch: batchInf2A, quantity: 240 }],
  total_quantity: 240,
  sample_request_id: null,
  note: null,
  created_by: laila,
  created_at: "2026-11-07T13:30:00Z",
  cancelled_by: laila,
  cancelled_at: "2026-11-07T14:10:00Z",
  cancel_reason: "اخترت وكيلاً خطأً: المقصود وكالة الساحل للتوزيع.",
  hours_in_transit: null,
};

/** صرف عينات لمندوب أُلغي، ثم وصل تأكيد المندوب بلا اتصال فرُفض (transfer_cancelled). الحل صرف جديد. */
export const cancelledRepTransfer: Transfer = {
  id: 149,
  reference: "TRF-000149",
  from_location: warehouse,
  to_location: samer,
  status: "CANCELLED",
  lines: [{ item: sample, batch: batchSample, quantity: 12 }],
  total_quantity: 12,
  sample_request_id: null,
  note: null,
  created_by: laila,
  created_at: "2026-11-01T12:00:00Z",
  cancelled_by: laila,
  cancelled_at: "2026-11-01T15:30:00Z",
  cancel_reason: "كمية خاطئة في الأسطر.",
  hours_in_transit: null,
};

/** محاولة تأكيد المندوب سامر الحلبي بعد الإلغاء (وصلت مع أول مزامنة بعد عودة الاتصال). */
export const rejectedReceipts = [{ by: { id: 31, name: "سامر الحلبي" }, at: "2026-11-03T08:40:00Z" }] satisfies { by: UserRef; at: string }[];

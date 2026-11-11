import type { BatchRef, StockReceipt } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import type { StockReceiptForm } from "@/features/stock/views/StockReceiptFormView";
import { balanceItems, batchA, batchB, batchBooklet, batchC, batchCereal, batchInf2A, batchInf2B, batchSample, damascus } from "./stock-balances";

// بيانات إدخال البضاعة (W04): دفعات الأصناف المعروفة ونماذج معبّأة لكل حالة ونتيجة إدخال. اليوم الثابت 10 تشرين الثاني 2026. لا يُنقل للإنتاج.

export const receiptToday = "2026-11-10";

/** `GET /batches?item_id=` لكل صنف: الدفعات المسجّلة (ومنها الموقوفة). */
export const knownBatches: Record<string, Loadable<readonly BatchRef[]>> = {
  "1": { status: "ready", data: [batchA, batchB, batchC] },
  "2": { status: "ready", data: [batchInf2A, batchInf2B] },
  "3": { status: "ready", data: [batchCereal] },
  "4": { status: "ready", data: [batchSample] },
  "5": { status: "ready", data: [batchBooklet] },
};

const line = (id: string, itemId: string, batchNo: string, expiryDate: string, quantity: number) => ({ id, itemId, batchNo, expiryDate, quantity });
const base = { locationId: "1", note: "", confirmNearExpiry: false } as const;

/** سطران جديدان سليمان. */
export const filledForm: StockReceiptForm = {
  ...base,
  note: "شحنة الأسبوع من المصنع.",
  lines: [line("a", "1", "LOT-2705-A", "2027-05-20", 480), line("b", "3", "LOT-2705-S", "2027-04-02", 240)],
};

/** تاريخ الانتهاء مضى: لا يُدخل. */
export const expiredForm: StockReceiptForm = { ...base, lines: [line("a", "1", "LOT-2510-D", "2026-10-30", 60)] };

/** ينتهي بعد 40 يوماً: تحذير يحتاج تأكيداً (التأكيد غير مفعّل). */
export const nearExpiryForm: StockReceiptForm = { ...base, lines: [line("a", "2", "LOT-2612-Z", "2026-12-20", 120), line("b", "3", "LOT-2705-S", "2027-04-02", 240)] };

/** LOT-2701-B موجودة لهذا الصنف بالتاريخ نفسه: تُضاف الكمية. */
export const batchExistsForm: StockReceiptForm = { ...base, lines: [line("a", "1", "LOT-2701-B", "2027-03-01", 120), line("b", "3", "LOT-2705-S", "2027-04-02", 240)] };

/** LOT-2701-B مسجّلة بتاريخ 1 آذار 2027 وهنا تاريخ مختلف. */
export const batchMismatchForm: StockReceiptForm = { ...base, lines: [line("a", "1", "LOT-2701-B", "2027-04-01", 120)] };

/** نماذج بأخطاء `validation_failed` من الخادم (النص عربي كما يرجع). */
export const validationForm: StockReceiptForm = { locationId: null, note: "", confirmNearExpiry: false, lines: [line("a", "1", "LOT-2705-A", "2027-05-20", 480), line("b", "3", "LOT-2705-S", "2027-04-02", 0)] };
export const validationErrors = { location_id: "حقل الموقع مطلوب.", "lines.1.quantity": "الكمية يجب ألا تقل عن 1." };

/** رد `POST /stock-receipts` 201: دفعة جديدة ودفعة موجودة أُضيفت كميتها. */
export const savedReceipt: StockReceipt = {
  id: 33,
  reference: "RCV-000033",
  location: damascus,
  received_at: "2026-11-10T09:20:00Z",
  note: "شحنة الأسبوع من المصنع.",
  created_by: { id: 3, name: "رامي السيد" },
  lines: [
    { item: balanceItems[0], batch: { id: 81, batch_no: "LOT-2705-A", expiry_date: "2027-05-20", status: "ACTIVE" }, quantity: 480, batch_created: true },
    { item: balanceItems[0], batch: batchB, quantity: 120, batch_created: false },
    { item: balanceItems[2], batch: { id: 82, batch_no: "LOT-2705-S", expiry_date: "2027-04-02", status: "ACTIVE" }, quantity: 240, batch_created: true },
  ],
};

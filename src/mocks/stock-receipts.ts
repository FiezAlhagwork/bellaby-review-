import type { BatchRef, LocationRef, StockReceipt, UserRef } from "@/lib/api/types";
import { aleppo, balanceItems, batchA, batchB, batchBooklet, batchC, batchCereal, batchInf2A, batchInf2B, batchSample, damascus } from "./stock-balances";

// سجل الإدخال (W05): 26 إدخالاً بين 27 تشرين الأول و10 تشرين الثاني 2026، منها متعدد الأسطر، ومنها ما أنشأ دفعة جديدة وما أُضيف لدفعة موجودة.
// الأوقات UTC بين 07:00 و14:00 فتقع في اليوم نفسه بتوقيت دمشق. الكتابة من الأقدم إلى الأحدث ويُقلب الترتيب في النهاية. لا يُنقل للإنتاج.

export const receiptsToday = "2026-11-10";

const [infant1, infant2, cereal, sample, booklet] = balanceItems;

const ramy: UserRef = { id: 3, name: "رامي السيد" };
const zeyad: UserRef = { id: 6, name: "زياد العلي" };

const newBatchA: BatchRef = { id: 81, batch_no: "LOT-2705-A", expiry_date: "2027-05-20", status: "ACTIVE" };
const newBatchS: BatchRef = { id: 82, batch_no: "LOT-2705-S", expiry_date: "2027-04-02", status: "ACTIVE" };

type ReceiptLine = NonNullable<StockReceipt["lines"]>[number];
const line = (item: ReceiptLine["item"], batch: BatchRef, quantity: number, created: boolean): ReceiptLine => ({ item, batch, quantity, batch_created: created });

function receipt(id: number, at: string, location: LocationRef, by: UserRef, lines: ReceiptLine[], note: string | null = null): StockReceipt {
  return { id, reference: `RCV-${String(id).padStart(6, "0")}`, location, received_at: `2026-${at}:00Z`, note, created_by: by, lines };
}

const oldestFirst: StockReceipt[] = [
  receipt(50, "10-27T09:00", damascus, ramy, [line(infant1, batchA, 300, true), line(infant1, batchC, 120, true)], "شحنة المصنع الشهرية"),
  receipt(51, "10-27T11:30", damascus, ramy, [line(infant2, batchInf2A, 480, true)]),
  receipt(52, "10-28T10:00", damascus, zeyad, [line(booklet, batchBooklet, 400, true), line(sample, batchSample, 80, true)], "مواد دعائية وعينات"),
  receipt(53, "10-28T12:15", aleppo, zeyad, [line(infant1, batchB, 360, true)]),
  receipt(54, "10-29T09:20", aleppo, zeyad, [line(cereal, batchCereal, 150, true)]),
  receipt(55, "10-29T11:45", damascus, ramy, [line(infant1, batchB, 840, false)]),
  receipt(56, "10-30T09:05", damascus, ramy, [line(infant2, batchInf2B, 720, true)]),
  receipt(57, "10-30T13:15", damascus, ramy, [line(cereal, batchCereal, 372, true)]),
  receipt(58, "10-31T10:00", aleppo, zeyad, [line(infant2, batchInf2B, 480, false)]),
  receipt(59, "10-31T12:30", damascus, ramy, [line(sample, batchSample, 40, false)]),
  receipt(60, "11-01T09:30", damascus, zeyad, [line(infant1, batchA, 60, false), line(infant2, batchInf2A, 120, false)]),
  receipt(61, "11-01T11:00", damascus, ramy, [line(booklet, batchBooklet, 200, false)]),
  receipt(62, "11-02T09:10", aleppo, zeyad, [line(cereal, batchCereal, 90, false)]),
  receipt(63, "11-02T12:00", damascus, ramy, [line(infant2, batchInf2B, 240, false)], "دفعة إضافية من المورّد نفسه"),
  receipt(64, "11-03T09:30", damascus, ramy, [line(infant1, batchB, 100, false)]),
  receipt(65, "11-03T11:45", damascus, zeyad, [line(sample, batchSample, 60, false), line(booklet, batchBooklet, 100, false)]),
  receipt(66, "11-04T10:20", aleppo, zeyad, [line(infant1, batchB, 120, false)]),
  receipt(67, "11-04T13:00", damascus, ramy, [line(infant2, batchInf2A, 60, false)]),
  receipt(68, "11-05T09:45", damascus, ramy, [line(cereal, batchCereal, 300, false)]),
  receipt(69, "11-06T09:10", damascus, ramy, [line(cereal, batchCereal, 300, false)]),
  receipt(70, "11-06T10:55", damascus, ramy, [line(cereal, batchCereal, 300, false)]),
  receipt(71, "11-07T11:00", damascus, zeyad, [line(infant1, batchA, 50, false)]),
  receipt(72, "11-08T09:15", damascus, ramy, [line(booklet, batchBooklet, 150, false)]),
  receipt(73, "11-09T09:30", damascus, ramy, [line(infant1, batchB, 600, false)], "شحنة الأسبوع"),
  receipt(74, "11-10T08:10", damascus, zeyad, [line(infant2, batchInf2B, 300, false)]),
  receipt(75, "11-10T09:20", damascus, ramy, [line(infant1, newBatchA, 480, true), line(infant1, batchB, 120, false), line(cereal, newBatchS, 240, true)], "شحنة الأسبوع من المصنع."),
];

/** الأحدث أولاً، كما يرجعها `GET /stock-receipts`. */
export const stockReceipts: readonly StockReceipt[] = [...oldestFirst].reverse();

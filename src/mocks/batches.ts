import { daysBetween } from "@/lib/calendar";
import type { BalanceLine, Batch, BatchRef, ItemRef, LocationRef, RecallEvent, RecallTrace, UserRef } from "@/lib/api/types";
import { allBalances, balanceItems, damascus, otherLocations } from "./stock-balances";
import { cerealSample } from "./sample-requests";

// الدفعات (W17 وW18 وW19): 24 دفعة بأصناف المعرض، منها موقوفة ومنتهية وقريبة الانتهاء ونافدة من المستودع، وسجل الإيقاف والفك وتقريرا تتبع.
// اليوم الثابت في المعرض 10 تشرين الثاني 2026، و`days_to_expiry` تُحسب منه. الأوقات UTC. لا يُنقل للإنتاج.

export const batchesToday = "2026-11-10";

const [infant1, infant2, cereal, sample, booklet] = balanceItems;

export const batchItems: readonly ItemRef[] = [infant1, infant2, cereal, sample, booklet, cerealSample];

const rami: UserRef = { id: 3, name: "رامي السيد" };
const ziad: UserRef = { id: 1, name: "زياد المصري" };
const rana: UserRef = { id: 6, name: "رنا الشامي" };

type Row = [id: number, batchNo: string, item: ItemRef, expiry: string, received: number, onHand: number, suspendedReason?: string];

const rows: Row[] = [
  [81, "LOT-2611-Q", cerealSample, "2027-03-20", 1000, 300],
  [71, "LOT-2612-P", booklet, "2027-06-30", 800, 400],
  [62, "LOT-2609-X", sample, "2027-01-08", 600, 40, "ورد بلاغ من المورّد بسحب الدفعة احترازياً."],
  [61, "LOT-2610-X", sample, "2026-11-24", 400, 80],
  [52, "LOT-2610-S", cereal, "2026-12-30", 480, 96],
  [51, "LOT-2611-S", cereal, "2027-02-11", 900, 450],
  [43, "LOT-2608-C", infant2, "2027-02-14", 960, 0, "سحب احترازي بطلب من المورّد بعد ملاحظة في تحليل عيّنة."],
  [42, "LOT-2703-B", infant2, "2027-05-02", 2400, 1380],
  [41, "LOT-2612-A", infant2, "2027-01-20", 1200, 480],
  [34, "LOT-2605-D", infant1, "2026-10-30", 360, 0],
  [33, "LOT-2609-C", infant1, "2027-06-10", 600, 120, "اشتباه بتلف في عبوات من الدفعة بعد شكوى من صيدلية في حلب."],
  [32, "LOT-2701-B", infant1, "2027-03-01", 2400, 960],
  [31, "LOT-2611-A", infant1, "2026-12-14", 1200, 240],
  // دفعات أقدم استُنفدت من المستودع.
  [30, "LOT-2604-F", infant1, "2026-12-02", 480, 0],
  [29, "LOT-2603-E", infant1, "2026-11-18", 360, 0],
  [28, "LOT-2602-D", infant2, "2026-11-30", 600, 0],
  [27, "LOT-2601-H", infant2, "2027-01-30", 720, 0],
  [26, "LOT-2511-S", cereal, "2026-11-05", 300, 0],
  [25, "LOT-2510-S", cereal, "2026-10-20", 300, 0],
  [24, "LOT-2509-X", sample, "2026-12-12", 240, 0],
  [23, "LOT-2508-P", booklet, "2027-04-15", 500, 0],
  [22, "LOT-2507-A", infant1, "2027-02-02", 840, 0],
  [21, "LOT-2506-B", infant2, "2027-03-10", 1200, 0],
  [20, "LOT-2505-Q", cerealSample, "2026-12-22", 600, 0],
];

function toBatch([id, batch_no, item, expiry_date, received_total, warehouse_on_hand, reason]: Row): Batch {
  return {
    id,
    batch_no,
    expiry_date,
    status: reason ? "SUSPENDED" : "ACTIVE",
    item,
    received_total,
    warehouse_on_hand,
    days_to_expiry: daysBetween(batchesToday, expiry_date),
    suspended_reason: reason ?? null,
  };
}

/** كل الدفعات بترتيب العرض (الأحدث رقماً أولاً)، لا مرتّبة بالعقد. */
export const batchesList: readonly Batch[] = rows.map(toBatch);

export const findBatch = (id: number): Batch => {
  const found = batchesList.find((batch) => batch.id === id);
  if (!found) throw new Error(`دفعة غير معرّفة في المعرض: ${id}`);
  return found;
};

const refOf = ({ id, batch_no, expiry_date, status }: Batch): BatchRef => ({ id, batch_no, expiry_date, status });

// أرصدة الدفعات الموقوفة تتجاوز المستودع: ما عند الوكلاء والمندوبين (أرصدة W02 لا تحملها).
const [yasmine, nour, sahel, samer, omar] = otherLocations;
const huda: LocationRef = { id: 16, type: "REP", name: "هدى العلي" };

const extraBalances = [
  { location: nour, item: infant1, batch: refOf(findBatch(33)), quantity: 36, in_transit_out: 0 },
  { location: yasmine, item: infant1, batch: refOf(findBatch(33)), quantity: 24, in_transit_out: 0 },
  { location: yasmine, item: infant2, batch: refOf(findBatch(43)), quantity: 200, in_transit_out: 0 },
  { location: sahel, item: infant2, batch: refOf(findBatch(43)), quantity: 160, in_transit_out: 0 },
  { location: nour, item: infant2, batch: refOf(findBatch(43)), quantity: 80, in_transit_out: 0 },
  { location: damascus, item: sample, batch: refOf(findBatch(62)), quantity: 40, in_transit_out: 0 },
  { location: samer, item: sample, batch: refOf(findBatch(62)), quantity: 18, in_transit_out: 0 },
  { location: omar, item: sample, batch: refOf(findBatch(62)), quantity: 7, in_transit_out: 0 },
  { location: huda, item: sample, batch: refOf(findBatch(62)), quantity: 11, in_transit_out: 0 },
] satisfies BalanceLine[];

/** `GET /stock/balances?batch_id=` لدفعة: رصيدها في كل موقع (مستودع ووكيل ومندوب). رصيد المندوب السالب جائز له وحده. */
export function batchBalances(batchId: number): BalanceLine[] {
  return [...allBalances.filter((line) => line.batch.id === batchId), ...extraBalances.filter((line) => line.batch.id === batchId)];
}

/** `GET /recalls?batch_id=`: الأحدث أولاً. */
export const batchRecalls: Record<number, readonly RecallEvent[]> = {
  33: [
    { id: 14, type: "SUSPEND", batch: refOf(findBatch(33)), reason: "اشتباه بتلف في عبوات من الدفعة بعد شكوى من صيدلية في حلب.", by: rami, on_behalf_of: null, at: "2026-11-04T08:40:00Z" },
    { id: 11, type: "UNSUSPEND", batch: { ...refOf(findBatch(33)), status: "ACTIVE" }, reason: "ظهرت نتيجة الفحص سليمة، فعادت الدفعة للحركة.", by: rana, on_behalf_of: ziad, at: "2026-10-15T10:05:00Z" },
    { id: 9, type: "SUSPEND", batch: { ...refOf(findBatch(33)), status: "ACTIVE" }, reason: "إيقاف مؤقت لحين نتيجة فحص عيّنة من المخبر.", by: ziad, on_behalf_of: null, at: "2026-10-12T07:15:00Z" },
  ],
  43: [{ id: 12, type: "SUSPEND", batch: refOf(findBatch(43)), reason: "سحب احترازي بطلب من المورّد بعد ملاحظة في تحليل عيّنة.", by: ziad, on_behalf_of: null, at: "2026-11-02T09:30:00Z" }],
  62: [{ id: 15, type: "SUSPEND", batch: refOf(findBatch(62)), reason: "ورد بلاغ من المورّد بسحب الدفعة احترازياً.", by: rami, on_behalf_of: null, at: "2026-11-06T08:10:00Z" }],
};

const agent = (id: number, name: string) => ({ id, name });

/** `GET /batches/33/recall-trace`: دفعة منتج موقوفة وصلت عملاء عبر الوكلاء، بلا توزيع في الزيارات. */
export const productTrace: RecallTrace = {
  batch: findBatch(33),
  generated_at: "2026-11-10T11:20:00Z",
  holders: [
    { location: damascus, on_hand: 120, in_transit: 0 },
    { location: nour, on_hand: 36, in_transit: 0 },
    { location: yasmine, on_hand: 24, in_transit: 0 },
  ],
  customer_deliveries: [
    { customer_id: 201, customer_name: "صيدلية الشفاء — الميدان", phone: "+963944120301", agent: agent(7, "وكالة الياسمين للتوزيع"), quantity: 120, delivered_at: "2026-10-26T09:10:00Z" },
    { customer_id: 202, customer_name: "صيدلية الأمل — المزة", phone: "+963933455102", agent: agent(7, "وكالة الياسمين للتوزيع"), quantity: 96, delivered_at: "2026-10-27T11:45:00Z" },
    { customer_id: 215, customer_name: "صيدلية الفرقان الطبية — حلب", phone: "+963955670218", agent: agent(9, "مؤسسة النور للتوزيع"), quantity: 84, delivered_at: "2026-10-29T08:30:00Z" },
    { customer_id: 216, customer_name: "صيدلية الحياة — حلب", phone: null, agent: agent(9, "مؤسسة النور للتوزيع"), quantity: 48, delivered_at: "2026-10-30T13:20:00Z" },
    { customer_id: 233, customer_name: "صيدلية السلام — اللاذقية", phone: "+963988341290", agent: agent(8, "وكالة الساحل للتوزيع"), quantity: 36, delivered_at: "2026-11-01T10:05:00Z" },
    { customer_id: 203, customer_name: "صيدلية دمشق الطبية — جرمانا", phone: "+963946880412", agent: agent(7, "وكالة الياسمين للتوزيع"), quantity: 36, delivered_at: "2026-11-03T12:15:00Z" },
  ],
  visit_distributions: [],
};

/** `GET /batches/62/recall-trace`: دفعة عيّنات موقوفة في 6 تشرين الثاني، وُزّع منها بعد الإيقاف من أجهزة كانت دون اتصال. */
export const sampleTrace: RecallTrace = {
  batch: findBatch(62),
  generated_at: "2026-11-10T11:25:00Z",
  holders: [
    { location: damascus, on_hand: 40, in_transit: 0 },
    { location: samer, on_hand: 18, in_transit: 0 },
    { location: omar, on_hand: 7, in_transit: 0 },
    { location: huda, on_hand: 11, in_transit: 0 },
  ],
  customer_deliveries: [],
  visit_distributions: [
    { rep: { id: 32, name: "عمر الخطيب" }, visit_point_name: "عيادة د. لينا الأيوبي — المزة", quantity: 6, at: "2026-11-09T09:40:00Z", after_suspension: true },
    { rep: { id: 32, name: "عمر الخطيب" }, visit_point_name: "مستوصف الأمل — جرمانا", quantity: 10, at: "2026-11-08T08:25:00Z", after_suspension: true },
    { rep: { id: 33, name: "هدى العلي" }, visit_point_name: "صيدلية الربيع — المالكي", quantity: 4, at: "2026-11-07T11:50:00Z", after_suspension: true },
    { rep: { id: 31, name: "سامر الحلبي" }, visit_point_name: "عيادة أطفال د. سامي قصّاب", quantity: 8, at: "2026-11-05T10:10:00Z", after_suspension: false },
    { rep: { id: 33, name: "هدى العلي" }, visit_point_name: "مركز الرعاية — كفرسوسة", quantity: 12, at: "2026-11-04T09:00:00Z", after_suspension: false },
    { rep: { id: 32, name: "عمر الخطيب" }, visit_point_name: "عيادة د. ريم حداد — المزة", quantity: 9, at: "2026-11-03T12:35:00Z", after_suspension: false },
    { rep: { id: 31, name: "سامر الحلبي" }, visit_point_name: "صيدلية الشفاء — الميدان", quantity: 14, at: "2026-11-02T08:50:00Z", after_suspension: false },
  ],
};

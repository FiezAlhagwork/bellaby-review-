import type { EditorBatch } from "@/components/data/LineItemsEditor";
import type { AgentListRow } from "@/features/agents/views/AgentsListView";
import type { AgentTabsData } from "@/features/agents/views/AgentDetailsView";
import type { SalesBar, SalesOverview } from "@/features/sales/views/SalesManagerDashboardView";
import type { AgentReturnForm, AgentReturnOptions } from "@/features/returns/views/AgentReturnFormView";
import { errorMessage } from "@/lib/api/error-messages";
import type { Agent, AgentRef, AgentReturn, BalanceLine, BatchRef, CoverageLine, Customer, CustomerReturn, Delivery, DeliveryStatus, Governorate, ItemRef, ListEntry, LocationRef, Money, MonthlyPlan, PlanTarget, Receivable, UserRef } from "@/lib/api/types";
import type { IsoMonth } from "@/lib/calendar";
import type { Loadable } from "@/lib/loadable";
import { agentReturnsList } from "./agent-returns";
import { stockItems } from "./stock";
import { balanceItems, batchA, batchB, batchC, batchCereal, batchInf2A, batchInf2B, otherLocations } from "./stock-balances";
import { transfersList } from "./transfers-list";

// بيانات مدير المبيعات (M01–M04 وM07): ستة وكلاء بينهم معطّل، و24 عميلاً، و19 تسليماً بحالاتها، وخطة المبيعات لشهرين. اليوم الثابت 10 تشرين الثاني 2026.
// المبالغ نصوص عشرية. الجمع في هذا الملف على أجزاء السنت لبناء بيانات متسقة فقط، ولا حساب على المبالغ في الـ views. لا يُنقل للإنتاج.

export const salesToday = "2026-11-10";
export const salesNow = "2026-11-10T09:00:00Z";
/** الشهر الجاري (مبدئي) والشهر المغلق قبله. */
export const currentMonth: IsoMonth = "2026-11";
export const closedMonth: IsoMonth = "2026-10";

const cents = (amount: Money): number => Math.round(Number(amount) * 100);
const money = (value: number): Money => (value / 100).toFixed(2);
const sumMoney = (amounts: readonly Money[]): Money => money(amounts.reduce((sum, amount) => sum + cents(amount), 0));

export const salesManager: UserRef = { id: 6, name: "رنا الشامي" };

export const salesGovernorates = [
  { id: 1, name: "دمشق" },
  { id: 2, name: "ريف دمشق" },
  { id: 3, name: "حلب" },
  { id: 4, name: "حمص" },
  { id: 5, name: "حماة" },
  { id: 6, name: "اللاذقية" },
  { id: 7, name: "طرطوس" },
  { id: 8, name: "درعا" },
  { id: 9, name: "الحسكة" },
  { id: 10, name: "دير الزور" },
] satisfies Governorate[];

const [damascus, rural, aleppo, homs, hama, latakia, tartus, daraa, hasakah, deir] = salesGovernorates;

// ————— الوكلاء —————

type AgentDef = { id: number; name: string; contact: string; phone: string; governorates: Governorate[]; address: string; user: UserRef | null; active: boolean; showOnSite: boolean };

const agentDefs: AgentDef[] = [
  { id: 7, name: "وكالة الياسمين للتوزيع", contact: "ياسر الحمصي", phone: "+963944210001", governorates: [damascus, rural], address: "دمشق، ركن الدين، شارع الشهداء", user: { id: 41, name: "ياسر الحمصي" }, active: true, showOnSite: true },
  { id: 9, name: "مؤسسة النور للتوزيع", contact: "عبد الله النوري", phone: "+963955210002", governorates: [aleppo], address: "حلب، الفرقان، شارع النيل", user: { id: 42, name: "عبد الله النوري" }, active: true, showOnSite: true },
  { id: 8, name: "وكالة الساحل للتوزيع", contact: "ماهر الشيخ", phone: "+963933210003", governorates: [latakia, tartus], address: "اللاذقية، الزراعة، شارع 8 آذار", user: { id: 43, name: "ماهر الشيخ" }, active: true, showOnSite: true },
  { id: 12, name: "مؤسسة الشام للتجارة", contact: "سمير الدباغ", phone: "+963944210004", governorates: [homs, hama], address: "حمص، الحمرا، شارع الدبلان", user: { id: 44, name: "سمير الدباغ" }, active: true, showOnSite: false },
  { id: 18, name: "مؤسسة الجزيرة للتوزيع", contact: "فراس العلي", phone: "+963955210005", governorates: [hasakah, daraa], address: "الحسكة، الغويران، طريق المطار", user: { id: 45, name: "فراس العلي" }, active: true, showOnSite: false },
  { id: 21, name: "شركة الفرات للأغذية", contact: "خالد الجاسم", phone: "+963933210006", governorates: [deir], address: "دير الزور، القصور، شارع الوادي", user: null, active: false, showOnSite: false },
];

const agentRef = (def: AgentDef): AgentRef => ({ id: def.id, name: def.name, governorates: def.governorates });
const agentRefs: Record<number, AgentRef> = Object.fromEntries(agentDefs.map((def) => [def.id, agentRef(def)]));
const agentLocation = (def: AgentDef): LocationRef => ({ id: def.id, type: "AGENT", name: def.name });

export const agentFilterOptions: readonly AgentRef[] = agentDefs.map(agentRef);

// ————— العملاء —————

type CustomerDef = [id: number, name: string, agentId: number, governorate: Governorate, linked: boolean, address: string];

const customerDefs: CustomerDef[] = [
  [1001, "صيدلية الشفاء", 7, damascus, true, "دمشق، المزة، أوتوستراد المزة"],
  [1002, "صيدلية الأمل", 7, damascus, true, "دمشق، الميدان، شارع الجزماتية"],
  [1003, "صيدلية الحياة", 7, rural, false, "ريف دمشق، جرمانا، الشارع العام"],
  [1004, "صيدلية ابن سينا", 7, damascus, true, "دمشق، كفرسوسة، شارع الفيحاء"],
  [1005, "صيدلية النهضة", 7, rural, true, "ريف دمشق، دوما، ساحة الأسد"],
  [1006, "صيدلية الرحمة", 7, damascus, false, "دمشق، الشعلان، شارع الحمراء"],
  [1007, "صيدلية الإسراء", 9, aleppo, true, "حلب، الفرقان، شارع النيل"],
  [1008, "صيدلية العافية", 9, aleppo, true, "حلب، الشهباء، شارع القوتلي"],
  [1009, "صيدلية السلام", 9, aleppo, false, "حلب، الأشرفية، الشارع الرئيسي"],
  [1010, "صيدلية الوفاء", 9, aleppo, true, "حلب، السليمانية، شارع بارون"],
  [1011, "صيدلية الصفا", 9, aleppo, true, "حلب، الميدان، شارع المطار القديم"],
  [1012, "صيدلية البحر", 8, latakia, true, "اللاذقية، الزراعة، شارع 8 آذار"],
  [1013, "صيدلية الشاطئ", 8, tartus, false, "طرطوس، الكورنيش، شارع الثورة"],
  [1014, "صيدلية النور", 8, latakia, true, "اللاذقية، الصليبة، الشارع العام"],
  [1015, "صيدلية الصحة", 8, tartus, true, "طرطوس، الشيخ سعد، ساحة السوق"],
  [1016, "صيدلية الأندلس", 12, homs, true, "حمص، الحمرا، شارع الدبلان"],
  [1017, "صيدلية العاصي", 12, hama, false, "حماة، الحاضر، شارع الكورنيش"],
  [1018, "صيدلية الزهراء", 12, homs, true, "حمص، الوعر، السوق المركزي"],
  [1019, "صيدلية الكندي", 12, hama, true, "حماة، البرناوي، الشارع الرئيسي"],
  [1020, "صيدلية حوران", 18, daraa, true, "درعا، المحطة، شارع الجامع"],
  [1021, "صيدلية البشائر", 18, hasakah, false, "الحسكة، النشوة، طريق الشدادي"],
  [1022, "صيدلية الجنوب", 18, daraa, true, "درعا، البلد، الشارع الغربي"],
  [1023, "صيدلية الرجاء", 21, deir, false, "دير الزور، الجورة، شارع بورسعيد"],
  [1024, "صيدلية دجلة", 21, deir, true, "دير الزور، القصور، شارع الوادي"],
];

const customerId: Record<string, number> = Object.fromEntries(customerDefs.map(([id, name]) => [name.replace("صيدلية ", ""), id]));
const customerName = (id: number): string => customerDefs.find(([defId]) => defId === id)?.[1] ?? "";

// ————— التسليمات —————

const [infant1, infant2, cereal] = balanceItems;
const unitPrice: Record<number, Money> = { 1: "4.50", 2: "7.20", 3: "3.10" };

type LineDef = [item: ItemRef, batch: BatchRef, quantity: number];

function deliveryLines(lines: LineDef[], idBase: number): NonNullable<Delivery["lines"]> {
  return lines.map(([item, batch, quantity], index) => ({
    id: idBase * 10 + index,
    item,
    batch,
    quantity,
    unit_price: unitPrice[item.id ?? 1],
    line_value: money(quantity * cents(unitPrice[item.id ?? 1])),
    returned_accepted: 0,
    returned_pending: 0,
    returnable_quantity: quantity,
  }));
}

type DeliveryDef = {
  id: number;
  customer: string;
  agentId: number;
  delivered: string;
  expected: string;
  status: DeliveryStatus;
  lines: LineDef[];
  extra?: Partial<Delivery>;
};

const deliveryDefs: DeliveryDef[] = [
  { id: 2101, customer: "الشفاء", agentId: 7, delivered: "10-01", expected: "2026-10-25", status: "UNPAID", lines: [[infant1, batchA, 120]] },
  { id: 2102, customer: "الأمل", agentId: 7, delivered: "10-05", expected: "2026-10-30", status: "UNPAID", lines: [[infant2, batchInf2A, 60], [infant1, batchA, 24]] },
  { id: 2103, customer: "الحياة", agentId: 7, delivered: "10-20", expected: "2026-11-20", status: "UNPAID", lines: [[infant1, batchB, 80]] },
  { id: 2104, customer: "ابن سينا", agentId: 7, delivered: "09-20", expected: "2026-10-10", status: "PAID", lines: [[infant1, batchB, 90]], extra: { collected_at: "2026-10-08T10:00:00Z", paid_on_time: true } },
  { id: 2105, customer: "الإسراء", agentId: 9, delivered: "09-25", expected: "2026-10-15", status: "UNPAID", lines: [[infant1, batchB, 200]] },
  { id: 2106, customer: "العافية", agentId: 9, delivered: "10-02", expected: "2026-10-28", status: "UNPAID", lines: [[infant2, batchInf2B, 40]], extra: { dispute_id: 5001 } },
  { id: 2107, customer: "السلام", agentId: 9, delivered: "10-28", expected: "2026-11-25", status: "UNPAID", lines: [[infant2, batchInf2B, 96]] },
  { id: 2108, customer: "الوفاء", agentId: 9, delivered: "10-10", expected: "2026-11-05", status: "UNPAID", lines: [[cereal, batchCereal, 150]] },
  { id: 2109, customer: "الصفا", agentId: 9, delivered: "09-28", expected: "2026-10-20", status: "PAID", lines: [[infant1, batchA, 60]], extra: { collected_at: "2026-10-22T11:30:00Z", paid_on_time: false } },
  { id: 2110, customer: "البحر", agentId: 8, delivered: "10-08", expected: "2026-11-01", status: "UNPAID", lines: [[infant2, batchInf2A, 72]] },
  { id: 2111, customer: "الشاطئ", agentId: 8, delivered: "11-02", expected: "2026-11-30", status: "UNPAID", lines: [[infant1, batchA, 60]] },
  { id: 2112, customer: "النور", agentId: 8, delivered: "09-30", expected: "2026-10-18", status: "PAID", lines: [[cereal, batchCereal, 80]], extra: { collected_at: "2026-10-17T09:15:00Z", paid_on_time: true } },
  { id: 2113, customer: "الأندلس", agentId: 12, delivered: "09-15", expected: "2026-10-05", status: "UNPAID", lines: [[infant1, batchB, 300]] },
  {
    id: 2114,
    customer: "العاصي",
    agentId: 12,
    delivered: "10-25",
    expected: "2026-11-15",
    status: "APPROVAL_PENDING",
    lines: [[infant2, batchInf2B, 50]],
    extra: { pending_request: { type: "CANCEL", reason: "رفضت الصيدلية الاستلام لانتهاء التعاقد.", requested_at: "2026-11-08T08:00:00Z" } },
  },
  { id: 2115, customer: "الزهراء", agentId: 12, delivered: "10-01", expected: "2026-10-22", status: "PAID", lines: [[infant2, batchInf2B, 40]], extra: { collected_at: "2026-10-21T13:00:00Z", paid_on_time: true } },
  { id: 2116, customer: "حوران", agentId: 18, delivered: "10-12", expected: "2026-11-08", status: "UNPAID", lines: [[cereal, batchCereal, 90]] },
  { id: 2117, customer: "البشائر", agentId: 18, delivered: "11-04", expected: "2026-12-01", status: "UNPAID", lines: [[infant2, batchInf2B, 48]] },
  {
    id: 2118,
    customer: "الرجاء",
    agentId: 21,
    delivered: "10-05",
    expected: "2026-10-26",
    status: "CANCELLED",
    lines: [[infant1, batchA, 30]],
    extra: { decision: { type: "CANCEL", outcome: "APPROVED", reason: "ألغي الطلب قبل وصول الشحنة.", decided_by: salesManager, decided_at: "2026-10-12T09:00:00Z", on_behalf_of: null } },
  },
  { id: 2119, customer: "دجلة", agentId: 21, delivered: "09-10", expected: "2026-10-01", status: "UNPAID", lines: [[infant1, batchA, 100]] },
  { id: 2122, customer: "ابن سينا", agentId: 7, delivered: "10-22", expected: "2026-11-18", status: "UNPAID", lines: [[infant2, batchInf2A, 36], [cereal, batchCereal, 20]] },
  {
    id: 2120,
    customer: "الرحمة",
    agentId: 7,
    delivered: "09-05",
    expected: "2026-09-28",
    status: "WRITTEN_OFF",
    lines: [[infant2, batchInf2A, 30]],
    extra: { decision: { type: "WRITE_OFF", outcome: "APPROVED", reason: "أُغلقت الصيدلية نهائياً ولا مال يُحصَّل.", decided_by: { id: 1, name: "زياد المصري" }, decided_at: "2026-10-20T09:30:00Z", on_behalf_of: null } },
  },
  {
    id: 2121,
    customer: "الحياة",
    agentId: 7,
    delivered: "09-12",
    expected: "2026-10-03",
    status: "APPROVAL_PENDING",
    lines: [[infant1, batchB, 40]],
    extra: { pending_request: { type: "WRITE_OFF", reason: "الصيدلية أعلنت إفلاسها ولا يمكن التحصيل.", requested_at: "2026-11-09T11:00:00Z" } },
  },
];

function buildDelivery(def: DeliveryDef): Delivery {
  const lines = deliveryLines(def.lines, def.id);
  const owner = agentDefs.find((agent) => agent.id === def.agentId);
  return {
    id: def.id,
    reference: `DLV-${String(def.id - 1000).padStart(6, "0")}`,
    agent: agentRefs[def.agentId],
    customer: { id: customerId[def.customer], name: `صيدلية ${def.customer}` },
    delivered_at: `2026-${def.delivered}T09:00:00Z`,
    expected_payment_date: def.expected,
    status: def.status,
    lines,
    estimated_value: sumMoney(lines.map((line) => line.line_value ?? "0.00")),
    collected_at: null,
    paid_on_time: null,
    is_payment_overdue: def.status === "UNPAID" && def.expected < salesToday,
    pending_request: null,
    decision: null,
    dispute_id: null,
    created_by: owner?.user ?? salesManager,
    ...def.extra,
  };
}

export const salesDeliveries: readonly Delivery[] = deliveryDefs.map(buildDelivery);

const unpaidOf = (agentId?: number) => salesDeliveries.filter((delivery) => delivery.status === "UNPAID" && (agentId === undefined || delivery.agent?.id === agentId));

/** التسليمات غير المسدّدة، المتأخر أولاً (الأبعد موعداً فاتاً أولاً)، ثم غير المتأخر بالأقرب موعداً. ما يفعله الخادم بترتيب `GET /deliveries?status=UNPAID`. */
export const unpaidDeliveries: readonly Delivery[] = [...unpaidOf()].sort((a, b) => {
  if (a.is_payment_overdue !== b.is_payment_overdue) return a.is_payment_overdue ? -1 : 1;
  return (a.expected_payment_date ?? "").localeCompare(b.expected_payment_date ?? "");
});

/** رد `POST /deliveries/{id}/refer-dispute` 200: `{ dispute_id }`. التسليم يحمل رقم النزاع بعدها. */
export const referredDisputeId = 5002;

export function referDelivery(delivery: Delivery): Delivery {
  return { ...delivery, dispute_id: referredDisputeId };
}

// ————— التحصيل لكل وكيل —————

/** ما سُدِّد من تسليمات سابقة خارج القائمة (تشرين الأول وما قبله): يدخل المستحق والمسدَّد معاً فتصير نسب التحصيل واقعية. */
const settledEarlier: Record<number, Money> = { 7: "6000.00", 9: "7500.00", 8: "5200.00", 12: "4200.00", 18: "2800.00", 21: "600.00" };

function receivableOf(def: AgentDef): Receivable {
  const own = salesDeliveries.filter((delivery) => delivery.agent?.id === def.id && (delivery.status === "UNPAID" || delivery.status === "PAID"));
  const paid = [settledEarlier[def.id], ...own.filter((delivery) => delivery.status === "PAID").map((delivery) => delivery.estimated_value ?? "0.00")];
  const overdue = own.filter((delivery) => delivery.is_payment_overdue);
  const due = [settledEarlier[def.id], ...own.map((delivery) => delivery.estimated_value ?? "0.00")];
  const dueCents = cents(sumMoney(due));
  return {
    agent: agentRefs[def.id],
    due_value: sumMoney(due),
    paid_value: sumMoney(paid),
    collection_rate_pct: dueCents === 0 ? 0 : Math.round((cents(sumMoney(paid)) / dueCents) * 1000) / 10,
    overdue_value: sumMoney(overdue.map((delivery) => delivery.estimated_value ?? "0.00")),
    overdue_deliveries: overdue.length,
  };
}

export const receivablesByAgent: readonly Receivable[] = agentDefs.map(receivableOf);

const allDueCents = cents(sumMoney(receivablesByAgent.map((row) => row.due_value ?? "0.00")));
const allPaidCents = cents(sumMoney(receivablesByAgent.map((row) => row.paid_value ?? "0.00")));
/** نسبة التحصيل الكلية: من الخادم في الإنتاج (حسابها من المبالغ ممنوع في الواجهة). */
const overallCollectionPct = allDueCents === 0 ? 0 : Math.round((allPaidCents / allDueCents) * 1000) / 10;
const overdueCount = salesDeliveries.filter((delivery) => delivery.is_payment_overdue).length;

// ————— الأرصدة والاستلامات والمرتجعات —————

const [, , , def12, def18, def21] = agentDefs;

/** أرصدة الوكلاء بالدفعة. 7 و9 و8 من أرصدة W02، والباقي مكمّل لها. الفرات (المعطّل) بقي عنده رصيد وفيه دفعة موقوفة. */
export const agentBalances: Record<number, readonly BalanceLine[]> = {
  7: [
    { location: otherLocations[0], item: infant1, batch: batchB, quantity: 60, in_transit_out: 0 },
    { location: otherLocations[0], item: infant2, batch: batchInf2A, quantity: 120, in_transit_out: 0 },
  ],
  9: [{ location: otherLocations[1], item: infant1, batch: batchA, quantity: 180, in_transit_out: 48 }],
  8: [{ location: otherLocations[2], item: cereal, batch: batchCereal, quantity: 96, in_transit_out: 0 }],
  12: [
    { location: agentLocation(def12), item: infant1, batch: batchB, quantity: 240, in_transit_out: 0 },
    { location: agentLocation(def12), item: infant2, batch: batchInf2B, quantity: 180, in_transit_out: 0 },
  ],
  18: [{ location: agentLocation(def18), item: cereal, batch: batchCereal, quantity: 150, in_transit_out: 0 }],
  21: [
    { location: agentLocation(def21), item: infant1, batch: batchA, quantity: 36, in_transit_out: 0 },
    { location: agentLocation(def21), item: infant1, batch: batchC, quantity: 12, in_transit_out: 0 },
    { location: agentLocation(def21), item: cereal, batch: batchCereal, quantity: 24, in_transit_out: 0 },
  ],
};

const stockTotal = (agentId: number): number => (agentBalances[agentId] ?? []).reduce((sum, line) => sum + (line.quantity ?? 0), 0);

const reasonEntries: Record<string, ListEntry> = {
  nearExpiry: { id: 1, name: "قرب انتهاء الصلاحية", order: 1, is_active: true },
  slowSales: { id: 2, name: "ركود المبيع في المنطقة", order: 2, is_active: true },
  defect: { id: 3, name: "عيب في العبوة", order: 3, is_active: true },
  surplus: { id: 4, name: "فائض عن حاجة الوكيل", order: 4, is_active: true },
};

const returnReasons = {
  dented: { id: 11, name: "علب منبعجة", order: 1, is_active: true },
  nearExpiry: { id: 12, name: "قرب انتهاء الصلاحية", order: 2, is_active: true },
  transit: { id: 13, name: "تلف أثناء النقل", order: 3, is_active: true },
  mismatch: { id: 14, name: "لا تطابق الطلب", order: 4, is_active: true },
} satisfies Record<string, ListEntry>;

type ReturnExtra = { responsibility?: CustomerReturn["responsibility"]; decidedAt?: string; decisionReason?: string; note?: string; onBehalf?: boolean };

function customerReturn(id: number, deliveryId: number, quantity: number, reason: ListEntry, status: NonNullable<CustomerReturn["status"]>, createdAt: string, extra: ReturnExtra = {}): CustomerReturn {
  const delivery = salesDeliveries.find((entry) => entry.id === deliveryId);
  const owner = agentDefs.find((def) => def.id === delivery?.agent?.id);
  const decided = status !== "PENDING";
  return {
    id,
    delivery_id: deliveryId,
    delivery_line: delivery?.lines?.[0],
    customer: delivery?.customer,
    agent: delivery?.agent,
    quantity,
    reason,
    note: extra.note ?? null,
    status,
    responsibility: status === "DAMAGED" ? (extra.responsibility ?? null) : null,
    created_by: owner?.user ?? salesManager,
    created_at: `2026-${createdAt}:00Z`,
    decided_by: decided ? salesManager : null,
    decided_at: decided && extra.decidedAt ? `2026-${extra.decidedAt}:00Z` : null,
    decision_reason: status === "REJECTED" ? (extra.decisionReason ?? null) : null,
    on_behalf_of: extra.onBehalf ? { id: 6, name: "رنا الشامي" } : null,
  };
}

/** مرتجعات الصيدليات (`GET /customer-returns`): ثلاثة بانتظار قرار مدير المبيعات والباقي مقرَّر. الأحدث أولاً. */
export const customerReturns: readonly CustomerReturn[] = [
  customerReturn(305, 2112, 8, returnReasons.nearExpiry, "PENDING", "11-09T15:10", { note: "الصيدلية ستغلق الأسبوع القادم وتريد ردّ ما بقي." }),
  customerReturn(304, 2105, 20, returnReasons.transit, "PENDING", "11-09T09:20"),
  customerReturn(301, 2104, 12, returnReasons.dented, "PENDING", "11-08T10:20", { note: "اثنتا عشرة علبة منبعجة وصلت بهذا الشكل." }),
  customerReturn(303, 2115, 4, returnReasons.transit, "DAMAGED", "11-01T11:00", { decidedAt: "11-02T10:10", responsibility: "AGENT" }),
  customerReturn(302, 2109, 6, returnReasons.nearExpiry, "RESTOCKED", "11-03T09:00", { decidedAt: "11-04T08:40" }),
  customerReturn(306, 2104, 5, returnReasons.mismatch, "REJECTED", "10-30T13:00", { decidedAt: "10-31T09:15", decisionReason: "لا يطابق سجل التسليم: الكمية المطلوبة أكبر مما سُلِّم." }),
  customerReturn(307, 2115, 3, returnReasons.dented, "DAMAGED", "10-28T10:00", { decidedAt: "10-29T08:30", responsibility: "WAREHOUSE", onBehalf: true }),
];

// ————— قائمة الوكلاء وصفحاتهم —————

/** المبيعات الفعلية للشهر الجاري لكل وكيل، من الخطة (`SALES_VALUE.actual`). */
const currentSalesByAgent: Record<number, number> = { 7: 41200, 9: 35800, 8: 21500, 12: 31900, 18: 17400, 21: 3200 };

function buildAgent(def: AgentDef): Agent {
  return {
    id: def.id,
    user: def.user,
    name: def.name,
    contact_name: def.contact,
    phone: def.phone,
    governorates: def.governorates,
    address: def.address,
    location_id: def.id,
    is_active: def.active,
    show_on_site: def.showOnSite,
    site_phone: def.showOnSite ? def.phone : null,
    unpaid_value: sumMoney(unpaidOf(def.id).map((delivery) => delivery.estimated_value ?? "0.00")),
  };
}

export const salesAgents: readonly Agent[] = agentDefs.map(buildAgent);

export const agentListRows: readonly AgentListRow[] = salesAgents.map((agent) => ({
  ...agent,
  stock_total: stockTotal(agent.id ?? 0),
  sales_value: `${currentSalesByAgent[agent.id ?? 0]}.00`,
}));

export const findAgent = (id: number): Agent => salesAgents.find((agent) => agent.id === id) ?? salesAgents[0];

export function agentTabs(agentId: number): AgentTabsData {
  const agent = findAgent(agentId);
  const summary = receivablesByAgent.find((row) => row.agent?.id === agentId) ?? null;
  const ready = <T,>(data: T): Loadable<T> => ({ status: "ready", data });
  return {
    receipts: ready(transfersList.filter((transfer) => transfer.to_location?.id === agent.location_id)),
    balances: ready(agentBalances[agentId] ?? []),
    deliveries: ready(salesDeliveries.filter((delivery) => delivery.agent?.id === agentId)),
    receivables: ready({ summary, unpaid: unpaidOf(agentId) }),
    returns: ready({
      toWarehouse: agentReturnsList.filter((item) => item.agent?.id === agentId),
      fromPharmacies: customerReturns.filter((item) => item.agent?.id === agentId),
    }),
  };
}

/** وكيل فعّال بتبويباته كلها (الياسمين) ووكيل معطّل (الفرات) بما بقي من رصيده. */
export const activeAgentId = 7;
export const deactivatedAgentId = 21;

// ————— العملاء —————

export const salesCustomers: readonly Customer[] = customerDefs.map(([id, name, agentId, governorate, linked, address], index) => {
  const unpaid = unpaidOf().filter((delivery) => delivery.customer?.id === id);
  const owner = agentDefs.find((def) => def.id === agentId);
  const firstDelivery = salesDeliveries.filter((delivery) => delivery.customer?.id === id).map((delivery) => delivery.delivered_at ?? "").sort()[0] ?? null;
  return {
    id,
    name,
    normalized_name: name,
    governorate,
    phone: `+963944${String(300000 + index * 137).padStart(6, "0")}`,
    address,
    agent: agentRefs[agentId],
    visit_point_id: linked ? 500 + index : null,
    created_by: owner?.user ?? salesManager,
    created_at: `2026-0${(index % 8) + 2}-1${(index % 9) + 1}T09:00:00Z`,
    first_delivery_at: firstDelivery,
    unpaid_value: unpaid.length ? sumMoney(unpaid.map((delivery) => delivery.estimated_value ?? "0.00")) : "0.00",
  };
});

export { customerName };

// ————— الخطة والمؤشرات —————

type MonthFigures = {
  /** منتج ← [الهدف، الفعلي]. */
  items: Record<number, [number, number]>;
  agents: Record<number, [number, number]>;
  newCustomers: [number, number];
  managerVisits: [number, number];
};

const figures: Record<IsoMonth, MonthFigures> = {
  [closedMonth]: {
    items: { 1: [50000, 51200], 2: [34000, 36100], 3: [28000, 24300] },
    agents: { 7: [44000, 46800], 9: [36000, 35200], 8: [27000, 28900], 12: [29000, 26700], 18: [20000, 21800], 21: [9000, 5400] },
    newCustomers: [16, 17],
    managerVisits: [20, 19],
  },
  [currentMonth]: {
    items: { 1: [52000, 48200], 2: [36000, 39600], 3: [30000, 21400] },
    agents: { 7: [45000, 41200], 9: [38000, 35800], 8: [28000, 21500], 12: [30000, 31900], 18: [22000, 17400], 21: [10000, 3200] },
    newCustomers: [18, 12],
    managerVisits: [20, 13],
  },
};

const pct = (actual: number, target: number) => Math.round((actual / target) * 1000) / 10;

function target(partial: Pick<PlanTarget, "type" | "metric"> & Partial<PlanTarget>, [goal, actual]: [number, number]): PlanTarget {
  return { region_id: null, agent_id: null, item_id: null, visit_point_type_id: null, specialty_id: null, ...partial, target: goal, actual, achievement_pct: pct(actual, goal) };
}

/** `GET /plans/SALES/{month}`: الخطة المعتمدة وفعليّها. */
export function salesPlanFor(month: IsoMonth): MonthlyPlan {
  const data = figures[month];
  return {
    department: "SALES",
    month,
    version: 1,
    status: "APPROVED",
    source_report_id: 4,
    targets: [
      ...Object.entries(data.items).map(([id, figure]) => target({ type: "SALES_ITEM", metric: "ITEM_SALES_VALUE", item_id: Number(id) }, figure)),
      ...Object.entries(data.agents).map(([id, figure]) => target({ type: "SALES", metric: "SALES_VALUE", agent_id: Number(id) }, figure)),
      target({ type: "SALES", metric: "NEW_CUSTOMERS" }, data.newCustomers),
      target({ type: "VISITS", metric: "MANAGER_VISITS" }, data.managerVisits),
    ],
    versions: [{ version: 1, reason: null, approved_by: { id: 1, name: "زياد المصري" }, approved_at: `${month}-01T08:00:00Z` }],
    pending_revision: null,
  };
}

/** نسب إعادة الطلب لكل محافظة (`GET /dashboard/coverage`). */
export const coverageLines: readonly CoverageLine[] = [
  { governorate: damascus, region: "الوسطى", active_customers: 42, visited_points_pct: 86, products_available_pct: 94, reorder_rate_pct: 71, collection_rate_pct: 88 },
  { governorate: aleppo, region: "الشمالية", active_customers: 31, visited_points_pct: 74, products_available_pct: 88, reorder_rate_pct: 64, collection_rate_pct: 79 },
  { governorate: latakia, region: "الساحلية", active_customers: 24, visited_points_pct: 81, products_available_pct: 90, reorder_rate_pct: 69, collection_rate_pct: 84 },
  { governorate: homs, region: "الوسطى", active_customers: 19, visited_points_pct: 69, products_available_pct: 85, reorder_rate_pct: 58, collection_rate_pct: 72 },
];

const averageReorder = Math.round((coverageLines.reduce((sum, line) => sum + (line.reorder_rate_pct ?? 0), 0) / coverageLines.length) * 10) / 10;

const itemShort: Record<number, string> = { 1: "المرحلة الأولى", 2: "المرحلة الثانية", 3: "سيريلاك أرز" };
const agentShort: Record<number, string> = { 7: "الياسمين", 9: "النور", 8: "الساحل", 12: "الشام", 18: "الجزيرة", 21: "الفرات" };

/**
 * يبني ما تجمعه الحاوية للوحة من الخطة: عمود لكل هدف منتج وكل هدف وكيل، والعملاء الجدد وزيارات المدير من أهدافهما.
 * `plan = null` = 404 (لا خطة معتمدة).
 */
function overviewFrom(month: IsoMonth, plan: MonthlyPlan | null, provisional: boolean): SalesOverview {
  const targets = plan?.targets ?? [];
  const bars = (metric: PlanTarget["metric"], key: "item_id" | "agent_id", short: Record<number, string>): SalesBar[] =>
    targets.filter((entry) => entry.metric === metric).map((entry) => ({ label: short[entry[key] ?? 0] ?? "", actual: entry.actual ?? 0, target: entry.target ?? 0 }));
  const single = (metric: PlanTarget["metric"]) => {
    const entry = targets.find((candidate) => candidate.metric === metric);
    return { actual: entry?.actual ?? 0, target: entry?.target ?? 0 };
  };
  return {
    month,
    provisional,
    hasPlan: plan !== null,
    collection: { ratePct: overallCollectionPct, overdueDeliveries: overdueCount },
    reorderRatePct: averageReorder,
    newCustomers: single("NEW_CUSTOMERS"),
    managerVisits: single("MANAGER_VISITS"),
    pendingDecisions: { count: 5, oldestAt: "2026-11-07T09:00:00Z" },
    byItem: bars("ITEM_SALES_VALUE", "item_id", itemShort),
    byAgent: bars("SALES_VALUE", "agent_id", agentShort),
  };
}

/** الافتراضي: شهر مغلق، أرقامه نهائية. */
export const finalOverview: SalesOverview = overviewFrom(closedMonth, salesPlanFor(closedMonth), false);
/** الشهر الجاري قبل إغلاقه: أرقامه مبدئية. */
export const provisionalOverview: SalesOverview = overviewFrom(currentMonth, salesPlanFor(currentMonth), true);
/** شهر بلا خطة معتمدة: `GET /plans/SALES/{month}` ← 404. */
export const noPlanOverview: SalesOverview = overviewFrom(currentMonth, null, true);

// ————— إرجاع للمستودع عن وكيل معطّل (M03) —————

const returnableItems = new Set([1, 3]);
export const agentReturnOptions: AgentReturnOptions = {
  items: stockItems.filter((item) => returnableItems.has(item.id)),
  reasons: Object.values(reasonEntries),
};

/** دفعات كل منتج ومتاحها في رصيد الوكيل المعطّل: الموقوفة تُرجع ولا تُوزَّع. */
export const agentReturnBatches: Record<string, Loadable<readonly EditorBatch[]>> = {
  "1": {
    status: "ready",
    data: [
      { ...batchA, available: 36 },
      { ...batchC, available: 12 },
    ],
  },
  "3": { status: "ready", data: [{ ...batchCereal, available: 24 }] },
};

export const filledAgentReturnForm: AgentReturnForm = {
  reasonId: "4",
  note: "الحساب معطّل وبقي عند الوكيل رصيد غير مباع.",
  lines: [
    { id: "a", itemId: 1, batchId: 31, quantity: 36 },
    { id: "b", itemId: 1, batchId: 33, quantity: 12 },
    { id: "c", itemId: 3, batchId: 51, quantity: 24 },
  ],
};

export const invalidAgentReturnForm: AgentReturnForm = {
  reasonId: "2",
  note: "",
  lines: [{ id: "a", itemId: 1, batchId: 31, quantity: 60 }],
};

export const invalidAgentReturnErrors = { reason_id: "السبب المختار غير فعّال. اختر سبباً آخر.", "lines.0.quantity": errorMessage("insufficient_stock") };

/** نموذج فارغ مبنيّ حرفياً (صفحات الرسم خادمية فلا تستدعي دوال ملفات client). */
export const blankAgentReturnForm: AgentReturnForm = { reasonId: null, note: "", lines: [{ id: "line-1", itemId: null, batchId: null, quantity: null }] };

/** رد `POST /agent-returns` 201: طلب بانتظار القرار أنشأه مدير المبيعات عن الوكيل. */
export const savedAgentReturn: AgentReturn = {
  id: 10,
  agent: agentRefs[21],
  to_location: { id: 1, type: "WAREHOUSE", name: "مستودع دمشق الرئيسي" },
  status: "PENDING",
  reason: reasonEntries.surplus,
  note: "الحساب معطّل وبقي عند الوكيل رصيد غير مباع.",
  lines: [
    { item: infant1, batch: batchA, quantity: 36 },
    { item: infant1, batch: batchC, quantity: 12 },
    { item: cereal, batch: batchCereal, quantity: 24 },
  ],
  created_by: salesManager,
  created_on_behalf_of_agent: true,
  created_at: "2026-11-10T09:00:00Z",
  decided_by: null,
  decided_at: null,
  decision_reason: null,
  on_behalf_of: null,
  received_by: null,
  received_at: null,
};

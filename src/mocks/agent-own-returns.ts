import type { DamageReportOptions } from "@/features/damage/views/DamageReportFormView";
import type { AgentReturnForm, AgentReturnOptions } from "@/features/returns/views/AgentReturnFormView";
import type { AgentReturn, CustomerReturn, DamageReport, Delivery, ListEntry, Location } from "@/lib/api/types";
import { agentDeliveries, deliveryBatches } from "./agent-deliveries";
import { damageReasons, damageReportsList } from "./damage-reports";
import { agentReturnOptions, customerReturns, savedAgentReturn } from "./sales";
import { balanceItems, batchA, batchC, batchCereal, batchInf2A } from "./stock-balances";
import { transferRecipients } from "./transfers-list";

// المرتجع والتالف والإرجاع للوكيل (A12–A16): وكالة الياسمين (id 7). «اليوم» 10 تشرين الثاني 2026. لا يُنقل للإنتاج.

const yasmeen = transferRecipients[0];
const agentRef = { id: 7, name: "وكالة الياسمين للتوزيع" };
const yasser = { id: 41, name: "ياسر الحمصي" };
const rana = { id: 6, name: "رنا الشامي" };
const [infant1, infant2, cereal] = balanceItems;

// ————— A12 —————

/** أسباب مرتجع الصيدلية، ومعها «سحب دفعة» المفروض للدفعة الموقوفة (§121). */
export const customerReturnReasons: readonly ListEntry[] = [
  { id: 11, name: "علب منبعجة", order: 1, is_active: true },
  { id: 12, name: "قرب انتهاء الصلاحية", order: 2, is_active: true },
  { id: 13, name: "تلف أثناء النقل", order: 3, is_active: true },
  { id: 14, name: "لا تطابق الطلب", order: 4, is_active: true },
  { id: 15, name: "سحب دفعة", order: 5, is_active: true },
];
export const recallReasonId = "15";

/** تسليم بسطر فيه مرتجع سابق: المسلَّم 20، المقبول 10، المعلّق 2، فالمسموح 8. وسطر من دفعة موقوفة. */
const partlyReturned: Delivery = {
  ...(agentDeliveries.find((delivery) => delivery.id === 2104) ?? agentDeliveries[0]),
  lines: [
    { id: 21040, item: infant1, batch: batchA, quantity: 20, unit_price: "4.50", line_value: "90.00", returned_accepted: 10, returned_pending: 2, returnable_quantity: 8 },
    { id: 21041, item: infant1, batch: batchC, quantity: 12, unit_price: "4.50", line_value: "54.00", returned_accepted: 0, returned_pending: 0, returnable_quantity: 12 },
  ],
};

/** تسليماتي التي يجوز منها مرتجع (غير مسدد أو مسدد، وفيها قابل للإرجاع). */
export const returnableDeliveries: readonly Delivery[] = [partlyReturned, ...agentDeliveries.filter((delivery) => delivery.id !== 2104 && (delivery.status === "UNPAID" || delivery.status === "PAID"))];

export const savedCustomerReturn: CustomerReturn = {
  id: 310,
  delivery_id: 2104,
  delivery_line: partlyReturned.lines?.[0],
  customer: partlyReturned.customer,
  agent: agentRef,
  quantity: 6,
  reason: customerReturnReasons[0],
  note: null,
  status: "PENDING",
  responsibility: null,
  created_by: yasser,
  created_at: "2026-11-10T09:05:00Z",
  decided_by: null,
  decided_at: null,
  decision_reason: null,
  on_behalf_of: null,
};

// ————— A13 —————

const ownReturns = customerReturns.filter((entry) => entry.agent?.id === 7);
const lineOf = (id: number) => agentDeliveries.find((delivery) => delivery.id === id);
const asOwn = (entry: CustomerReturn | undefined, deliveryId: number): CustomerReturn[] => (entry ? [{ ...entry, agent: agentRef, delivery_id: deliveryId, delivery_line: lineOf(deliveryId)?.lines?.[0], customer: lineOf(deliveryId)?.customer, created_by: yasser }] : []);

/** مرتجعات صيدلياتي بالحالات الأربع، الأحدث أولاً. */
export const agentCustomerReturns: readonly CustomerReturn[] = [
  ...ownReturns,
  ...asOwn(customerReturns.find((entry) => entry.status === "RESTOCKED"), 2101),
  ...asOwn(customerReturns.find((entry) => entry.status === "DAMAGED"), 2102),
].sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));

/** تقارير تالفي: من نماذج W21 بموقعي. */
export const agentDamageReports: readonly DamageReport[] = damageReportsList.filter((report) => [25, 21, 20].includes(report.id ?? 0)).map((report) => ({ ...report, location: yasmeen, created_by: yasser }));

// ————— A14 —————

const agentLocation: Location = { id: yasmeen.id, type: "AGENT", name: yasmeen.name, is_active: true };
export const agentDamageOptions: DamageReportOptions = { locations: [agentLocation], items: [infant1, infant2, cereal].map((item) => ({ id: item.id, name: item.name, sku: item.sku, type: item.type })), reasons: damageReasons };
export const agentDamageBatches = deliveryBatches;
export const agentDamageLocationId = String(yasmeen.id);

// ————— A15 —————

export const agentReturnFormOptions: AgentReturnOptions = { items: agentReturnOptions.items, reasons: [...agentReturnOptions.reasons, { id: 5, name: "سحب دفعة", order: 5, is_active: true }] };
export const agentRecallReasonId = "5";
export const agentReturnFormBatches = deliveryBatches;

export const recallAgentReturnForm: AgentReturnForm = { reasonId: agentRecallReasonId, note: "", lines: [{ id: "a", itemId: 1, batchId: batchC.id, quantity: 40 }] };

const request = (id: number, extra: Partial<AgentReturn>): AgentReturn => ({ ...savedAgentReturn, id, agent: agentRef, created_by: yasser, created_on_behalf_of_agent: false, ...extra });

export const savedOwnAgentReturn = request(14, { lines: [{ item: infant1, batch: batchC, quantity: 40 }], reason: agentReturnFormOptions.reasons.at(-1), note: null });

// ————— A16 —————

/** طلبات الإرجاع للمستودع بالحالات الأربع، الأحدث أولاً. */
export const agentReturnRequests: readonly AgentReturn[] = [
  savedOwnAgentReturn,
  request(12, { status: "IN_TRANSIT", lines: [{ item: cereal, batch: batchCereal, quantity: 24 }], reason: agentReturnOptions.reasons[1], created_at: "2026-11-06T10:00:00Z", decided_by: rana, decided_at: "2026-11-07T09:00:00Z" }),
  request(9, { status: "RECEIVED", lines: [{ item: infant2, batch: batchInf2A, quantity: 30 }], reason: agentReturnOptions.reasons[0], created_at: "2026-10-28T10:00:00Z", decided_by: rana, decided_at: "2026-10-29T09:00:00Z", received_by: { id: 3, name: "رامي السيد" }, received_at: "2026-10-31T12:00:00Z" }),
  request(7, { status: "REJECTED", lines: [{ item: infant1, batch: batchA, quantity: 50 }], reason: agentReturnOptions.reasons[3], created_at: "2026-10-20T10:00:00Z", decided_by: rana, decided_at: "2026-10-21T09:00:00Z", decision_reason: "الفائض يُوزَّع على وكالة النور بدل الإرجاع." }),
];

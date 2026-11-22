import type { AgentOverview } from "@/features/agents/views/AgentDashboardView";
import type { BalanceLine, Delivery, LocationRef, Transfer, UserRef } from "@/lib/api/types";
import { balanceItems, batchA, batchB, batchC, batchCereal, batchInf2A, batchInf2B } from "./stock-balances";
import { inTransitTransfer } from "./transfer-details";
import { transferRecipients } from "./transfers-list";

// الوكيل (A01–A04): ياسر الحمصي، وكالة الياسمين للتوزيع. «الآن» 10 تشرين الثاني 2026 09:00 UTC، متسق مع mocks المستودع. لا يُنقل للإنتاج.

export const agentToday = "2026-11-10";
export const agentNow = "2026-11-10T09:00:00Z";

const warehouse: LocationRef = { id: 1, type: "WAREHOUSE", name: "مستودع دمشق الرئيسي" };
const yasmeen = transferRecipients[0];
const yasser: UserRef = { id: 41, name: "ياسر الحمصي" };
const ramy: UserRef = { id: 3, name: "رامي السيد" };
const laila: UserRef = { id: 4, name: "ليلى الأحمد" };
const [infant1, infant2, cereal] = balanceItems;

const transfer = (id: number, extra: Partial<Transfer>): Transfer => ({
  id,
  reference: `TRF-000${id}`,
  from_location: warehouse,
  to_location: yasmeen,
  status: "RECEIVED",
  lines: [],
  total_quantity: 0,
  sample_request_id: null,
  note: null,
  created_by: ramy,
  created_at: "2026-11-01T09:00:00Z",
  received_by: null,
  received_at: null,
  cancelled_by: null,
  cancelled_at: null,
  cancel_reason: null,
  hours_in_transit: null,
  ...extra,
});

/** بالطريق (W08 نفسه): 360 علبة منذ 21 ساعة. */
export const agentInTransit: Transfer = inTransitTransfer;

export const agentReceived = transfer(149, {
  lines: [
    { item: infant1, batch: batchA, quantity: 240 },
    { item: cereal, batch: batchCereal, quantity: 120 },
  ],
  total_quantity: 360,
  note: "طلبية بداية الشهر.",
  created_at: "2026-11-02T08:30:00Z",
  received_by: yasser,
  received_at: "2026-11-02T13:45:00Z",
});

export const agentCancelled = transfer(152, {
  status: "CANCELLED",
  lines: [{ item: infant2, batch: batchInf2B, quantity: 300 }],
  total_quantity: 300,
  created_by: laila,
  created_at: "2026-11-05T10:00:00Z",
  cancelled_by: laila,
  cancelled_at: "2026-11-05T10:40:00Z",
  cancel_reason: "كمية خطأ: المطلوب 200 علبة. صدر صرف جديد بالكمية الصحيحة.",
});

/** الاستلامات (A02)، الأحدث أولاً. */
export const agentTransfers: readonly Transfer[] = [
  agentInTransit,
  transfer(153, { lines: [{ item: infant2, batch: batchInf2A, quantity: 200 }], total_quantity: 200, created_at: "2026-11-05T11:10:00Z", received_by: yasser, received_at: "2026-11-05T16:00:00Z" }),
  agentCancelled,
  agentReceived,
  transfer(137, { lines: [{ item: infant1, batch: batchC, quantity: 180 }, { item: infant2, batch: batchInf2A, quantity: 300 }], total_quantity: 480, created_at: "2026-10-27T09:10:00Z", received_by: yasser, received_at: "2026-10-27T15:20:00Z" }),
];

const line = (item: BalanceLine["item"], batch: BalanceLine["batch"], quantity: number): BalanceLine => ({ location: yasmeen, item, batch, quantity, in_transit_out: 0 });

/** رصيد الوكيل (A04): المرحلة الأولى بدفعة موقوفة (LOT-2609-C) ودفعة تنتهي 14 كانون الأول. */
export const agentBalances: readonly BalanceLine[] = [
  line(infant1, batchA, 96),
  line(infant1, batchB, 0),
  line(infant1, batchC, 40),
  line(infant2, batchInf2A, 310),
  line(infant2, batchInf2B, 0),
  line(cereal, batchCereal, 72),
];

/** بلا موقوفة ولا قريبة: للحالة الافتراضية. */
export const agentBalancesClean: readonly BalanceLine[] = [line(infant1, batchB, 186), line(infant2, batchInf2A, 310), line(cereal, batchCereal, 72)];
/** قريبة الانتهاء فقط. */
export const agentBalancesNearExpiry: readonly BalanceLine[] = [line(infant1, batchA, 96), line(infant1, batchB, 90), line(infant2, batchInf2A, 310), line(cereal, batchCereal, 72)];

const agentRef = { id: 7, name: "وكالة الياسمين للتوزيع" };
const delivery = (id: number, customer: string, due: string, value: string, overdue = false): Delivery => ({
  id,
  reference: `DLV-00${id}`,
  agent: agentRef,
  customer: { id: id - 1000, name: customer },
  delivered_at: "2026-10-20T09:00:00Z",
  expected_payment_date: due,
  status: "UNPAID",
  lines: [],
  estimated_value: value,
  collected_at: null,
  paid_on_time: null,
  is_payment_overdue: overdue,
  pending_request: null,
});

const upcoming: readonly Delivery[] = [delivery(1206, "صيدلية الشفاء · المزة", "2026-11-12", "1840.00"), delivery(1211, "صيدلية الرحمة · ركن الدين", "2026-11-15", "960.00"), delivery(1215, "صيدلية ابن سينا · جرمانا", "2026-11-17", "2310.50")];
const overdue: readonly Delivery[] = [delivery(1189, "صيدلية النور · دمّر", "2026-11-03", "1275.00", true), delivery(1194, "صيدلية الأمل · القدم", "2026-11-07", "640.00", true)];

const receivable = { agent: agentRef, due_value: "18420.50", paid_value: "41200.00", collection_rate_pct: 69.1, overdue_value: "0.00", overdue_deliveries: 0 };

export type AgentDashboardState = "default" | "pending-receipt" | "overdue-payments";

export function agentOverviewAt(state: AgentDashboardState): AgentOverview {
  const base: AgentOverview = { salesEstimate: null, newCustomers: null, receivable, pendingTransfers: [], upcomingPayments: upcoming };
  switch (state) {
    case "default":
      return base;
    case "pending-receipt":
      return { ...base, pendingTransfers: [agentInTransit, transfer(156, { status: "IN_TRANSIT", lines: [{ item: cereal, batch: batchCereal, quantity: 96 }], total_quantity: 96, created_at: "2026-11-10T07:30:00Z", hours_in_transit: 1 })] };
    case "overdue-payments":
      return { ...base, receivable: { ...receivable, overdue_value: "1915.00", overdue_deliveries: 2 }, upcomingPayments: [...overdue, ...upcoming] };
  }
}

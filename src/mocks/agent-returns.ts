import type { AgentReturn, BatchRef, ItemRef, ListEntry, Location, UserRef } from "@/lib/api/types";
import { balanceItems, batchA, batchB, batchC, batchCereal, batchInf2A, batchInf2B, damascus } from "./stock-balances";

// إرجاعات الوكلاء إلى المستودع (W13): 9 إرجاعات بين 28 تشرين الأول و10 تشرين الثاني 2026، اعتمدها مدير المبيعات. 5 بالطريق و4 مستلمة.
// الأوقات UTC. بانتظار القرار والمرفوض ليسا في المعرض (قرار مدير المبيعات، docs/backend-requests.md §16.1). لا يُنقل للإنتاج.

export const agentReturnsToday = "2026-11-10";

const [infant1, infant2, cereal] = balanceItems;

/** الوكلاء كمواقع (لفلتر الوكيل: `agent_id` = `location.agent.id`). */
export const agentReturnLocations = [
  { id: 7, type: "AGENT", name: "وكالة الياسمين للتوزيع", is_active: true, agent: { id: 7, name: "وكالة الياسمين للتوزيع" } },
  { id: 9, type: "AGENT", name: "مؤسسة النور للتوزيع", is_active: true, agent: { id: 9, name: "مؤسسة النور للتوزيع" } },
  { id: 8, type: "AGENT", name: "وكالة الساحل للتوزيع", is_active: true, agent: { id: 8, name: "وكالة الساحل للتوزيع" } },
] satisfies Location[];

const [yasmine, nour, sahel] = agentReturnLocations.map((location) => location.agent);

const salesManager: UserRef = { id: 21, name: "طارق الدباغ" };
const logistics: UserRef = { id: 3, name: "رامي السيد" };

const reasons = {
  nearExpiry: { id: 1, name: "قرب انتهاء الصلاحية", order: 1, is_active: true },
  slowSales: { id: 2, name: "ركود المبيع في المنطقة", order: 2, is_active: true },
  defect: { id: 3, name: "عيب في العبوة", order: 3, is_active: true },
  surplus: { id: 4, name: "فائض عن حاجة الوكيل", order: 4, is_active: true },
} satisfies Record<string, ListEntry>;

type Status = "IN_TRANSIT" | "RECEIVED";
type Line = [item: ItemRef, batch: BatchRef, quantity: number];

function agentReturn(
  id: number,
  createdAt: string,
  agent: AgentReturn["agent"],
  status: Status,
  reason: ListEntry,
  lines: Line[],
  decidedAt: string,
  extra: { receivedAt?: string; note?: string; onBehalf?: boolean } = {},
): AgentReturn {
  return {
    id,
    agent,
    to_location: damascus,
    status,
    reason,
    note: extra.note ?? null,
    lines: lines.map(([item, batch, quantity]) => ({ item, batch, quantity })),
    created_by: extra.onBehalf ? salesManager : { id: agent?.id ?? 0, name: agent?.name ?? "" },
    created_on_behalf_of_agent: extra.onBehalf ?? false,
    created_at: `2026-${createdAt}:00Z`,
    decided_by: salesManager,
    decided_at: `2026-${decidedAt}:00Z`,
    decision_reason: null,
    on_behalf_of: null,
    received_by: extra.receivedAt ? logistics : null,
    received_at: extra.receivedAt ? `2026-${extra.receivedAt}:00Z` : null,
  };
}

const oldestFirst: AgentReturn[] = [
  agentReturn(1, "10-28T08:00", yasmine, "RECEIVED", reasons.nearExpiry, [[infant1, batchA, 120], [infant2, batchInf2A, 48]], "10-29T09:30", { receivedAt: "10-31T10:15", note: "الدفعتان تنتهيان قبل نهاية الشهر القادم." }),
  agentReturn(2, "10-29T09:20", nour, "RECEIVED", reasons.defect, [[infant1, batchB, 36]], "10-30T08:45", { receivedAt: "11-01T11:00", note: "علب منبعجة من الشحن." }),
  agentReturn(3, "10-30T10:00", sahel, "RECEIVED", reasons.slowSales, [[cereal, batchCereal, 60]], "10-31T12:10", { receivedAt: "11-03T09:40" }),
  agentReturn(4, "11-01T09:00", yasmine, "RECEIVED", reasons.surplus, [[infant2, batchInf2B, 72]], "11-02T10:00", { receivedAt: "11-04T08:55" }),
  agentReturn(5, "11-03T10:30", nour, "IN_TRANSIT", reasons.nearExpiry, [[infant1, batchA, 96], [cereal, batchCereal, 24]], "11-04T08:20", { note: "تنتهي الدفعة بعد 34 يوماً." }),
  agentReturn(6, "11-04T11:15", sahel, "IN_TRANSIT", reasons.slowSales, [[infant2, batchInf2A, 120]], "11-05T09:10"),
  agentReturn(7, "11-06T09:40", yasmine, "IN_TRANSIT", reasons.defect, [[infant1, batchC, 18]], "11-07T08:30", { note: "الدفعة موقوفة. تُرجع للمستودع ولا تُوزَّع." }),
  agentReturn(8, "11-07T12:00", nour, "IN_TRANSIT", reasons.surplus, [[infant2, batchInf2B, 48], [cereal, batchCereal, 36], [infant1, batchB, 24]], "11-08T11:25", { onBehalf: true, note: "رفعه مدير المبيعات لأن حساب الوكيل معطَّل." }),
  agentReturn(9, "11-08T08:50", yasmine, "IN_TRANSIT", reasons.nearExpiry, [[infant1, batchA, 60]], "11-09T09:05"),
];

/** الأحدث اعتماداً أولاً، كما يرجعها `GET /agent-returns`. */
export const agentReturnsList: readonly AgentReturn[] = [...oldestFirst].sort((a, b) => Date.parse(b.decided_at ?? "") - Date.parse(a.decided_at ?? ""));

/** رد `POST /agent-returns/{id}/receive` 200: الإرجاع مستلماً. */
export function receivedReturn(item: AgentReturn): AgentReturn {
  return { ...item, status: "RECEIVED", received_by: logistics, received_at: "2026-11-10T09:40:00Z" };
}

import type { PendingCounts, ReturnsPage } from "@/features/returns/views/ReturnDecisionsView";
import type { ReturnDecisionForm, ReturnSelection } from "@/features/returns/views/ReturnDecisionDrawer";
import type { ReturnKind } from "@/components/data/return-kinds";
import type { AgentReturn, BatchRef, ConflictDecided, DamageReport, ItemRef, ListEntry, LocationRef, UserRef } from "@/lib/api/types";
import { agentReturnsList } from "./agent-returns";
import { damageReportsList } from "./damage-reports";
import { customerReturns, salesManager } from "./sales";
import { balanceItems, batchA, batchB, batchC, batchCereal, batchInf2A, batchInf2B, damascus, warehouseLocations } from "./stock-balances";

// قرارات المرتجع والتالف لمدير المبيعات (M08): أربعة أنواع بمعلّقها ومقرَّرها. مرتجعات الصيدليات من `mocks/sales.ts`، وتالف المستودع من `damage-reports.ts`،
// وتالف الوكيل والإرجاعات المعلّقة هنا. الأوقات UTC. اليوم الثابت 10 تشرين الثاني 2026. لا يُنقل للإنتاج.

export const decisionsToday = "2026-11-10";
export const decisionsWarehouses = warehouseLocations;

const [infant1, infant2, cereal] = balanceItems;

const agentLocation = (id: number, name: string): LocationRef => ({ id, type: "AGENT", name });
const yasmine = agentLocation(7, "وكالة الياسمين للتوزيع");
const nour = agentLocation(9, "مؤسسة النور للتوزيع");
const sahel = agentLocation(8, "وكالة الساحل للتوزيع");
const agentUsers: Record<number, UserRef> = { 7: { id: 41, name: "ياسر الحمصي" }, 9: { id: 42, name: "عبد الله النوري" }, 8: { id: 43, name: "ماهر الشيخ" } };

const reason = (id: number, name: string): ListEntry => ({ id, name, order: id, is_active: true });
const damageReasonTransit = reason(4, "تلف أثناء النقل");
const damageReasonStorage = reason(2, "تلف بالتخزين (رطوبة أو حرارة)");
const damageReasonDefect = reason(5, "عيب تصنيع ظاهر");

type Line = [item: ItemRef, batch: BatchRef, quantity: number];

function agentDamage(id: number, createdAt: string, location: LocationRef, status: NonNullable<DamageReport["status"]>, why: ListEntry, lines: Line[], extra: { decidedAt?: string; responsibility?: DamageReport["responsibility"]; decisionReason?: string; note?: string } = {}): DamageReport {
  const decided = status !== "PENDING";
  return {
    id,
    location,
    status,
    reason: why,
    lines: lines.map(([item, batch, quantity]) => ({ item, batch, quantity })),
    note: extra.note ?? null,
    attachments: [],
    responsibility: status === "DAMAGED" ? (extra.responsibility ?? null) : null,
    created_by: agentUsers[location.id ?? 7],
    created_at: `2026-${createdAt}:00Z`,
    decided_by: decided ? salesManager : null,
    decided_at: decided && extra.decidedAt ? `2026-${extra.decidedAt}:00Z` : null,
    decision_reason: status === "REJECTED" ? (extra.decisionReason ?? null) : null,
    on_behalf_of: null,
  };
}

/** تقارير تالف يرفعها الوكلاء (موقعها وكيل): اثنان بانتظار القرار. */
export const agentDamageReports: readonly DamageReport[] = [
  agentDamage(41, "11-10T08:10", yasmine, "PENDING", damageReasonTransit, [[infant1, batchB, 14]], { note: "سقط صندوق أثناء التفريغ عند الصيدلية." }),
  agentDamage(40, "11-09T13:00", nour, "PENDING", damageReasonStorage, [[infant2, batchInf2B, 9], [cereal, batchCereal, 6]], { note: "رطوبة في مخزن الوكيل بعد تسرّب." }),
  agentDamage(38, "11-05T09:30", sahel, "DAMAGED", damageReasonTransit, [[cereal, batchCereal, 10]], { decidedAt: "11-06T08:50", responsibility: "OTHER" }),
  agentDamage(36, "11-02T11:40", yasmine, "REJECTED", damageReasonDefect, [[infant1, batchA, 4]], { decidedAt: "11-03T10:20", decisionReason: "لا مرفقات تثبت العيب. أعد الرفع بصور." }),
];

/** تقارير تالف المستودع (`W20`): من `damage-reports.ts`. */
export const warehouseDamageReports: readonly DamageReport[] = damageReportsList;

function pendingReturn(id: number, createdAt: string, agent: LocationRef, why: ListEntry, lines: Line[], extra: { note?: string; onBehalf?: boolean } = {}): AgentReturn {
  return {
    id,
    agent: { id: agent.id, name: agent.name },
    to_location: null,
    status: "PENDING",
    reason: why,
    note: extra.note ?? null,
    lines: lines.map(([item, batch, quantity]) => ({ item, batch, quantity })),
    created_by: extra.onBehalf ? salesManager : agentUsers[agent.id ?? 7],
    created_on_behalf_of_agent: extra.onBehalf ?? false,
    created_at: `2026-${createdAt}:00Z`,
    decided_by: null,
    decided_at: null,
    decision_reason: null,
    on_behalf_of: null,
    received_by: null,
    received_at: null,
  };
}

const returnReasonNearExpiry = reason(1, "قرب انتهاء الصلاحية");
const returnReasonSurplus = reason(4, "فائض عن حاجة الوكيل");
const returnReasonDefect = reason(3, "عيب في العبوة");

/** إرجاعات الوكلاء: ثلاثة بانتظار الاعتماد (أحدها عن وكيل معطّل: M03)، ومعها ما اعتُمد من `agent-returns.ts` ورفضان. */
export const agentReturnRequests: readonly AgentReturn[] = [
  pendingReturn(12, "11-10T07:55", yasmine, returnReasonNearExpiry, [[infant1, batchA, 80], [infant2, batchInf2A, 24]], { note: "تنتهي الدفعة بعد 34 يوماً." }),
  pendingReturn(11, "11-09T10:30", nour, returnReasonSurplus, [[infant2, batchInf2B, 60]]),
  pendingReturn(10, "11-09T08:00", agentLocation(21, "شركة الفرات للأغذية"), returnReasonSurplus, [[infant1, batchA, 36], [infant1, batchC, 12], [cereal, batchCereal, 24]], { onBehalf: true, note: "الوكيل معطّل وبقي عنده رصيد غير مباع." }),
  { ...pendingReturn(7, "10-29T09:00", sahel, returnReasonDefect, [[cereal, batchCereal, 18]]), status: "REJECTED", decided_by: salesManager, decided_at: "2026-10-30T09:20:00Z", decision_reason: "العبوات سليمة بعد المعاينة، تُباع من المخزون." },
  ...agentReturnsList,
];

// ————— الصفحات والعدّادات —————

const pendingFirst = <T extends { status?: string; created_at?: string }>(list: readonly T[]): T[] =>
  [...list].sort((a, b) => {
    const aPending = a.status === "PENDING";
    if (aPending !== (b.status === "PENDING")) return aPending ? -1 : 1;
    return Date.parse(b.created_at ?? "") - Date.parse(a.created_at ?? "");
  });

const sources = {
  "customer-return": customerReturns,
  "agent-damage": agentDamageReports,
  "warehouse-damage": warehouseDamageReports,
  "agent-return": agentReturnRequests,
} as const;

export const pendingCountsOf = (overrides: Partial<Record<ReturnKind, readonly { status?: string }[]>> = {}): PendingCounts => ({
  "customer-return": (overrides["customer-return"] ?? sources["customer-return"]).filter((item) => item.status === "PENDING").length,
  "agent-damage": (overrides["agent-damage"] ?? sources["agent-damage"]).filter((item) => item.status === "PENDING").length,
  "warehouse-damage": (overrides["warehouse-damage"] ?? sources["warehouse-damage"]).filter((item) => item.status === "PENDING").length,
  "agent-return": (overrides["agent-return"] ?? sources["agent-return"]).filter((item) => item.status === "PENDING").length,
});

/** صفحة من نوع بعد تطبيق «المعلّق فقط» والترقيم، كما يفعل الخادم بـ `status=PENDING` وpage. */
export function pageOf(kind: ReturnKind, items: ReturnsPage["data"], pendingOnly: boolean, page: number, perPage: number): ReturnsPage {
  const filtered = pendingFirst(pendingOnly ? items.filter((item) => item.status === "PENDING") : items);
  const lastPage = Math.max(1, Math.ceil(filtered.length / perPage));
  const current = Math.min(page, lastPage);
  const meta = { current_page: current, last_page: lastPage, per_page: perPage, total: filtered.length };
  const slice = filtered.slice((current - 1) * perPage, current * perPage);
  return { kind, data: slice, meta } as ReturnsPage;
}

export const sourceOf = (kind: ReturnKind) => sources[kind];

/** أول طلب معلّق من كل نوع: ما تفتحه حالات الدرج. */
export const firstPending = {
  "customer-return": pendingFirst(customerReturns)[0],
  "agent-damage": pendingFirst(agentDamageReports)[0],
  "warehouse-damage": pendingFirst(warehouseDamageReports)[0],
  "agent-return": pendingFirst(agentReturnRequests)[0],
};

export const selectionOf = (kind: ReturnKind, id: number): ReturnSelection => {
  const list = sources[kind] as readonly { id?: number }[];
  const item = list.find((entry) => entry.id === id) ?? list[0];
  return { kind, item } as ReturnSelection;
};

/** رد `…/{id}/decision` 200: الطلب مقرَّراً بما اختاره المدير (القبول بنموذجه أو الرفض بسببه). */
export function decide(selection: ReturnSelection, form: ReturnDecisionForm, rejectReason: string | null): ReturnSelection {
  const decidedAt = "2026-11-10T09:00:00Z";
  const rejected = rejectReason !== null;
  if (selection.kind === "customer-return") {
    const status = rejected ? "REJECTED" : (form.decision ?? "RESTOCKED");
    return { kind: selection.kind, item: { ...selection.item, status, responsibility: status === "DAMAGED" ? form.responsibility : null, decided_by: salesManager, decided_at: decidedAt, decision_reason: rejected ? rejectReason : null } };
  }
  if (selection.kind === "agent-return") {
    const to = warehouseLocations.find((location) => String(location.id) === form.toLocationId) ?? damascus;
    return {
      kind: selection.kind,
      item: { ...selection.item, status: rejected ? "REJECTED" : "IN_TRANSIT", to_location: rejected ? null : { id: to.id, type: to.type, name: to.name }, decided_by: salesManager, decided_at: decidedAt, decision_reason: rejected ? rejectReason : null },
    };
  }
  return {
    kind: selection.kind,
    item: { ...selection.item, status: rejected ? "REJECTED" : "DAMAGED", responsibility: rejected ? null : form.responsibility, decided_by: salesManager, decided_at: decidedAt, decision_reason: rejected ? rejectReason : null },
  };
}

/** 409 `already_decided`: قرّر المدير التنفيذي قبل مدير المبيعات بلحظات (القرار 12). */
export const conflictDecided: ConflictDecided = {
  message: "قرّر غيرك قبلك.",
  code: "already_decided",
  current_status: "RESTOCKED",
  decided_by: { id: 1, name: "زياد المصري" },
  decided_at: "2026-11-10T08:52:00Z",
};

export const blankDecisionForm: ReturnDecisionForm = { decision: null, responsibility: null, toLocationId: null };
export const damagedReturnForm: ReturnDecisionForm = { decision: "DAMAGED", responsibility: null, toLocationId: null };
export const filledDamageDecisionForm: ReturnDecisionForm = { decision: null, responsibility: "WAREHOUSE", toLocationId: null };

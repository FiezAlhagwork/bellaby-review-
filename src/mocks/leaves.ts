import type { Leave, UserRef } from "@/lib/api/types";

// الإجازات (G17–G18). اليوم 22 تشرين الثاني 2026: يجوز طلب يبدأ من 1 تشرين الثاني. الأوقات UTC. لا يُنقل للإنتاج.

export const leavesToday = "2026-11-22";
export const leavesMonthStart = "2026-11-01";
export const leavesNow = "2026-11-22T10:00:00Z";

export const salim: UserRef = { id: 5, name: "سليم القاسم" };
export const rami: UserRef = { id: 3, name: "رامي السيد" };
const omar: UserRef = { id: 8, name: "عمر الدباغ" };
const ziad: UserRef = { id: 1, name: "زياد المصري" };
const heba: UserRef = { id: 40, name: "د. هبة الأحمد" };
const supervisor: UserRef = { id: 30, name: "خالد العمر" };
const rep: UserRef = { id: 20, name: "سامر الحلبي" };
const samar: UserRef = { id: 52, name: "سمر العبدالله" };

const leave = (id: number, extra: Partial<Leave>): Leave => ({
  id,
  client_uuid: null,
  employee: salim,
  approver: rami,
  from: "2026-11-25",
  to: "2026-11-26",
  reason: null,
  status: "PENDING",
  decided_by: null,
  decided_at: null,
  decision_reason: null,
  created_at: "2026-11-20T08:00:00Z",
  ...extra,
});

/** إجازات سليم (`scope=mine`)، الأحدث أولاً. */
export const myLeaves: readonly Leave[] = [
  leave(61, { from: "2026-12-07", to: "2026-12-09", reason: "سفر عائلي إلى حمص." }),
  leave(54, { from: "2026-11-12", to: "2026-11-12", reason: "مراجعة طبية.", status: "APPROVED", decided_by: rami, decided_at: "2026-11-10T09:00:00Z", created_at: "2026-11-09T08:00:00Z" }),
  leave(47, { from: "2026-10-27", to: "2026-10-29", reason: "إجازة سنوية.", status: "REJECTED", decided_by: rami, decided_at: "2026-10-20T09:00:00Z", decision_reason: "الجرد الشهري في 28 تشرين الأول. اختر أسبوعاً بعده.", created_at: "2026-10-19T08:00:00Z" }),
  leave(41, { from: "2026-10-05", to: "2026-10-05", status: "CANCELLED", created_at: "2026-10-01T08:00:00Z" }),
];

/** بانتظار قرار رامي (`scope=to_decide`)، المعلّقة أولاً. */
export const teamLeaves: readonly Leave[] = [
  leave(63, { employee: omar, from: "2026-11-18", to: "2026-11-19", reason: "مرض. التقرير الطبي مع أمين المستودع.", created_at: "2026-11-21T07:30:00Z" }),
  leave(61, { from: "2026-12-07", to: "2026-12-09", reason: "سفر عائلي إلى حمص." }),
  leave(54, { from: "2026-11-12", to: "2026-11-12", reason: "مراجعة طبية.", status: "APPROVED", decided_by: rami, decided_at: "2026-11-10T09:00:00Z", created_at: "2026-11-09T08:00:00Z" }),
  leave(47, { from: "2026-10-27", to: "2026-10-29", reason: "إجازة سنوية.", status: "REJECTED", decided_by: rami, decided_at: "2026-10-20T09:00:00Z", decision_reason: "الجرد الشهري في 28 تشرين الأول.", created_at: "2026-10-19T08:00:00Z" }),
];

/** كل الإجازات للمحاسب (`scope=all`). */
export const allLeaves: readonly Leave[] = [
  teamLeaves[0],
  myLeaves[0],
  leave(62, { employee: rep, approver: supervisor, from: "2026-11-24", to: "2026-11-24", reason: "ظرف عائلي.", created_at: "2026-11-21T06:00:00Z" }),
  leave(58, { employee: heba, approver: ziad, from: "2026-11-16", to: "2026-11-18", reason: "مؤتمر طبي في بيروت.", status: "APPROVED", decided_by: ziad, decided_at: "2026-11-12T10:00:00Z", created_at: "2026-11-11T08:00:00Z" }),
  myLeaves[1],
  leave(51, { employee: samar, approver: ziad, from: "2026-11-03", to: "2026-11-04", status: "APPROVED", decided_by: ziad, decided_at: "2026-11-02T10:00:00Z", created_at: "2026-11-01T08:00:00Z" }),
  myLeaves[2],
];

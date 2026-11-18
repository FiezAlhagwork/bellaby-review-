import type { MonthClosing, MonthlyScore, MonthWinner, UserRef } from "@/lib/api/types";

// إغلاق الشهر والتقييم اليدوي والنقاط وموظف الشهر (E06–E09). تشرين الأول مغلق، وتشرين الثاني مفتوح حتى 10 منه. لا يُنقل للإنتاج.

export const scoringToday = "2026-11-10";
export const scoringClosedMonths = ["2026-08", "2026-09", "2026-10"];

const u = (id: number, name: string): UserRef => ({ id, name });
const ziad = u(1, "زياد المصري");

// ————— إغلاق الشهر —————

export const closingOpen: MonthClosing = {
  month: "2026-11",
  status: "OPEN",
  fifth_work_day: "2026-12-07",
  missing_manual_ratings: [u(20, "خالد النجار"), u(21, "منى الصباغ"), u(3, "رامي السيد")],
  missing_expenses: [{ category_id: 4, name: "اتصالات" }],
  closed_at: null,
};

/** تشرين الأول بعد يوم العمل الخامس (5 تشرين الثاني) وما زال ينتظر تقييماً ومصروفاً. */
export const closingWaiting: MonthClosing = {
  month: "2026-10",
  status: "WAITING",
  fifth_work_day: "2026-11-05",
  missing_manual_ratings: [u(20, "خالد النجار")],
  missing_expenses: [{ category_id: 4, name: "اتصالات" }],
  closed_at: null,
};

export const closingClosed: MonthClosing = {
  month: "2026-10",
  status: "CLOSED",
  fifth_work_day: "2026-11-05",
  missing_manual_ratings: [],
  missing_expenses: [],
  closed_at: "2026-11-06T00:05:00Z",
};

// ————— النقاط —————

const groups = { reps: { id: 1, name: "المندوبون" }, supervisors: { id: 2, name: "الإشراف" }, warehouse: { id: 3, name: "المستودع" } };

type Kpi = [key: string, label: string, weight: number, score: number];
function score(user: UserRef, month: string, status: "PROVISIONAL" | "FINAL", group: (typeof groups)[keyof typeof groups], total: number, kpis: Kpi[], manual: MonthlyScore["manual_rating"], deduction = false): MonthlyScore {
  return {
    user,
    role_key: group.id === 1 ? "rep" : group.id === 2 ? "supervisor" : "logistics",
    month,
    status,
    total,
    kpis: kpis.map(([key, label, weight, value]) => ({ key, label, weight, raw_value: value, score: value })),
    manual_rating: manual,
    comparison_group: group,
    agent_coefficient_applied: null,
    has_deduction: deduction,
  };
}

const rated = (value: "100" | "80" | "60" | "40" | "20", locked: boolean) => ({ score: value, rated_by: ziad, locked });
const repKpis = (visits: number, reports: number, samples: number, manual: number): Kpi[] => [["visits", "الزيارات", 40, visits], ["reports", "التقارير", 20, reports], ["samples", "توزيع العينات", 20, samples], ["manual", "التقييم اليدوي", 20, manual]];
const leadKpis = (tasks: number, team: number, manual: number): Kpi[] => [["tasks", "المهام", 40, tasks], ["team", "أداء الفريق", 40, team], ["manual", "التقييم اليدوي", 20, manual]];

function monthScores(month: string, status: "PROVISIONAL" | "FINAL", allRated: boolean): MonthlyScore[] {
  const locked = status === "FINAL";
  const manual = (value: "100" | "80" | "60" | "40" | "20") => rated(value, locked);
  return [
    score(u(33, "هدى العلي"), month, status, groups.reps, 92.1, repKpis(38, 19, 19, 16.1), manual("80")),
    score(u(31, "سامر الحلبي"), month, status, groups.reps, 88.4, repKpis(36, 18, 18.4, 16), manual("80"), true),
    score(u(32, "عمر الخطيب"), month, status, groups.reps, 79, repKpis(32, 16, 19, 12), manual("60"), true),
    score(u(37, "رنا الحسن"), month, status, groups.reps, 61.5, repKpis(24, 14, 15.5, 8), manual("40")),
    score(u(21, "منى الصباغ"), month, status, groups.supervisors, 86.2, leadKpis(36, 34.2, 16), allRated ? manual("80") : null),
    score(u(20, "خالد النجار"), month, status, groups.supervisors, 72.4, leadKpis(28, 32.4, 12), allRated ? manual("60") : null),
    score(u(3, "رامي السيد"), month, status, groups.warehouse, 90.3, leadKpis(38, 36.3, 16), allRated ? manual("80") : null),
    score(u(5, "سليم القاسم"), month, status, groups.warehouse, 68, leadKpis(24, 32, 12), manual("60"), true),
  ];
}

export const scoresNovember = monthScores("2026-11", "PROVISIONAL", false);
export const scoresNovemberRated = monthScores("2026-11", "PROVISIONAL", true);
export const scoresOctober = monthScores("2026-10", "FINAL", true);

// ————— موظف الشهر —————

const winner = (group: (typeof groups)[keyof typeof groups] | null, nominees: MonthWinner["nominees"], excluded: MonthWinner["excluded_for_deduction"] = [], approved: MonthWinner["approved"] = null): MonthWinner => ({
  kind: group ? "EMPLOYEE" : "CUSTOMER",
  group,
  month: "2026-10",
  nominees,
  excluded_for_deduction: excluded,
  approved,
});

/** الحالة الافتراضية: مرشّح واحد لكل مجموعة، ومرشّح المندوبين بعد تخطّي سامر لخصم عليه. */
export const winnersDefault: readonly MonthWinner[] = [
  winner(groups.reps, [{ subject_id: 33, name: "هدى العلي", total: 92.1, tied: false }], [{ subject_id: 31, name: "سامر الحلبي", total: 93.4 }]),
  winner(groups.supervisors, [{ subject_id: 21, name: "منى الصباغ", total: 86.2, tied: false }]),
  winner(groups.warehouse, [{ subject_id: 3, name: "رامي السيد", total: 90.3, tied: false }], [{ subject_id: 5, name: "سليم القاسم", total: 91 }]),
  winner(null, [{ subject_id: 1004, name: "صيدلية الحياة — العزيزية", total: 97, tied: false }]),
];

/** متعادلون في الإشراف. */
export const winnersTie: readonly MonthWinner[] = winnersDefault.map((entry) =>
  entry.group?.id === 2 ? { ...entry, nominees: [{ subject_id: 21, name: "منى الصباغ", total: 86.2, tied: true }, { subject_id: 20, name: "خالد النجار", total: 86.2, tied: true }] } : entry,
);

/** كلها معتمدة، والمستودع باختيار غير المرشّح. */
export const winnersApproved: readonly MonthWinner[] = winnersDefault.map((entry) => ({
  ...entry,
  approved:
    entry.group?.id === 3
      ? { subject_id: 5, name: "سليم القاسم", reason: "الخصم كان لتلف عرضي، وجرد حلب أُنجز بجهده الاستثنائي.", by: ziad, at: "2026-11-07T09:30:00Z" }
      : { subject_id: entry.nominees?.[0]?.subject_id, name: entry.nominees?.[0]?.name, reason: null, by: ziad, at: "2026-11-07T09:20:00Z" },
}));

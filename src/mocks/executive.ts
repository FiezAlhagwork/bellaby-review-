import type { ExecutiveOverview } from "@/features/executive/views/ExecutiveDashboardView";
import type { ExecutiveDashboard } from "@/lib/api/types";

// لوحة المدير التنفيذي (E01): تشرين الأول 2026 مغلق بأرقام نهائية، وتشرين الثاني مبدئي حتى 10 منه. لا يُنقل للإنتاج.

export const executiveNow = "2026-11-10T09:00:00Z";

const u = (id: number, name: string) => ({ id, name });
const cat = (id: number, name: string) => ({ id, name });

const october: ExecutiveDashboard = {
  month: "2026-10",
  task_completion: [
    { user: u(3, "رامي السيد"), approved: 18, due: 19, completion_pct: 94.7, on_time_pct: 89.5 },
    { user: u(6, "رنا الشامي"), approved: 14, due: 16, completion_pct: 87.5, on_time_pct: 75 },
    { user: u(40, "د. هبة الأحمد"), approved: 12, due: 12, completion_pct: 100, on_time_pct: 91.7 },
    { user: u(20, "خالد النجار"), approved: 9, due: 13, completion_pct: 69.2, on_time_pct: 53.8 },
    { user: u(21, "منى الصباغ"), approved: 11, due: 12, completion_pct: 91.7, on_time_pct: 83.3 },
    { user: u(5, "سليم القاسم"), approved: 7, due: 15, completion_pct: 46.7, on_time_pct: 40 },
  ],
  lowest_by_tasks: [
    { group: "المستودع", user: u(5, "سليم القاسم"), completion_pct: 46.7 },
    { group: "الإشراف", user: u(20, "خالد النجار"), completion_pct: 69.2 },
    { group: "المديرون", user: u(6, "رنا الشامي"), completion_pct: 87.5 },
  ],
  lowest_by_score: [
    { group: "المندوبون", user: u(37, "رنا الحسن"), total: 61.5 },
    { group: "الإشراف", user: u(20, "خالد النجار"), total: 72.4 },
    { group: "المستودع", user: u(5, "سليم القاسم"), total: 68 },
  ],
  item_targets: [
    { item: { id: 1, name: "حليب أطفال المرحلة الأولى 400غ" }, target: "60000.00", actual: "54320.50", achievement_pct: 90.5 },
    { item: { id: 2, name: "حليب أطفال المرحلة الثانية 800غ" }, target: "45000.00", actual: "47210.00", achievement_pct: 104.9 },
    { item: { id: 3, name: "سيريلاك أرز 250غ" }, target: "18000.00", actual: "11240.75", achievement_pct: 62.4 },
  ],
  agent_targets: [
    { agent: { id: 7, name: "وكالة الياسمين للتوزيع" }, target: "40000.00", actual: "38900.00", achievement_pct: 97.3 },
    { agent: { id: 9, name: "مؤسسة النور للتوزيع" }, target: "35000.00", actual: "29120.25", achievement_pct: 83.2 },
    { agent: { id: 8, name: "وكالة الساحل للتوزيع" }, target: "25000.00", actual: "26010.00", achievement_pct: 104 },
    { agent: { id: 12, name: "وكالة الشام للتوزيع" }, target: "23000.00", actual: "18741.00", achievement_pct: 81.5 },
  ],
  expenses: {
    month: "2026-10",
    lines: [
      { category: cat(1, "مواصلات"), budget: "4000.00", actual: "3620.00", ratio_pct: 90.5, actual_entered_by: u(50, "سمر العبدالله"), actual_entered_at: "2026-11-02T08:00:00Z" },
      { category: cat(2, "عينات ومواد"), budget: "6000.00", actual: "6480.40", ratio_pct: 108, actual_entered_by: null, actual_entered_at: null },
      { category: cat(3, "ضيافة ومؤتمرات"), budget: "2500.00", actual: "1410.00", ratio_pct: 56.4, actual_entered_by: u(50, "سمر العبدالله"), actual_entered_at: "2026-11-02T08:05:00Z" },
      { category: cat(4, "اتصالات"), budget: "800.00", actual: "690.00", ratio_pct: 86.3, actual_entered_by: u(50, "سمر العبدالله"), actual_entered_at: "2026-11-02T08:07:00Z" },
    ],
    total_budget: "13300.00",
    total_actual: "12200.40",
    total_ratio_pct: 91.7,
    locked: true,
  },
};

const scoreGroups: ExecutiveOverview["scoreGroups"] = [
  { group: "المندوبون", scores: [{ user: u(33, "هدى العلي"), total: 92.1 }, { user: u(31, "سامر الحلبي"), total: 88.4 }, { user: u(32, "عمر الخطيب"), total: 79 }, { user: u(37, "رنا الحسن"), total: 61.5 }] },
  { group: "الإشراف", scores: [{ user: u(21, "منى الصباغ"), total: 86.2 }, { user: u(20, "خالد النجار"), total: 72.4 }] },
  { group: "المستودع", scores: [{ user: u(3, "رامي السيد"), total: 90.3 }, { user: u(5, "سليم القاسم"), total: 68 }] },
];

export const executiveFinal: ExecutiveOverview = { dashboard: october, pending: { count: 7, oldestAt: "2026-11-06T08:30:00Z" }, scoreGroups, provisional: false };

export const executiveProvisional: ExecutiveOverview = {
  dashboard: { ...october, month: "2026-11", expenses: october.expenses ? { ...october.expenses, month: "2026-11", locked: false } : undefined },
  pending: { count: 7, oldestAt: "2026-11-06T08:30:00Z" },
  scoreGroups,
  provisional: true,
};

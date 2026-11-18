import type { Budget, Deduction, ExpenseCategory, UserRef } from "@/lib/api/types";

// الميزانية وبنود المصاريف والخصومات (E03 · E04 · E05). تشرين الأول 2026 مغلق، وتشرين الثاني مفتوح حتى 10 منه. لا يُنقل للإنتاج.

export const financeToday = "2026-11-10";
export const closedMonths = ["2026-08", "2026-09", "2026-10"];

export const expenseCategories: readonly ExpenseCategory[] = [
  { id: 2, name: "عينات ومواد دعائية", kind: "COMPUTED", is_active: true, is_system: true },
  { id: 1, name: "مواصلات", kind: "ENTERED", is_active: true, is_system: true },
  { id: 3, name: "ضيافة ومؤتمرات", kind: "ENTERED", is_active: true, is_system: false },
  { id: 4, name: "اتصالات", kind: "ENTERED", is_active: true, is_system: false },
  { id: 5, name: "قرطاسية", kind: "ENTERED", is_active: false, is_system: false },
];

const [samples, transport, hospitality, phones] = expenseCategories;
const samar: UserRef = { id: 50, name: "سمر العبدالله" };

/** تشرين الثاني مفتوح: الفعلي حتى اليوم، والاتصالات لم يُدخلها المحاسب بعد. */
export const novemberBudget: Budget = {
  month: "2026-11",
  lines: [
    { category: samples, budget: "6000.00", actual: "2140.60", ratio_pct: 35.7, actual_entered_by: null, actual_entered_at: null },
    { category: transport, budget: "4000.00", actual: "1320.00", ratio_pct: 33, actual_entered_by: samar, actual_entered_at: "2026-11-09T08:10:00Z" },
    { category: hospitality, budget: "2500.00", actual: "450.00", ratio_pct: 18, actual_entered_by: samar, actual_entered_at: "2026-11-09T08:12:00Z" },
    { category: phones, budget: "800.00", actual: null, ratio_pct: null, actual_entered_by: null, actual_entered_at: null },
  ],
  total_budget: "13300.00",
  total_actual: "3910.60",
  total_ratio_pct: 29.4,
  locked: false,
};

/** حالة `default`: كل البنود فيها فعلي. */
export const novemberBudgetComplete: Budget = {
  ...novemberBudget,
  lines: (novemberBudget.lines ?? []).map((line) => (line.category?.id === phones.id ? { ...line, actual: "210.00", ratio_pct: 26.3, actual_entered_by: samar, actual_entered_at: "2026-11-09T08:15:00Z" } : line)),
  total_actual: "4120.60",
  total_ratio_pct: 31,
};

/** تشرين الأول مغلق. */
export const octoberBudget: Budget = {
  month: "2026-10",
  lines: [
    { category: samples, budget: "6000.00", actual: "6480.40", ratio_pct: 108, actual_entered_by: null, actual_entered_at: null },
    { category: transport, budget: "4000.00", actual: "3620.00", ratio_pct: 90.5, actual_entered_by: samar, actual_entered_at: "2026-11-02T08:00:00Z" },
    { category: hospitality, budget: "2500.00", actual: "1410.00", ratio_pct: 56.4, actual_entered_by: samar, actual_entered_at: "2026-11-02T08:05:00Z" },
    { category: phones, budget: "800.00", actual: "690.00", ratio_pct: 86.3, actual_entered_by: samar, actual_entered_at: "2026-11-02T08:07:00Z" },
  ],
  total_budget: "13300.00",
  total_actual: "12200.40",
  total_ratio_pct: 91.7,
  locked: true,
};

const ziad: UserRef = { id: 1, name: "زياد المصري" };
export const deductionUsers: readonly UserRef[] = [
  { id: 5, name: "سليم القاسم" },
  { id: 20, name: "خالد النجار" },
  { id: 31, name: "سامر الحلبي" },
  { id: 32, name: "عمر الخطيب" },
  { id: 37, name: "رنا الحسن" },
];
const [salim, khaled, samer, omar, ranaH] = deductionUsers;

function d(id: number, user: UserRef, month: string, amount: string, source: NonNullable<Deduction["source"]>, reason: string, at: string, extra: Partial<Deduction> = {}): Deduction {
  return { id, user, month, amount, source, reason, task_id: null, investigation_id: null, reverses_id: null, reversed_by_id: null, created_by: ziad, created_at: `2026-${at}:00Z`, ...extra };
}

/** الأحدث أولاً. */
export const deductionsList: readonly Deduction[] = [
  d(412, samer, "2026-11", "25.00", "OTHER", "قيد معاكس: الغياب كان بإجازة مرضية معتمدة لم تُسجَّل في وقتها.", "11-09T10:20", { reverses_id: 409 }),
  d(411, salim, "2026-11", "40.00", "TASK", "تأخّر جرد مستودع حلب أسبوعاً عن موعده دون سبب.", "11-08T09:00", { task_id: 233 }),
  d(410, omar, "2026-11", "60.00", "INVESTIGATION", "قرار التحقيق رقم 17: زيارتان بموقع مزوَّر.", "11-06T12:40", { investigation_id: 17, created_by: ziad }),
  d(409, samer, "2026-11", "25.00", "ATTENDANCE", "غياب يوم 4 تشرين الثاني بلا إجازة.", "11-05T08:30", { reversed_by_id: 412 }),
  d(402, khaled, "2026-10", "30.00", "TASK", "لم يُسلَّم تقرير الإشراف الشهري.", "10-28T11:00", { task_id: 214 }),
  d(398, ranaH, "2026-10", "20.00", "ATTENDANCE", "ثلاثة أيام دوام ناقص دون مبرر.", "10-22T09:15"),
  d(391, salim, "2026-10", "15.00", "OTHER", "تلف عبوات أثناء التحميل بسبب سوء الرص.", "10-14T13:30"),
];

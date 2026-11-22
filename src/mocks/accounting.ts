import type { MonthClosing, ReportResult } from "@/lib/api/types";

// تقريرا المحاسبة (I13 · I14) وحالة إغلاق الشهر في لوحة المحاسبة (I11). تشرين الثاني مفتوح (مبدئي)، وتشرين الأول مغلق (نهائي).
// أعمدة التقريرين من عندنا بانتظار الباك (§85)، والعقد يعرّف الشكل فقط (`columns` و`rows` و`totals`). لا يُنقل للإنتاج.

export const accountingToday = "2026-11-10";

/** تشرين الثاني مفتوح، والاتصالات بلا مصروف فعلي: تذكير المحاسب. */
export const closingWithMissing = {
  month: "2026-11",
  status: "OPEN",
  fifth_work_day: "2026-12-07",
  missing_manual_ratings: [],
  missing_expenses: [{ category_id: 4, name: "اتصالات" }],
  closed_at: null,
} satisfies MonthClosing;

export const closingComplete = { ...closingWithMissing, missing_expenses: [] } satisfies MonthClosing;

// ————— تقرير الدوام —————

type AttendanceRow = { employee: string; department: string; work_days: number; absences: number; short_days: number; leave_days: number };

const attendanceColumns = [
  { key: "employee", label: "الموظف", type: "string" },
  { key: "department", label: "القسم", type: "string" },
  { key: "work_days", label: "أيام العمل", type: "integer" },
  { key: "absences", label: "الغياب", type: "integer" },
  { key: "short_days", label: "الدوام الناقص", type: "integer" },
  { key: "leave_days", label: "الإجازات", type: "integer" },
] satisfies ReportResult["columns"];

const attendanceRows = (scale: 0 | 1): AttendanceRow[] => [
  { employee: "خالد النجار", department: "المكتب العلمي", work_days: scale ? 22 : 7, absences: scale ? 1 : 0, short_days: scale ? 2 : 1, leave_days: scale ? 1 : 0 },
  { employee: "منى الصباغ", department: "المكتب العلمي", work_days: scale ? 23 : 7, absences: 0, short_days: 0, leave_days: scale ? 1 : 0 },
  { employee: "ماهر الأتاسي", department: "المكتب العلمي", work_days: scale ? 24 : 7, absences: 0, short_days: scale ? 1 : 0, leave_days: 0 },
  { employee: "رامي السيد", department: "اللوجستيات", work_days: scale ? 21 : 6, absences: scale ? 2 : 1, short_days: 0, leave_days: scale ? 1 : 0 },
  { employee: "سليم القاسم", department: "اللوجستيات", work_days: scale ? 24 : 7, absences: 0, short_days: scale ? 3 : 1, leave_days: 0 },
  { employee: "جمال الحكيم", department: "المراقبة", work_days: scale ? 22 : 7, absences: 0, short_days: 0, leave_days: scale ? 2 : 0 },
];

export const attendanceProvisional = {
  key: "attendance",
  title: "تقرير الدوام",
  is_final: false,
  generated_at: "2026-11-10T07:00:00Z",
  columns: attendanceColumns,
  rows: attendanceRows(0),
  totals: { work_days: 41, absences: 2, short_days: 3, leave_days: 0 },
} satisfies ReportResult;

export const attendanceFinal = {
  ...attendanceProvisional,
  is_final: true,
  generated_at: "2026-11-06T00:10:00Z",
  rows: attendanceRows(1),
  totals: { work_days: 136, absences: 3, short_days: 6, leave_days: 5 },
} satisfies ReportResult;

// ————— تقرير الخصومات —————

const deductionColumns = [
  { key: "employee", label: "الموظف", type: "string" },
  { key: "reason", label: "السبب", type: "string" },
  { key: "date", label: "التاريخ", type: "date" },
  { key: "amount", label: "المبلغ", type: "money" },
  { key: "note", label: "ملاحظة", type: "string" },
] satisfies ReportResult["columns"];

const deductionBase = [
  { employee: "خالد النجار", reason: "تأخر تقرير يومي", date: "2026-11-04", amount: "25.00", note: null },
  { employee: "سليم القاسم", reason: "فرق جرد", date: "2026-11-06", amount: "60.00", note: null },
  { employee: "رامي السيد", reason: "غياب بلا إذن", date: "2026-11-07", amount: "40.00", note: null },
];

/** القيد المعاكس سطران متقابلان: الخصم الأصلي كما هو، وسطر بالقيمة السالبة بعده. */
const reversalPair = [
  { employee: "منى الصباغ", reason: "تأخر تقرير يومي", date: "2026-11-03", amount: "25.00", note: null },
  { employee: "منى الصباغ", reason: "تأخر تقرير يومي", date: "2026-11-08", amount: "-25.00", note: "قيد معاكس: التقرير رُفع في موعده بعد التحقق." },
];

export const deductionsProvisional = {
  key: "deductions",
  title: "تقرير الخصومات",
  is_final: false,
  generated_at: "2026-11-10T07:00:00Z",
  columns: deductionColumns,
  rows: deductionBase,
  totals: { amount: "125.00" },
} satisfies ReportResult;

export const deductionsWithReversal = {
  ...deductionsProvisional,
  rows: [...deductionBase, ...reversalPair],
  totals: { amount: "125.00" },
} satisfies ReportResult;

export const deductionsFinal = {
  ...deductionsProvisional,
  is_final: true,
  generated_at: "2026-11-06T00:10:00Z",
  rows: [
    { employee: "خالد النجار", reason: "تأخر تقرير يومي", date: "2026-10-12", amount: "25.00", note: null },
    { employee: "رامي السيد", reason: "غياب بلا إذن", date: "2026-10-20", amount: "40.00", note: null },
    { employee: "جمال الحكيم", reason: "تأخر تقرير يومي", date: "2026-10-22", amount: "25.00", note: null },
  ],
  totals: { amount: "90.00" },
} satisfies ReportResult;

export const emptyReport = { ...attendanceProvisional, rows: [], totals: {} } satisfies ReportResult;

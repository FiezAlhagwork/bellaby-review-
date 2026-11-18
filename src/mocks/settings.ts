import type { ComparisonGroup, GeoTree, Holiday, KpiWeightSet, ListEntry, ListKey, Settings, UserRef } from "@/lib/api/types";

// بيانات الإعدادات (E13–E15): GET /settings، وGET /lists/{key}، وGET /holidays. لا تُنقل للإنتاج.

export const settingsToday = "2026-11-17";

const ziad: UserRef = { id: 1, name: "زياد المصري" };
const lama: UserRef = { id: 31, name: "لمى الحسن" };

export const settings = {
  workday_hours: 8,
  max_payment_term_days: 30,
  payment_alert_days_before: 3,
  expiry_alert_days: 60,
  visit_range_m: 200,
  duplicate_visit_window_days: 7,
  visit_auto_close_hours: 2,
  clock_skew_minutes: 5,
  transfer_unconfirmed_alert_hours: 48,
  flag_handling_work_hours: 72,
  contract_alert_days: 30,
  report_deadline_work_days: { MONTHLY: 3, QUARTERLY: 7, ANNUAL: 14 },
  timezone: "Asia/Damascus",
} satisfies Settings;

const entries = (names: readonly string[], system: readonly string[] = [], inactive: readonly string[] = []): ListEntry[] =>
  names.map((name, index) => ({ id: index + 1, name, order: index + 1, is_active: !inactive.includes(name), is_system: system.includes(name) }));

export const lists = {
  return_reasons: entries(["سحب دفعة", "قرب انتهاء الصلاحية", "تلف في التغليف", "خطأ في الطلب", "ركود عند الصيدلية", "طلب الزبون"], ["سحب دفعة"], ["طلب الزبون"]),
  damage_reasons: entries(["كسر أثناء النقل", "رطوبة في المستودع", "انتهاء الصلاحية", "تلف الختم"]),
  visit_purposes: entries(["تعريف بمنتج", "متابعة", "توزيع عينات", "تدريب كادر الصيدلية"]),
  visit_outcomes: entries(["اهتمام بالمنتج", "وعد بالوصف", "طلب عينات إضافية", "لا اهتمام"]),
  not_met_reasons: entries(["الطبيب غير موجود", "العيادة مغلقة", "انشغال الطبيب", "رفض المقابلة"]),
  specialties: entries(["أطفال", "نسائية وتوليد", "تغذية", "طب عام"]),
  visit_point_types: entries(["عيادة", "صيدلية", "مستشفى", "مستوصف"], [], ["مستوصف"]),
} satisfies Record<ListKey, ListEntry[]>;

export const holidays = [
  { id: 1, date: "2026-01-01", name: "رأس السنة الميلادية", created_by: ziad },
  { id: 2, date: "2026-03-20", name: "عيد الفطر", created_by: ziad },
  { id: 3, date: "2026-03-21", name: "عيد الفطر (اليوم الثاني)", created_by: ziad },
  { id: 4, date: "2026-04-17", name: "عيد الجلاء", created_by: lama },
  { id: 5, date: "2026-05-01", name: "عيد العمال", created_by: lama },
  { id: 6, date: "2026-05-27", name: "عيد الأضحى", created_by: ziad },
  { id: 7, date: "2026-05-28", name: "عيد الأضحى (اليوم الثاني)", created_by: ziad },
  { id: 8, date: "2026-10-06", name: "ذكرى حرب تشرين", created_by: lama },
  { id: 9, date: "2026-12-25", name: "عيد الميلاد المجيد", created_by: ziad },
  { id: 10, date: "2026-12-31", name: "ليلة رأس السنة", created_by: ziad },
] satisfies Holiday[];

export const holidaysCreator = ziad;

// E16: الأوزان (GET /kpi-weights?role_key) ومجموعات المقارنة (GET /comparison-groups). أسماء الأدوار من RoleRef (العقد لا يعطي قائمة الأدوار ذات الأوزان، §70).
export const kpiNextMonth = "2026-12";

export const kpiRoles = [
  { key: "rep", name: "المندوب" },
  { key: "supervisor", name: "السوبرفايزر" },
  { key: "agent", name: "الوكيل" },
] as const;

export const kpiWeights = {
  rep: {
    role_key: "rep",
    effective_month: "2026-06",
    weights: [
      { kpi_key: "confirmed_visits", label: "الزيارات المؤكدة", weight: 35 },
      { kpi_key: "coverage", label: "تغطية الخطة", weight: 20 },
      { kpi_key: "samples_distributed", label: "توزيع العينات", weight: 15 },
      { kpi_key: "daily_reports", label: "التقارير اليومية", weight: 10 },
      { kpi_key: "attendance", label: "الالتزام بالدوام", weight: 10 },
      { kpi_key: "manual_rating", label: "التقييم اليدوي", weight: 10 },
    ],
  },
  supervisor: {
    role_key: "supervisor",
    effective_month: "2026-06",
    weights: [
      { kpi_key: "team_visits", label: "زيارات الفريق المؤكدة", weight: 40 },
      { kpi_key: "reviews_on_time", label: "مراجعة الزيارات في وقتها", weight: 25 },
      { kpi_key: "field_visits", label: "الزيارات الميدانية", weight: 20 },
      { kpi_key: "manual_rating", label: "التقييم اليدوي", weight: 15 },
    ],
  },
  agent: {
    role_key: "agent",
    effective_month: "2026-09",
    weights: [
      { kpi_key: "sales_target", label: "تحقيق هدف المبيعات", weight: 50 },
      { kpi_key: "collection", label: "التحصيل في المهلة", weight: 30 },
      { kpi_key: "manual_rating", label: "التقييم اليدوي", weight: 20 },
    ],
  },
} satisfies Record<(typeof kpiRoles)[number]["key"], KpiWeightSet>;

export const comparisonGroups = [
  { id: 1, name: "المندوبون", effective_month: "2026-06", role_keys: ["rep"], user_ids: [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32], agent_coefficient: 1 },
  { id: 2, name: "المشرفون", effective_month: "2026-06", role_keys: ["supervisor"], user_ids: [11, 12, 13], agent_coefficient: 1 },
  { id: 3, name: "الوكلاء", effective_month: "2026-09", role_keys: ["agent"], user_ids: [41, 42, 43, 44, 45], agent_coefficient: 1.2 },
  { id: 4, name: "الإداريون", effective_month: "2026-06", role_keys: ["logistics", "accountant", "it", "legal"], user_ids: [3, 7, 8, 9], agent_coefficient: 1 },
] satisfies ComparisonGroup[];

export const roleNames: Readonly<Record<string, string>> = {
  rep: "المندوب",
  supervisor: "السوبرفايزر",
  agent: "الوكيل",
  logistics: "اللوجستي",
  accountant: "المحاسب",
  it: "IT",
  legal: "القانوني",
};

// E17: GET /geo.
export const geoTree = {
  countries: [
    {
      id: 1,
      name: "سوريا",
      regions: [
        { id: 1, name: "الشمالية", class: "A", governorates: [{ id: 1, name: "حلب" }, { id: 2, name: "إدلب" }] },
        { id: 2, name: "الوسطى", class: "A", governorates: [{ id: 3, name: "حمص" }, { id: 4, name: "حماة" }] },
        { id: 3, name: "الجنوبية", class: "B", governorates: [{ id: 5, name: "دمشق" }, { id: 6, name: "ريف دمشق" }, { id: 7, name: "درعا" }, { id: 8, name: "السويداء" }, { id: 9, name: "القنيطرة" }] },
        { id: 4, name: "الساحلية", class: "B", governorates: [{ id: 10, name: "اللاذقية" }, { id: 11, name: "طرطوس" }] },
        { id: 5, name: "الشرقية", class: "C", governorates: [{ id: 12, name: "دير الزور" }, { id: 13, name: "الرقة" }] },
        { id: 6, name: "الجزيرة", class: "D", governorates: [{ id: 14, name: "الحسكة" }] },
      ],
    },
  ],
} satisfies GeoTree;

import type { PeriodicReport, PlanTarget, UserRef } from "@/lib/api/types";

// التقارير الدورية (G11–G13). اليوم 4 تشرين الثاني 2026: تقارير تشرين الأول الشهرية مسودات تنتظر الإرسال. الأوقات UTC، ونهاية اليوم بدمشق 20:59Z. لا يُنقل للإنتاج.

export const reportsNow = "2026-11-04T10:00:00Z";
export const reportsToday = "2026-11-04";

const rami: UserRef = { id: 3, name: "رامي السيد" };
const salim: UserRef = { id: 5, name: "سليم القاسم" };
const omar: UserRef = { id: 8, name: "عمر الدباغ" };
const rana: UserRef = { id: 6, name: "رنا الشامي" };
const heba: UserRef = { id: 40, name: "د. هبة الأحمد" };
const ziad: UserRef = { id: 1, name: "زياد المصري" };
const jamal: UserRef = { id: 50, name: "جمال الحكيم" };

/** أعضاء قسم اللوجستيات: المسؤولون المتاحون في بند الخطة. */
export const logisticsMembers: readonly UserRef[] = [rami, salim, omar];

/** أعضاء كل قسم (المسؤولون في بند الخطة): §103. */
export const departmentMembers: Partial<Record<NonNullable<PeriodicReport["department"]>, readonly UserRef[]>> = {
  LOGISTICS: logisticsMembers,
  SALES: [rana, { id: 15, name: "باسل العمر" }],
  SCIENTIFIC_OFFICE: [heba, { id: 20, name: "سامر الحلبي" }, { id: 21, name: "ميس العلي" }],
};

// أسماء المعرّفات في الأهداف: تحسبها الحاوية من القوائم (§102).
const regions: Record<number, string> = { 1: "دمشق", 2: "ريف دمشق", 3: "حلب" };
const agents: Record<number, string> = { 11: "مؤسسة النور للتوزيع", 12: "مؤسسة الشام للتجارة" };
const items: Record<number, string> = { 101: "حليب أطفال مرحلة أولى 400غ", 102: "حليب أطفال مرحلة ثانية 800غ" };
const pointTypes: Record<number, string> = { 1: "صيدلية", 2: "عيادة أطفال" };
const specialties: Record<number, string> = { 1: "طب الأطفال", 2: "النسائية والتوليد" };

/** اسم الهدف من معرّفاته، كما تحسبه الحاوية. */
export function describeTarget(target: PlanTarget): string {
  const parts = [
    target.region_id ? regions[target.region_id] : null,
    target.agent_id ? agents[target.agent_id] : null,
    target.item_id ? items[target.item_id] : null,
    target.visit_point_type_id ? pointTypes[target.visit_point_type_id] : null,
    target.specialty_id ? specialties[target.specialty_id] : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "القسم كله";
}

const base = {
  template_version: 1,
  is_mandatory: true,
  kind: "MONTHLY",
  period_start: "2026-10-01",
  period_end: "2026-10-31",
  first_submitted_at: null,
  on_time: null,
  current_version: null,
  declaration_confirmed: false,
  monitoring_review: null,
  executive_decision: null,
  needs_from_management: "",
  cooperation: "",
  problems: [],
  risks: [],
  needs_from_departments: [],
  next_period_plan: [],
  next_period_targets: [],
  overdue_work: [],
} satisfies Partial<PeriodicReport>;

/** تقرير اللوجستيات الشهري لتشرين الأول: مسودة مملوءة جزئياً. */
const logistics: PeriodicReport = {
  ...base,
  id: 77,
  department: "LOGISTICS",
  author: rami,
  status: "DRAFT",
  deadline_at: "2026-11-07T20:59:00Z",
  executive_summary: {
    summary: "استلمنا ثلاث شحنات من المصنّع وصرفنا 214 طلباً للوكلاء. الجرد الشهري لمستودع دمشق تمّ بفرق 0.4%.",
    achievements: "تقليص زمن تجهيز الصرف من يومين إلى يوم واحد.",
    failures: [],
  },
  overdue_work: [
    { kind: "TASK", ref_id: 214, title: "جرد رف العينات في مستودع حلب", responsible: salim, original_due: "2026-10-20T20:59:00Z", delay_days: 11, reason: "انتظار وصول عينات المرحلة الثانية.", action: null, new_due: null },
    { kind: "DEPARTMENT_REQUEST", ref_id: 14, title: "كشف حركات مستودع حمص للمحاسبة", responsible: omar, original_due: "2026-10-27T20:59:00Z", delay_days: 4, reason: null, action: null, new_due: null },
  ],
  problems: [
    { id: 31, text: "تأخر شحنات المصنّع أسبوعاً عن موعدها المعلن.", status: "OPEN", origin_report_id: 64 },
    { id: 35, text: "عطل في مبرّد مستودع حمص يومين.", status: "OPEN", origin_report_id: null },
  ],
  risks: [{ text: "نفاد المرحلة الأولى 400غ في حلب إن تأخرت الشحنة القادمة.", probability: "MEDIUM", impact: "HIGH", level: "HIGH" }],
  needs_from_management: "اعتماد مبرّد احتياطي لمستودع حمص.",
  needs_from_departments: [{ to_department: "SALES", description: "توقعات طلب الوكلاء لكانون الأول قبل 20 تشرين الثاني.", due_date: "2026-11-20" }],
  cooperation: "",
  team_evaluation: [
    { user: salim, tasks_auto: 92, commitment_auto: 88, quality: "80", productivity: "80", overall: "80" },
    { user: omar, tasks_auto: 75, commitment_auto: 81, quality: undefined, productivity: undefined, overall: undefined },
  ],
  head_evaluation: { plan_achievement_pct: 84, overall: undefined, score_100: undefined, system_score: 79 },
  next_period_plan: [
    { title: "جرد مستودع حلب نصف الشهري", responsible_id: 5, due_date: "2026-11-15" },
    { title: "تركيب المبرّد الاحتياطي في حمص", responsible_id: 8, due_date: "2026-11-25" },
  ],
};

/** ما كتبه رامي كاملاً قبل الإرسال. */
const logisticsComplete: PeriodicReport = {
  ...logistics,
  declaration_confirmed: true,
  executive_summary: { ...logistics.executive_summary, failures: [] },
  overdue_work: [
    { ...logistics.overdue_work![0], action: "الجرد فور وصول العينات.", new_due: "2026-11-10" },
    { ...logistics.overdue_work![1], reason: "إجازة أمين مستودع حمص.", action: "يُسلَّم من مستودع دمشق.", new_due: "2026-11-06" },
  ],
  cooperation: "تنسيق جيد مع المبيعات في جدولة الصرف.",
  team_evaluation: [logistics.team_evaluation![0], { ...logistics.team_evaluation![1], quality: "60", productivity: "60", overall: "60" }],
  head_evaluation: { ...logistics.head_evaluation, overall: "80", score_100: 82 },
};

const review = { received_at: "2026-11-06T08:30:00Z", is_complete: true, needs_verification: false, notes: "الأرقام مطابقة لحركات المستودع. فرق الجرد ضمن الحد.", reviewed_by: jamal };

/** تقرير المبيعات: أهداف بقيمة لكل منطقة ووكيل ومنتج، وعملاء جدد، وزيارات المدير. لا فريق (team_evaluation = null). */
const sales: PeriodicReport = {
  ...base,
  id: 79,
  department: "SALES",
  author: rana,
  status: "DRAFT",
  deadline_at: "2026-11-07T20:59:00Z",
  executive_summary: {
    summary: "مبيعات تشرين الأول 84% من الهدف. دمشق فوق الهدف، وحلب دونه بسبب تأخر الشحنة.",
    achievements: "ثلاثة عملاء جدد في ريف دمشق.",
    failures: [
      { target: { type: "SALES", metric: "SALES_VALUE", region_id: 3, target: 40000, actual: 26800, achievement_pct: 67 }, reason: "نفاد المرحلة الأولى أسبوعين." },
      { target: { type: "SALES", metric: "NEW_CUSTOMERS", target: 6, actual: 3, achievement_pct: 50 }, reason: null },
    ],
  },
  team_evaluation: null,
  head_evaluation: { plan_achievement_pct: 84, overall: undefined, score_100: undefined, system_score: 81 },
  next_period_plan: [{ title: "زيارة وكلاء حلب بعد وصول الشحنة", responsible_id: 6, due_date: "2026-11-20" }],
  next_period_targets: [
    { type: "SALES", metric: "SALES_VALUE", region_id: 1, target: 65000 },
    { type: "SALES", metric: "SALES_VALUE", region_id: 3, target: 40000 },
    { type: "SALES", metric: "SALES_VALUE", agent_id: 11, target: 30000 },
    { type: "SALES_ITEM", metric: "ITEM_SALES_VALUE", item_id: 101, target: 52000 },
    { type: "SALES", metric: "NEW_CUSTOMERS", target: 6 },
    { type: "VISITS", metric: "MANAGER_VISITS", target: 12 },
  ],
};

/** تقرير المكتب العلمي: زيارات، وفئات، ومنتجات، وخطة العينات. */
const scientific: PeriodicReport = {
  ...base,
  id: 80,
  department: "SCIENTIFIC_OFFICE",
  author: heba,
  status: "DRAFT",
  deadline_at: "2026-11-07T20:59:00Z",
  executive_summary: {
    summary: "1,140 زيارة من 1,300 مخططة. تغطية أطباء الأطفال 92%.",
    achievements: "إطلاق مناقشة المرحلة الثانية في 140 عيادة.",
    failures: [{ target: { type: "CATEGORY", metric: "CATEGORY_VISITS", visit_point_type_id: 1, target: 400, actual: 290, achievement_pct: 72.5 }, reason: "نقص مندوبين في حلب." }],
  },
  team_evaluation: [
    { user: { id: 20, name: "سامر الحلبي" }, tasks_auto: 95, commitment_auto: 90, quality: "80", productivity: "100", overall: "80" },
    { user: { id: 21, name: "ميس العلي" }, tasks_auto: 70, commitment_auto: 76, quality: "60", productivity: "60", overall: "60" },
  ],
  head_evaluation: { plan_achievement_pct: 88, overall: undefined, score_100: undefined, system_score: 85 },
  next_period_targets: [
    { type: "VISITS", metric: "VISITS", target: 1300 },
    { type: "CATEGORY", metric: "CATEGORY_VISITS", specialty_id: 1, target: 600 },
    { type: "CATEGORY", metric: "CATEGORY_VISITS", visit_point_type_id: 1, target: 400 },
    { type: "PRODUCT", metric: "ITEM_DISCUSSIONS", item_id: 102, target: 500 },
    { type: "PRODUCT", metric: "ITEM_SAMPLES", item_id: 101, target: 900 },
  ],
};

export type ReportState = "draft" | "validation" | "submitted" | "returned" | "overdue" | "targets-sales" | "targets-scientific" | "reviewed" | "approved" | "follow-up" | "sales-reviewed";

export function reportAt(state: ReportState): PeriodicReport {
  switch (state) {
    case "draft":
      return logistics;
    case "validation":
      return { ...logistics, executive_summary: { ...logistics.executive_summary, summary: "" } };
    case "overdue":
      return { ...logistics, deadline_at: "2026-11-03T20:59:00Z" };
    case "submitted":
      return { ...logisticsComplete, status: "SUBMITTED", current_version: 1, first_submitted_at: "2026-11-06T08:30:00Z", on_time: true };
    case "reviewed":
      return { ...logisticsComplete, status: "REVIEWED", current_version: 1, first_submitted_at: "2026-11-06T08:30:00Z", on_time: true, monitoring_review: review };
    case "returned":
      return {
        ...logisticsComplete,
        status: "RETURNED",
        declaration_confirmed: false,
        current_version: 1,
        first_submitted_at: "2026-11-06T08:30:00Z",
        on_time: true,
        monitoring_review: { ...review, needs_verification: true, notes: "فرق جرد حلب غير مشروح." },
        executive_decision: { decision: "RETURN_FOR_EDIT", notes: "اشرح فرق جرد حلب وأثره على أرصدة الوكلاء.", required_action: "أضف سبب الفرق وخطة تسويته.", decided_by: ziad, decided_at: "2026-11-09T11:00:00Z", on_behalf_of: null },
      };
    case "approved":
      return { ...reportAt("reviewed"), status: "APPROVED", executive_decision: { decision: "APPROVE_WITH_NOTES", notes: "أداء جيد. ثبّتوا موعد تركيب المبرّد.", required_action: null, decided_by: ziad, decided_at: "2026-11-09T11:00:00Z", on_behalf_of: null } };
    case "follow-up":
      return { ...reportAt("reviewed"), status: "APPROVED", executive_decision: { decision: "APPROVE_WITH_FOLLOW_UP", notes: null, required_action: "تقرير أسبوعي عن أرصدة حلب حتى وصول الشحنة.", decided_by: ziad, decided_at: "2026-11-09T11:00:00Z", on_behalf_of: null } };
    case "sales-reviewed":
      return { ...sales, status: "REVIEWED", declaration_confirmed: true, current_version: 1, first_submitted_at: "2026-11-06T10:00:00Z", on_time: true, monitoring_review: { ...review, notes: "أرقام المبيعات مطابقة للتسليمات." } };
    case "targets-sales":
      return sales;
    case "targets-scientific":
      return scientific;
  }
}

const row = (id: number, extra: Partial<PeriodicReport>): PeriodicReport => ({ ...base, id, department: "LOGISTICS", author: rami, status: "APPROVED", deadline_at: null, ...extra });

/** تقارير رامي (`scope=mine`)، الأحدث أولاً. */
export const myReports: readonly PeriodicReport[] = [
  logistics,
  row(83, { kind: "EXCEPTIONAL", is_mandatory: false, period_start: "2026-10-18", period_end: "2026-10-19", status: "SUBMITTED", first_submitted_at: "2026-10-20T07:00:00Z", current_version: 1 }),
  row(64, { period_start: "2026-09-01", period_end: "2026-09-30", deadline_at: "2026-10-07T20:59:00Z", first_submitted_at: "2026-10-08T09:00:00Z", on_time: false, current_version: 2 }),
  row(52, { kind: "QUARTERLY", period_start: "2026-07-01", period_end: "2026-09-30", deadline_at: "2026-10-09T20:59:00Z", first_submitted_at: "2026-10-06T09:00:00Z", on_time: true, current_version: 1 }),
  row(41, { period_start: "2026-08-01", period_end: "2026-08-31", deadline_at: "2026-09-07T20:59:00Z", first_submitted_at: "2026-09-04T09:00:00Z", on_time: true, current_version: 1 }),
];

/** بانتظار مراجعة المراقبة (`scope=to_review`). */
export const toReviewReports: readonly PeriodicReport[] = [
  reportAt("submitted"),
  row(82, { department: "LEGAL", author: { id: 60, name: "لينا الخطيب" }, status: "SUBMITTED", deadline_at: "2026-11-07T20:59:00Z", first_submitted_at: "2026-11-03T12:00:00Z", on_time: true, current_version: 1 }),
  row(83, { kind: "EXCEPTIONAL", is_mandatory: false, period_start: "2026-10-18", period_end: "2026-10-19", status: "SUBMITTED", first_submitted_at: "2026-10-20T07:00:00Z", current_version: 1 }),
];

/** نسخ تقرير اللوجستيات (GET /versions بعد التحويل): الأولى قبل الإعادة، والثانية بعد شرح فرق الجرد. */
export const reportVersions = [
  { version: 1, submittedAt: "2026-11-06T08:30:00Z", report: { ...reportAt("submitted"), current_version: 1 } },
  {
    version: 2,
    submittedAt: "2026-11-10T09:15:00Z",
    report: {
      ...reportAt("submitted"),
      current_version: 2,
      problems: [...(logistics.problems ?? []), { id: 38, text: "فرق جرد حلب 18 علبة: صرف مسجّل مرتين في 14 تشرين الأول، يُسوّى بحركة تصحيح.", status: "OPEN" as const, origin_report_id: null }],
    },
  },
];

/** بانتظار قرار المدير التنفيذي (`scope=to_decide`). */
export const toDecideReports: readonly PeriodicReport[] = [
  reportAt("reviewed"),
  row(78, { department: "IT", author: { id: 9, name: "طارق النحاس" }, status: "REVIEWED", deadline_at: "2026-11-07T20:59:00Z", first_submitted_at: "2026-11-02T10:00:00Z", on_time: true, current_version: 1 }),
  row(76, { department: "ACCOUNTING", author: { id: 52, name: "سمر العبدالله" }, status: "REVIEWED", deadline_at: "2026-11-07T20:59:00Z", first_submitted_at: "2026-11-01T10:00:00Z", on_time: true, current_version: 2 }),
];

import type { ExecReportDecision, OptionalReportKind, ReportKind, ReportLikelihood, ReportRiskLevel, TargetMetric } from "@/lib/api/types";
import type { BadgeColor } from "@/components/ui/Badge";

/** نوع التقرير الدوري (`ReportKind`). الشهري والربع سنوي والسنوي إجبارية. */
export const reportKindLabels = {
  DAILY: "يومي",
  WEEKLY: "أسبوعي",
  MONTHLY: "شهري",
  QUARTERLY: "ربع سنوي",
  ANNUAL: "سنوي",
  EXCEPTIONAL: "استثنائي",
} satisfies Record<ReportKind, string>;

export const reportKindOrder = Object.keys(reportKindLabels) as ReportKind[];

/** ما يُنشأ يدوياً بـ `POST /periodic-reports`. الإجبارية مسودة تلقائية عند نهاية الفترة. */
export const optionalReportKinds: readonly OptionalReportKind[] = ["DAILY", "WEEKLY", "EXCEPTIONAL"];

/** مقياس هدف الخطة (`PlanTarget.metric`). */
export const targetMetricLabels = {
  VISITS: "الزيارات",
  CATEGORY_VISITS: "زيارات الفئة",
  ITEM_DISCUSSIONS: "مناقشات المنتج",
  ITEM_SAMPLES: "عينات المنتج",
  SALES_VALUE: "قيمة المبيعات",
  NEW_CUSTOMERS: "العملاء الجدد",
  MANAGER_VISITS: "زيارات المدير",
  ITEM_SALES_VALUE: "مبيعات المنتج",
} satisfies Record<TargetMetric, string>;

/** قرارات المدير التنفيذي الستة على التقرير: الأربعة الأولى اعتماد، والأخيران إعادة. */
export const execDecisionLabels = {
  APPROVE: { title: "اعتماد", description: "يُعتمد كما هو. بنود الخطة تصير مهاماً، والأهداف خطة الشهر التالي." },
  APPROVE_WITH_NOTES: { title: "اعتماد مع ملاحظات", description: "يُعتمد، وتصل ملاحظاتك إلى رئيس القسم." },
  APPROVE_WITH_FOLLOW_UP: { title: "فتح إجراء متابعة", description: "يُعتمد، ويُفتح الإجراء المطلوب مهمةً لرئيس القسم." },
  APPROVE_WITH_ADMIN_DECISION: { title: "قرار إداري", description: "يُعتمد، ويُسجَّل قرارك الإداري معه." },
  RETURN_FOR_EDIT: { title: "إعادة للتعديل", description: "يعود إلى رئيس القسم ليعدّله ويرسله من جديد." },
  REQUEST_INFO: { title: "طلب معلومات", description: "يعود إلى رئيس القسم ليضيف ما تطلبه." },
} satisfies Record<ExecReportDecision, { title: string; description: string }>;

export const execDecisionOrder = Object.keys(execDecisionLabels) as ExecReportDecision[];

/** احتمال الخطر وأثره. */
export const likelihoodLabels = { LOW: "منخفض", MEDIUM: "متوسط", HIGH: "مرتفع" } satisfies Record<ReportLikelihood, string>;
export const likelihoodOrder: readonly ReportLikelihood[] = ["LOW", "MEDIUM", "HIGH"];

/** مستوى الخطر (يحسبه الخادم من الاحتمال والأثر). */
export const riskLevelBadge = {
  LOW: { label: "منخفض", color: "neutral" },
  MEDIUM: { label: "متوسط", color: "warning" },
  HIGH: { label: "مرتفع", color: "danger" },
  CRITICAL: { label: "حرج", color: "danger" },
} satisfies Record<ReportRiskLevel, { label: string; color: BadgeColor }>;

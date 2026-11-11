import type { components } from "@/lib/api/schema";
import type { BadgeColor } from "@/components/ui/Badge";
import { isolate } from "@/lib/format";

// ترجمة كل الحالات من مكان واحد (DESIGN.md 9.9). لا تُكتب ترجمة حالة في أي شاشة.
// المفاتيح قيم الـ enum في العقد حرفياً. والـ satisfies أدناه يكسر tsc إن نقص مفتاح أو زاد أو غيّر العقد قيمة.
//
// الألوان بالقاعدة العامة:
//   neutral: المسودة، الجديد الذي لم يُبدأ، الملغى، المغلق، المعطّل
//   info: قيد التنفيذ، في الطريق، مراحل التحقيق والنزاع
//   warning: ينتظر قراراً، معلّق، قريب الانتهاء
//   success: معتمد، مستلم، مكتمل، نشط
//   danger: مرفوض، موقوف، منتهٍ، تالف

type Schemas = components["schemas"];

export type StatusDefinition = { label: string; color: BadgeColor };
type StatusesOf<Status extends string> = Record<Status, StatusDefinition>;

const stage = (n: number): StatusDefinition => ({ label: `المرحلة ${isolate(n)}`, color: "info" });

/** مرتجع الصيدلية وتقرير التالف يتشاركان `ReturnStatus` (العقد). */
const returnStatuses = {
  PENDING: { label: "بانتظار القرار", color: "warning" },
  RESTOCKED: { label: "أُعيد للمخزون", color: "success" },
  DAMAGED: { label: "تالف", color: "danger" },
  REJECTED: { label: "مرفوض", color: "danger" },
} satisfies StatusesOf<Schemas["ReturnStatus"]>;

type StatusMapShape = {
  batch: StatusesOf<Schemas["BatchStatus"]>;
  transfer: StatusesOf<Schemas["TransferStatus"]>;
  withdrawRequest: StatusesOf<Schemas["WithdrawStatus"]>;
  sampleRequest: StatusesOf<Schemas["SampleRequestStatus"]>;
  delivery: StatusesOf<Schemas["DeliveryStatus"]>;
  customerReturn: StatusesOf<Schemas["ReturnStatus"]>;
  damageReport: StatusesOf<Schemas["ReturnStatus"]>;
  agentReturn: StatusesOf<Schemas["AgentReturnStatus"]>;
  stockCount: StatusesOf<Schemas["StockCountStatus"]>;
  visit: StatusesOf<Schemas["VisitStatus"]>;
  visitVerification: StatusesOf<Schemas["VisitVerification"]>;
  flag: StatusesOf<Schemas["FlagStatus"]>;
  leave: StatusesOf<Schemas["LeaveStatus"]>;
  task: StatusesOf<Schemas["TaskStatus"]>;
  priority: StatusesOf<Schemas["Priority"]>;
  report: StatusesOf<Schemas["ReportStatus"]>;
  departmentRequest: StatusesOf<Schemas["DeptRequestStatus"]>;
  score: StatusesOf<Schemas["ScoreStatus"]>;
  investigation: StatusesOf<NonNullable<Schemas["Investigation"]["status"]>>;
  dispute: StatusesOf<NonNullable<Schemas["Dispute"]["status"]>>;
  legalDocument: StatusesOf<NonNullable<Schemas["LegalDocument"]["status"]>>;
  monthClosing: StatusesOf<NonNullable<Schemas["MonthClosing"]["status"]>>;
  monthlyPlan: StatusesOf<NonNullable<Schemas["MonthlyPlan"]["status"]>>;
  device: StatusesOf<NonNullable<Schemas["Device"]["status"]>>;
  deviceChangeRequest: StatusesOf<NonNullable<Schemas["DeviceChangeRequest"]["status"]>>;
  visitPoint: StatusesOf<NonNullable<Schemas["VisitPoint"]["status"]>>;
  siteMessage: StatusesOf<NonNullable<Schemas["SiteMessage"]["status"]>>;
};

export const statusMap = {
  batch: {
    ACTIVE: { label: "فعّالة", color: "success" },
    SUSPENDED: { label: "موقوفة", color: "danger" },
  },
  transfer: {
    IN_TRANSIT: { label: "بالطريق", color: "info" },
    RECEIVED: { label: "مستلم", color: "success" },
    CANCELLED: { label: "ملغى", color: "neutral" },
  },
  withdrawRequest: {
    REQUESTED: { label: "مطلوب", color: "info" },
    HANDED_OVER: { label: "مسلَّم", color: "success" },
    CANCELLED: { label: "ملغى", color: "neutral" },
  },
  sampleRequest: {
    NEW: { label: "جديد", color: "neutral" },
    DISPATCHED: { label: "مصروف", color: "success" },
    REJECTED: { label: "مرفوض", color: "danger" },
    CANCELLED: { label: "ملغى", color: "neutral" },
  },
  delivery: {
    UNPAID: { label: "غير مسدد", color: "warning" },
    PAID: { label: "مسدد", color: "success" },
    APPROVAL_PENDING: { label: "بانتظار الاعتماد", color: "warning" },
    CANCELLED: { label: "ملغى", color: "neutral" },
    WRITTEN_OFF: { label: "مشطوب", color: "neutral" },
  },
  customerReturn: returnStatuses,
  damageReport: returnStatuses,
  agentReturn: {
    PENDING: { label: "بانتظار القرار", color: "warning" },
    IN_TRANSIT: { label: "بالطريق", color: "info" },
    REJECTED: { label: "مرفوض", color: "danger" },
    RECEIVED: { label: "مستلم", color: "success" },
  },
  stockCount: {
    IN_PROGRESS: { label: "قيد العدّ", color: "info" },
    SUBMITTED: { label: "بانتظار الاعتماد", color: "warning" },
    APPROVED: { label: "معتمد", color: "success" },
    CANCELLED: { label: "ملغى", color: "neutral" },
  },
  visit: {
    IN_PROGRESS: { label: "جارية", color: "info" },
    COMPLETED: { label: "منتهية", color: "success" },
  },
  visitVerification: {
    OK: { label: "سليمة", color: "success" },
    FLAGGED: { label: "مشكوك فيها", color: "warning" },
    CONFIRMED: { label: "مؤكدة", color: "success" },
    REJECTED: { label: "مرفوضة", color: "danger" },
  },
  flag: {
    OPEN: { label: "مفتوحة", color: "warning" },
    CLEARED: { label: "لا مشكلة", color: "success" },
    CONFIRMED: { label: "مؤكَّدة", color: "danger" },
    ESCALATED: { label: "محالة للتحقيق", color: "info" },
    AUTO_CLEARED: { label: "زال سببها", color: "neutral" },
  },
  leave: {
    PENDING: { label: "معلّقة", color: "warning" },
    APPROVED: { label: "معتمدة", color: "success" },
    REJECTED: { label: "مرفوضة", color: "danger" },
    CANCELLED: { label: "ملغاة", color: "neutral" },
  },
  task: {
    NEW: { label: "جديدة", color: "neutral" },
    IN_PROGRESS: { label: "قيد التنفيذ", color: "info" },
    SUBMITTED: { label: "بانتظار المراجعة", color: "warning" },
    APPROVED: { label: "معتمدة", color: "success" },
    RESOLVED: { label: "مغلقة بقرار", color: "neutral" },
  },
  priority: {
    LOW: { label: "منخفضة", color: "neutral" },
    NORMAL: { label: "عادية", color: "neutral" },
    HIGH: { label: "عالية", color: "warning" },
  },
  report: {
    DRAFT: { label: "مسودة", color: "neutral" },
    SUBMITTED: { label: "بانتظار المراقبة", color: "warning" },
    REVIEWED: { label: "بانتظار الإدارة", color: "warning" },
    RETURNED: { label: "معاد", color: "warning" },
    APPROVED: { label: "معتمد", color: "success" },
  },
  departmentRequest: {
    OPEN: { label: "مفتوح", color: "neutral" },
    IN_PROGRESS: { label: "قيد التنفيذ", color: "info" },
    DONE: { label: "منجز", color: "success" },
    REJECTED: { label: "مرفوض", color: "danger" },
  },
  score: {
    PROVISIONAL: { label: "مبدئي", color: "neutral" },
    FINAL: { label: "نهائي", color: "success" },
  },
  investigation: {
    STAGE_1: stage(1),
    STAGE_2: stage(2),
    STAGE_3: stage(3),
    STAGE_4: stage(4),
    STAGE_5: stage(5),
    STAGE_6: stage(6),
    STAGE_7: stage(7),
    AWAITING_DECISION: { label: "بانتظار القرار", color: "warning" },
    DECIDED: { label: "تم القرار", color: "success" },
    CLOSED_NO_VIOLATION: { label: "أُغلق بلا مخالفة", color: "neutral" },
  },
  dispute: {
    STAGE_1: stage(1),
    STAGE_2: stage(2),
    STAGE_3: stage(3),
    STAGE_4: stage(4),
    STAGE_5: stage(5),
    STAGE_6: stage(6),
    STAGE_7: stage(7),
    AWAITING_DECISION: { label: "بانتظار القرار", color: "warning" },
    CLOSED: { label: "مغلق", color: "neutral" },
    CLOSED_RESOLVED: { label: "أُغلق بحل", color: "neutral" },
  },
  legalDocument: {
    ACTIVE: { label: "سارية", color: "success" },
    EXPIRING: { label: "قريبة الانتهاء", color: "warning" },
    EXPIRED: { label: "منتهية", color: "danger" },
    INTENTIONALLY_EXPIRED: { label: "منتهية بقصد", color: "neutral" },
  },
  monthClosing: {
    OPEN: { label: "مفتوح", color: "info" },
    WAITING: { label: "بانتظار الإغلاق", color: "warning" },
    CLOSED: { label: "مغلق", color: "neutral" },
  },
  monthlyPlan: {
    APPROVED: { label: "معتمدة", color: "success" },
    REVISION_PENDING: { label: "تعديل بانتظار القرار", color: "warning" },
  },
  device: {
    ACTIVE: { label: "فعّال", color: "success" },
    REVOKED: { label: "ملغى", color: "neutral" },
  },
  deviceChangeRequest: {
    PENDING: { label: "بانتظار القرار", color: "warning" },
    APPROVED: { label: "معتمد", color: "success" },
    REJECTED: { label: "مرفوض", color: "danger" },
  },
  visitPoint: {
    ACTIVE: { label: "فعّالة", color: "success" },
    DISABLED: { label: "معطّلة", color: "neutral" },
  },
  siteMessage: {
    NEW: { label: "جديدة", color: "neutral" },
    HANDLED: { label: "عولجت", color: "success" },
  },
} satisfies StatusMapShape;

export type StatusEntity = keyof StatusMapShape;
/** قيم الحالة المسموحة لكيان: `StatusOf<"transfer">` = "IN_TRANSIT" | "RECEIVED" | "CANCELLED". */
export type StatusOf<Entity extends StatusEntity> = keyof StatusMapShape[Entity] & string;

export function getStatusDefinition<Entity extends StatusEntity>(entity: Entity, status: StatusOf<Entity>): StatusDefinition {
  const definitions: Record<string, StatusDefinition> = statusMap[entity];
  return definitions[status];
}

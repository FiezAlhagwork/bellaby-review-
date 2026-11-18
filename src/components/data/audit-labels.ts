import type { paths } from "@/lib/api/schema";

// أسماء أنواع الكيانات والإجراءات في سجلَّي التدقيق والاطلاع. `action` و`entity_type` في `AuditLog` نصان حرّان في العقد، فنترجم المعروف
// ونعرض غيره كما يصل (docs/backend-requests.md §57.1). أنواع سجل الاطلاع الأربعة معرّفة في العقد.

/** أنواع ملفات سجل الاطلاع كما يعرّفها معامل `entity_type` في `GET /access-logs`. */
export type AccessEntityType = NonNullable<NonNullable<paths["/access-logs"]["get"]["parameters"]["query"]>["entity_type"]>;

export const accessEntityLabels = {
  investigation: "تحقيق",
  dispute: "نزاع",
  legal_document: "وثيقة قانونية",
  contract: "عقد",
} as const satisfies Record<AccessEntityType, string>;

/** أنواع الكيانات المعروفة في سجل التدقيق. */
export const auditEntityLabels: Readonly<Record<string, string>> = {
  ...accessEntityLabels,
  transfer: "صرف",
  stock_count: "جرد",
  batch: "دفعة",
  delivery: "تسليم",
  customer_return: "مرتجع صيدلية",
  damage_report: "تقرير تالف",
  agent_return: "إرجاع وكيل",
  user: "مستخدم",
  setting: "إعداد",
  delegation: "تفويض",
  visit: "زيارة",
  visit_point: "جهة زيارة",
  plan: "خطة",
  budget: "ميزانية",
};

/** الإجراءات المعروفة في سجل التدقيق. */
export const auditActionLabels: Readonly<Record<string, string>> = {
  created: "إنشاء",
  updated: "تعديل",
  deleted: "حذف",
  approved: "اعتماد",
  rejected: "رفض",
  cancelled: "إلغاء",
  suspended: "إيقاف",
  unsuspended: "فكّ إيقاف",
  merged: "دمج",
  deactivated: "تعطيل",
  activated: "تفعيل",
  login: "دخول",
};

export const entityLabel = (type: string | undefined) => (type ? (auditEntityLabels[type] ?? type) : "—");
export const actionLabel = (action: string | undefined) => (action ? (auditActionLabels[action] ?? action) : "—");

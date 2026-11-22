import type { DepartmentRequest, UserRef } from "@/lib/api/types";

// الطلبات بين الأقسام (G09–G10). المستخدم رامي السيد، رئيس قسم اللوجستيات. اليوم 22 تشرين الثاني 2026. لا يُنقل للإنتاج.

export const requestsNow = "2026-11-22T10:00:00Z";
export const rami: UserRef = { id: 3, name: "رامي السيد" };

const r = (id: number, extra: Partial<DepartmentRequest>): DepartmentRequest => ({
  id,
  from_department: "SALES",
  to_department: "LOGISTICS",
  source_report_id: 77,
  description: "",
  due_date: "2026-11-28",
  status: "OPEN",
  is_overdue: false,
  reply: null,
  handled_by: null,
  linked_tasks_count: 0,
  created_at: "2026-11-17T09:00:00Z",
  updated_at: "2026-11-17T09:00:00Z",
  ...extra,
});

/** الطلب الرئيسي للتفاصيل: المبيعات تطلب جدول صرف أسبوعياً. */
const weekly = r(18, { description: "نحتاج جدول الصرف المتوقع لكل وكيل كل أحد، لنرتّب زيارات التحصيل على مواعيد وصول البضاعة." });

export function requestAt(state: "open" | "in-progress" | "done" | "rejected" | "overdue" | "outgoing"): DepartmentRequest {
  switch (state) {
    case "open":
      return weekly;
    case "in-progress":
      return { ...weekly, status: "IN_PROGRESS", handled_by: rami, reply: "نبدأ من الأحد القادم.", linked_tasks_count: 1, updated_at: "2026-11-18T08:00:00Z" };
    case "done":
      return { ...weekly, status: "DONE", handled_by: rami, reply: "يُرسل الجدول كل أحد من حساب المستودع. أول جدول أُرسل 23 تشرين الثاني.", linked_tasks_count: 1, updated_at: "2026-11-21T12:00:00Z" };
    case "rejected":
      return { ...weekly, status: "REJECTED", handled_by: rami, reply: "الصرف يُجدول يومياً بحسب الطلبات ولا يُعرف قبل أسبوع. نرسل تأكيد كل صرف عند خروجه.", linked_tasks_count: 0, updated_at: "2026-11-18T08:00:00Z" };
    case "overdue":
      return { ...weekly, status: "IN_PROGRESS", is_overdue: true, due_date: "2026-11-20", handled_by: rami, linked_tasks_count: 2, updated_at: "2026-11-18T08:00:00Z" };
    case "outgoing":
      return r(25, { from_department: "LOGISTICS", to_department: "ACCOUNTING", description: "نحتاج كشف المصاريف الفعلية للنقل في تشرين الأول لنقارنه بفواتير الشحن.", status: "IN_PROGRESS", handled_by: { id: 52, name: "سمر العبدالله" }, reply: "نرسله بعد إغلاق الشهر.", linked_tasks_count: null, source_report_id: 81 });
  }
}

/** الواردة إلى اللوجستيات (direction=incoming)، الأحدث أولاً. */
export const incomingRequests: readonly DepartmentRequest[] = [
  requestAt("open"),
  r(21, { from_department: "SCIENTIFIC_OFFICE", description: "تجهيز 300 عينة مرحلة 1 لمؤتمر أطباء الأطفال في حلب.", due_date: "2026-12-01", created_at: "2026-11-19T09:00:00Z" }),
  r(16, { description: "تقرير بالدفعات القريبة الانتهاء لدى كل وكيل.", status: "IN_PROGRESS", is_overdue: true, due_date: "2026-11-15", handled_by: rami, linked_tasks_count: 1, created_at: "2026-11-08T09:00:00Z" }),
  r(12, { from_department: "MONITORING", description: "سجل حركات مستودع حلب في أيلول للتدقيق.", status: "DONE", handled_by: rami, reply: "أُرسل الكشف.", linked_tasks_count: 1, created_at: "2026-10-20T09:00:00Z" }),
];

/** الصادرة من اللوجستيات (direction=outgoing). القسم الطالب لا يرى المهام. */
export const outgoingRequests: readonly DepartmentRequest[] = [
  requestAt("outgoing"),
  r(23, { from_department: "LOGISTICS", to_department: "IT", description: "صلاحية طباعة إيصال الصرف من جهاز المستودع.", status: "REJECTED", handled_by: { id: 9, name: "طارق النحاس" }, reply: "الطباعة من المتصفح متاحة؛ لا صلاحية خاصة لها.", linked_tasks_count: null, source_report_id: 81 }),
  r(19, { from_department: "LOGISTICS", to_department: "SALES", description: "مواعيد تسليم الوكلاء الجدد في ريف دمشق.", status: "OPEN", is_overdue: true, due_date: "2026-11-19", linked_tasks_count: null, source_report_id: 81, handled_by: null }),
];

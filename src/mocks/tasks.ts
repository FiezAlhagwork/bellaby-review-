import type { Task, TaskStatus, UserRef } from "@/lib/api/types";

// المهام (G06–G08). الآن 18 تشرين الثاني 2026 10:00 (UTC). المُسند رامي السيد (اللوجستي)، والمكلَّف سليم القاسم (عامل المستودع). لا يُنقل للإنتاج.

export const tasksNow = "2026-11-18T10:00:00Z";

const u = (id: number, name: string): UserRef => ({ id, name });
export const rami = u(3, "رامي السيد");
export const salim = u(5, "سليم القاسم");
export const ziad = u(1, "زياد المصري");
const rana = u(6, "رنا الشامي");
const fadi = u(7, "فادي العمر");

const file = (id: string, name: string) => ({ upload_id: id, url: "#", name, mime: "application/pdf" });

const base = (id: number, title: string, extra: Partial<Task> = {}): Task => ({
  id,
  title,
  description: null,
  priority: "NORMAL",
  source: "MANUAL",
  status: "NEW",
  is_overdue: false,
  assigned_by: rami,
  assignee: salim,
  due_at: "2026-11-22T20:59:00Z",
  attachments: [],
  department_request_id: null,
  periodic_report_id: null,
  submissions: [],
  on_time: null,
  resolution: null,
  reassignments: [],
  created_at: "2026-11-15T08:00:00Z",
  ...extra,
});

/** المهمة الرئيسية للتفاصيل: جرد رف العينات قبل نهاية الأسبوع. */
const shelf = base(301, "جرد رف العينات وترتيبه حسب تاريخ الانتهاء", {
  description: "عدّ عينات الحليب على رف العينات، وانقل ما ينتهي خلال 60 يوماً إلى الأمام، وأرفق صورة الرف بعد الترتيب.",
  priority: "HIGH",
  attachments: [file("t-301-a", "shelf-layout.pdf")],
});

const submission = (id: number, note: string, at: string, decision: "ACCEPTED" | "REJECTED" | null, reason: string | null = null) => ({
  id,
  note,
  attachments: [file(`s-${id}`, `shelf-photo-${id}.pdf`)],
  submitted_at: at,
  decision,
  reject_reason: reason,
  decided_by: decision ? rami : null,
  decided_at: decision ? "2026-11-17T09:00:00Z" : null,
});

/** المهمة في الحالة المطلوبة، بسجلها حتى تلك الحالة. */
export function taskAt(state: "new" | "in-progress" | "submitted" | "rejected" | "approved" | "overdue" | "resolved" | "reassigned"): Task {
  switch (state) {
    case "new":
      return shelf;
    case "in-progress":
      return { ...shelf, status: "IN_PROGRESS" };
    case "submitted":
      return { ...shelf, status: "SUBMITTED", submissions: [submission(41, "عُدّ الرف ورُتّب، والصورة مرفقة.", "2026-11-18T08:30:00Z", null)] };
    case "rejected":
      return {
        ...shelf,
        status: "IN_PROGRESS",
        submissions: [submission(40, "رُتّب الرف.", "2026-11-16T15:00:00Z", "REJECTED", "الصورة لا تُظهر تواريخ الانتهاء. أعد التصوير من قرب.")],
      };
    case "approved":
      return {
        ...shelf,
        status: "APPROVED",
        on_time: true,
        submissions: [submission(40, "رُتّب الرف.", "2026-11-16T15:00:00Z", "REJECTED", "الصورة لا تُظهر تواريخ الانتهاء. أعد التصوير من قرب."), { ...submission(41, "عُدّ الرف ورُتّب، والصورة مرفقة.", "2026-11-17T08:30:00Z", "ACCEPTED"), decided_at: "2026-11-17T09:00:00Z" }],
      };
    case "overdue":
      return { ...shelf, status: "IN_PROGRESS", is_overdue: true, due_at: "2026-11-12T20:59:00Z", created_at: "2026-11-05T08:00:00Z" };
    case "resolved":
      return { ...taskAt("overdue"), status: "RESOLVED", resolution: { reason: "تأخر أسبوعاً دون سبب، والرف رُتّب لاحقاً بيد غيره.", by: ziad, at: "2026-11-17T12:00:00Z", deduction_id: 411, on_behalf_of: null } };
    case "reassigned":
      return { ...shelf, assignee: salim, reassignments: [{ from: fadi, to: salim, reason: "فادي في إجازة حتى نهاية الشهر.", by: rami, at: "2026-11-16T09:00:00Z" }] };
  }
}

/** قائمة رامي: ما أسنده (scope=assigned_by_me) وما أُسند إليه (assigned_to_me). */
export const tasksList: readonly Task[] = [
  taskAt("submitted"),
  base(302, "تجهيز صرف وكالة النور", { status: "IN_PROGRESS", priority: "HIGH", due_at: "2026-11-19T20:59:00Z" }),
  base(303, "إدخال شحنة المصنع LOT-2611", { status: "NEW", is_overdue: true, due_at: "2026-11-16T20:59:00Z" }),
  base(304, "تنظيف منطقة التالف", { status: "APPROVED", priority: "LOW", on_time: true, due_at: "2026-11-10T20:59:00Z" }),
  base(305, "مراجعة أرصدة مستودع حلب", { source: "PLAN", periodic_report_id: 77, status: "IN_PROGRESS", is_overdue: true, due_at: "2026-11-14T20:59:00Z" }),
  base(306, "تقرير أسباب التالف في تشرين الأول", { assigned_by: ziad, assignee: rami, source: "FOLLOW_UP", status: "NEW", priority: "HIGH", due_at: "2026-11-25T20:59:00Z" }),
  base(307, "إرسال جدول الصرف الأسبوعي للمبيعات", { assigned_by: ziad, assignee: rami, department_request_id: 18, status: "SUBMITTED", due_at: "2026-11-18T20:59:00Z" }),
  base(308, "تحديث خطة الجرد الشهرية", { assigned_by: ziad, assignee: rami, source: "PLAN", status: "RESOLVED", is_overdue: false, due_at: "2026-11-05T20:59:00Z", resolution: { reason: "أُلغيت بعد دمجها في خطة كانون الأول.", by: rana, at: "2026-11-12T10:00:00Z", deduction_id: null, on_behalf_of: ziad } }),
];

export const assignedByRami = tasksList.filter((task) => task.assigned_by?.id === rami.id);
export const assignedToRami = tasksList.filter((task) => task.assignee?.id === rami.id);

/** `GET /me/assignees` لرامي (فريقه في المستودع). مدير المبيعات بلا مكلَّفين (القرار 12). */
export const ramiAssignees: readonly UserRef[] = [salim, fadi, u(11, "نزار العبد")];

export const isOpen = (status: TaskStatus | undefined) => status === "NEW" || status === "IN_PROGRESS";

import type { Notification, PendingDecision, Profile, UserRef } from "@/lib/api/types";
import { deductionsList } from "./finance";
import { findUser } from "./users";

// الإشعارات وبانتظار قراري وملفي الشخصي (G03–G05). الآن 18 تشرين الثاني 2026 10:00 (UTC). لا يُنقل للإنتاج.

export const meNow = "2026-11-18T10:00:00Z";

const n = (id: number, type: string, title: string, body: string, at: string, read: boolean, ref: [string, number] | null = null): Notification => ({
  id: `0b5e7c1a-0000-4000-8000-${String(id).padStart(12, "0")}`,
  type,
  title,
  body,
  ref_type: ref?.[0] ?? null,
  ref_id: ref?.[1] ?? null,
  read_at: read ? at : null,
  created_at: at,
});

/** إشعارات مدير المبيعات: اليوم وهذا الأسبوع وأقدم، المقروء وغير المقروء. الأحدث أولاً. */
export const notificationsList: readonly Notification[] = [
  n(1, "pending_decision_customer_return", "مرتجع صيدلية ينتظر قرارك", "وكالة الياسمين: مرتجع 12 علبة من صيدلية الشفاء.", "2026-11-18T09:40:00Z", false, ["customer_return", 88]),
  n(2, "delivery_overdue", "تسليم متأخر السداد", "صيدلية الأمل تأخرت عن موعد السداد 19 يوماً.", "2026-11-18T07:15:00Z", false, ["delivery", 2102]),
  n(3, "task_assigned", "مهمة جديدة", "أسند إليك المدير التنفيذي «مراجعة أهداف كانون الأول».", "2026-11-17T12:30:00Z", false, ["task", 301]),
  n(4, "periodic_report_returned", "أُعيد تقريرك الأسبوعي", "أعاده المدير التنفيذي بملاحظة على أرقام التحصيل.", "2026-11-16T15:00:00Z", true, ["periodic_report", 77]),
  n(5, "leave_decided", "وُوفق على إجازتك", "إجازة 24–25 تشرين الثاني.", "2026-11-14T09:00:00Z", true, ["leave", 41]),
  n(6, "transfer_in_transit", "صرف في الطريق", "صرف إلى وكالة الياسمين بانتظار الاستلام.", "2026-11-05T11:20:00Z", true, ["transfer", 512]),
];

const u = (id: number, name: string): UserRef => ({ id, name });
const p = (kind: NonNullable<PendingDecision["kind"]>, ref: number, title: string, by: UserRef | null, since: string, delegable: boolean): PendingDecision => ({ kind, ref_id: ref, title, requested_by: by, waiting_since: since, delegable });

/** كل ما ينتظر المدير التنفيذي، الأقدم أولاً (كما يرجعه الخادم). */
export const executivePending: readonly PendingDecision[] = [
  p("INVESTIGATION", 17, "ملف تحقيق: زيارات بموقع مزوَّر", u(50, "جمال الحكيم"), "2026-11-09T08:00:00Z", false),
  p("PERIODIC_REPORT", 77, "تقرير المبيعات الأسبوعي", u(6, "رنا الشامي"), "2026-11-12T16:00:00Z", true),
  p("BATCH_UNSUSPEND", 62, "فك إيقاف الدفعة LOT-2609-S", u(3, "رامي السيد"), "2026-11-13T10:00:00Z", true),
  p("DISPUTE", 5004, "توصية نزاع: مطالبة صيدلية الإسراء", u(60, "لينا الخطيب"), "2026-11-14T09:00:00Z", false),
  p("STOCK_COUNT", 19, "جرد مستودع حلب", u(3, "رامي السيد"), "2026-11-15T13:00:00Z", true),
  p("DELIVERY_WRITE_OFF", 2105, "شطب تسليم صيدلية الإسراء", u(6, "رنا الشامي"), "2026-11-16T11:00:00Z", true),
  p("OVERDUE_TASK", 233, "مهمة متأخرة: جرد مستودع حلب", u(3, "رامي السيد"), "2026-11-17T08:00:00Z", true),
  p("LEAVE", 44, "إجازة رئيس قسم: د. هبة الأحمد", u(40, "د. هبة الأحمد"), "2026-11-17T14:00:00Z", false),
  p("EMPLOYEE_OF_MONTH", 10, "موظف شهر تشرين الأول", null, "2026-11-18T06:00:00Z", false),
];

/** مدير المبيعات: المرتجع والتالف وإرجاع الوكيل. */
export const salesManagerPending: readonly PendingDecision[] = [
  p("DAMAGE_REPORT", 31, "تقرير تالف: 6 علب مرحلة 2", u(41, "ياسر الحمصي"), "2026-11-15T10:00:00Z", false),
  p("CUSTOMER_RETURN", 88, "مرتجع صيدلية الشفاء: 12 علبة", u(41, "ياسر الحمصي"), "2026-11-18T09:40:00Z", false),
  p("AGENT_RETURN", 14, "إرجاع وكالة النور: دفعة قريبة الانتهاء", u(42, "سمير النوري"), "2026-11-18T08:00:00Z", false),
];

/** المفوَّض: ما يشمله التفويض فقط، دون ما يخصّه. */
export const delegatePending: readonly PendingDecision[] = executivePending.filter((item) => item.delegable && item.requested_by?.id !== 6);

/** ملف سليم القاسم (عامل المستودع): تقييماته وخصوماته ومهامه. العقد null في ملفي الشخصي (§96). */
export const myProfile = {
  user: findUser(5),
  job_description: "يستلم البضاعة ويصرفها ويرصّها في المستودع، ويشارك في الجرد.",
  contract: null,
  scores: [
    { month: "2026-11", total: 78.5, status: "PROVISIONAL" },
    { month: "2026-10", total: 84, status: "FINAL" },
    { month: "2026-09", total: 81.5, status: "FINAL" },
  ],
  deductions: deductionsList.filter((deduction) => deduction.user?.id === 5),
  open_tasks: 3,
} satisfies Profile;

/** حالة `default`: الأشهر المغلقة وحدها، نهائية. وحالة `provisional` فيها الشهر الجاري مبدئياً (`myProfile`). */
export const myProfileFinal = { ...myProfile, scores: myProfile.scores.slice(1) } satisfies Profile;

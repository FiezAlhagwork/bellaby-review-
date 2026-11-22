import type { Delivery, Dispute, DisputeStatus, UserRef } from "@/lib/api/types";
import { referredDisputeId, salesDeliveries, salesManager, unpaidDeliveries } from "./sales";

// النزاعات (I18–I21). النزاع 5001 على تسليم العافية، و5002 محال من مدير المبيعات (رد refer-dispute). اليوم 18 تشرين الثاني 2026. لا يُنقل للإنتاج.

export const disputesNow = "2026-11-18T10:00:00Z";
export const legalUser: UserRef = { id: 60, name: "لينا الخطيب" };
export const executiveUser: UserRef = { id: 1, name: "زياد المصري" };
export { referredDisputeId, salesManager };

const deliveryById = (id: number) => salesDeliveries.find((delivery) => delivery.id === id) as Delivery;

/** ملخصات المراحل 1–7 كما تُسجَّل عند إكمال كل مرحلة. */
const summaries: Record<number, string> = {
  1: "صيدلية العافية لم تسدّد تسليم 40 علبة منذ 28 تشرين الأول، وتدّعي أن جزءاً منها وصل تالفاً.",
  2: "جُمع إيصال التسليم الموقَّع، وتقرير الوكيل، ومراسلات المطالبة الثلاث.",
  3: "الإيصال موقَّع بلا تحفّظ على التلف، فموقف الشركة قوي في المطالبة بكامل القيمة.",
  4: "خطر منخفض: المستندات كاملة، وأقصى خسارة قيمة التسليم.",
  5: "الحلول: تسوية بجدولة السداد على دفعتين، أو إنذار رسمي ثم دعوى.",
  6: "نوصي بالتسوية بجدولة السداد على دفعتين خلال شهر، مع إنذار إن تأخرت الدفعة الأولى.",
  7: "وُقّع اتفاق الجدولة مع الصيدلية، وسُدّدت الدفعة الأولى.",
};

const at = (day: number) => `2026-11-${String(day).padStart(2, "0")}T09:00:00Z`;
const stageEntry = (stage: number) => ({ stage, summary: summaries[stage], done_by: legalUser, done_at: at(stage + 3), attachments: stage === 2 ? [{ upload_id: "d-2-1", url: "#", name: "receipt-2106.pdf", mime: "application/pdf" }] : [] });

const base = (id: number, title: string, deliveryId: number | null, created: string): Dispute => {
  const delivery = deliveryId ? deliveryById(deliveryId) : null;
  return {
    id,
    title,
    delivery_id: deliveryId,
    customer: delivery?.customer ? { id: delivery.customer.id ?? 0, name: delivery.customer.name ?? "" } : null,
    status: "STAGE_1",
    stages: [],
    risk: null,
    recommendation: null,
    decision: null,
    close_reason: null,
    opened_by: legalUser,
    created_at: created,
  };
};

/** الملف في حالة `status`: المراحل المكتملة قبلها، والخطر من الرابعة، والتوصية من السادسة، والقرار قبل السابعة. */
export function disputeAt(dispute: Dispute, status: DisputeStatus, resolvedReason?: string): Dispute {
  const reached = status === "AWAITING_DECISION" ? 7 : status === "CLOSED" ? 8 : status === "CLOSED_RESOLVED" ? 3 : Number(status.slice("STAGE_".length));
  const done = Array.from({ length: Math.min(reached - 1, 7) }, (_, index) => stageEntry(index + 1));
  return {
    ...dispute,
    status,
    stages: done,
    risk: reached > 4 ? { level: "LOW", value: "480.00" } : null,
    recommendation: reached > 6 ? summaries[6] : null,
    decision: reached > 7 || status === "STAGE_7" ? { type: "APPROVED_RECOMMENDATION", text: summaries[6], reason: null, decided_by: executiveUser, decided_at: at(12) } : null,
    close_reason: status === "CLOSED_RESOLVED" ? (resolvedReason ?? "سدّدت الصيدلية كامل المبلغ بعد المطالبة الثانية، فزال سبب النزاع.") : null,
  };
}

const afia = base(5001, "مطالبة صيدلية العافية بقيمة تسليم متأخر", 2106, "2026-11-03T08:00:00Z");

export const afiaAt = (status: DisputeStatus) => disputeAt(afia, status);

/** المحال من مدير المبيعات: يُنشأ في الخادم برد refer-dispute، ويفتحه القانوني من I19 معبّأً. */
export const referredDelivery = unpaidDeliveries.find((delivery) => delivery.is_payment_overdue && !delivery.dispute_id) as Delivery;
export const referralNote = "تأخّر السداد أكثر من 3 أسابيع ورفضت الصيدلية الجدولة.";

export const disputesList: readonly Dispute[] = [
  afiaAt("STAGE_2"),
  disputeAt(base(5003, "خلاف مع مورّد العبوات على شحنة ناقصة", null, "2026-11-01T08:00:00Z"), "STAGE_4"),
  disputeAt(base(5004, "مطالبة صيدلية الإسراء بالمرتجع المرفوض", 2105, "2026-10-20T08:00:00Z"), "AWAITING_DECISION"),
  disputeAt(base(5005, "اعتراض وكيل حلب على عمولة أيلول", null, "2026-10-12T08:00:00Z"), "STAGE_7"),
  disputeAt(base(5006, "مطالبة صيدلية الأمل بقيمة تسليم", 2102, "2026-09-30T08:00:00Z"), "CLOSED"),
  disputeAt(base(5007, "شكوى تسويقية من شركة منافسة", null, "2026-09-15T08:00:00Z"), "CLOSED_RESOLVED", "سحبت الشركة الشكوى بعد الرد الرسمي."),
];

/** خيارات التسليم في «فتح نزاع»: التسليمات غير المسدّدة (GET /deliveries?status=UNPAID). */
export const disputeDeliveryOptions = unpaidDeliveries;

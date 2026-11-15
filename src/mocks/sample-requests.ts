import type { ItemRef, LocationRef, SampleRequest, UserRef } from "@/lib/api/types";
import { balanceItems } from "./stock-balances";

// طلبات العينات والمواد الدعائية (W09 وW10): 22 طلباً بين 24 تشرين الأول و10 تشرين الثاني 2026، من مدير المكتب العلمي للمندوبين.
// الصرف المرتبط يطابق قائمة الصرف (W07) بالأرقام والكميات. الأوقات UTC بين 07:00 و14:00. لا يُنقل للإنتاج.

export const sampleRequestsToday = "2026-11-10";

const [, , , sample, booklet] = balanceItems;
export const cerealSample: ItemRef & { id: number; name: string; type: "SAMPLE" } = { id: 6, name: "عينة سيريلاك أرز 30غ", sku: "SM-RICE-30", type: "SAMPLE" };
export const flyer: ItemRef & { id: number; name: string; type: "PROMO" } = { id: 7, name: "فلاير تعريفي بالمنتجات", sku: "PR-FLY-01", type: "PROMO" };
export const bag: ItemRef & { id: number; name: string; type: "PROMO" } = { id: 8, name: "حقيبة ترويجية للأمهات", sku: "PR-BAG-01", type: "PROMO" };

const samer: UserRef = { id: 31, name: "سامر الحلبي" };
const omar: UserRef = { id: 32, name: "عمر الخطيب" };
const huda: UserRef = { id: 33, name: "هدى العلي" };
const heba: UserRef = { id: 40, name: "د. هبة الأحمد" };
const waseem: UserRef = { id: 42, name: "د. وسيم الخطيب" };

/** المندوبون كمواقع (لفلتر المندوب: `rep_id` معرّف المستخدم من `location.user.id`). */
export const sampleRequestReps = [
  { id: 14, type: "REP", name: "سامر الحلبي", is_active: true, user: samer },
  { id: 15, type: "REP", name: "عمر الخطيب", is_active: true, user: omar },
  { id: 16, type: "REP", name: "هدى العلي", is_active: true, user: huda },
] satisfies (LocationRef & { is_active: boolean; user: UserRef })[];

type Status = NonNullable<SampleRequest["status"]>;
type Line = [item: ItemRef, requested: number, dispatched?: number];

function request(
  id: number,
  createdAt: string,
  rep: UserRef,
  by: UserRef,
  status: Status,
  reason: string,
  lines: Line[],
  extra: { decidedAt?: string; transferId?: number; rejectReason?: string } = {},
): SampleRequest {
  return {
    id,
    rep,
    requested_by: by,
    status,
    reason,
    lines: lines.map(([item, requested, dispatched]) => ({ item, requested_quantity: requested, dispatched_quantity: dispatched ?? null })),
    transfer_id: extra.transferId ?? null,
    reject_reason: extra.rejectReason ?? null,
    created_at: `2026-${createdAt}:00Z`,
    decided_at: extra.decidedAt ? `2026-${extra.decidedAt}:00Z` : null,
  };
}

const oldestFirst: SampleRequest[] = [
  request(1, "10-24T09:00", samer, heba, "DISPATCHED", "عينات لمؤتمر أطباء الأطفال", [[sample, 30, 30], [booklet, 6, 6]], { decidedAt: "10-28T08:30", transferId: 139 }),
  request(2, "10-25T10:30", omar, heba, "DISPATCHED", "حملة توعية الرضاعة في مراكز الأمومة", [[sample, 40, 40], [bag, 20, 20]], { decidedAt: "10-29T12:20", transferId: 143 }),
  request(3, "10-26T11:00", huda, waseem, "DISPATCHED", "تعريف الأطباء بالسيريلاك الجديد", [[cerealSample, 24, 24]], { decidedAt: "10-31T08:50", transferId: 146 }),
  request(4, "10-27T08:45", samer, waseem, "REJECTED", "ورشة تثقيفية للأمهات", [[sample, 400]], { decidedAt: "10-28T09:10", rejectReason: "الكمية المطلوبة أكبر من رصيد العينات المتاح." }),
  request(5, "10-30T09:20", omar, heba, "DISPATCHED", "تجهيز حقائب الزيارات الأسبوعية", [[sample, 30, 30], [flyer, 18, 18]], { decidedAt: "11-04T13:15", transferId: 153 }),
  request(6, "10-28T12:00", huda, heba, "CANCELLED", "معرض الصحة الأسري", [[bag, 50]], { decidedAt: "10-29T07:40" }),
  request(7, "10-30T10:10", samer, waseem, "REJECTED", "زيارات صيدليات حلب", [[cerealSample, 60], [flyer, 40]], { decidedAt: "10-31T11:00", rejectReason: "المادة الدعائية غير متوفرة حالياً، أعد الطلب الأسبوع القادم." }),
  request(8, "10-31T09:00", omar, waseem, "CANCELLED", "زيارة مراكز اللقاح", [[sample, 20]], { decidedAt: "10-31T13:30" }),
  request(9, "11-01T08:30", huda, heba, "REJECTED", "عينات لحملة الأمهات الجدد", [[sample, 90]], { decidedAt: "11-02T09:00", rejectReason: "الكمية تفوق حدّ الطلب الشهري للمندوب." }),
  request(10, "11-02T11:15", samer, heba, "CANCELLED", "ورشة حديثي الولادة", [[booklet, 25]], { decidedAt: "11-02T12:40" }),
  request(11, "11-02T13:00", omar, waseem, "REJECTED", "تعريف مجمع طبي جديد", [[cerealSample, 30], [bag, 10]], { decidedAt: "11-03T08:20", rejectReason: "لا رصيد من الحقائب الترويجية." }),
  request(12, "11-03T09:40", huda, waseem, "CANCELLED", "يوم صحي في مدرسة", [[flyer, 80]], { decidedAt: "11-03T11:05" }),
  request(13, "11-04T10:00", samer, heba, "REJECTED", "زيارات الشهر الجديد", [[sample, 70], [booklet, 20]], { decidedAt: "11-05T08:10", rejectReason: "ارفع الطلب بكمية أقل: رصيد العينات 80 علبة." }),
  request(14, "11-05T09:15", omar, heba, "CANCELLED", "تجهيز معرض", [[bag, 15]], { decidedAt: "11-05T10:00" }),
  request(15, "11-05T12:30", huda, waseem, "REJECTED", "عينات لعيادة جديدة", [[cerealSample, 45]], { decidedAt: "11-06T07:50", rejectReason: "عينة السيريلاك قاربت الانتهاء: تُصرف بكميات صغيرة." }),
  request(16, "11-06T10:20", samer, heba, "NEW", "حملة توعية الرضاعة الطبيعية", [[booklet, 50], [flyer, 30]]),
  request(17, "11-06T11:45", samer, heba, "DISPATCHED", "زيارات مستشفيات الأطفال", [[sample, 40, 40], [booklet, 10, 8]], { decidedAt: "11-08T07:15", transferId: 156 }),
  request(18, "11-08T11:00", omar, waseem, "NEW", "عينات لزيارة مراكز الأمومة", [[sample, 35], [cerealSample, 20]]),
  request(19, "11-09T08:20", huda, heba, "NEW", "تجهيز حقائب الأسبوع", [[bag, 12], [flyer, 25]]),
  request(20, "11-09T13:45", samer, waseem, "NEW", "تعريف مختبر جديد", [[cerealSample, 15]]),
  request(21, "11-09T11:00", samer, heba, "NEW", "عينات لزيارة مستشفى الأطفال", [[sample, 40], [booklet, 30]]),
  request(22, "11-10T07:30", omar, heba, "NEW", "ورشة تدريبية للأمهات", [[sample, 25], [bag, 10], [flyer, 20]]),
];

/** الأحدث أولاً (بالإنشاء)، كما يرجعها `GET /sample-requests`. */
export const sampleRequestsList: readonly SampleRequest[] = [...oldestFirst].sort((a, b) => Date.parse(b.created_at ?? "") - Date.parse(a.created_at ?? ""));

/** الطلب برقمه (لصفحات التفاصيل W10). */
export function findSampleRequest(id: number): SampleRequest {
  const found = sampleRequestsList.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`طلب عينات غير موجود في المعرض: ${id}`);
  return found;
}

import type { EditorBatch } from "@/components/data/LineItemsEditor";
import type { RepBalance, WithdrawFormOptions } from "@/features/transfers/views/WithdrawRequestFormView";
import type { BatchRef, ItemRef, Location, LocationRef, UserRef, WithdrawRequest } from "@/lib/api/types";
import { balanceItems, batchBooklet, batchSample, damascus, warehouseLocations } from "./stock-balances";
import { bag, cerealSample, flyer, sampleRequestReps } from "./sample-requests";

// طلبات السحب من المندوبين (W11 وW12): 16 طلباً بين 26 تشرين الأول و10 تشرين الثاني 2026، يرفعها اللوجستي لاستلام عينات ومواد من أرصدة المندوبين.
// مندوبة معطَّلة (ريم الشامي) لها طلبان: واحد أُكِّد عنها وآخر ما زال مطلوباً (حالة rep-deactivated). الأوقات UTC. لا يُنقل للإنتاج.

export const withdrawToday = "2026-11-10";

const [, , , sample, booklet] = balanceItems;

const logistics: UserRef = { id: 3, name: "رامي السيد" };
const samer: UserRef = sampleRequestReps[0].user;
const omar: UserRef = sampleRequestReps[1].user;
const huda: UserRef = sampleRequestReps[2].user;
const reem: UserRef = { id: 34, name: "ريم الشامي" };

/** المندوبون كمواقع، ومنهم المعطَّلة (لفلتر القائمة). خيارات النموذج تستثني المعطَّل. */
export const withdrawReps = [
  ...sampleRequestReps,
  { id: 17, type: "REP", name: "ريم الشامي", is_active: false, user: reem },
] satisfies (LocationRef & { is_active: boolean; user: UserRef })[];

/** هل مندوب الطلب فعّال؟ العقد لا يعيد حالة المندوب في `WithdrawRequest.rep` (docs/backend-requests.md §15.1)، فتُحسب هنا من مواقع المندوبين. */
export const isWithdrawRepActive = (request: WithdrawRequest): boolean => withdrawReps.find((rep) => rep.user.id === request.rep?.id)?.is_active !== false;

// دفعات العينات والمواد (متاحها عند المندوبين في أرصدتهم).
const batchSampleSuspended: BatchRef = { id: 62, batch_no: "LOT-2608-X", expiry_date: "2027-02-10", status: "SUSPENDED" };
const batchCerealSample: BatchRef = { id: 81, batch_no: "LOT-2611-SM", expiry_date: "2027-01-15", status: "ACTIVE" };
const batchFlyer: BatchRef = { id: 91, batch_no: "LOT-2610-FL", expiry_date: "2027-09-01", status: "ACTIVE" };
const batchBag: BatchRef = { id: 95, batch_no: "LOT-2609-BG", expiry_date: "2027-12-01", status: "ACTIVE" };

type Status = NonNullable<WithdrawRequest["status"]>;
type Line = [item: ItemRef, batch: BatchRef, requested: number, actual?: number];

function request(
  id: number,
  createdAt: string,
  rep: UserRef,
  status: Status,
  reason: string,
  lines: Line[],
  extra: { confirmedAt?: string; confirmedBy?: UserRef; onBehalf?: boolean; cancelReason?: string } = {},
): WithdrawRequest {
  return {
    id,
    rep,
    to_location: damascus,
    status,
    reason,
    lines: lines.map(([item, batch, requested, actual]) => ({ item, batch, requested_quantity: requested, actual_quantity: actual ?? null })),
    created_by: logistics,
    created_at: `2026-${createdAt}:00Z`,
    confirmed_by: extra.confirmedAt ? (extra.confirmedBy ?? rep) : null,
    confirmed_at: extra.confirmedAt ? `2026-${extra.confirmedAt}:00Z` : null,
    confirmed_on_behalf: extra.onBehalf ?? false,
    cancelled_by: status === "CANCELLED" ? logistics : null,
    cancel_reason: extra.cancelReason ?? null,
  };
}

const oldestFirst: WithdrawRequest[] = [
  request(1, "10-26T08:00", samer, "HANDED_OVER", "استلام المتبقي بعد مؤتمر أطباء الأطفال", [[sample, batchSample, 20, 20], [booklet, batchBooklet, 10, 10]], { confirmedAt: "10-27T10:30" }),
  request(2, "10-27T09:15", omar, "HANDED_OVER", "نهاية حملة الأمهات الجدد", [[sample, batchSample, 15, 15]], { confirmedAt: "10-28T09:00" }),
  request(3, "10-28T10:00", huda, "CANCELLED", "إعادة توزيع الفلايرات", [[flyer, batchFlyer, 30]], { cancelReason: "تراجع المكتب العلمي عن الحملة." }),
  request(4, "10-29T11:20", samer, "HANDED_OVER", "تجهيز عينات السيريلاك لمندوب آخر", [[cerealSample, batchCerealSample, 12, 12]], { confirmedAt: "10-30T08:10" }),
  request(5, "11-01T09:00", reem, "HANDED_OVER", "سحب العينات والمواد بعد تعطيل حساب المندوبة", [[sample, batchSample, 25, 22], [bag, batchBag, 10, 10]], {
    confirmedAt: "11-02T12:45",
    confirmedBy: logistics,
    onBehalf: true,
  }),
  request(6, "11-01T12:30", omar, "CANCELLED", "حملة مدرسة", [[sample, batchSample, 10]], { cancelReason: "أُلغيت الحملة قبل البدء." }),
  request(7, "11-02T08:40", samer, "HANDED_OVER", "إعادة الكتيّبات الزائدة", [[booklet, batchBooklet, 18, 16]], { confirmedAt: "11-03T09:20" }),
  request(8, "11-03T10:10", huda, "HANDED_OVER", "تجميع الحقائب الترويجية", [[bag, batchBag, 8, 8]], { confirmedAt: "11-04T10:55" }),
  request(9, "11-04T09:30", omar, "HANDED_OVER", "جرد نهاية الشهر", [[sample, batchSample, 22, 22]], { confirmedAt: "11-05T08:25" }),
  request(10, "11-05T11:00", samer, "REQUESTED", "سحب الدفعة الموقوفة LOT-2608-X", [[sample, batchSampleSuspended, 8], [sample, batchSample, 20]]),
  request(11, "11-06T09:00", huda, "REQUESTED", "استلام فائض السيريلاك والكتيّبات", [[cerealSample, batchCerealSample, 10], [booklet, batchBooklet, 6]]),
  request(12, "11-07T10:15", omar, "REQUESTED", "جرد نهاية الشهر للمواد الدعائية", [[sample, batchSample, 18], [flyer, batchFlyer, 25]]),
  request(13, "11-08T08:30", reem, "REQUESTED", "سحب كامل رصيد المندوبة بعد تعطيل حسابها", [[sample, batchSample, 30], [booklet, batchBooklet, 12], [flyer, batchFlyer, 20]]),
  request(14, "11-08T12:00", samer, "REQUESTED", "استلام الحقائب بعد انتهاء المعرض", [[bag, batchBag, 5]]),
  request(15, "11-09T09:45", huda, "REQUESTED", "استلام عينات لإعادة توزيعها", [[sample, batchSample, 12]]),
  request(16, "11-10T07:50", omar, "REQUESTED", "تجميع المواد الدعائية", [[flyer, batchFlyer, 40], [bag, batchBag, 6]]),
];

/** الأحدث أولاً (بالإنشاء)، كما يرجعها `GET /withdraw-requests`. */
export const withdrawRequestsList: readonly WithdrawRequest[] = [...oldestFirst].sort((a, b) => Date.parse(b.created_at ?? "") - Date.parse(a.created_at ?? ""));

export function findWithdrawRequest(id: number): WithdrawRequest {
  const found = withdrawRequestsList.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`طلب سحب غير موجود في المعرض: ${id}`);
  return found;
}

// ---- نموذج «طلب سحب»

/** خيارات النموذج: المندوبون (ومنهم المعطَّلة، يستثنيها الـ view) ومستودعا الاستلام. */
export const withdrawFormOptions: WithdrawFormOptions = {
  reps: withdrawReps as readonly Location[],
  destinations: [warehouseLocations[0]],
};

const available = (batch: BatchRef, quantity: number): EditorBatch => ({
  id: batch.id ?? 0,
  batch_no: batch.batch_no ?? "",
  expiry_date: batch.expiry_date ?? "",
  status: batch.status === "SUSPENDED" ? "SUSPENDED" : "ACTIVE",
  available: quantity,
});

const editorItem = (item: { id: number; name: string; type: "SAMPLE" | "PROMO" }) => ({ id: item.id, name: item.name, type: item.type });

/** أرصدة المندوبين بمفتاح `user.id`: سامر عنده دفعة موقوفة من العينات (السحب مسموح عليها)، والباقون عينات ومواد بدفعاتها. */
export const repBalances: Record<string, RepBalance> = {
  "31": {
    items: [editorItem(sample), editorItem(booklet)],
    batches: {
      "4": [available(batchSample, 60), available(batchSampleSuspended, 8)],
      "5": [available(batchBooklet, 35)],
    },
  },
  "32": {
    items: [editorItem(sample), editorItem(flyer), editorItem(bag)],
    batches: {
      "4": [available(batchSample, 40)],
      "7": [available(batchFlyer, 70)],
      "8": [available(batchBag, 20)],
    },
  },
  "33": {
    items: [editorItem(cerealSample), editorItem(booklet), editorItem(bag)],
    batches: {
      "6": [available(batchCerealSample, 24)],
      "5": [available(batchBooklet, 10)],
      "8": [available(batchBag, 14)],
    },
  },
};

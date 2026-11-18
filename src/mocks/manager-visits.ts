import type { ManagerVisitForm, ManagerVisitLocation, VisitTarget } from "@/features/manager-visits/views/NewManagerVisitView";
import type { VisitGoal } from "@/features/manager-visits/views/ManagerVisitsView";
import type { ListEntry, ManagerVisit } from "@/lib/api/types";
import { currentMonth, salesCustomers, salesManager } from "./sales";

// زيارات مدير المبيعات (M09 وM10): 13 زيارة في تشرين الثاني 2026 من أصل هدف 20 (يطابق `MANAGER_VISITS` في خطة المبيعات M01). الوقت وقت الخادم (UTC). لا يُنقل للإنتاج.

export const visitsToday = "2026-11-10";

/** `GET /lists` للهدف والنتيجة: مفتاحا القائمتين غير معروفين في العقد (docs/backend-requests.md §48.2). */
export const managerVisitPurposes = [
  { id: 1, name: "متابعة المبيعات والتحصيل", order: 1, is_active: true },
  { id: 2, name: "عرض منتج جديد", order: 2, is_active: true },
  { id: 3, name: "حلّ مشكلة مع الوكيل", order: 3, is_active: true },
  { id: 4, name: "تعريف بالشركة", order: 4, is_active: true },
] satisfies ListEntry[];

export const managerVisitOutcomes = [
  { id: 1, name: "وعد بطلب جديد", order: 1, is_active: true },
  { id: 2, name: "حُلَّت المشكلة", order: 2, is_active: true },
  { id: 3, name: "يحتاج متابعة", order: 3, is_active: true },
  { id: 4, name: "لا اهتمام حالياً", order: 4, is_active: true },
] satisfies ListEntry[];

const [followUp, newProduct, problem, intro] = managerVisitPurposes;
const [promise, solved, needsFollowUp, noInterest] = managerVisitOutcomes;

/** جهات الزيارة التي لم تصر عملاء (`visit_point_id`): صيدليات يفاوضها مدير المبيعات. */
const pointsNotCustomers = [
  { id: 701, name: "صيدلية الينابيع — القصاع" },
  { id: 702, name: "صيدلية الحياة الجديدة — باب توما" },
  { id: 703, name: "صيدلية الإخلاص — دوما" },
];

/** العملاء أولاً ثم الجهات التي لم تصر عملاء: ما يعيده بحث الجهة. */
export const visitTargets: readonly VisitTarget[] = [
  ...salesCustomers.slice(0, 8).map((customer) => ({ key: `customer-${customer.id}`, kind: "customer" as const, id: customer.id ?? 0, name: customer.name ?? "" })),
  ...pointsNotCustomers.map((point) => ({ key: `point-${point.id}`, kind: "visit-point" as const, id: point.id, name: point.name })),
];

const accuracy = (n: number) => ({ lat: 33.5 + n / 1000, lng: 36.29 + n / 1000, accuracy_m: 8 + (n % 9) });

type VisitDef = [id: number, at: string, target: { customer?: number; point?: number; name: string }, purpose: ListEntry, outcome: ListEntry | null, notes: string | null];

const customerName = (id: number) => salesCustomers.find((customer) => customer.id === id)?.name ?? "";

const defs: VisitDef[] = [
  [9013, "11-10T08:40", { customer: 1001, name: customerName(1001) }, followUp, promise, "سيرسل طلب المرحلة الثانية نهاية الأسبوع."],
  [9012, "11-09T12:10", { customer: 1005, name: customerName(1005) }, newProduct, needsFollowUp, null],
  [9011, "11-09T09:30", { point: 701, name: "صيدلية الينابيع — القصاع" }, intro, promise, "مهتمة بالتعاقد مع وكيل الياسمين."],
  [9010, "11-08T11:00", { customer: 1008, name: customerName(1008) }, problem, solved, "تأخر وصول الطلب، وُعدت بتسليم الأحد."],
  [9009, "11-07T10:20", { customer: 1007, name: customerName(1007) }, followUp, null, null],
  [9008, "11-06T14:45", { point: 702, name: "صيدلية الحياة الجديدة — باب توما" }, intro, noInterest, "تتعامل مع مورد آخر حصراً."],
  [9007, "11-05T09:15", { customer: 1001, name: customerName(1001) }, followUp, promise, null],
  [9006, "11-04T13:30", { customer: 1012, name: customerName(1012) }, newProduct, promise, "طلبت عينات من سيريلاك."],
  [9005, "11-04T10:05", { customer: 1016, name: customerName(1016) }, followUp, needsFollowUp, "رصيدها منخفض وتنتظر شحنة."],
  [9004, "11-03T12:40", { customer: 1010, name: customerName(1010) }, problem, solved, null],
  [9003, "11-03T09:50", { point: 703, name: "صيدلية الإخلاص — دوما" }, intro, needsFollowUp, null],
  [9002, "11-02T11:25", { customer: 1002, name: customerName(1002) }, followUp, promise, null],
  [9001, "11-02T08:55", { customer: 1004, name: customerName(1004) }, newProduct, noInterest, "لا مساحة عرض إضافية الآن."],
];

function visit([id, at, target, purpose, outcome, notes]: VisitDef): ManagerVisit {
  return {
    id,
    manager: salesManager,
    customer_id: target.customer ?? null,
    visit_point_id: target.point ?? null,
    target_name: target.name,
    purpose,
    outcome,
    notes,
    location: accuracy(id % 97),
    visited_at: `2026-${at}:00Z`,
  };
}

/** الأحدث أولاً، كما يرجعها `GET /manager-visits`. */
export const managerVisits: readonly ManagerVisit[] = defs.map(visit);

/** زياراتي لعميل: `GET /manager-visits` بفلترة العميل في الحاوية (§45.1). */
export const managerVisitsOfCustomer = (customerId: number): readonly ManagerVisit[] => managerVisits.filter((entry) => entry.customer_id === customerId);

/** هدف الشهر الجاري وما أُنجز (13 من 20): `PlanTarget.MANAGER_VISITS`. */
export const visitGoal: VisitGoal = { month: currentMonth, target: 20, actual: managerVisits.length };

/** موقع ملتقَط بدقة جيدة. */
export const readyLocation: ManagerVisitLocation = { status: "ready", point: { lat: 33.5121, lng: 36.2917, accuracy_m: 14 } };

// صفحات الرسم خادمية فلا تستدعي دوالاً من ملفات الـ view: النماذج حرفية هنا.
export const blankVisitForm: ManagerVisitForm = { targetKey: null, purposeId: null, outcomeId: null, notes: "" };

export const filledVisitForm: ManagerVisitForm = {
  targetKey: "customer-1001",
  purposeId: "1",
  outcomeId: "1",
  notes: "ناقشنا طلب نهاية الأسبوع ومواعيد التسليم.",
};

/** رفض الخادم (422 `validation_failed`): الهدف غير فعّال. */
export const invalidVisitForm: ManagerVisitForm = { ...filledVisitForm, purposeId: "4" };
export const invalidVisitErrors = { purpose_id: "الهدف المختار غير فعّال. اختر هدفاً آخر.", notes: "الملاحظات أطول من الحد المسموح (2000 حرف)." };

/** رد `POST /manager-visits` 201. */
export const savedVisit: ManagerVisit = {
  id: 9014,
  manager: salesManager,
  customer_id: 1001,
  visit_point_id: null,
  target_name: customerName(1001),
  purpose: followUp,
  outcome: promise,
  notes: filledVisitForm.notes,
  location: { lat: 33.5121, lng: 36.2917, accuracy_m: 14 },
  visited_at: "2026-11-10T09:00:00Z",
};

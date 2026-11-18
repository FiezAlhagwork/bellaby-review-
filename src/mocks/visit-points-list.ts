import type { LinkedCustomer } from "@/features/visit-points/views/VisitPointDetailsView";
import type { Governorate, ListEntry, UserRef, Visit, VisitPoint } from "@/lib/api/types";
import { customerPoint, findCustomer, linkedCustomerId, repVisitsOf } from "./customer-page";
import { salesGovernorates } from "./sales";
import { allVisits } from "./visits";

// جهات الزيارة (M14 وM15): 15 جهة بأنواعها واختصاصاتها ومحافظاتها، بينها جهة مربوطة بعميل، ومرفوضة، ومدمجة. اليوم الثابت 10 تشرين الثاني 2026. لا يُنقل للإنتاج.

export const visitPointsToday = "2026-11-10";

export const pointTypes = [
  { id: 1, name: "عيادة", order: 1, is_active: true },
  { id: 2, name: "مستوصف", order: 2, is_active: true },
  { id: 3, name: "صيدلية", order: 3, is_active: true },
  { id: 4, name: "مركز صحي", order: 4, is_active: true },
] satisfies ListEntry[];

export const pointSpecialties = [
  { id: 1, name: "أطفال", order: 1, is_active: true },
  { id: 2, name: "نسائية", order: 2, is_active: true },
  { id: 3, name: "عامة", order: 3, is_active: true },
] satisfies ListEntry[];

export const pointGovernorates: readonly Governorate[] = salesGovernorates.slice(0, 4);

const [clinic, dispensary, pharmacy, center] = pointTypes;
const [pediatrics, gynecology] = pointSpecialties;
const [damascus, rural, aleppo, homs] = salesGovernorates;

const samer: UserRef = { id: 31, name: "سامر الحلبي" };
const omar: UserRef = { id: 32, name: "عمر الخطيب" };
const huda: UserRef = { id: 33, name: "هدى العلي" };

type Extra = Partial<VisitPoint>;

function point(id: number, name: string, type: ListEntry, governorate: Governorate, by: UserRef, lat: number, lng: number, extra: Extra = {}): VisitPoint {
  return {
    id,
    client_uuid: `00000000-0000-4000-c000-${String(id).padStart(12, "0")}`,
    type,
    specialty: null,
    name,
    normalized_name: name,
    phone: `+96394${String(1000000 + id * 137).slice(-7)}`,
    governorate,
    address: null,
    location: { lat, lng, accuracy_m: 9 },
    status: "ACTIVE",
    review_state: "ACCEPTED",
    merged_into_id: null,
    customer_id: null,
    created_by: by,
    created_at: "2026-09-14T08:00:00Z",
    last_visit_at: "2026-11-09T09:30:00Z",
    next_action: null,
    ...extra,
  };
}

const linked = customerPoint(findCustomer(linkedCustomerId));

/** كل الجهات: الأحدث رقماً أولاً كما يرجعها `GET /visit-points`. */
export const visitPointsList: readonly VisitPoint[] = [
  point(115, "صيدلية الشفا — الميدان (مكررة)", pharmacy, damascus, omar, 33.4969, 36.2985, { status: "DISABLED", merged_into_id: 106, review_state: "ACCEPTED", last_visit_at: "2026-11-05T10:10:00Z" }),
  point(114, "صيدلية بلا ترخيص — باب توما", pharmacy, damascus, huda, 33.5124, 36.3158, { status: "DISABLED", review_state: "REJECTED", last_visit_at: null, address: "باب توما، بجانب الجامع" }),
  point(113, "مركز الأمومة — دوما", center, rural, huda, 33.5721, 36.4012, { address: "دوما، الشارع الرئيسي", last_visit_at: "2026-11-08T11:20:00Z" }),
  point(112, "عيادة د. هالة منصور — الحمرا", clinic, homs, samer, 34.7324, 36.7137, { specialty: gynecology, address: "حمص، الحمرا", last_visit_at: "2026-11-07T09:00:00Z" }),
  point(111, "صيدلية الحياة — العزيزية", pharmacy, aleppo, omar, 36.2021, 37.1343, { address: "حلب، العزيزية", last_visit_at: "2026-11-09T10:45:00Z" }),
  ...(linked ? [linked] : []),
  point(108, "صيدلية النور — أبو رمانة", pharmacy, damascus, samer, 33.5189, 36.2699, { address: "دمشق، أبو رمانة" }),
  point(107, "عيادة د. لينا الأيوبي — المزة", clinic, damascus, huda, 33.5067, 36.2758, { specialty: gynecology, address: "دمشق، المزة" }),
  point(106, "صيدلية الشفاء — الميدان", pharmacy, damascus, omar, 33.4968, 36.2983, { address: "دمشق، الميدان", next_action: "عرض المرحلة الثانية الجديدة." }),
  point(105, "مركز الرعاية — كفرسوسة", center, damascus, samer, 33.4915, 36.2655, { address: "دمشق، كفرسوسة" }),
  point(104, "عيادة أطفال د. سامي قصّاب", clinic, damascus, huda, 33.5121, 36.2917, { specialty: pediatrics, address: "دمشق، الصالحية" }),
  point(103, "صيدلية الربيع — المالكي", pharmacy, damascus, omar, 33.5198, 36.2831, { address: "دمشق، المالكي" }),
  point(102, "مستوصف الأمل — جرمانا", dispensary, rural, samer, 33.4802, 36.3466, { address: "جرمانا، ساحة السيوف" }),
  point(101, "عيادة د. ريم حداد — المزة", clinic, damascus, samer, 33.5039, 36.2799, { specialty: pediatrics, address: "دمشق، المزة، خلف مشفى الرازي", next_action: "إعادة عينات الحليب وسؤالها عن ردود الأمهات." }),
];

export const findVisitPoint = (id: number): VisitPoint => visitPointsList.find((entry) => entry.id === id) ?? visitPointsList[visitPointsList.length - 1];

/** زيارات الجهة (`GET /visits?visit_point_id=`): الأحدث أولاً. */
export function pointVisits(id: number): readonly Visit[] {
  const point = findVisitPoint(id);
  if (point.customer_id === linkedCustomerId) return repVisitsOf(findCustomer(linkedCustomerId));
  return allVisits.filter((entry) => entry.visit_point?.id === id).sort((a, b) => ((a.started_at ?? "") < (b.started_at ?? "") ? 1 : -1)).slice(0, 6);
}

/** العميل المربوط بالجهة باسمه (§53: الاسم يجلبه الأب من `GET /customers/{id}`). */
export function pointCustomer(point: VisitPoint): LinkedCustomer | null {
  return point.customer_id ? { id: point.customer_id, name: findCustomer(point.customer_id).name ?? "" } : null;
}

export const linkedPointId = linked?.id ?? 101;
export const rejectedPointId = 114;
export const mergedPointId = 115;

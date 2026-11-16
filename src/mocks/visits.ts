import type { Flag, FlagStatus, FlagType, ListEntry, UserRef, Visit } from "@/lib/api/types";
import { balanceItems, batchBooklet, batchSample } from "./stock-balances";
import { huda, monitoringUser, omar, samer } from "./supervision";

const [, , , sampleItem, bookletItem] = balanceItems;

// زيارات المندوبين في أيام العمل 3–10 تشرين الثاني 2026 (S03 وغيرها): كل زيارة بنقطتيها ومدتها ومسافتها، والتحقق سليم افتراضياً.
// تُولَّد من جدول الخطة أدناه فتنسجم أعدادها مع التقارير اليومية. الأوقات UTC (دمشق +3). لا يُنقل للإنتاج.

export const purposes = [
  { id: 1, name: "تعريف بالمنتجات", order: 1, is_active: true },
  { id: 2, name: "متابعة طلب", order: 2, is_active: true },
  { id: 3, name: "توزيع عينات", order: 3, is_active: true },
] satisfies ListEntry[];

export const notMetReasons = [
  { id: 1, name: "الطبيب غير موجود", order: 1, is_active: true },
  { id: 2, name: "العيادة مغلقة", order: 2, is_active: true },
  { id: 3, name: "الطبيب مشغول", order: 3, is_active: true },
] satisfies ListEntry[];

export const outcomes = [
  { id: 1, name: "وعد بالتجربة", order: 1, is_active: true },
  { id: 2, name: "طلب عينات", order: 2, is_active: true },
  { id: 3, name: "لا اهتمام حالياً", order: 3, is_active: true },
] satisfies ListEntry[];

/** جهات الزيارة (نقاط) بأنواعها. */
export const visitPoints = [
  { id: 101, name: "عيادة د. ريم حداد — المزة", type: "عيادة", specialty: "أطفال", status: "ACTIVE", lat: 33.5039, lng: 36.2799 },
  { id: 102, name: "مستوصف الأمل — جرمانا", type: "مستوصف", specialty: null, status: "ACTIVE", lat: 33.4802, lng: 36.3466 },
  { id: 103, name: "صيدلية الربيع — المالكي", type: "صيدلية", specialty: null, status: "ACTIVE", lat: 33.5198, lng: 36.2831 },
  { id: 104, name: "عيادة أطفال د. سامي قصّاب", type: "عيادة", specialty: "أطفال", status: "ACTIVE", lat: 33.5121, lng: 36.2917 },
  { id: 105, name: "مركز الرعاية — كفرسوسة", type: "مركز صحي", specialty: null, status: "ACTIVE", lat: 33.4915, lng: 36.2655 },
  { id: 106, name: "صيدلية الشفاء — الميدان", type: "صيدلية", specialty: null, status: "ACTIVE", lat: 33.4968, lng: 36.2983 },
  { id: 107, name: "عيادة د. لينا الأيوبي — المزة", type: "عيادة", specialty: "نسائية", status: "ACTIVE", lat: 33.5067, lng: 36.2758 },
  { id: 108, name: "صيدلية النور — أبو رمانة", type: "صيدلية", specialty: null, status: "ACTIVE", lat: 33.5189, lng: 36.2699 },
] as const;

type Plan = [rep: UserRef, date: string, total: number];

/** زيارات كل مندوب في يوم عمله. غياب سامر 4 تشرين الثاني وهدى 5 تشرين الثاني بلا زيارات. */
export const visitPlan: readonly Plan[] = [
  [samer, "2026-11-03", 5], [samer, "2026-11-05", 4], [samer, "2026-11-07", 5], [samer, "2026-11-08", 6], [samer, "2026-11-09", 5], [samer, "2026-11-10", 2],
  [omar, "2026-11-03", 4], [omar, "2026-11-04", 5], [omar, "2026-11-05", 5], [omar, "2026-11-07", 4], [omar, "2026-11-08", 5], [omar, "2026-11-09", 4], [omar, "2026-11-10", 2],
  [huda, "2026-11-03", 5], [huda, "2026-11-04", 4], [huda, "2026-11-07", 5], [huda, "2026-11-08", 4], [huda, "2026-11-09", 5], [huda, "2026-11-10", 1],
];

const pad = (n: number) => String(n).padStart(2, "0");
const at = (date: string, minutes: number) => `${date}T${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}:00Z`;

function visit(rep: UserRef, date: string, index: number, total: number): Visit {
  const point = visitPoints[(index + (rep.id ?? 0)) % visitPoints.length];
  // آخر زيارة في اليوم غير ملتقاة (الطبيب غير موجود أو العيادة مغلقة)، وما قبلها ملتقاة.
  const met = index !== total - 1 || total < 4;
  const startMinutes = 6 * 60 + 40 + index * 62;
  const duration = met ? 18 + ((index * 7) % 14) : 6;
  const day = Number(date.slice(-2));
  const id = (rep.id ?? 0) * 1000 + day * 10 + index;
  return {
    id,
    client_uuid: `00000000-0000-4000-8000-${String(id).padStart(12, "0")}`,
    rep,
    session_id: (rep.id ?? 0) * 100 + day,
    visit_point: { id: point.id, name: point.name, type: point.type, specialty: point.specialty, status: point.status },
    status: "COMPLETED",
    started_at: at(date, startMinutes),
    start_location: { lat: point.lat + 0.0004, lng: point.lng - 0.0003, accuracy_m: 9 + (index % 4) * 3 },
    ended_at: at(date, startMinutes + duration),
    end_location: { lat: point.lat + 0.0003, lng: point.lng - 0.0002, accuracy_m: 11 },
    end_source: "MANUAL",
    duration_minutes: duration,
    distance_m: 40 + ((index * 37) % 120),
    range_m_used: 200,
    met,
    not_met_reason: met ? null : notMetReasons[(index + day) % notMetReasons.length],
    met_person: met ? "المسؤول عن الجهة" : null,
    purpose: purposes[index % purposes.length],
    discussed_items: [],
    interest_level: met ? (["HIGH", "MEDIUM", "LOW"] as const)[index % 3] : null,
    // عينة في كل زيارة ملتقاة زوجية الترتيب، ومادة دعائية في كل ثالثة. تُجمع في ملخص التقرير اليومي.
    samples: met && index % 2 === 0 ? [{ item: sampleItem, batch: batchSample, quantity: 3, unit_cost: "0.40", after_suspension: false }] : [],
    promo_materials: met && index % 3 === 0 ? [{ item: bookletItem, batch: batchBooklet, quantity: 2, unit_cost: "0.15", after_suspension: false }] : [],
    outcome: met ? outcomes[index % outcomes.length] : null,
    custom_outcome: null,
    objections: null,
    follow_up_date: null,
    next_action: null,
    notes: null,
    photo_status: "UPLOADED",
    photos: [{ upload_id: `00000000-0000-4000-9000-${String(id).padStart(12, "0")}`, url: `https://files.trust.example/visits/${id}.jpg`, name: `visit-${id}.jpg`, mime: "image/jpeg" }],
    verification_status: "OK",
    flags: [],
    received_at: at(date, startMinutes + duration + 3),
    decided_by: null,
    decision_reason: null,
  };
}

const baseVisits: readonly Visit[] = visitPlan.flatMap(([rep, date, total]) => Array.from({ length: total }, (_, index) => visit(rep, date, index, total)));

/** علامة على زيارة (`GET /visits` تحمل علاماتها): تُنشأ وقت الاستلام وتُغلق بقرار المراقبة. */
function flag(id: number, visit: Visit, type: FlagType, status: FlagStatus, details: Record<string, unknown>, extra: Partial<Flag> = {}): Flag {
  return { id, type, status, subject_user: visit.rep, ref_type: "visit", ref_id: visit.id ?? 0, details, created_at: visit.received_at ?? "", closed_by: null, closed_at: null, note: null, investigation_id: null, handling_work_hours: null, ...extra };
}

// حالات خاصة تُطبَّق على زيارات مولَّدة بمعرّفها: لا تغيّر أعدادها فتبقى التقارير اليومية متّسقة. المرفوضة على يوم بلا تقرير (10 تشرين الثاني)
// لأن الرفض يستبعدها من المؤشرات. بقية الزيارات سليمة. الأوقات UTC.
const special: Record<number, (visit: Visit) => Visit> = {
  // خارج نطاق الجهة: 640 م والنطاق المستعمل 200 م.
  31092: (v) => ({ ...v, distance_m: 640, verification_status: "FLAGGED", flags: [flag(9001, v, "OUT_OF_RANGE", "OPEN", { distance_m: 640, range_m: 200 })] }),
  // قراءة موقع من تطبيق تزوير عند البدء.
  32081: (v) => ({ ...v, start_location: { ...v.start_location!, is_mock: true, accuracy_m: 3 }, verification_status: "FLAGGED", flags: [flag(9002, v, "MOCK_LOCATION", "OPEN", { is_mock: true })] }),
  // زيارة مكررة للجهة نفسها في اليوم نفسه.
  33093: (v) => ({ ...v, verification_status: "FLAGGED", flags: [flag(9003, v, "DUPLICATE_VISIT", "OPEN", { previous_visit_id: 33090, minutes_apart: 26 })] }),
  // الصورة لم تُرفع بعد: الزيارة سليمة وعلامتها «صورة معلّقة».
  31100: (v) => ({ ...v, photo_status: "PENDING", photos: [], flags: [flag(9004, v, "PHOTO_PENDING", "OPEN", {})] }),
  // جارية الآن: بلا إنهاء ولا مدة ولا مسافة بعد.
  33100: (v) => ({ ...v, status: "IN_PROGRESS", ended_at: null, end_location: null, end_source: null, duration_minutes: null, distance_m: null, received_at: v.started_at, photo_status: "NONE", photos: [] }),
  // أكّدتها المراقبة: كانت خارج النطاق، أُغلقت علامتها «لا مشكلة».
  32100: (v) => ({
    ...v,
    distance_m: 410,
    verification_status: "CONFIRMED",
    flags: [flag(9005, v, "OUT_OF_RANGE", "CLEARED", { distance_m: 410, range_m: 200 }, { closed_by: monitoringUser, closed_at: "2026-11-10T09:12:00Z" })],
    decided_by: monitoringUser,
    decision_reason: "العيادة داخل مجمّع واسع والمدخل بعيد عن موقعها المسجّل.",
  }),
  // رفضتها المراقبة: موقع مزوَّر مؤكَّد. تُستبعد من المؤشرات.
  32101: (v) => ({
    ...v,
    start_location: { ...v.start_location!, is_mock: true, accuracy_m: 2 },
    verification_status: "REJECTED",
    flags: [flag(9006, v, "MOCK_LOCATION", "CONFIRMED", { is_mock: true }, { closed_by: monitoringUser, closed_at: "2026-11-10T10:05:00Z" })],
    decided_by: monitoringUser,
    decision_reason: "قراءة الموقع من تطبيق تزوير، وبيانات الجهاز تؤكد ذلك.",
  }),
};

/** كل زيارات المعرض: الأقدم أولاً. */
export const allVisits: readonly Visit[] = baseVisits.map((entry) => special[entry.id ?? 0]?.(entry) ?? entry);

/** زيارة بمعرّفها: `GET /visits/{id}`. */
export const findVisit = (id: number): Visit => {
  const found = allVisits.find((entry) => entry.id === id);
  if (!found) throw new Error(`زيارة غير معرّفة في المعرض: ${id}`);
  return found;
};

/** زيارات مندوب في يوم عمل: `GET /visits?rep_id=&from=&to=`. */
export const visitsOf = (repId: number, workDate: string): Visit[] => allVisits.filter((entry) => entry.rep?.id === repId && entry.started_at?.slice(0, 10) === workDate);

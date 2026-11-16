import type { NewPointRow } from "@/features/visit-points/views/NewVisitPointsView";
import type { PointCompare } from "@/features/visit-points/views/MergePointsView";
import type { ListEntry, UserRef, VisitPoint } from "@/lib/api/types";
import { findFlag } from "./flags";
import { huda, omar, samer } from "./supervision";

// جهات الزيارة التي تنتظر مراجعة المراقبة (S10) وجهتان مكررتان (S11). الأوقات UTC. عدد الزيارات (`visits_count`) والعميل المربوط باسمه مضافان في الواجهة
// (docs/backend-requests.md §33.3 و§34.2). لا يُنقل للإنتاج.

const types = {
  clinic: { id: 1, name: "عيادة", order: 1, is_active: true },
  dispensary: { id: 2, name: "مستوصف", order: 2, is_active: true },
  pharmacy: { id: 3, name: "صيدلية", order: 3, is_active: true },
} satisfies Record<string, ListEntry>;

const pediatrics = { id: 1, name: "أطفال", order: 1, is_active: true } satisfies ListEntry;

const damascus = { id: 1, name: "دمشق" };
const rifDimashq = { id: 2, name: "ريف دمشق" };

function point(id: number, name: string, type: ListEntry, governorate: { id: number; name: string }, by: UserRef, createdAt: string, lat: number, lng: number, extra: Partial<VisitPoint> = {}): VisitPoint {
  return {
    id,
    client_uuid: `00000000-0000-4000-b000-${String(id).padStart(12, "0")}`,
    type,
    specialty: null,
    name,
    normalized_name: name,
    phone: null,
    governorate,
    address: null,
    location: { lat, lng, accuracy_m: 9 },
    status: "ACTIVE",
    review_state: "PENDING_REVIEW",
    merged_into_id: null,
    customer_id: null,
    created_by: by,
    created_at: createdAt,
    last_visit_at: null,
    next_action: null,
    ...extra,
  };
}

/** جهات جديدة بانتظار المراجعة بعلاماتها `NEW_VISIT_POINT` وعدد زياراتها. */
export const newPointRows: readonly NewPointRow[] = [
  { flag: findFlag(8006), point: point(201, "عيادة د. نور الشامي — المزة", types.clinic, damascus, samer, "2026-11-09T09:40:00Z", 33.5081, 36.2772, { specialty: pediatrics, phone: "+963944771122", address: "المزة، خلف مشفى الرازي" }), visits_count: 2 },
  { flag: findFlag(8007), point: point(202, "صيدلية الأمان — جرمانا", types.pharmacy, rifDimashq, omar, "2026-11-09T10:20:00Z", 33.4789, 36.3452, { phone: "+963955220033", address: "جرمانا، ساحة السيوف" }), visits_count: 1 },
  { flag: findFlag(8008), point: point(203, "مستوصف الرحمة — كفرسوسة", types.dispensary, damascus, huda, "2026-11-10T07:30:00Z", 33.4921, 36.2674), visits_count: 3 },
];

/** الجهتان المكررتان (علامة `DUPLICATE_POINT` رقم 8009): كتابتان لاسم صيدلية واحدة بفارق 40 متراً. */
export const duplicateFlag = findFlag(8009);

export const duplicatePair: { first: PointCompare; second: PointCompare } = {
  first: {
    point: point(204, "صيدلية الشفا — الميدان", types.pharmacy, damascus, omar, "2026-11-10T08:15:00Z", 33.49685, 36.29845, { phone: "+963933445566" }),
    visitsCount: 1,
    customer: null,
  },
  second: {
    point: point(106, "صيدلية الشفاء — الميدان", types.pharmacy, damascus, samer, "2026-09-02T08:00:00Z", 33.4968, 36.2983, { review_state: "ACCEPTED", customer_id: 66, address: "الميدان، شارع الجزماتية", phone: "+963933445566", last_visit_at: "2026-11-09T09:10:00Z" }),
    visitsCount: 12,
    customer: { id: 66, name: "صيدلية الشفاء" },
  },
};

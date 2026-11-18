import type { RepRow } from "@/features/reps/views/RepsListView";
import type { AttendanceSession, Governorate, User, UserRef } from "@/lib/api/types";
import { salesGovernorates } from "./sales";

// المندوبون (M13): سبعة مندوبين في ثلاث مناطق تحت سوبرفايزرَين، بدوام يوم 10 تشرين الثاني 2026 (يعمل الآن، وانتهى، ولم يبدأ). لا يُنقل للإنتاج.

export const repsToday = "2026-11-10";

const [damascus, rural, aleppo, homs] = salesGovernorates;

export const repSupervisors: readonly UserRef[] = [
  { id: 20, name: "خالد النجار" },
  { id: 21, name: "منى الصباغ" },
];
const [khaled, mona] = repSupervisors;

export const repGovernorates: readonly Governorate[] = [damascus, rural, aleppo, homs];

function rep(id: number, name: string, phone: string, governorates: Governorate[], manager: UserRef, lastSyncAt: string | null): User {
  return {
    id,
    name,
    type: "REP",
    email: null,
    phone,
    role: { id: 9, key: "rep", name: "مندوب" },
    department: "SCIENTIFIC_OFFICE",
    is_department_head: false,
    manager,
    agent: null,
    governorates,
    is_active: true,
    last_login_at: "2026-11-10T04:55:00Z",
    last_sync_at: lastSyncAt,
    created_at: "2026-02-01T08:00:00Z",
  };
}

function session(id: number, repUser: User, startedAt: string, endedAt: string | null, planned: number): AttendanceSession {
  return {
    id,
    client_uuid: `00000000-0000-4000-d000-${String(id).padStart(12, "0")}`,
    rep: { id: repUser.id, name: repUser.name },
    work_date: repsToday,
    planned_visits: planned,
    started_at: `2026-11-10T${startedAt}:00Z`,
    start_location: { lat: 33.5, lng: 36.29, accuracy_m: 9 },
    ended_at: endedAt ? `2026-11-10T${endedAt}:00Z` : null,
    end_location: endedAt ? { lat: 33.5, lng: 36.29, accuracy_m: 11 } : null,
    close_source: endedAt ? "MANUAL" : null,
    duration_minutes: null,
    is_full_day: null,
    is_holiday: false,
    flags: [],
  };
}

const samer = rep(31, "سامر الحلبي", "+963944100031", [damascus], khaled, "2026-11-10T10:42:00Z");
const omar = rep(32, "عمر الخطيب", "+963955100032", [aleppo], mona, "2026-11-10T10:30:00Z");
const huda = rep(33, "هدى العلي", "+963933100033", [homs], mona, "2026-11-10T09:58:00Z");
const layla = rep(34, "ليلى منصور", "+963944100034", [damascus, rural], khaled, "2026-11-10T11:05:00Z");
const jood = rep(35, "جود الدالاتي", "+963955100035", [aleppo], mona, "2026-11-09T14:20:00Z");
const maher = rep(36, "ماهر قدّور", "+963933100036", [rural], khaled, "2026-11-10T08:12:00Z");
const rana = rep(37, "رنا الحسن", "+963944100037", [homs], mona, null);

export const repRows: readonly RepRow[] = [
  { rep: samer, session: session(901, samer, "05:30", null, 8), visitsToday: 5 },
  { rep: omar, session: session(902, omar, "05:45", null, 8), visitsToday: 4 },
  { rep: huda, session: session(903, huda, "05:20", "11:40", 7), visitsToday: 7 },
  { rep: layla, session: session(904, layla, "06:00", null, 9), visitsToday: 6 },
  { rep: jood, session: null, visitsToday: 0 },
  { rep: maher, session: session(905, maher, "05:15", "11:10", 6), visitsToday: 6 },
  { rep: rana, session: null, visitsToday: 0 },
];

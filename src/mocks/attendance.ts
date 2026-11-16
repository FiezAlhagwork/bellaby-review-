import type { AttendanceAlert, SupervisorOverview } from "@/features/supervision/views/SupervisorDashboardView";
import type { AttendanceRow } from "@/features/attendance/views/AttendanceSessionsView";
import type { AttendanceSession, Flag, UserRef } from "@/lib/api/types";
import { dailyReportsList } from "./daily-reports";
import { huda, omar, samer } from "./supervision";

// جلسات الدوام (S01 وS04): 20 جلسة لثلاثة مندوبين بين 3 و10 تشرين الثاني 2026، منها دوام ناقص وإغلاق آلي وجلسة في عطلة، ويومان بلا جلسة (غياب).
// جلسات اليوم (10 تشرين الثاني) مفتوحة. الأوقات UTC (دمشق +3). لا يُنقل للإنتاج.

const at = (date: string, hhmm: string) => `${date}T${hhmm}:00Z`;
const minutesBetween = (start: string, end: string) => Math.round((Date.parse(end) - Date.parse(start)) / 60_000);

const homePoint = { lat: 33.5138, lng: 36.2765, accuracy_m: 10 };

type Options = { planned: number; ended?: string; autoClosed?: boolean; holiday?: boolean };

function session(id: number, rep: UserRef, date: string, started: string, { planned, ended, autoClosed = false, holiday = false }: Options): AttendanceSession {
  const startedAt = at(date, started);
  const endedAt = ended ? at(date, ended) : null;
  const duration = endedAt ? minutesBetween(startedAt, endedAt) : null;
  const flags: Flag[] = autoClosed
    ? [{ id: id + 900, type: "AUTO_CLOSED", status: "OPEN", subject_user: rep, ref_type: "attendance_session", ref_id: id, details: {}, created_at: endedAt ?? startedAt, closed_by: null, closed_at: null, note: null, investigation_id: null, handling_work_hours: null }]
    : [];
  return {
    id,
    client_uuid: `00000000-0000-4000-a000-${String(id).padStart(12, "0")}`,
    rep,
    work_date: date,
    planned_visits: planned,
    started_at: startedAt,
    start_location: homePoint,
    ended_at: endedAt,
    end_location: endedAt ? homePoint : null,
    close_source: endedAt ? (autoClosed ? "AUTO" : "MANUAL") : null,
    duration_minutes: duration,
    is_full_day: duration === null ? null : duration >= 480,
    is_holiday: holiday,
    flags,
  };
}

export const attendanceSessions: readonly AttendanceSession[] = [
  // 10 تشرين الثاني: جارية.
  session(1031, samer, "2026-11-10", "05:50", { planned: 6 }),
  session(1032, omar, "2026-11-10", "06:05", { planned: 5 }),
  session(1033, huda, "2026-11-10", "07:10", { planned: 4 }),
  // 9 تشرين الثاني.
  session(1021, samer, "2026-11-09", "05:55", { planned: 5, ended: "14:20" }),
  session(1022, omar, "2026-11-09", "06:00", { planned: 4, ended: "14:25" }),
  session(1023, huda, "2026-11-09", "06:10", { planned: 5, ended: "14:35" }),
  // 8 تشرين الثاني.
  session(1011, samer, "2026-11-08", "05:50", { planned: 6, ended: "14:15" }),
  session(1012, omar, "2026-11-08", "06:00", { planned: 5, ended: "14:30" }),
  session(1013, huda, "2026-11-08", "06:05", { planned: 4, ended: "14:20" }),
  // 7 تشرين الثاني.
  session(1001, samer, "2026-11-07", "06:00", { planned: 5, ended: "14:30" }),
  session(1002, omar, "2026-11-07", "05:55", { planned: 4, ended: "14:10" }),
  session(1003, huda, "2026-11-07", "06:15", { planned: 5, ended: "14:40" }),
  // 6 تشرين الثاني (الجمعة): جلسة بجهاز لم يزامن قائمة العطل، لا تُحسب في أيام العمل.
  session(991, omar, "2026-11-06", "08:00", { planned: 0, ended: "09:35", holiday: true }),
  // 5 تشرين الثاني: دوام ناقص لسامر، وإغلاق آلي لعمر. هدى غائبة.
  session(981, samer, "2026-11-05", "06:00", { planned: 4, ended: "12:10" }),
  session(982, omar, "2026-11-05", "06:05", { planned: 5, ended: "17:00", autoClosed: true }),
  // 4 تشرين الثاني: دوام ناقص لهدى. سامر غائب.
  session(972, omar, "2026-11-04", "06:00", { planned: 5, ended: "14:20" }),
  session(973, huda, "2026-11-04", "06:10", { planned: 4, ended: "13:00" }),
  // 3 تشرين الثاني.
  session(961, samer, "2026-11-03", "05:55", { planned: 5, ended: "14:20" }),
  session(962, omar, "2026-11-03", "06:00", { planned: 4, ended: "14:15" }),
  session(963, huda, "2026-11-03", "06:05", { planned: 5, ended: "14:30" }),
];

/** أيام العمل التي لا جلسة فيها: غياب. مصدرها مطلوب من الباك (docs/backend-requests.md §28.2). */
const absences: readonly { rep: UserRef; work_date: string }[] = [
  { rep: huda, work_date: "2026-11-05" },
  { rep: samer, work_date: "2026-11-04" },
];

const repOrder = [samer.id, omar.id, huda.id];

/** الصفوف من الأحدث: الجلسات والغياب معاً، وفي اليوم الواحد بترتيب المندوبين. */
export const attendanceRows: readonly AttendanceRow[] = [
  ...attendanceSessions.map((value): AttendanceRow => ({ kind: "session", session: value })),
  ...absences.map((value): AttendanceRow => ({ kind: "absence", rep: value.rep, work_date: value.work_date })),
].sort((a, b) => {
  const dateA = a.kind === "session" ? a.session.work_date ?? "" : a.work_date;
  const dateB = b.kind === "session" ? b.session.work_date ?? "" : b.work_date;
  if (dateA !== dateB) return dateA < dateB ? 1 : -1;
  const repA = (a.kind === "session" ? a.session.rep?.id : a.rep.id) ?? 0;
  const repB = (b.kind === "session" ? b.session.rep?.id : b.rep.id) ?? 0;
  return repOrder.indexOf(repA) - repOrder.indexOf(repB);
});

/** تنبيهات الدوام: ناقص أو غياب، الأحدث أولاً. */
export const attendanceAlerts: readonly AttendanceAlert[] = attendanceRows.flatMap((row): AttendanceAlert[] => {
  if (row.kind === "absence") return [{ rep: row.rep, work_date: row.work_date, kind: "absent" }];
  const { session: value } = row;
  return value.is_full_day === false && !value.is_holiday && value.rep && value.work_date ? [{ rep: value.rep, work_date: value.work_date, kind: "short-day" }] : [];
});

const pending = dailyReportsList.filter((report) => !report.rating);

/** لوحة السوبرفايزر بلا تنبيهات (الافتراضي). زيارات اليوم 5 من 15: سامر 2 من 6، وعمر 2 من 5، وهدى 1 من 4. */
export const supervisorOverview: SupervisorOverview = {
  visits: { done: 5, planned: 15 },
  attendance: { present: 3, total: 3 },
  pendingReports: { count: pending.length, nextDueAt: pending.map((report) => report.rating_due_at ?? "").sort()[0] ?? null },
  pendingLeaves: 2,
  alerts: [],
};

/** وفيها تنبيهات دوام (حالة `attendance-alerts`). */
export const supervisorOverviewWithAlerts: SupervisorOverview = { ...supervisorOverview, alerts: attendanceAlerts };

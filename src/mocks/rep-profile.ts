import type { RepDistribution } from "@/features/reps/views/RepProfileView";
import type { AttendanceSession, BalanceLine, MonthlyScore, User } from "@/lib/api/types";
import { attendanceSessions } from "./attendance";
import { dailyReportsList } from "./daily-reports";
import { allBalances, otherLocations } from "./stock-balances";
import { samer, supervisionToday, supervisor } from "./supervision";
import { allVisits, visitsOf } from "./visits";

// صفحة المندوب (S07): سامر الحلبي، مندوب في المكتب العلمي يتبع السوبرفايزر ماهر الأتاسي (لا وكيل له: المندوبون تابعون للشركة).
// البيانات من نقاط العقد: `GET /users/{id}` و`/attendance-sessions` و`/visits` و`/stock/balances` و`/daily-reports` و`/scores`. لا يُنقل للإنتاج.

export const repUser = {
  id: samer.id,
  name: samer.name,
  type: "REP",
  email: null,
  phone: "+963944123456",
  role: { id: 12, key: "rep", name: "مندوب" },
  department: "SCIENTIFIC_OFFICE",
  is_department_head: false,
  manager: supervisor,
  agent: null,
  governorates: [
    { id: 1, name: "دمشق" },
    { id: 2, name: "ريف دمشق" },
  ],
  is_active: true,
  last_login_at: "2026-11-10T04:02:00Z",
  last_sync_at: "2026-11-10T11:02:00Z",
  created_at: "2025-03-02T08:00:00Z",
} satisfies User;

/** موقع المندوب (`GET /locations?type=REP`): رصيده بمعرّف الموقع لا المستخدم. */
const repLocation = otherLocations[3];

/** دوام اليوم (10 تشرين الثاني): `GET /attendance-sessions?rep_id=&from=&to=`. */
export const repTodaySession: AttendanceSession | null = attendanceSessions.find((entry) => entry.rep?.id === samer.id && entry.work_date === supervisionToday) ?? null;

/** زيارات اليوم: `GET /visits?rep_id=&from=&to=`. */
export const repTodayVisits = visitsOf(samer.id ?? 0, supervisionToday);

/** رصيده الحالي: عينات ومواد فقط (المنتجات للوكيل). */
export const repBalances: readonly BalanceLine[] = allBalances.filter((line) => line.location.id === repLocation.id);

/** رصيد سالب بعد تعارض مع المزامنة (يجوز للمندوب وحده): العينات نقصت عن المسجّل. */
export const repBalancesNegative: readonly BalanceLine[] = repBalances.map((line) => (line.item?.type === "SAMPLE" ? { ...line, quantity: -3 } : line));

/** ما وزّعه هذا الشهر: مجاميع كميات الزيارات غير المرفوضة (محسوبة في الواجهة، §30.3). */
function distributedIn(month: string): RepDistribution[] {
  const totals = new Map<number, RepDistribution>();
  for (const visit of allVisits) {
    if (visit.rep?.id !== samer.id || visit.verification_status === "REJECTED" || !visit.started_at?.startsWith(month)) continue;
    for (const entry of [...(visit.samples ?? []), ...(visit.promo_materials ?? [])]) {
      if (!entry.item?.id) continue;
      const current = totals.get(entry.item.id);
      totals.set(entry.item.id, { item: entry.item, quantity: (current?.quantity ?? 0) + (entry.quantity ?? 0) });
    }
  }
  return [...totals.values()];
}

export const repDistributed = distributedIn(supervisionToday.slice(0, 7));

/** آخر خمسة تقارير يومية: الأحدث أولاً. */
export const repReports = dailyReportsList
  .filter((report) => report.rep?.id === samer.id)
  .sort((a, b) => (b.work_date ?? "").localeCompare(a.work_date ?? ""))
  .slice(0, 5);

/** نقاطه الشهرية: تشرين الأول نهائي، وتشرين الثاني مبدئي حتى إغلاق الشهر. الأحدث أولاً. */
export const repScores = [
  {
    user: samer,
    role_key: "rep",
    month: "2026-11",
    status: "PROVISIONAL",
    total: 82,
    kpis: [
      { key: "visits_vs_plan", label: "الزيارات مقابل الخطة", weight: 30, raw_value: 88, score: 26.4 },
      { key: "met_rate", label: "نسبة اللقاء", weight: 20, raw_value: 75, score: 15 },
      { key: "daily_report_rating", label: "تقييم التقارير اليومية", weight: 20, raw_value: 80, score: 16 },
      { key: "attendance", label: "الالتزام بالدوام", weight: 15, raw_value: 100, score: 15 },
      { key: "samples_efficiency", label: "كفاءة توزيع العينات", weight: 15, raw_value: 64, score: 9.6 },
    ],
    manual_rating: null,
    comparison_group: { id: 3, name: "مندوبو دمشق" },
  },
  {
    user: samer,
    role_key: "rep",
    month: "2026-10",
    status: "FINAL",
    total: 84.7,
    kpis: [
      { key: "visits_vs_plan", label: "الزيارات مقابل الخطة", weight: 30, raw_value: 92, score: 27.6 },
      { key: "met_rate", label: "نسبة اللقاء", weight: 20, raw_value: 78, score: 15.6 },
      { key: "daily_report_rating", label: "تقييم التقارير اليومية", weight: 20, raw_value: 80, score: 16 },
      { key: "attendance", label: "الالتزام بالدوام", weight: 15, raw_value: 100, score: 15 },
      { key: "samples_efficiency", label: "كفاءة توزيع العينات", weight: 15, raw_value: 70, score: 10.5 },
    ],
    manual_rating: { score: "80", rated_by: { id: 40, name: "د. هبة الأحمد" }, locked: true },
    comparison_group: { id: 3, name: "مندوبو دمشق" },
  },
] satisfies MonthlyScore[];

import type { DailyReportRow } from "@/features/daily-reports/deadline";
import type { RatingScale, UserRef } from "@/lib/api/types";
import { huda, omar, samer, supervisor } from "./supervision";
import { visitsOf } from "./visits";

// التقارير اليومية (S02 وS03): 14 تقريراً لثلاثة مندوبين بين 3 و9 تشرين الثاني 2026، أُرسلت مساء يوم العمل. 5 منها بانتظار التقييم (اثنان تجاوزا المهلة)
// و9 مقيَّمة. ملخص كل تقرير يُحسب من زيارات يومه (mocks/visits.ts) فيتّسق معها. الأوقات UTC. لا يُنقل للإنتاج.

type Rated = { score: RatingScale; ratedAt: string; comment?: string; within?: boolean };
type Spec = {
  id: number;
  rep: UserRef;
  date: string;
  /** وقت الاستلام مساء يوم العمل (UTC). */
  receivedAt: string;
  onTime?: boolean;
  rated?: Rated;
  /** موعد انتهاء المهلة للتقرير غير المقيَّم. */
  dueAt?: string;
  notes?: { id: number; text: string; at: string }[];
};

const regions: Record<number, string> = { 31: "المزة وأبو رمانة", 32: "جرمانا والقصّاع", 33: "كفرسوسة والميدان" };

const topResults = [
  "ثلاث جهات طلبت عينات إضافية.",
  "اهتمام واضح بالمرحلة الثانية في العيادة الأولى.",
  "تعريف ناجح بالمنتجات في مستوصف جديد.",
  "طبيبة وعدت بتجربة المنتج على مرضاها.",
];
const topProblems = ["ازدحام شديد أخّر آخر زيارتين.", "نفاد المواد الدعائية قبل نهاية اليوم.", "إغلاق جهتين بلا إشعار مسبق.", "لا مشكلات تُذكر."];
const nextPlans = ["إعادة زيارة الجهات التي وعدت بالتجربة.", "التركيز على منطقة جرمانا.", "متابعة طلبات العينات المعلّقة.", "زيارة الجهات الجديدة في المالكي."];

const specs: Spec[] = [
  { id: 114, rep: samer, date: "2026-11-09", receivedAt: "17:20", dueAt: "2026-11-10T16:40:00Z" },
  { id: 113, rep: omar, date: "2026-11-09", receivedAt: "17:05", dueAt: "2026-11-10T13:20:00Z" },
  { id: 112, rep: huda, date: "2026-11-09", receivedAt: "17:35", dueAt: "2026-11-10T15:00:00Z" },
  { id: 111, rep: samer, date: "2026-11-08", receivedAt: "17:15", rated: { score: "80", ratedAt: "2026-11-09T06:10:00Z", comment: "تغطية جيدة ونتائج مقبولة." } },
  { id: 110, rep: omar, date: "2026-11-08", receivedAt: "17:40", dueAt: "2026-11-09T14:10:00Z" },
  { id: 109, rep: huda, date: "2026-11-08", receivedAt: "17:10", rated: { score: "60", ratedAt: "2026-11-09T06:45:00Z", comment: "زيارتان ناقصتان بلا مبرر واضح." } },
  { id: 108, rep: samer, date: "2026-11-07", receivedAt: "17:25", rated: { score: "60", ratedAt: "2026-11-08T06:20:00Z" } },
  { id: 107, rep: omar, date: "2026-11-07", receivedAt: "17:00", rated: { score: "100", ratedAt: "2026-11-08T06:50:00Z", comment: "يوم ممتاز: تغطية كاملة ونتائج فعلية." } },
  { id: 106, rep: huda, date: "2026-11-07", receivedAt: "17:30", dueAt: "2026-11-08T14:30:00Z" },
  {
    id: 105,
    rep: samer,
    date: "2026-11-05",
    receivedAt: "17:10",
    rated: { score: "100", ratedAt: "2026-11-07T06:30:00Z", comment: "تقرير مفصّل ومنظم." },
    notes: [{ id: 3, text: "نوقشت الملاحظات مع المندوب وتقرر تكرار الزيارة الأسبوع القادم.", at: "2026-11-07T08:00:00Z" }],
  },
  { id: 104, rep: omar, date: "2026-11-05", receivedAt: "17:45", onTime: false, rated: { score: "40", ratedAt: "2026-11-08T07:05:00Z", comment: "تأخر التقييم لتزامنه مع العطلة.", within: false } },
  { id: 103, rep: omar, date: "2026-11-04", receivedAt: "17:20", rated: { score: "60", ratedAt: "2026-11-05T06:40:00Z" } },
  { id: 102, rep: huda, date: "2026-11-03", receivedAt: "17:05", rated: { score: "80", ratedAt: "2026-11-04T07:30:00Z" } },
  { id: 101, rep: samer, date: "2026-11-03", receivedAt: "17:15", rated: { score: "80", ratedAt: "2026-11-04T07:10:00Z", comment: "تغطية جيدة، ركّز على متابعة الطلبات." } },
];

function build(spec: Spec, index: number): DailyReportRow {
  const visits = visitsOf(spec.rep.id ?? 0, spec.date);
  const met = visits.filter((visit) => visit.met).length;
  const reasons = new Map<string, number>();
  for (const visit of visits) if (!visit.met && visit.not_met_reason?.name) reasons.set(visit.not_met_reason.name, (reasons.get(visit.not_met_reason.name) ?? 0) + 1);
  const sum = (pick: (visit: (typeof visits)[number]) => readonly { quantity?: number }[] | undefined) => visits.reduce((total, visit) => total + (pick(visit) ?? []).reduce((inner, line) => inner + (line.quantity ?? 0), 0), 0);
  const received = `${spec.date}T${spec.receivedAt}:00Z`;

  return {
    id: spec.id,
    client_uuid: `00000000-0000-4000-9000-${String(spec.id).padStart(12, "0")}`,
    rep: spec.rep,
    work_date: spec.date,
    session_id: (spec.rep.id ?? 0) * 100 + Number(spec.date.slice(-2)),
    basics: { governorate: "دمشق", region: regions[spec.rep.id ?? 0] ?? "", planned_visits: visits.length + (index % 2) },
    summary: {
      visits_total: visits.length,
      met,
      not_met: visits.length - met,
      not_met_reasons: [...reasons].map(([reason, count]) => ({ reason, count })),
      samples_distributed: sum((visit) => visit.samples),
      promo_distributed: sum((visit) => visit.promo_materials),
      sales_opportunities: visits.filter((visit) => visit.interest_level === "HIGH").length,
    },
    top_result: topResults[index % topResults.length],
    top_problem: topProblems[index % topProblems.length],
    next_day_plan: nextPlans[index % nextPlans.length],
    submitted_at_device: `${spec.date}T${spec.receivedAt.slice(0, 3)}${String(Number(spec.receivedAt.slice(3)) - 2).padStart(2, "0")}:00Z`,
    received_at: received,
    on_time: spec.onTime ?? true,
    rating: spec.rated
      ? { score: spec.rated.score, comment: spec.rated.comment ?? null, rated_by: supervisor, rated_at: spec.rated.ratedAt, within_24_work_hours: spec.rated.within ?? true }
      : null,
    notes: (spec.notes ?? []).map((note) => ({ id: note.id, author: supervisor, text: note.text, created_at: note.at })),
    rating_due_at: spec.dueAt ?? null,
  };
}

/** كل التقارير: الأحدث أولاً بيوم العمل. */
export const dailyReportsList: readonly DailyReportRow[] = specs.map(build);

export const findDailyReport = (id: number): DailyReportRow => {
  const found = dailyReportsList.find((report) => report.id === id);
  if (!found) throw new Error(`تقرير غير معرّف في المعرض: ${id}`);
  return found;
};

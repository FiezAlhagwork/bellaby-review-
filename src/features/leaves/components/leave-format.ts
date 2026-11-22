import { dayLabel, dayMonthLabel, daysBetween, type IsoDate } from "@/lib/calendar";
import { countPhrase } from "@/lib/format";

/** فترة الإجازة: «15 تشرين الثاني 2026» ليوم واحد، وإلا «15 تشرين الثاني – 17 تشرين الثاني 2026». */
export function leavePeriod(from: IsoDate | undefined, to: IsoDate | undefined): string {
  if (!from || !to) return "—";
  return from === to ? dayLabel(from) : `${dayMonthLabel(from)} – ${dayLabel(to)}`;
}

/** مدة الإجازة بالأيام التقويمية (شاملة الطرفين). أيام العمل يحسبها الخادم: §109. */
export function leaveDays(from: IsoDate | undefined, to: IsoDate | undefined): string {
  if (!from || !to) return "—";
  return countPhrase(daysBetween(from, to) + 1, ["يوم واحد", "يومان", "أيام"]);
}

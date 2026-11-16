import { isolate } from "@/lib/format";

// مهلة التقييم: 24 ساعة عمل. الخادم يحسب موعد انتهائها (العطل وساعات العمل عنده)، والواجهة تحسب الباقي منه فقط.

export type RatingDeadline = {
  /** تجاوز المهلة. */
  late: boolean;
  /** قاربت المهلة (3 ساعات فأقل). */
  urgent: boolean;
  /** «متأخر» · «متبقٍّ 5 ساعات» · «أقل من ساعة». */
  label: string;
};

const HOUR = 3_600_000;
const URGENT_HOURS = 3;

/** «ساعة» · «ساعتان» · «5 ساعات» · «14 ساعة». */
function hoursPhrase(hours: number): string {
  if (hours === 1) return "ساعة";
  if (hours === 2) return "ساعتان";
  return hours <= 10 ? `${isolate(hours)} ساعات` : `${isolate(hours)} ساعة`;
}

/** الوقت المتبقي من المهلة للتقرير غير المقيَّم. دالة نقية: «الآن» يُمرَّر. */
export function ratingDeadline(dueAt: string | null | undefined, now: string): RatingDeadline | null {
  return deadlineFrom(dueAt, now, URGENT_HOURS);
}

const FLAG_URGENT_HOURS = 8;

/**
 * الوقت المتبقي من مهلة معالجة العلامة: 72 ساعة عمل. الخادم يحسب موعد انتهائها كذلك، والواجهة تحسب الباقي منه فقط.
 * «قاربت المهلة» عند 8 ساعات فأقل (يوم عمل واحد). دالة نقية: «الآن» يُمرَّر.
 */
export function flagDeadline(dueAt: string | null | undefined, now: string): RatingDeadline | null {
  return deadlineFrom(dueAt, now, FLAG_URGENT_HOURS);
}

function deadlineFrom(dueAt: string | null | undefined, now: string, urgentHours: number): RatingDeadline | null {
  if (!dueAt) return null;
  const remaining = Date.parse(dueAt) - Date.parse(now);
  if (remaining <= 0) return { late: true, urgent: false, label: "متأخر" };
  const hours = Math.floor(remaining / HOUR);
  return { late: false, urgent: hours < urgentHours, label: hours < 1 ? "متبقٍّ أقل من ساعة" : `متبقٍّ ${hoursPhrase(hours)}` };
}

import type { Location, UserRef } from "@/lib/api/types";
import { sampleRequestReps } from "./sample-requests";

// أساس بيانات السوبرفايزر (S01–S07): السوبرفايزر ومندوبو محافظاته، واليوم والوقت الثابتان في المعرض. لا يُنقل للإنتاج.
// اليوم الثلاثاء 10 تشرين الثاني 2026، والجمعة عطلة (6 و13 تشرين الثاني). الأوقات UTC وتُعرض بتوقيت دمشق (+3).

export const supervisionToday = "2026-11-10";
/** 14:30 بتوقيت دمشق. */
export const supervisionNow = "2026-11-10T11:30:00Z";

export const supervisor: UserRef = { id: 8, name: "ماهر الأتاسي" };

/** مندوبو محافظات السوبرفايزر كمواقع (لفلتر المندوب: `rep_id` = `location.user.id`). */
export const supervisionReps: readonly Location[] = sampleRequestReps;

export const samer: UserRef = { id: 31, name: "سامر الحلبي" };
export const omar: UserRef = { id: 32, name: "عمر الخطيب" };
export const huda: UserRef = { id: 33, name: "هدى العلي" };

export const repUsers: readonly UserRef[] = [samer, omar, huda];

/** المراقبة تقرّر في الزيارات المشكوك فيها (`visits.decide`). */
export const monitoringUser: UserRef = { id: 50, name: "جمال الحكيم" };

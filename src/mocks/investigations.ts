import type { Investigation, Money, UserRef } from "@/lib/api/types";
import { addDays } from "@/lib/calendar";
import { rami } from "./flags";
import { huda, monitoringUser, omar, samer } from "./supervision";

// ملفات التحقيق (S13 إلى S15): اثنا عشر ملفاً في مراحل مختلفة: مفتوحة في المراحل 1 إلى 7، وبانتظار القرار، ومقرَّرة، ومغلقة بلا مخالفة. المراحل المكتملة بملخصاتها ومرفقاتها.
// الملف 31 من العلامة 8013 (S09). `investigationDeductions` (مبلغ الخصم وسببه) مضاف في الواجهة لأن `Investigation.decision` فيه `deduction_id` فقط (docs/backend-requests.md §38.7).
// الأوقات UTC. لا يُنقل للإنتاج.

export const executive: UserRef = { id: 1, name: "زياد المصري" };

export const investigationsNow = "2026-11-10T11:30:00Z";

/** الموظفون الذين يُفتح عليهم ملف (S14). مصدرهم مطلوب (§37.4). */
export const investigationEmployees: readonly UserRef[] = [samer, omar, huda, rami, { id: 5, name: "سليم القاسم" }, { id: 8, name: "ماهر الأتاسي" }];

const summaries: Record<number, string[]> = {
  1: ["سُجّل فرق في رصيد العينات بعد المزامنة وأُبلغت المراقبة بالعلامة.", "رُصدت ثلاث زيارات بقراءات موقع مشكوك فيها في يوم واحد.", "بلّغ المستودع عن فرق بين المتوقع والفعلي في الجرد."],
  2: ["جُمعت كشوف المزامنة وسجل الحركات للفترة، وصور التسليم.", "أُرفقت سجلات الدوام والزيارات لثلاثة أيام."],
  3: ["الطرف الأول المندوب، والثاني مسؤول المستودع الذي سلّم العينات."],
  4: ["سُمع المندوب بحضور مسؤول المكتب العلمي وأقرّ بنقل العينات دون تسجيل."],
  5: ["يتبيّن أن النقل تم لتغطية زيارة طارئة دون تسجيل التوزيع في الوقت المناسب."],
  6: ["رُفع التقرير بنتائج التحقيق والأدلة المرفقة."],
};

const files = [
  { upload_id: "00000000-0000-4000-c000-000000000001", url: "https://files.trust.example/inv/sync-report.pdf", name: "sync-report.pdf", mime: "application/pdf" },
  { upload_id: "00000000-0000-4000-c000-000000000002", url: "https://files.trust.example/inv/movements.xlsx", name: "movements.xlsx", mime: "application/vnd.ms-excel" },
  { upload_id: "00000000-0000-4000-c000-000000000003", url: "https://files.trust.example/inv/statement.pdf", name: "statement.pdf", mime: "application/pdf" },
];

/** مراحل مكتملة 1 إلى `done` بتواريخ متتالية من `start`. */
function stagesUpTo(done: number, start: string): NonNullable<Investigation["stages"]> {
  return Array.from({ length: done }, (_, index) => {
    const stage = index + 1;
    const pool = summaries[stage] ?? summaries[6];
    return {
      stage,
      summary: pool[(Number(start.slice(8, 10)) + index) % pool.length],
      done_by: monitoringUser,
      done_at: `${addDays(start, index)}T${String((index % 6) + 7).padStart(2, "0")}:30:00Z`,
      attachments: stage === 2 ? [files[0], files[1]] : stage === 4 ? [files[2]] : [],
    };
  });
}

function make(id: number, title: string, subject: UserRef, status: NonNullable<Investigation["status"]>, created: string, done: number, extra: Partial<Investigation> = {}): Investigation {
  return {
    id,
    subject_user: subject,
    opened_from_flag_id: null,
    title,
    status,
    stages: stagesUpTo(done, created),
    classification: null,
    proposed_action: null,
    close_reason: null,
    decision: null,
    created_by: monitoringUser,
    created_at: `${created}T07:00:00Z`,
    ...extra,
  };
}

/** الأحدث أولاً. */
export const investigationsList: readonly Investigation[] = [
  make(42, "ملاحظات على تأخر المندوب في تسليم التقارير", huda, "STAGE_1", "2026-11-10", 0),
  make(41, "فرق في مخزون المواد الدعائية لدى المستودع", rami, "STAGE_6", "2026-11-04", 5),
  make(40, "زيارات مكررة لجهة واحدة في أسبوع", omar, "DECIDED", "2026-10-26", 6, {
    classification: "NEGLIGENCE",
    proposed_action: "تنبيه خطي ومتابعة لشهر.",
    decision: { text: "تنبيه خطي ومتابعة الزيارات لشهر.", deduction_id: null, decided_by: executive, decided_at: "2026-11-02T09:10:00Z" },
  }),
  make(39, "خلاف حول توثيق صور الزيارات", huda, "CLOSED_NO_VIOLATION", "2026-10-28", 2, { close_reason: "تبيّن أن الصور رُفعت في موعدها وتأخّر ظهورها بسبب المزامنة، ولا مخالفة." }),
  make(38, "تعارض بين الدوام المسجّل والزيارات", omar, "STAGE_2", "2026-11-08", 1),
  make(37, "نقص عينات بعد توزيع غير مسجّل", samer, "STAGE_5", "2026-11-03", 4),
  make(36, "تسجيل زيارة دون مغادرة الدوام", samer, "CLOSED_NO_VIOLATION", "2026-10-30", 2, { close_reason: "تبيّن أن الجهاز لم يزامن موقع الإنهاء، ولا مخالفة." }),
  make(35, "تأخر متكرر في الدوام", huda, "DECIDED", "2026-10-20", 7, {
    classification: "REPEATED_NEGLIGENCE",
    proposed_action: "إنذار خطي وخصم نصف يوم.",
    decision: { text: "إنذار خطي مع خصم نصف يوم.", deduction_id: 14, decided_by: executive, decided_at: "2026-11-08T08:40:00Z" },
  }),
  make(34, "قراءة موقع مزوَّرة عند بدء الزيارات", omar, "AWAITING_DECISION", "2026-10-29", 7, { classification: "DELIBERATE_VIOLATION", proposed_action: "إنذار خطي وخصم ثلاثة أيام من الراتب." }),
  make(33, "فرق مخزون بعد جرد المستودع الرئيسي", rami, "STAGE_7", "2026-10-31", 6),
  make(32, "زيارات مشكوك فيها لعمر الخطيب", omar, "STAGE_1", "2026-11-10", 0, { created_at: "2026-11-10T06:30:00Z" }),
  make(31, "فرق عينات بعد المزامنة", samer, "STAGE_4", "2026-11-03", 3, { opened_from_flag_id: 8013 }),
];

export const findInvestigation = (id: number): Investigation => {
  const found = investigationsList.find((entry) => entry.id === id);
  if (!found) throw new Error(`ملف تحقيق غير معرّف في المعرض: ${id}`);
  return found;
};

/** معرّفات ملفات المعرض بالاسم: لصفحات الرسم. */
export const investigationIds = { stage1: 32, stage4: 31, stage7: 33, awaiting: 34, decided: 35, closed: 36 } as const;

/** الخصم المقرَّر وسببه للملف 35: يُعرض من الواجهة (§38.7). */
export const investigationDeductions: Readonly<Record<number, { amount: Money; reason: string }>> = {
  35: { amount: "25.00", reason: "خصم نصف يوم عن تأخر متكرر." },
};

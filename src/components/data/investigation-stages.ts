import type { Investigation } from "@/lib/api/types";

/**
 * مراحل ملف التحقيق الثماني (القرار 9): أسماؤها من وصف `Investigation.status` في العقد. المرحلة الثامنة `AWAITING_DECISION`.
 * لا قفز بين المراحل: الملف يتقدّم مرحلة واحدة بـ`complete-stage` حتى السابعة، وفيها يُرفع للقرار.
 */
export const investigationStageLabels = ["تسجيل الواقعة", "جمع المستندات", "تحديد الأطراف", "سماع المعنيين", "تحليل السبب", "رفع التقرير", "اقتراح الإجراء", "انتظار القرار"] as const;

/** تسمية حقل الملخص وتلميحه لكل مرحلة 1–6 (العقد: `summary` ومرفقات فقط لكل مرحلة، §38.1). */
export const stageSummaryHints: Record<number, { label: string; hint: string }> = {
  1: { label: "ما جرى", hint: "سجّل الواقعة: ما حدث ومتى وأين وكيف عُرفت." },
  2: { label: "المستندات المجموعة", hint: "اذكر المستندات والأدلة التي جُمعت وأرفقها." },
  3: { label: "الأطراف", hint: "حدّد الأطراف المعنية بالواقعة ودور كل منهم." },
  4: { label: "ما قيل في السماع", hint: "لخّص أقوال من سُمع منهم وتواريخ السماع." },
  5: { label: "تحليل السبب", hint: "اكتب سبب الواقعة كما استخلصته من الأدلة والأقوال." },
  6: { label: "التقرير", hint: "لخّص التقرير المرفوع بنتائج التحقيق وأرفقه." },
};

export type StatusValue = NonNullable<Investigation["status"]>;

/** رقم المرحلة الحالية 1–8 من الحالة، أو null لما انتهى (تم القرار أو أُغلق بلا مخالفة). */
export function currentStageNumber(status: StatusValue): number | null {
  if (status === "AWAITING_DECISION") return 8;
  if (status === "DECIDED" || status === "CLOSED_NO_VIOLATION") return null;
  return Number(status.slice("STAGE_".length));
}

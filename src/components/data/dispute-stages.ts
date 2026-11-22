import type { DisputeStatus, RiskLevel } from "@/lib/api/types";

/**
 * مراحل ملف النزاع السبع (القرار 14): أسماؤها من وصف `Dispute.status` في العقد. القرار بين السادسة والسابعة (`AWAITING_DECISION`).
 * المراحل 1–5 تُكمَل بـ`complete-stage`، والسادسة برفع التوصية، والسابعة بتنفيذ القرار.
 */
export const disputeStageLabels = ["جمع المعلومات", "جمع المستندات", "تحديد موقف الشركة", "تقدير المخاطر", "اقتراح الحل", "رفع التوصية", "تنفيذ القرار"] as const;

/** تسمية حقل الملخص وتلميحه للمراحل 1–5 (`complete-stage`: `summary` ومرفقات، و`risk` في الرابعة). */
export const disputeStageHints: Record<number, { label: string; hint: string }> = {
  1: { label: "المعلومات", hint: "ما الخلاف، ومع من، ومنذ متى، وما قيمته." },
  2: { label: "المستندات", hint: "اذكر المستندات المجموعة (العقد، والفواتير، والمراسلات) وأرفقها." },
  3: { label: "موقف الشركة", hint: "موقف الشركة القانوني من الخلاف وأسانيده." },
  4: { label: "تقدير المخاطر", hint: "ما تخسره الشركة أو تكسبه في كل احتمال." },
  5: { label: "الحلول المقترحة", hint: "الحلول الممكنة (تسوية، إنذار، دعوى…) ومزايا كل منها." },
};

export const riskLevelLabels = { LOW: "منخفض", MEDIUM: "متوسط", HIGH: "مرتفع" } satisfies Record<RiskLevel, string>;
export const riskLevelOrder: RiskLevel[] = ["LOW", "MEDIUM", "HIGH"];

/** رقم المرحلة الحالية 1–7 من الحالة، و`decision` لبانتظار القرار، أو null لما أُغلق. */
export function currentDisputeStage(status: DisputeStatus): number | "decision" | null {
  if (status === "AWAITING_DECISION") return "decision";
  if (status === "CLOSED" || status === "CLOSED_RESOLVED") return null;
  return Number(status.slice("STAGE_".length));
}

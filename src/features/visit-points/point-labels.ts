import type { VisitPoint } from "@/lib/api/types";

/**
 * سبب تعطيل الجهة بما يحمله العقد: `review_state = REJECTED` (رفضتها المراقبة) أو `merged_into_id` (دُمجت في جهة أخرى).
 * null للجهة الفعّالة. العقد لا يسمّي «سبب التعطيل» حقلاً، فنستنتجه من هذين الحقلين (docs/backend-requests.md §53).
 */
export function disabledReason(point: VisitPoint): "rejected" | "merged" | null {
  if (point.status !== "DISABLED") return null;
  if (point.merged_into_id) return "merged";
  return point.review_state === "REJECTED" ? "rejected" : null;
}

export const disabledReasonLabels = { rejected: "مرفوضة", merged: "مدمجة" } as const;

/** مراجعة المراقبة للجهة (`review_state`): الجهة متاحة للزيارة فور إضافتها ولو لم تُراجَع بعد. */
export const reviewStateLabels = {
  PENDING_REVIEW: "بانتظار المراجعة",
  ACCEPTED: "مقبولة",
  REJECTED: "مرفوضة",
} as const satisfies Record<NonNullable<VisitPoint["review_state"]>, string>;

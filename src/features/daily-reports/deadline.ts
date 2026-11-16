import type { DailyReport } from "@/lib/api/types";

/**
 * التقرير اليومي كما تعرضه الشاشات: عقد `DailyReport` ومعه موعد انتهاء مهلة التقييم (24 ساعة عمل).
 * الموعد غير موجود في العقد: أُضيف في الواجهة وطلبه docs/backend-requests.md §26.2. يحسبه الخادم لأن العطل وساعات العمل عنده.
 */
export type DailyReportRow = DailyReport & {
  /** UTC. للتقرير غير المقيَّم فقط. */
  rating_due_at?: string | null;
};

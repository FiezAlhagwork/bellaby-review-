import type { Flag } from "@/lib/api/types";

/**
 * علامة بموعد انتهاء مهلة معالجتها (72 ساعة عمل). `due_at` (UTC) غير موجود في `Flag` بالعقد: أُضيف في الواجهة ويُطلب من الباك (docs/backend-requests.md §31.2)
 * لأن حساب ساعات العمل والعطل عند الخادم. الواجهة تحسب منه الباقي فقط.
 */
export type FlagRow = Flag & { due_at?: string | null };

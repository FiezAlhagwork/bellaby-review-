import { targetInput } from "@/features/plans/views/MonthlyPlanView";
import type { MonthlyPlan } from "@/lib/api/types";

// الخطة الشهرية (G16): خطة المبيعات لتشرين الثاني 2026 من أهداف تقريرها المعتمد لتشرين الأول (#79). اليوم 22 تشرين الثاني. لا يُنقل للإنتاج.

export const plansToday = "2026-11-22";
export const plansMonth = "2026-11";
export const plansNow = "2026-11-22T10:00:00Z";

const ziad = { id: 1, name: "زياد المصري" };
const rana = { id: 6, name: "رنا الشامي" };

/** الخطة السارية: الفعلي حتى اليوم. */
const approved = {
  department: "SALES",
  month: "2026-11",
  version: 1,
  status: "APPROVED",
  source_report_id: 79,
  targets: [
    { type: "SALES", metric: "SALES_VALUE", region_id: 1, target: 65000, actual: 47450, achievement_pct: 73 },
    { type: "SALES", metric: "SALES_VALUE", region_id: 3, target: 40000, actual: 14800, achievement_pct: 37 },
    { type: "SALES", metric: "SALES_VALUE", agent_id: 11, target: 30000, actual: 22100, achievement_pct: 73.7 },
    { type: "SALES_ITEM", metric: "ITEM_SALES_VALUE", item_id: 101, target: 52000, actual: 30160, achievement_pct: 58 },
    { type: "SALES", metric: "NEW_CUSTOMERS", target: 6, actual: 4, achievement_pct: 66.7 },
    { type: "VISITS", metric: "MANAGER_VISITS", target: 12, actual: 9, achievement_pct: 75 },
  ],
  versions: [{ version: 1, reason: null, approved_by: ziad, approved_at: "2026-11-09T11:00:00Z" }],
  pending_revision: null,
} satisfies MonthlyPlan;

export type PlanState = "approved" | "revision-pending" | "revised";

export function planAt(state: PlanState): MonthlyPlan {
  switch (state) {
    case "approved":
      return approved;
    case "revision-pending":
      return {
        ...approved,
        status: "REVISION_PENDING",
        pending_revision: {
          id: 4,
          reason: "شحنة المرحلة الأولى تأخرت إلى 25 تشرين الثاني، فلا تُباع كمية حلب هذا الشهر. ننقل جزءاً من هدفها إلى دمشق.",
          targets: approved.targets.map((target, index) => ({ ...targetInput(target), target: index === 0 ? 72000 : index === 1 ? 25000 : target.target })),
          requested_by: rana,
          requested_at: "2026-11-20T09:00:00Z",
        },
      };
    case "revised":
      return {
        ...approved,
        version: 2,
        targets: approved.targets.map((target, index) => (index === 0 ? { ...target, target: 72000, achievement_pct: 65.9 } : index === 1 ? { ...target, target: 25000, achievement_pct: 59.2 } : target)),
        versions: [...approved.versions, { version: 2, reason: "شحنة المرحلة الأولى تأخرت إلى 25 تشرين الثاني.", approved_by: ziad, approved_at: plansNow }],
      };
  }
}

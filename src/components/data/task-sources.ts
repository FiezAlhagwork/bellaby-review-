import type { TaskSource } from "@/lib/api/types";

/** مصدر المهمة (`Task.source`): يدوية، أو من خطة تقرير معتمد، أو إجراء متابعة من المدير التنفيذي. */
export const taskSourceLabels = {
  MANUAL: "يدوية",
  PLAN: "من خطة",
  FOLLOW_UP: "إجراء متابعة",
} satisfies Record<TaskSource, string>;

export const taskSourceOrder = Object.keys(taskSourceLabels) as TaskSource[];

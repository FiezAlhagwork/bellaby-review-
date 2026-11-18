"use client";

import { useState } from "react";
import { BudgetView, type BudgetDraft } from "@/features/budgets/views/BudgetView";
import type { Budget } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { closedMonths, financeToday, novemberBudget, novemberBudgetComplete, octoberBudget } from "@/mocks/finance";

// غلاف تفاعلي لصفحة الرسم (E03): يملك الشهر والمسودة. «حفظ الميزانية» يحدّث القيم محلياً كما يفعل PUT /budgets/{month} (والنسب يحسبها الخادم، فتبقى هنا).
// في الإنتاج تحلّ محلّه حاوية تطلب GET /budgets/{month} وترسل PUT. لا يُنقل للإنتاج.

type BudgetDemoProps = {
  initialMonth?: string;
  /** missing: تشرين الثاني والاتصالات بلا فعلي. */
  dataset?: "complete" | "missing";
  initialEditing?: boolean;
  /** حفظ يرجع 409 month_closed. */
  saveError?: string;
  canEdit?: boolean;
  mode?: "ready" | "loading" | "error";
};

const draftOf = (budget: Budget): BudgetDraft => Object.fromEntries((budget.lines ?? []).map((line) => [String(line.category?.id ?? ""), line.budget ?? ""]));

export function BudgetDemo({ initialMonth = "2026-11", dataset = "complete", initialEditing = false, saveError, canEdit = true, mode = "ready" }: BudgetDemoProps) {
  const [month, setMonth] = useState(initialMonth);
  const [november, setNovember] = useState<Budget>(dataset === "missing" ? novemberBudget : novemberBudgetComplete);
  const current = month === "2026-11" ? november : month === "2026-10" ? octoberBudget : { ...octoberBudget, month };
  const [draft, setDraft] = useState<BudgetDraft | null>(initialEditing ? draftOf(current) : null);

  const budget: Loadable<Budget> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: current };

  return (
    <BudgetView
      month={month}
      onMonthChange={(next) => {
        setMonth(next);
        setDraft(null);
      }}
      closedMonths={closedMonths}
      budget={budget}
      canEdit={canEdit}
      draft={draft}
      onDraftChange={setDraft}
      onEdit={() => setDraft(draftOf(current))}
      onCancel={() => setDraft(null)}
      onSave={() => {
        if (!draft || saveError) return;
        setNovember({ ...november, lines: (november.lines ?? []).map((line) => ({ ...line, budget: draft[String(line.category?.id ?? "")] ?? line.budget })) });
        setDraft(null);
      }}
      saveError={saveError}
      onOpenCategories={() => {}}
      today={financeToday}
    />
  );
}

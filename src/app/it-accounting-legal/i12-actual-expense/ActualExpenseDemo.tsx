"use client";

import { useState } from "react";
import { ActualExpenseView, type ExpenseDraft } from "@/features/budgets/views/ActualExpenseView";
import type { Budget } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { closedMonths, financeToday, novemberBudget, novemberBudgetComplete, octoberBudget } from "@/mocks/finance";

// غلاف تفاعلي لصفحة الرسم (I12): يملك الشهر والمسودة. «حفظ المصروف» يحدّث الفعلي محلياً كما يفعل PUT /expenses/{month}. لا يُنقل للإنتاج.

type ActualExpenseDemoProps = {
  initialMonth?: string;
  /** missing: الاتصالات بلا فعلي. */
  dataset?: "complete" | "missing";
  /** مسودة أولى (حالة التحقق). */
  initialDraft?: ExpenseDraft;
  errors?: Readonly<Record<string, string>>;
  saveError?: string;
  mode?: "ready" | "loading" | "error";
};

const samar = { id: 52, name: "سمر العبدالله" };

const draftOf = (budget: Budget): ExpenseDraft => Object.fromEntries((budget.lines ?? []).filter((line) => line.category?.kind === "ENTERED").map((line) => [String(line.category?.id ?? ""), line.actual ?? ""]));

export function ActualExpenseDemo({ initialMonth = "2026-11", dataset = "complete", initialDraft, errors, saveError, mode = "ready" }: ActualExpenseDemoProps) {
  const [month, setMonth] = useState(initialMonth);
  const [november, setNovember] = useState<Budget>(dataset === "missing" ? novemberBudget : novemberBudgetComplete);
  const current = month === "2026-11" ? november : month === "2026-10" ? octoberBudget : { ...octoberBudget, month };
  const [draft, setDraft] = useState<ExpenseDraft>(() => initialDraft ?? draftOf(current));
  const [saved, setSaved] = useState<string | undefined>();

  const budget: Loadable<Budget> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: current };

  return (
    <ActualExpenseView
      month={month}
      onMonthChange={(next) => {
        setMonth(next);
        setDraft(draftOf(next === "2026-11" ? november : octoberBudget));
        setSaved(undefined);
      }}
      closedMonths={closedMonths}
      today={financeToday}
      budget={budget}
      canEnter
      draft={draft}
      onDraftChange={(next) => {
        setDraft(next);
        setSaved(undefined);
      }}
      onSave={() => {
        if (saveError || errors) return;
        setNovember({
          ...november,
          lines: (november.lines ?? []).map((line) => {
            const value = (draft[String(line.category?.id ?? "")] ?? "").trim();
            return line.category?.kind === "ENTERED" && value !== "" && value !== line.actual ? { ...line, actual: value, actual_entered_by: samar, actual_entered_at: "2026-11-10T09:00:00Z" } : line;
          }),
        });
        setSaved("حُفظ المصروف.");
      }}
      errors={errors}
      saveError={saveError}
      savedMessage={saved}
    />
  );
}

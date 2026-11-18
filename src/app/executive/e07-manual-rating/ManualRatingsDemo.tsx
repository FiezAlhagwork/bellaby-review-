"use client";

import { useState } from "react";
import { ManualRatingsView } from "@/features/scoring/views/ManualRatingsView";
import type { MonthlyScore } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { scoresNovember, scoresNovemberRated, scoresOctober, scoringClosedMonths, scoringToday } from "@/mocks/scoring";

// غلاف تفاعلي لصفحة الرسم (E07): يملك الشهر والتقييمات. اختيار التقييم يحفظه محلياً كما يفعل PUT /manual-ratings. لا يُنقل للإنتاج.

type ManualRatingsDemoProps = { complete?: boolean; initialMonth?: string; mode?: "ready" | "loading" | "error" | "empty" };

export function ManualRatingsDemo({ complete = false, initialMonth = "2026-11", mode = "ready" }: ManualRatingsDemoProps) {
  const [month, setMonth] = useState(initialMonth);
  const [november, setNovember] = useState<readonly MonthlyScore[]>(complete ? scoresNovemberRated : scoresNovember);
  const locked = scoringClosedMonths.includes(month);
  const rows = month === "2026-11" ? november : scoresOctober.map((row) => ({ ...row, month }));
  const scores: Loadable<readonly MonthlyScore[]> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: mode === "empty" ? [] : rows };

  return (
    <ManualRatingsView
      month={month}
      onMonthChange={setMonth}
      closedMonths={scoringClosedMonths}
      scores={scores}
      canRate
      locked={locked}
      onRate={(userId, score) => setNovember(november.map((row) => (row.user?.id === userId ? { ...row, manual_rating: { score, rated_by: { id: 1, name: "زياد المصري" }, locked: false } } : row)))}
      today={scoringToday}
    />
  );
}

"use client";

import { useState } from "react";
import { ScoresView } from "@/features/scoring/views/ScoresView";
import type { MonthlyScore } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { scoresNovemberRated, scoresOctober, scoringClosedMonths, scoringToday } from "@/mocks/scoring";

// غلاف لصفحة الرسم (E08): يملك الشهر. في الإنتاج: GET /scores?month=. لا يُنقل للإنتاج.

type ScoresDemoProps = { initialMonth?: string; mode?: "ready" | "loading" | "error" | "empty" };

export function ScoresDemo({ initialMonth = "2026-11", mode = "ready" }: ScoresDemoProps) {
  const [month, setMonth] = useState(initialMonth);
  const rows = month === "2026-11" ? scoresNovemberRated : scoresOctober.map((row) => ({ ...row, month }));
  const scores: Loadable<readonly MonthlyScore[]> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: mode === "empty" ? [] : rows };
  return <ScoresView month={month} onMonthChange={setMonth} closedMonths={scoringClosedMonths} scores={scores} today={scoringToday} />;
}

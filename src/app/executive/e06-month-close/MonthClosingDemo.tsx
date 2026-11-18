"use client";

import { useState } from "react";
import { MonthClosingView } from "@/features/scoring/views/MonthClosingView";
import type { MonthClosing } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { closingClosed, closingOpen, closingWaiting, scoringClosedMonths, scoringToday } from "@/mocks/scoring";

// غلاف لصفحة الرسم (E06): يحوّل الحالة المطلوبة إلى Loadable، ويبدّل الشهر بين المفتوح وتشرين الأول. في الإنتاج: GET /month-closings/{month}. لا يُنقل للإنتاج.

type MonthClosingDemoProps = { october?: "waiting" | "closed"; initialMonth?: string; mode?: "ready" | "loading" | "error" };

export function MonthClosingDemo({ october = "closed", initialMonth = "2026-11", mode = "ready" }: MonthClosingDemoProps) {
  const [month, setMonth] = useState(initialMonth);
  const data = month === "2026-11" ? closingOpen : october === "waiting" ? closingWaiting : { ...closingClosed, month };
  const closing: Loadable<MonthClosing> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data };
  return <MonthClosingView month={month} onMonthChange={setMonth} closedMonths={october === "closed" ? scoringClosedMonths : scoringClosedMonths.slice(0, 2)} closing={closing} today={scoringToday} onOpenRatings={() => {}} onOpenBudget={() => {}} onOpenScores={() => {}} />;
}

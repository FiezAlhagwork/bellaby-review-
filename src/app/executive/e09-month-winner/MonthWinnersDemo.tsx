"use client";

import { useState } from "react";
import { MonthWinnersView, winnerKey, type ChooseOther } from "@/features/scoring/views/MonthWinnersView";
import type { MonthWinner } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { scoringClosedMonths, scoringToday, winnersApproved, winnersDefault, winnersTie } from "@/mocks/scoring";

// غلاف تفاعلي لصفحة الرسم (E09): يملك الترشيحات والنافذة. الاعتماد واختيار غيره محلياً كما يفعل POST /month-winners/{month}/approve.
// تشرين الثاني غير مغلق: 409 month_not_closed. لا يُنقل للإنتاج.

type MonthWinnersDemoProps = {
  dataset?: "default" | "tie" | "approved";
  initialChoosing?: ChooseOther | null;
  initialMonth?: string;
  mode?: "ready" | "loading" | "error";
};

const ziad = { id: 1, name: "زياد المصري" };
const at = `${scoringToday}T10:00:00Z`;

export function MonthWinnersDemo({ dataset = "default", initialChoosing = null, initialMonth = "2026-10", mode = "ready" }: MonthWinnersDemoProps) {
  const [month, setMonth] = useState(initialMonth);
  const [rows, setRows] = useState<readonly MonthWinner[]>(dataset === "tie" ? winnersTie : dataset === "approved" ? winnersApproved : winnersDefault);
  const [choosing, setChoosing] = useState<ChooseOther | null>(initialChoosing);

  const winners: Loadable<readonly MonthWinner[]> =
    mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : scoringClosedMonths.includes(month) ? { status: "ready", data: rows } : { status: "error", code: "month_not_closed" };

  const approve = (key: string, subjectId: number, reason: string | null) =>
    setRows(
      rows.map((winner) => {
        if (winnerKey(winner) !== key) return winner;
        const all = [...(winner.nominees ?? []), ...(winner.excluded_for_deduction ?? [])];
        const chosen = all.find((entry) => entry.subject_id === subjectId);
        return { ...winner, approved: { subject_id: subjectId, name: chosen?.name, reason, by: ziad, at } };
      }),
    );

  return (
    <MonthWinnersView
      month={month}
      onMonthChange={setMonth}
      closedMonths={scoringClosedMonths}
      winners={winners}
      canApprove
      onApprove={(winner, subjectId) => approve(winnerKey(winner), subjectId, null)}
      choosing={choosing}
      onChoosingChange={setChoosing}
      onChooseOther={() => {
        if (!choosing?.subjectId) return;
        approve(choosing.key, Number(choosing.subjectId), choosing.reason.trim());
        setChoosing(null);
      }}
      today={scoringToday}
    />
  );
}

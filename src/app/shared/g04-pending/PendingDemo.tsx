"use client";

import { useState } from "react";
import type { PendingKind } from "@/components/data/pending-kinds";
import { PendingDecisionsView } from "@/features/pending-decisions/views/PendingDecisionsView";
import type { PendingDecision } from "@/lib/api/types";
import { dayLabel } from "@/lib/calendar";
import { delegatePending, executivePending, meNow, salesManagerPending } from "@/mocks/me";

// غلاف تفاعلي لصفحة الرسم (G04): يملك فلتر النوع، ويصفّي كما يفعل GET /me/pending-decisions?kind. لا يُنقل للإنتاج.

type PendingDemoProps = { role?: "executive" | "sales-manager" | "delegate"; mode?: "ready" | "loading" | "error" | "empty" };

const sources: Record<NonNullable<PendingDemoProps["role"]>, readonly PendingDecision[]> = { executive: executivePending, "sales-manager": salesManagerPending, delegate: delegatePending };

export function PendingDemo({ role = "executive", mode = "ready" }: PendingDemoProps) {
  const [kind, setKind] = useState<PendingKind | null>(null);
  const all = mode === "empty" ? [] : sources[role];
  const rows = all.filter((item) => kind === null || item.kind === kind);
  const kinds = [...new Set(sources[role].map((item) => item.kind).filter((value): value is PendingKind => value !== undefined))];

  return (
    <PendingDecisionsView
      pending={mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: { data: rows, meta: { current_page: 1, last_page: 1, per_page: 20, total: rows.length } } }}
      kind={kind}
      onKindChange={setKind}
      kinds={kinds}
      delegation={role === "delegate" ? { from: dayLabel("2026-11-10"), to: dayLabel("2026-11-15") } : null}
      now={meNow}
      onOpen={() => {}}
      onPageChange={() => {}}
    />
  );
}

"use client";

import { useState } from "react";
import { VisitDetailsView, type VisitDecisionDialog } from "@/features/visits/views/VisitDetailsView";
import type { Visit } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { monitoringUser, supervisionNow } from "@/mocks/supervision";
import { findVisit } from "@/mocks/visits";

// غلاف تفاعلي لصفحة الرسم: يملك الزيارة ونافذة القرار. «تأكيد الزيارة» يغلق علاماتها «لا مشكلة» فتصير مؤكَّدة، و«رفض الزيارة» (بسبب إلزامي)
// يغلقها «مؤكَّدة» فتصير مرفوضة؛ وفي الحالتين يحل سجل القرار محل لوحة القرار. `initialDecisionError` يحاكي خطأ القرار (already_decided).
// في الإنتاج تحلّ محلّه حاوية تجلب GET /visits/{id} وترسل POST /visits/{id}/decision. لا يُنقل للإنتاج.

type VisitDetailsDemoProps = {
  visitId: number;
  /** المراقبة (true) أو القراءة فقط (false). */
  canDecide?: boolean;
  /** نافذة القرار المفتوحة عند العرض. */
  initialDecision?: VisitDecisionDialog | null;
  /** رمز خطأ القرار الظاهر عند العرض. */
  initialDecisionError?: string;
  /** يحاكي أن غير المراقب الحالي قرّر قبله (حالة already_decided): تُعرض الزيارة مقرَّراً عليها. */
  decidedByOther?: boolean;
  /** حالة البيانات: جاهزة، أو تحميل، أو خطأ، أو غير موجودة. */
  mode?: "ready" | "loading" | "error" | "not-found";
};

const otherQa = { id: 51, name: "ليلى درويش" };

function decide(visit: Visit, kind: "confirm" | "reject", reason: string): Visit {
  const status = kind === "confirm" ? "CLEARED" : "CONFIRMED";
  return {
    ...visit,
    verification_status: kind === "confirm" ? "CONFIRMED" : "REJECTED",
    flags: (visit.flags ?? []).map((flag) => (flag.status === "OPEN" ? { ...flag, status, closed_by: monitoringUser, closed_at: supervisionNow } : flag)),
    decided_by: monitoringUser,
    decision_reason: reason.trim() || null,
  };
}

export function VisitDetailsDemo({ visitId, canDecide = false, initialDecision = null, initialDecisionError, decidedByOther = false, mode = "ready" }: VisitDetailsDemoProps) {
  const [visit, setVisit] = useState<Visit>(() => {
    const base = findVisit(visitId);
    return decidedByOther ? { ...decide(base, "confirm", ""), decided_by: otherQa } : base;
  });
  const [decision, setDecision] = useState<VisitDecisionDialog | null>(initialDecision);
  const [decisionError, setDecisionError] = useState(initialDecisionError);

  const loadable: Loadable<Visit> =
    mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : mode === "not-found" ? { status: "error", code: "not_found" } : { status: "ready", data: visit };

  return (
    <VisitDetailsView
      visit={loadable}
      canDecide={canDecide}
      decision={decision}
      decisionError={decisionError}
      onStartDecision={(kind) => {
        setDecisionError(undefined);
        setDecision({ kind, reason: "" });
      }}
      onReasonChange={(reason) => setDecision((current) => (current ? { ...current, reason } : current))}
      onSubmitDecision={() => {
        if (!decision) return;
        setVisit(decide(visit, decision.kind, decision.reason));
        setDecision(null);
      }}
      onDismissDecision={() => setDecision(null)}
      onBack={() => {}}
    />
  );
}

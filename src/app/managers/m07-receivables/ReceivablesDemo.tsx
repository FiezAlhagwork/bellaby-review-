"use client";

import { useState } from "react";
import { noReceivableFilters, ReceivablesView, type ReceivableFilters, type UnpaidDeliveriesPage } from "@/features/receivables/views/ReceivablesView";
import type { Delivery, Receivable } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { agentFilterOptions, receivablesByAgent, referredDisputeId, salesToday, unpaidDeliveries } from "@/mocks/sales";

// غلاف تفاعلي لصفحة الرسم: يملك الفلاتر والصفحة ونافذة الإحالة، ويرشّح ويرقّم بيانات المعرض محلياً (ما يفعله الخادم بـ agent_id وpayment_overdue وpage).
// «إحالة للقانوني» تجعل التسليم محالاً (dispute_id) كما يفعل POST /deliveries/{id}/refer-dispute. في الإنتاج تحلّ محلّه حاوية. لا يُنقل للإنتاج.

type ReceivablesDemoProps = {
  /** حالة البيانات: جاهزة، أو تحميل، أو خطأ، أو لا مستحقات. */
  mode?: "ready" | "loading" | "error" | "empty";
  initialFilters?: ReceivableFilters;
  /** تسليم مفتوح في نافذة الإحالة عند العرض. */
  initialReferringId?: number;
  /** رمز خطأ يظهر في النافذة ويتكرر عند التأكيد (409 محال مسبقاً). */
  conflict?: string;
  /** تسليمات محالة عند العرض: معرّف التسليم ← رقم النزاع. */
  initialReferred?: Readonly<Record<number, number>>;
};

export function ReceivablesDemo({ mode = "ready", initialFilters = noReceivableFilters, initialReferringId, conflict, initialReferred = {} }: ReceivablesDemoProps) {
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [referringId, setReferringId] = useState<number | null>(initialReferringId ?? null);
  const [note, setNote] = useState("");
  const [referred, setReferred] = useState<Record<number, number>>({ ...initialReferred });
  const [error, setError] = useState<string | undefined>(conflict);

  const withReferral = (delivery: Delivery): Delivery => (delivery.id !== undefined && referred[delivery.id] !== undefined ? { ...delivery, dispute_id: referred[delivery.id] } : delivery);

  const matching =
    mode === "empty"
      ? []
      : unpaidDeliveries
          .filter((delivery) => (!filters.agentId || String(delivery.agent?.id) === filters.agentId) && (!filters.overdueOnly || delivery.is_payment_overdue))
          .map(withReferral);
  const lastPage = Math.max(1, Math.ceil(matching.length / perPage));
  const current = Math.min(page, lastPage);
  const result: UnpaidDeliveriesPage = {
    data: matching.slice((current - 1) * perPage, current * perPage),
    meta: { current_page: current, last_page: lastPage, per_page: perPage, total: matching.length },
  };

  const failure = mode === "error" ? ({ status: "error", code: "too_many_requests" } as const) : null;
  const deliveries: Loadable<UnpaidDeliveriesPage> = mode === "loading" ? { status: "loading" } : (failure ?? { status: "ready", data: result });
  const summary: Loadable<readonly Receivable[]> = mode === "loading" ? { status: "loading" } : (failure ?? { status: "ready", data: mode === "empty" ? [] : receivablesByAgent });

  const referring = referringId === null ? null : (unpaidDeliveries.find((delivery) => delivery.id === referringId) ?? null);

  return (
    <ReceivablesView
      summary={summary}
      deliveries={deliveries}
      agents={agentFilterOptions}
      filters={filters}
      onFiltersChange={(next) => {
        setFilters(next);
        setPage(1);
      }}
      onPageChange={setPage}
      onPerPageChange={(next) => {
        setPerPage(next);
        setPage(1);
      }}
      today={salesToday}
      canRefer
      referring={referring}
      referNote={note}
      onReferNoteChange={setNote}
      onRefer={(delivery) => {
        setReferringId(delivery.id ?? null);
        setNote("");
        setError(conflict && delivery.id === initialReferringId ? conflict : undefined);
      }}
      onReferClose={() => {
        setReferringId(null);
        setError(undefined);
      }}
      onReferConfirm={() => {
        if (conflict) {
          setError(conflict);
          return;
        }
        const id = referring?.id;
        if (id !== undefined) setReferred((previous) => ({ ...previous, [id]: referredDisputeId }));
        setReferringId(null);
      }}
      referError={error}
      onRetry={() => {}}
    />
  );
}

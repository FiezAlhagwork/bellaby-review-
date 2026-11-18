"use client";

import { useState } from "react";
import type { ReturnKind } from "@/components/data/return-kinds";
import { ReturnDecisionsView, type ReturnsPage } from "@/features/returns/views/ReturnDecisionsView";
import { emptyReturnDecisionForm, type ReturnDecisionForm, type ReturnSelection } from "@/features/returns/views/ReturnDecisionDrawer";
import type { ConflictDecided } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { conflictDecided, decide, decisionsToday, decisionsWarehouses, pageOf, pendingCountsOf, selectionOf, sourceOf } from "@/mocks/return-decisions";

// غلاف تفاعلي لصفحة الرسم: يملك النوع والفلتر والصفحة والطلب المفتوح ونموذج القرار ونافذة الرفض، ويطبّق القرار محلياً (ما يفعله الخادم بـ POST …/decision).
// «اعتماد القرار» أو «رفض بسبب» يحوّلان الطلب إلى مقرَّر ويحل سجل القرار محل اللوحة. `conflict` يجعل الاعتماد يرجع 409 already_decided. لا يُنقل للإنتاج.

type ReturnDecisionsDemoProps = {
  initialKind?: ReturnKind;
  /** طلب مفتوح في الدرج عند العرض. */
  initialOpen?: { kind: ReturnKind; id: number };
  initialForm?: ReturnDecisionForm;
  /** نافذة الرفض مفتوحة عند العرض. */
  initialRejecting?: boolean;
  /** يرجع الاعتماد 409 (قرّر غيرك قبلك). */
  conflict?: boolean;
  initialPendingOnly?: boolean;
  /** حالة البيانات: جاهزة، أو تحميل، أو خطأ، أو لا طلبات. */
  mode?: "ready" | "loading" | "error" | "empty";
  /** بلا `returns.decide`: يرى الطلب ولا يقرر. */
  canDecide?: boolean;
};

export function ReturnDecisionsDemo({ initialKind = "customer-return", initialOpen, initialForm = emptyReturnDecisionForm, initialRejecting = false, conflict = false, initialPendingOnly = true, mode = "ready", canDecide = true }: ReturnDecisionsDemoProps) {
  const [kind, setKind] = useState<ReturnKind>(initialKind);
  const [pendingOnly, setPendingOnly] = useState(initialPendingOnly);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [open, setOpen] = useState<{ kind: ReturnKind; id: number } | null>(initialOpen ?? null);
  const [decided, setDecided] = useState<Record<string, ReturnSelection>>({});
  const [form, setForm] = useState(initialForm);
  const [rejecting, setRejecting] = useState(initialRejecting);
  const [rejectReason, setRejectReason] = useState("");
  const [conflicted, setConflicted] = useState<ConflictDecided | null>(null);

  const keyOf = (target: ReturnKind, id: number | undefined) => `${target}-${id}`;
  const withDecisions = (target: ReturnKind) =>
    (sourceOf(target) as readonly { id?: number }[]).map((item) => decided[keyOf(target, item.id)]?.item ?? item) as ReturnsPage["data"];

  const counts = pendingCountsOf({
    "customer-return": withDecisions("customer-return"),
    "agent-damage": withDecisions("agent-damage"),
    "warehouse-damage": withDecisions("warehouse-damage"),
    "agent-return": withDecisions("agent-return"),
  });

  const result: ReturnsPage = pageOf(kind, mode === "empty" ? [] : withDecisions(kind), pendingOnly, page, perPage);
  const list: Loadable<ReturnsPage> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: result };

  const base = open ? selectionOf(open.kind, open.id) : null;
  const selection = base ? (decided[keyOf(base.kind, base.item.id)] ?? base) : null;

  const close = () => {
    setOpen(null);
    setForm(emptyReturnDecisionForm);
    setRejecting(false);
    setConflicted(null);
  };

  return (
    <ReturnDecisionsView
      kind={kind}
      onKindChange={(next) => {
        setKind(next);
        setPage(1);
        close();
      }}
      page={list}
      pendingCounts={counts}
      pendingOnly={pendingOnly}
      onPendingOnlyChange={(next) => {
        setPendingOnly(next);
        setPage(1);
      }}
      onPageChange={setPage}
      onPerPageChange={(next) => {
        setPerPage(next);
        setPage(1);
      }}
      selection={selection}
      onOpen={(next) => {
        setOpen({ kind: next.kind, id: next.item.id ?? 0 });
        setForm(emptyReturnDecisionForm);
        setConflicted(null);
      }}
      onClose={close}
      canDecide={canDecide}
      form={form}
      onFormChange={setForm}
      warehouses={decisionsWarehouses}
      rejecting={rejecting}
      rejectReason={rejectReason}
      onRejectReasonChange={setRejectReason}
      onStartReject={() => {
        setRejectReason("");
        setRejecting(true);
      }}
      onRejectClose={() => setRejecting(false)}
      onRejectConfirm={() => {
        if (selection) setDecided((previous) => ({ ...previous, [keyOf(selection.kind, selection.item.id)]: decide(selection, form, rejectReason) }));
        setRejecting(false);
      }}
      onApprove={() => {
        if (conflict) {
          setConflicted(conflictDecided);
          return;
        }
        if (selection) setDecided((previous) => ({ ...previous, [keyOf(selection.kind, selection.item.id)]: decide(selection, form, null) }));
      }}
      conflict={conflicted}
      today={decisionsToday}
      onRetry={() => {}}
    />
  );
}

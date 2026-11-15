"use client";

import { useState } from "react";
import { emptyCountEntry, StockCountDetailsView, type CountEntry, type CountReasonDialog } from "@/features/stock-counts/views/StockCountDetailsView";
import type { StockCount, StockCountLine, UserRef } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { balanceItems } from "@/mocks/stock-balances";
import { countBatches, countItems, savedLine } from "@/mocks/stock-counts";

// غلاف تفاعلي لصفحتَي W15 وW16: يملك الجرد وإدخال السطر والنوافذ، فيجرّب الزبون الرحلة كلها. حفظ السطر يضيفه بمتوقعه وفرقه (أو يستبدل السطر نفسه)،
// والإرسال يقفل الأسطر، والإلغاء يحوّل الجرد إلى «ملغى»، والاعتماد يعتمده، والإرجاع يعيده قيد العدّ بأسطر قديمة في السجل. في الإنتاج تحلّ محلّه
// حاوية تجلب GET /stock-counts/{id} وترسل POST /lines و/submit و/cancel و/approve و/return. لا يُنقل للإنتاج.

type Actor = { counter: UserRef; decider: { by: UserRef; onBehalfOf?: UserRef } };

type StockCountDetailsDemoProps = {
  initialCount: StockCount;
  /** من يعدّ ويقرّر: اللوجستي أو العامل أو المدير التنفيذي أو المفوَّض. */
  actor: Actor;
  canCount: boolean;
  canCancel: boolean;
  canDecide: boolean;
  decisionState?: "awaiting-me" | "self-decision-forbidden";
  /** سطر يُحفظ عند العرض (حالة line-saved). */
  initialSave?: CountEntry;
  initialSubmitOpen?: boolean;
  initialCancelOpen?: boolean;
  initialReturnOpen?: boolean;
  /** خطأ اعتماد ثابت للحالة المعروضة (invalid_status). */
  initialApproveError?: string;
  /** حالة البيانات: جاهزة، أو تحميل، أو خطأ، أو غير موجود. */
  mode?: "ready" | "loading" | "error" | "not-found";
};

/** يطبّق حفظ سطر على الجرد: السطر الحالي للصنف والدفعة نفسيهما يُستبدل (العقد). */
function withSavedLine(count: StockCount, entry: CountEntry, by: UserRef): { count: StockCount; line: StockCountLine } | null {
  const item = balanceItems.find((candidate) => candidate.id === entry.itemId);
  const batchList = entry.itemId === null ? undefined : countBatches[String(entry.itemId)];
  const batch = batchList?.status === "ready" ? batchList.data.find((candidate) => candidate.id === entry.batchId) : undefined;
  if (!item || !batch || entry.quantity === null) return null;
  const line = savedLine(item, { id: batch.id, batch_no: batch.batch_no, expiry_date: batch.expiry_date, status: batch.status }, entry.quantity, by);
  const others = (count.lines ?? []).filter((candidate) => candidate.superseded || !(candidate.item?.id === item.id && candidate.batch?.id === batch.id));
  return { count: { ...count, lines: [...others, line] }, line };
}

export function StockCountDetailsDemo({
  initialCount,
  actor,
  canCount,
  canCancel,
  canDecide,
  decisionState,
  initialSave,
  initialSubmitOpen = false,
  initialCancelOpen = false,
  initialReturnOpen = false,
  initialApproveError,
  mode = "ready",
}: StockCountDetailsDemoProps) {
  const [seed] = useState(() => (initialSave ? withSavedLine(initialCount, initialSave, actor.counter) : null));
  const [count, setCount] = useState<StockCount>(seed?.count ?? initialCount);
  const [savedLineId, setSavedLineId] = useState<number | null>(seed?.line.id ?? null);
  const [entry, setEntry] = useState<CountEntry>(emptyCountEntry);
  const [submit, setSubmit] = useState<{ loading?: boolean } | null>(initialSubmitOpen ? {} : null);
  const [cancellation, setCancellation] = useState<CountReasonDialog | null>(initialCancelOpen ? { reason: "" } : null);
  const [returning, setReturning] = useState<CountReasonDialog | null>(initialReturnOpen ? { reason: "" } : null);
  const [approveError, setApproveError] = useState(initialApproveError);

  const loadable: Loadable<StockCount> =
    mode === "loading"
      ? { status: "loading" }
      : mode === "error"
        ? { status: "error", code: "too_many_requests" }
        : mode === "not-found"
          ? { status: "error", code: "not_found" }
          : { status: "ready", data: count };

  return (
    <StockCountDetailsView
      count={loadable}
      canCount={canCount}
      canCancel={canCancel}
      canDecide={canDecide}
      decisionState={decisionState}
      items={countItems}
      batches={countBatches}
      entry={entry}
      onEntryChange={(next) => {
        setEntry(next);
        setSavedLineId(null);
      }}
      onSaveLine={() => {
        // في الإنتاج: POST /stock-counts/{id}/lines ثم يضيف الرد (بمتوقعه وفرقه) إلى الأسطر. هنا يُحسب محلياً من رصيد المعرض.
        const applied = withSavedLine(count, entry, actor.counter);
        if (!applied) return;
        setCount(applied.count);
        setSavedLineId(applied.line.id ?? null);
        setEntry(emptyCountEntry);
      }}
      savedLineId={savedLineId}
      submit={submit}
      onStartSubmit={() => setSubmit({})}
      onConfirmSubmit={() => {
        // في الإنتاج: POST /stock-counts/{id}/submit. الأسطر تُقفل (lines_locked بعدها).
        setCount({ ...count, status: "SUBMITTED", submitted_at: "2026-11-10T10:30:00Z" });
        setSubmit(null);
      }}
      onDismissSubmit={() => setSubmit(null)}
      cancellation={cancellation}
      onStartCancel={() => setCancellation({ reason: "" })}
      onCancelReasonChange={(reason) => setCancellation({ reason })}
      onConfirmCancel={() => {
        setCount({ ...count, status: "CANCELLED", cancel_reason: cancellation?.reason ?? null });
        setCancellation(null);
      }}
      onDismissCancel={() => setCancellation(null)}
      returning={returning}
      onStartReturn={() => setReturning({ reason: "" })}
      onReturnReasonChange={(reason) => setReturning({ reason })}
      onConfirmReturn={() => {
        // الجرد يعود قيد العدّ والأسطر الحالية تصير قديمة (superseded) وتبقى في السجل.
        setCount({
          ...count,
          status: "IN_PROGRESS",
          submitted_at: null,
          lines: (count.lines ?? []).map((line) => ({ ...line, superseded: true })),
          return_history: [...(count.return_history ?? []), { reason: returning?.reason ?? "", by: actor.decider.by, at: "2026-11-10T10:45:00Z" }],
        });
        setReturning(null);
      }}
      onDismissReturn={() => setReturning(null)}
      onApprove={() => {
        // في الإنتاج: POST /stock-counts/{id}/approve، وتتولّد التسويات وتُحال الفروق للمراقبة. المفوَّض يعتمد بالتفويض عن المدير التنفيذي.
        setCount({ ...count, status: "APPROVED", approved_by: actor.decider.by, approved_at: "2026-11-10T10:45:00Z", on_behalf_of: actor.decider.onBehalfOf ?? null });
        setApproveError(undefined);
      }}
      approveError={approveError}
      onBack={() => {}}
    />
  );
}


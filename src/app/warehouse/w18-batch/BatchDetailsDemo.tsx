"use client";

import { useState } from "react";
import { BatchDetailsView, type BatchReasonDialogState } from "@/features/batches/views/BatchDetailsView";
import type { Batch, RecallEvent, UserRef } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { batchBalances, batchRecalls, findBatch } from "@/mocks/batches";

// غلاف تفاعلي لصفحة الرسم: يملك الدفعة وسجلها ونافذة السبب. تأكيد الإيقاف يحوّل الدفعة إلى «موقوفة» بسببها ويضيف حدثها إلى السجل،
// وتأكيد الفك يعيدها «فعّالة». `failWith` يحاكي 409 (قرار سبقك: موقوفة مسبقاً أو غير موقوفة). في الإنتاج تحلّ محلّه حاوية
// تجلب GET /batches/{id} و/stock/balances و/recalls وترسل POST /batches/{id}/suspend و/unsuspend. لا يُنقل للإنتاج.

const actors = {
  logistics: { id: 3, name: "رامي السيد" },
  executive: { id: 1, name: "زياد المصري" },
} satisfies Record<string, UserRef>;

type BatchDetailsDemoProps = {
  batchId: number;
  /** من يشغّل الشاشة: اللوجستي يوقف ولا يفك، والمدير التنفيذي يفعل الاثنين. */
  actor: keyof typeof actors;
  initialDialog?: BatchReasonDialogState | null;
  /** رمز خطأ يرجع عند التأكيد (يحاكي 409). */
  failWith?: string;
  /** حالة البيانات: جاهزة، أو تحميل، أو خطأ، أو غير موجودة. */
  mode?: "ready" | "loading" | "error" | "not-found";
};

export function BatchDetailsDemo({ batchId, actor, initialDialog = null, failWith, mode = "ready" }: BatchDetailsDemoProps) {
  const [batch, setBatch] = useState<Batch>(findBatch(batchId));
  const [recalls, setRecalls] = useState<readonly RecallEvent[]>(batchRecalls[batchId] ?? []);
  const [dialog, setDialog] = useState<BatchReasonDialogState | null>(initialDialog);

  const loadable: Loadable<Batch> =
    mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : mode === "not-found" ? { status: "error", code: "not_found" } : { status: "ready", data: batch };

  const confirm = () => {
    if (!dialog) return;
    if (failWith) {
      setDialog({ ...dialog, errorCode: failWith });
      return;
    }
    const suspending = dialog.kind === "suspend";
    const next: Batch = { ...batch, status: suspending ? "SUSPENDED" : "ACTIVE", suspended_reason: suspending ? dialog.reason : null };
    const event: RecallEvent = {
      id: Math.max(0, ...recalls.map((entry) => entry.id ?? 0)) + 1,
      type: suspending ? "SUSPEND" : "UNSUSPEND",
      batch: { id: batch.id, batch_no: batch.batch_no, expiry_date: batch.expiry_date, status: next.status },
      reason: dialog.reason,
      by: actors[actor],
      on_behalf_of: null,
      at: "2026-11-10T11:40:00Z",
    };
    setBatch(next);
    setRecalls([event, ...recalls]);
    setDialog(null);
  };

  return (
    <BatchDetailsView
      batch={loadable}
      balances={{ status: "ready", data: batchBalances(batchId) }}
      recalls={{ status: "ready", data: recalls }}
      canSuspend
      canUnsuspend={actor === "executive"}
      dialog={dialog}
      onStartSuspend={() => setDialog({ kind: "suspend", reason: "" })}
      onStartUnsuspend={() => setDialog({ kind: "unsuspend", reason: "" })}
      onDialogReasonChange={(reason) => dialog && setDialog({ kind: dialog.kind, reason })}
      onConfirmDialog={confirm}
      onDismissDialog={() => setDialog(null)}
      onOpenTrace={() => {}}
      onBack={() => {}}
    />
  );
}

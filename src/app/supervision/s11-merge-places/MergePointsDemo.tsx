"use client";

import { useState } from "react";
import { MergePointsView, type MergeDialog, type PointCompare } from "@/features/visit-points/views/MergePointsView";
import type { Loadable } from "@/lib/loadable";
import { duplicatePair } from "@/mocks/visit-points";

// غلاف تفاعلي لصفحة الرسم: يملك الجهة الباقية ونافذة التأكيد والنتيجة. «دمج» يفتح التأكيد فيُظهر شريط «تم الدمج»، و«ليستا مكررتين» يغلق العلامة بلا مشكلة.
// في الإنتاج تحلّ محلّه حاوية تجلب الجهتين (GET /visit-points/{id}) وترسل POST /visit-points/merge أو POST /qa-flags/{id}/decision (CLEARED). لا يُنقل للإنتاج.

type MergePointsDemoProps = {
  /** الجهة الباقية المختارة عند العرض. */
  initialKeepId?: number | null;
  /** نافذة التأكيد المفتوحة عند العرض. */
  initialDialog?: MergeDialog | null;
  /** رمز خطأ الحفظ الظاهر عند العرض. */
  initialError?: string;
  /** حالة البيانات: جاهزة، أو تحميل، أو خطأ، أو غير موجودة. */
  mode?: "ready" | "loading" | "error" | "not-found";
};

export function MergePointsDemo({ initialKeepId = null, initialDialog = null, initialError, mode = "ready" }: MergePointsDemoProps) {
  const [keepId, setKeepId] = useState<number | null>(initialKeepId);
  const [dialog, setDialog] = useState<MergeDialog | null>(initialDialog);
  const [done, setDone] = useState<"merged" | "not-duplicate" | null>(null);
  const [error, setError] = useState(initialError);

  const pair: Loadable<{ first: PointCompare; second: PointCompare }> =
    mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : mode === "not-found" ? { status: "error", code: "not_found" } : { status: "ready", data: duplicatePair };

  return (
    <MergePointsView
      pair={pair}
      canMerge
      keepId={keepId}
      onKeepChange={(id) => {
        setKeepId(id);
        setError(undefined);
      }}
      dialog={dialog}
      onStartDialog={(kind) => setDialog({ kind })}
      onConfirm={() => {
        setDone(dialog?.kind === "merge" ? "merged" : "not-duplicate");
        setDialog(null);
        setError(undefined);
      }}
      onDismissDialog={() => setDialog(null)}
      error={error}
      done={done}
      onBack={() => {}}
    />
  );
}

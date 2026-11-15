"use client";

import { useState } from "react";
import { SampleRequestDetailsView, type SampleRequestRejection } from "@/features/transfers/views/SampleRequestDetailsView";
import type { SampleRequest } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";

// غلاف تفاعلي لصفحة الرسم: يملك الطلب ونافذة الرفض، والتأكيد يحوّل الطلب إلى «مرفوض» بسببه، فيرى الزبون النتيجة (الشريط والسجل).
// «صرف» ينقل في الإنتاج إلى W06 معبّأً من الطلب. في الإنتاج تحلّ محلّه حاوية تجلب GET /sample-requests/{id} وترسل POST /sample-requests/{id}/reject.
// لا يُنقل للإنتاج.

type SampleRequestDetailsDemoProps = {
  initialRequest: SampleRequest;
  /** نافذة الرفض مفتوحة عند العرض (حالة «reject»). */
  initialRejectOpen?: boolean;
  /** حالة البيانات: جاهزة، أو تحميل، أو خطأ، أو غير موجود. */
  mode?: "ready" | "loading" | "error" | "not-found";
};

export function SampleRequestDetailsDemo({ initialRequest, initialRejectOpen = false, mode = "ready" }: SampleRequestDetailsDemoProps) {
  const [request, setRequest] = useState<SampleRequest>(initialRequest);
  const [rejection, setRejection] = useState<SampleRequestRejection | null>(initialRejectOpen ? { reason: "" } : null);

  const loadable: Loadable<SampleRequest> =
    mode === "loading"
      ? { status: "loading" }
      : mode === "error"
        ? { status: "error", code: "too_many_requests" }
        : mode === "not-found"
          ? { status: "error", code: "not_found" }
          : { status: "ready", data: request };

  return (
    <SampleRequestDetailsView
      request={loadable}
      canDecide
      rejection={rejection}
      onStartReject={() => setRejection({ reason: "" })}
      onRejectReasonChange={(reason) => setRejection({ reason })}
      onConfirmReject={() => {
        // في الإنتاج: POST /sample-requests/{id}/reject بالسبب ثم إعادة جلب الطلب والقائمة. هنا تُطبَّق النتيجة محلياً.
        setRequest({ ...request, status: "REJECTED", reject_reason: rejection?.reason ?? null, decided_at: "2026-11-10T09:05:00Z" });
        setRejection(null);
      }}
      onDismissReject={() => setRejection(null)}
      onDispatch={() => {}}
      onOpenTransfer={() => {}}
      onBack={() => {}}
    />
  );
}

"use client";

import { useState } from "react";
import { WithdrawRequestDetailsView, withdrawLineKey, type WithdrawCancellation, type WithdrawOnBehalf } from "@/features/transfers/views/WithdrawRequestDetailsView";
import type { WithdrawRequest } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";

// غلاف تفاعلي لصفحة الرسم: يملك الطلب ونافذتَي الإلغاء والتأكيد عن المندوب. تأكيد الإلغاء يحوّل الطلب إلى «ملغى» بسببه، وتأكيد الاستلام عن المندوب
// يحوّله إلى «مسلَّم» بالكميات المُدخلة، فيرى الزبون النتيجة (الشريط والأسطر والسجل). في الإنتاج تحلّ محلّه حاوية تجلب GET /withdraw-requests/{id}
// وترسل POST /cancel أو /confirm-on-behalf. لا يُنقل للإنتاج.

type WithdrawRequestDetailsDemoProps = {
  initialRequest: WithdrawRequest;
  /** هل المندوب فعّال؟ العقد لا يعيد حالته (docs/backend-requests.md §15.1). */
  repActive: boolean;
  /** نافذة الإلغاء مفتوحة عند العرض. */
  initialCancelOpen?: boolean;
  /** نافذة التأكيد عن المندوب مفتوحة عند العرض. */
  initialOnBehalfOpen?: boolean;
  /** حالة البيانات: جاهزة، أو تحميل، أو خطأ، أو غير موجود. */
  mode?: "ready" | "loading" | "error" | "not-found";
};

export function WithdrawRequestDetailsDemo({ initialRequest, repActive, initialCancelOpen = false, initialOnBehalfOpen = false, mode = "ready" }: WithdrawRequestDetailsDemoProps) {
  const [request, setRequest] = useState<WithdrawRequest>(initialRequest);
  const [cancellation, setCancellation] = useState<WithdrawCancellation | null>(initialCancelOpen ? { reason: "" } : null);
  const [onBehalf, setOnBehalf] = useState<WithdrawOnBehalf | null>(initialOnBehalfOpen ? { quantities: {} } : null);

  const loadable: Loadable<WithdrawRequest> =
    mode === "loading"
      ? { status: "loading" }
      : mode === "error"
        ? { status: "error", code: "too_many_requests" }
        : mode === "not-found"
          ? { status: "error", code: "not_found" }
          : { status: "ready", data: request };

  return (
    <WithdrawRequestDetailsView
      request={loadable}
      repActive={repActive}
      canCancel
      canConfirmOnBehalf
      cancellation={cancellation}
      onStartCancel={() => setCancellation({ reason: "" })}
      onCancelReasonChange={(reason) => setCancellation({ reason })}
      onConfirmCancel={() => {
        // في الإنتاج: POST /withdraw-requests/{id}/cancel بالسبب ثم إعادة جلب الطلب والقائمة. هنا تُطبَّق النتيجة محلياً.
        setRequest({ ...request, status: "CANCELLED", cancelled_by: { id: 3, name: "رامي السيد" }, cancel_reason: cancellation?.reason ?? null });
        setCancellation(null);
      }}
      onDismissCancel={() => setCancellation(null)}
      onBehalf={onBehalf}
      onStartOnBehalf={() => setOnBehalf({ quantities: {} })}
      onOnBehalfQuantityChange={(key, quantity) => setOnBehalf({ quantities: { ...(onBehalf?.quantities ?? {}), [key]: quantity } })}
      onConfirmOnBehalf={() => {
        // في الإنتاج: POST /withdraw-requests/{id}/confirm-on-behalf بالكميات الفعلية ثم إعادة الجلب. هنا تُطبَّق النتيجة محلياً.
        setRequest({
          ...request,
          status: "HANDED_OVER",
          lines: (request.lines ?? []).map((line) => ({ ...line, actual_quantity: onBehalf?.quantities[withdrawLineKey(line)] ?? line.requested_quantity })),
          confirmed_by: { id: 3, name: "رامي السيد" },
          confirmed_at: "2026-11-10T09:40:00Z",
          confirmed_on_behalf: true,
        });
        setOnBehalf(null);
      }}
      onDismissOnBehalf={() => setOnBehalf(null)}
      onBack={() => {}}
    />
  );
}

"use client";

import { useState } from "react";
import { TransferDetailsView, type RejectedReceipt, type TransferCancellation } from "@/features/transfers/views/TransferDetailsView";
import type { Transfer } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { transferDetailsToday } from "@/mocks/transfer-details";

// غلاف تفاعلي لصفحة الرسم: يملك الصرف ونافذة الإلغاء، والتأكيد يحوّل الصرف إلى «ملغى» بسببه ومن ألغى، فيرى الزبون النتيجة (الشريط والسجل).
// في الإنتاج تحلّ محلّه حاوية تجلب GET /transfers/{id} وترسل POST /transfers/{id}/cancel. لا يُنقل للإنتاج.

type TransferDetailsDemoProps = {
  initialTransfer: Transfer;
  /** نافذة الإلغاء مفتوحة عند العرض (حالة «cancel»). */
  initialCancelOpen?: boolean;
  /** تأكيدات استلام رُفضت بعد الإلغاء (حالة «receipt-rejected»). */
  rejectedReceipts?: readonly RejectedReceipt[];
  /** حالة البيانات: جاهزة، أو تحميل، أو خطأ، أو غير موجود. */
  mode?: "ready" | "loading" | "error" | "not-found";
};

export function TransferDetailsDemo({ initialTransfer, initialCancelOpen = false, rejectedReceipts, mode = "ready" }: TransferDetailsDemoProps) {
  const [transfer, setTransfer] = useState<Transfer>(initialTransfer);
  const [cancellation, setCancellation] = useState<TransferCancellation | null>(initialCancelOpen ? { reason: "" } : null);

  const loadable: Loadable<Transfer> =
    mode === "loading"
      ? { status: "loading" }
      : mode === "error"
        ? { status: "error", code: "too_many_requests" }
        : mode === "not-found"
          ? { status: "error", code: "not_found" }
          : { status: "ready", data: transfer };

  return (
    <TransferDetailsView
      transfer={loadable}
      canCancel
      cancellation={cancellation}
      onStartCancel={() => setCancellation({ reason: "" })}
      onCancelReasonChange={(reason) => setCancellation({ reason })}
      onConfirmCancel={() => {
        // في الإنتاج: POST /transfers/{id}/cancel بالسبب ثم إعادة جلب الصرف (والقائمة). هنا تُطبَّق النتيجة محلياً.
        setTransfer({ ...transfer, status: "CANCELLED", hours_in_transit: null, cancelled_by: { id: 3, name: "رامي السيد" }, cancelled_at: "2026-11-10T09:05:00Z", cancel_reason: cancellation?.reason ?? null });
        setCancellation(null);
      }}
      onDismissCancel={() => setCancellation(null)}
      rejectedReceipts={rejectedReceipts}
      today={transferDetailsToday}
      onOpenSampleRequest={() => {}}
      onNewTransfer={() => {}}
      onBack={() => {}}
    />
  );
}

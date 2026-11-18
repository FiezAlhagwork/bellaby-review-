"use client";

import { DeliveryDetailsView } from "@/features/deliveries/views/DeliveryDetailsView";
import type { Delivery } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { salesDeliveries, salesToday } from "@/mocks/sales";

// غلاف لصفحة الرسم: يحوّل الحالة المطلوبة إلى Loadable. تفاصيل التسليم للقراءة فقط (لا قرار ولا فعل لمدير المبيعات). لا يُنقل للإنتاج.

type DeliveryDetailsDemoProps = {
  deliveryId: number;
  /** حالة البيانات: جاهزة، أو تحميل، أو خطأ، أو غير موجود. */
  mode?: "ready" | "loading" | "error" | "not-found";
};

export function DeliveryDetailsDemo({ deliveryId, mode = "ready" }: DeliveryDetailsDemoProps) {
  const found = salesDeliveries.find((delivery) => delivery.id === deliveryId) ?? salesDeliveries[0];
  const delivery: Loadable<Delivery> =
    mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : mode === "not-found" ? { status: "error", code: "not_found" } : { status: "ready", data: found };
  return <DeliveryDetailsView delivery={delivery} today={salesToday} onBack={() => {}} onRetry={() => {}} />;
}

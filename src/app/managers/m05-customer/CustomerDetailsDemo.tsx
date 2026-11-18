"use client";

import { useState } from "react";
import { CustomerDetailsView, type CustomerTab } from "@/features/customers/views/CustomerDetailsView";
import type { Customer } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { customerPoint, customerTabs, customerToday, findCustomer } from "@/mocks/customer-page";

// غلاف تفاعلي لصفحة الرسم: يملك القسم المختار ويحوّل الحالة المطلوبة إلى Loadable. في الإنتاج تحلّ محلّه حاوية تجلب كل قسم من نقطته عند فتحه (§45).
// لا يُنقل للإنتاج.

type CustomerDetailsDemoProps = {
  customerId: number;
  initialTab?: CustomerTab;
  /** حالة البيانات: جاهزة، أو تحميل، أو خطأ، أو غير موجود. */
  mode?: "ready" | "loading" | "error" | "not-found";
};

export function CustomerDetailsDemo({ customerId, initialTab = "deliveries", mode = "ready" }: CustomerDetailsDemoProps) {
  const [tab, setTab] = useState<CustomerTab>(initialTab);
  const info = findCustomer(customerId);

  const customer: Loadable<Customer> =
    mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : mode === "not-found" ? { status: "error", code: "not_found" } : { status: "ready", data: info };

  return <CustomerDetailsView customer={customer} point={customerPoint(info)} tabs={customerTabs(customerId)} tab={tab} onTabChange={setTab} showVisits today={customerToday} onOpenDelivery={() => {}} onBack={() => {}} onRetry={() => {}} />;
}

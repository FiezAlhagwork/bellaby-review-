"use client";

import { useState } from "react";
import { CustomerDetailsView, type CustomerTab } from "@/features/customers/views/CustomerDetailsView";
import type { Customer } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { customerPoint, customerTabs, customerToday, findCustomer } from "@/mocks/customer-page";

// غلاف تفاعلي لصفحة الرسم (A07): صفحة العميل نفسها (M05) للوكيل، بلا قسمَي الزيارات. لا يُنقل للإنتاج.

type AgentCustomerDemoProps = { customerId: number; initialTab?: CustomerTab; mode?: "ready" | "loading" | "error" | "not-found" };

export function AgentCustomerDemo({ customerId, initialTab = "deliveries", mode = "ready" }: AgentCustomerDemoProps) {
  const [tab, setTab] = useState<CustomerTab>(initialTab);
  const info = findCustomer(customerId);
  const customer: Loadable<Customer> =
    mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : mode === "not-found" ? { status: "error", code: "not_found" } : { status: "ready", data: info };

  return <CustomerDetailsView customer={customer} point={customerPoint(info)} tabs={customerTabs(customerId)} tab={tab} onTabChange={setTab} showVisits={false} today={customerToday} onOpenDelivery={() => {}} onBack={() => {}} onRetry={() => {}} />;
}

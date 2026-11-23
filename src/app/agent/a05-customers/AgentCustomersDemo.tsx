"use client";

import { useState } from "react";
import { AgentCustomersView, noAgentCustomerFilters } from "@/features/customers/views/AgentCustomersView";
import { agentCustomers, agentGovernorates } from "@/mocks/agent-customers";

// غلاف تفاعلي لصفحة الرسم (A05): يصفّي كما يفعل GET /customers?q&governorate_id. لا يُنقل للإنتاج.

export function AgentCustomersDemo({ initialQuery = "", mode = "ready" }: { initialQuery?: string; mode?: "ready" | "loading" | "error" | "empty" }) {
  const [filters, setFilters] = useState({ ...noAgentCustomerFilters, q: initialQuery });
  const q = filters.q.trim();
  const rows = (mode === "empty" ? [] : agentCustomers).filter((customer) => (!q || (customer.name ?? "").includes(q)) && (!filters.governorateId || String(customer.governorate?.id) === filters.governorateId));

  return (
    <AgentCustomersView
      customers={mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: { data: rows, meta: { current_page: 1, last_page: 1, per_page: 15, total: rows.length } } }}
      governorates={agentGovernorates}
      filters={filters}
      onFiltersChange={setFilters}
      onPageChange={() => {}}
      onPerPageChange={() => {}}
      canCreate
      onNewCustomer={() => {}}
      onOpen={() => {}}
    />
  );
}

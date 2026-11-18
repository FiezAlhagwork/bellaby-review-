"use client";

import { useState } from "react";
import { CustomersListView, noCustomerFilters, type CustomerFilters, type CustomersPage } from "@/features/customers/views/CustomersListView";
import type { Customer } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { agentFilterOptions, salesCustomers, salesGovernorates } from "@/mocks/sales";

// غلاف تفاعلي لصفحة الرسم: يملك الفلاتر والصفحة، ويرشّح ويرقّم بيانات المعرض محلياً (ما يفعله الخادم بـ q وagent_id وgovernorate_id وpage).
// في الإنتاج تحلّ محلّه حاوية تطلب GET /customers. لا يُنقل للإنتاج.

type CustomersDemoProps = {
  /** حالة البيانات: جاهزة، أو تحميل، أو خطأ، أو لا عملاء. */
  mode?: "ready" | "loading" | "error" | "empty";
  initialFilters?: CustomerFilters;
};

function applyFilters(rows: readonly Customer[], { q, agentId, governorateId }: CustomerFilters): Customer[] {
  const query = q.trim();
  return rows.filter(
    (row) => (!query || (row.name ?? "").includes(query)) && (!agentId || String(row.agent?.id) === agentId) && (!governorateId || String(row.governorate?.id) === governorateId),
  );
}

export function CustomersDemo({ mode = "ready", initialFilters = noCustomerFilters }: CustomersDemoProps) {
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const matching = mode === "empty" ? [] : applyFilters(salesCustomers, filters);
  const lastPage = Math.max(1, Math.ceil(matching.length / perPage));
  const current = Math.min(page, lastPage);
  const result: CustomersPage = {
    data: matching.slice((current - 1) * perPage, current * perPage),
    meta: { current_page: current, last_page: lastPage, per_page: perPage, total: matching.length },
  };
  const customers: Loadable<CustomersPage> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: result };

  return (
    <CustomersListView
      customers={customers}
      agents={agentFilterOptions}
      governorates={salesGovernorates}
      filters={filters}
      onFiltersChange={(next) => {
        setFilters(next);
        setPage(1);
      }}
      onPageChange={setPage}
      onPerPageChange={(next) => {
        setPerPage(next);
        setPage(1);
      }}
    />
  );
}

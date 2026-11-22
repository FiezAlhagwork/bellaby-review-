"use client";

import { useState } from "react";
import { DepartmentRequestsView, noRequestFilters, type RequestDirection } from "@/features/department-requests/views/DepartmentRequestsView";
import { incomingRequests, outgoingRequests } from "@/mocks/department-requests";

// غلاف تفاعلي لصفحة الرسم (G09): يملك الاتجاه والفلاتر، ويصفّي كما يفعل GET /department-requests?direction&status&overdue. لا يُنقل للإنتاج.

type DepartmentRequestsDemoProps = { initialDirection?: RequestDirection; mode?: "ready" | "loading" | "error" | "empty" };

export function DepartmentRequestsDemo({ initialDirection = "incoming", mode = "ready" }: DepartmentRequestsDemoProps) {
  const [direction, setDirection] = useState<RequestDirection>(initialDirection);
  const [filters, setFilters] = useState(noRequestFilters);
  const source = mode === "empty" ? [] : direction === "incoming" ? incomingRequests : outgoingRequests;
  const rows = source.filter((item) => (filters.status === null || item.status === filters.status) && (!filters.overdueOnly || item.is_overdue));

  return (
    <DepartmentRequestsView
      requests={mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: { data: rows, meta: { current_page: 1, last_page: 1, per_page: 15, total: rows.length } } }}
      direction={direction}
      onDirectionChange={(next) => {
        setDirection(next);
        setFilters(noRequestFilters);
      }}
      filters={filters}
      onFiltersChange={setFilters}
      onPageChange={() => {}}
      onPerPageChange={() => {}}
      onOpen={() => {}}
    />
  );
}

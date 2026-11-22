"use client";

import { useState } from "react";
import { UsersListView, noUserFilters, type UserFilters, type UsersPage } from "@/features/users/views/UsersListView";
import type { Loadable } from "@/lib/loadable";
import { rolesList, usersList } from "@/mocks/users";

// غلاف تفاعلي لصفحة الرسم (I01): يملك الفلاتر والصفحة ويرشّح بيانات المعرض محلياً. في الإنتاج: GET /users بـq وrole_id وdepartment وis_active. لا يُنقل للإنتاج.

type UsersDemoProps = { initialFilters?: UserFilters; mode?: "ready" | "loading" | "error" | "empty" };

export function UsersDemo({ initialFilters = noUserFilters, mode = "ready" }: UsersDemoProps) {
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  const q = filters.q.trim().toLowerCase();
  const matching =
    mode === "empty"
      ? []
      : usersList.filter(
          (row) =>
            (!q || (row.name ?? "").toLowerCase().includes(q) || (row.email ?? "").toLowerCase().includes(q) || (row.phone ?? "").includes(q)) &&
            (!filters.roleId || String(row.role?.id) === filters.roleId) &&
            (!filters.department || row.department === filters.department) &&
            (!filters.status || row.is_active === (filters.status === "active")),
        );
  const lastPage = Math.max(1, Math.ceil(matching.length / perPage));
  const current = Math.min(page, lastPage);
  const result: UsersPage = { data: matching.slice((current - 1) * perPage, current * perPage), meta: { current_page: current, last_page: lastPage, per_page: perPage, total: matching.length } };
  const users: Loadable<UsersPage> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: result };

  return (
    <UsersListView
      users={users}
      roles={rolesList}
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
      canCreate
      onNewUser={() => {}}
      onOpenUser={() => {}}
    />
  );
}

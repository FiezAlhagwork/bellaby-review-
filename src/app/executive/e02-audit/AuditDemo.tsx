"use client";

import { useState } from "react";
import { AuditLogView, noAuditFilters, type AccessFilters, type AccessPage, type AuditFilters, type AuditPage, type AuditTab } from "@/features/audit/views/AuditLogView";
import type { AuditLog } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { accessLogs, auditLogs, auditToday, auditUsers } from "@/mocks/audit-logs";

// غلاف تفاعلي لصفحة الرسم (E02): يملك التبويب والفلاتر والصفحة والسجل المفتوح، ويرشّح ويرقّم بيانات المعرض محلياً.
// في الإنتاج تحلّ محلّه حاوية تطلب GET /audit-logs وGET /access-logs. لا يُنقل للإنتاج.

type AuditDemoProps = {
  initialTab?: AuditTab;
  /** يفتح هذا السجل في الدرج عند العرض. */
  initialSelected?: AuditLog | null;
  /** من لا يملك access_logs.view لا يرى التبويب الثاني. */
  canViewAccess?: boolean;
  mode?: "ready" | "loading" | "error" | "empty";
};

function pageOf<T>(rows: readonly T[], page: number, perPage: number) {
  const lastPage = Math.max(1, Math.ceil(rows.length / perPage));
  const current = Math.min(page, lastPage);
  return { data: rows.slice((current - 1) * perPage, current * perPage), meta: { current_page: current, last_page: lastPage, per_page: perPage, total: rows.length } };
}

export function AuditDemo({ initialTab = "audit", initialSelected = null, canViewAccess = true, mode = "ready" }: AuditDemoProps) {
  const [tab, setTab] = useState<AuditTab>(initialTab);
  const [auditFilters, setAuditFilters] = useState<AuditFilters>(noAuditFilters);
  const [accessFilters, setAccessFilters] = useState<AccessFilters>({ entityType: null });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [selected, setSelected] = useState<AuditLog | null>(initialSelected);

  const { userId, entityType, action, range } = auditFilters;
  const auditRows =
    mode === "empty"
      ? []
      : auditLogs.filter((row) => {
          const day = (row.created_at ?? "").slice(0, 10);
          return (!userId || String(row.user?.id) === userId) && (!entityType || row.entity_type === entityType) && (!action || row.action === action) && (range.from === null || day >= range.from) && (range.to === null || day <= range.to);
        });
  const accessRows = mode === "empty" ? [] : accessLogs.filter((row) => !accessFilters.entityType || row.entity_type === accessFilters.entityType);

  const wrap = <T,>(data: T): Loadable<T> => (mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data });
  const audit: Loadable<AuditPage> = wrap(pageOf(auditRows, page, perPage));
  const access: Loadable<AccessPage> = wrap(pageOf(accessRows, page, perPage));

  return (
    <AuditLogView
      tab={tab}
      onTabChange={(next) => {
        setTab(next);
        setPage(1);
      }}
      canViewAccess={canViewAccess}
      audit={audit}
      access={access}
      users={auditUsers}
      auditFilters={auditFilters}
      onAuditFiltersChange={(next) => {
        setAuditFilters(next);
        setPage(1);
      }}
      accessFilters={accessFilters}
      onAccessFiltersChange={(next) => {
        setAccessFilters(next);
        setPage(1);
      }}
      onPageChange={setPage}
      onPerPageChange={(next) => {
        setPerPage(next);
        setPage(1);
      }}
      selected={selected}
      onSelect={setSelected}
      today={auditToday}
    />
  );
}

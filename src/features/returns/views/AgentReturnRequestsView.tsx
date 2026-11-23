"use client";

import { Truck } from "@phosphor-icons/react";
import { DateTimeStackCell, StatusCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { Pagination, type PaginationMeta } from "@/components/data/Pagination";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import type { AgentReturn } from "@/lib/api/types";
import { formatQuantity } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

export type AgentReturnRequestsPage = { data: readonly AgentReturn[]; meta: PaginationMeta };

type AgentReturnRequestsViewProps = {
  /** `GET /agent-returns` بنطاق الوكيل. */
  requests: Loadable<AgentReturnRequestsPage>;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  /** `agent_returns.create`: «طلب إرجاع» (A15). */
  canCreate: boolean;
  onCreate?: () => void;
  onRetry?: () => void;
};

/**
 * طلبات الإرجاع للمستودع (A16): التاريخ والأصناف والسبب والحالة. المعلّق ينتظر مدير المبيعات أو المدير التنفيذي،
 * والمعتمد «بالطريق» حتى يستلمه المستودع، والمرفوض بسببه.
 */
export function AgentReturnRequestsView({ requests, onPageChange, onPerPageChange, canCreate, onCreate, onRetry }: AgentReturnRequestsViewProps) {
  const columns: DataTableColumn<AgentReturn>[] = [
    { key: "date", header: "التاريخ", cell: (row) => <DateTimeStackCell value={row.created_at} />, width: "w-32", priority: "high" },
    {
      key: "items",
      header: "الأصناف",
      cell: (row) => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-body text-fg">{[...new Set((row.lines ?? []).map((line) => line.item?.name ?? ""))].join("، ")}</span>
          <span className="text-label text-fg-muted">{`${formatQuantity((row.lines ?? []).reduce((sum, line) => sum + (line.quantity ?? 0), 0))} علبة`}</span>
        </span>
      ),
      priority: "high",
      role: "primary",
    },
    { key: "reason", header: "السبب", cell: (row) => <TextCell value={row.reason?.name} />, width: "w-48" },
    {
      key: "status",
      header: "الحالة",
      cell: (row) => (
        <span className="flex min-w-0 flex-col gap-1">
          {row.status ? <StatusCell entity="agentReturn" status={row.status} /> : null}
          {row.status === "REJECTED" && row.decision_reason ? <span className="line-clamp-1 text-label text-fg-muted">{row.decision_reason}</span> : null}
        </span>
      ),
      width: "w-56",
      priority: "high",
      role: "status",
    },
  ];

  return (
    <>
      <PageHeader title="الإرجاع للمستودع" description="بضاعة من رصيدك تعيدها للمستودع بعد اعتماد الإدارة." actions={canCreate ? [{ id: "new", label: "طلب إرجاع", primary: true, onSelect: () => onCreate?.() }] : undefined} />
      <div className="flex flex-col gap-4">
        <DataTable
          label="طلبات الإرجاع"
          columns={columns}
          rows={requests.status === "ready" ? requests.data.data : []}
          getRowKey={(row) => row.id ?? ""}
          loading={requests.status === "loading"}
          error={requests.status === "error" ? { code: requests.code, onRetry } : undefined}
          empty={<EmptyState icon={Truck} title="لا طلبات إرجاع" description="أرجع بضاعة للمستودع من «طلب إرجاع»." />}
        />
        {requests.status === "ready" ? <Pagination meta={requests.data.meta} onPageChange={onPageChange} onPerPageChange={onPerPageChange} /> : null}
      </div>
    </>
  );
}

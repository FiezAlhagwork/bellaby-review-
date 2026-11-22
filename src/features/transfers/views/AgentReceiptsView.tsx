"use client";

import { Package } from "@phosphor-icons/react";
import { DateTimeStackCell, StatusCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { Pagination, type PaginationMeta } from "@/components/data/Pagination";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Transfer } from "@/lib/api/types";
import { formatQuantity } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

export type AgentReceiptsPage = { data: readonly Transfer[]; meta: PaginationMeta };

type AgentReceiptsViewProps = {
  /** `GET /transfers` بنطاق الوكيل (الصرف إليه). */
  transfers: Loadable<AgentReceiptsPage>;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  /** يفتح تفاصيل الصرف (A03). */
  onOpen?: (transfer: Transfer) => void;
  onRetry?: () => void;
};

/** أسماء أصناف الصرف بلا تكرار: «المرحلة الأولى 400غ، المرحلة الثانية 800غ». */
const itemsSummary = (transfer: Transfer) => [...new Set((transfer.lines ?? []).map((line) => line.item?.name ?? ""))].filter(Boolean).join("، ");

/**
 * الاستلامات (A02): الصرف من المستودع إليّ بالرقم والتاريخ والأصناف والحالة. «بالطريق» ينتظر تأكيدي، ولا يدخل رصيدي قبله.
 */
export function AgentReceiptsView({ transfers, onPageChange, onPerPageChange, onOpen, onRetry }: AgentReceiptsViewProps) {
  const columns: DataTableColumn<Transfer>[] = [
    { key: "reference", header: "الرقم", cell: (row) => <span className="text-body text-fg">{row.reference}</span>, width: "w-36", priority: "high", role: "primary" },
    { key: "date", header: "التاريخ", cell: (row) => <DateTimeStackCell value={row.created_at} />, width: "w-40", priority: "high" },
    {
      key: "items",
      header: "الأصناف",
      cell: (row) => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-body text-fg">{itemsSummary(row)}</span>
          <span className="text-label text-fg-muted">{`${formatQuantity(row.total_quantity ?? 0)} علبة`}</span>
        </span>
      ),
      priority: "high",
    },
    { key: "status", header: "الحالة", cell: (row) => (row.status ? <StatusCell entity="transfer" status={row.status} /> : null), width: "w-28", priority: "high", role: "status" },
  ];

  return (
    <>
      <PageHeader title="الاستلامات" description="الصرف من المستودع إليك. أكّد استلام ما وصلك ليدخل رصيدك." />
      <div className="flex flex-col gap-4">
        <DataTable
          label="الاستلامات"
          columns={columns}
          rows={transfers.status === "ready" ? transfers.data.data : []}
          getRowKey={(row) => row.id ?? ""}
          loading={transfers.status === "loading"}
          error={transfers.status === "error" ? { code: transfers.code, onRetry } : undefined}
          empty={<EmptyState icon={Package} title="لا صرف إليك بعد" description="يظهر هنا كل صرف من المستودع إليك." />}
          onRowOpen={onOpen}
        />
        {transfers.status === "ready" ? <Pagination meta={transfers.data.meta} onPageChange={onPageChange} onPerPageChange={onPerPageChange} /> : null}
      </div>
    </>
  );
}

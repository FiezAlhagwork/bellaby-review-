"use client";

import { ArrowUUpLeft } from "@phosphor-icons/react";
import { DateTimeStackCell, StatusCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { Pagination, type PaginationMeta } from "@/components/data/Pagination";
import { responsibilityLabels } from "@/components/data/responsibility";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tabs } from "@/components/ui/Tabs";
import type { CustomerReturn, DamageReport } from "@/lib/api/types";
import { formatQuantity } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

export type ReturnsTab = "returns" | "damage";
type Page<T> = { data: readonly T[]; meta: PaginationMeta };

type AgentReturnsDamageViewProps = {
  tab: ReturnsTab;
  onTabChange: (tab: ReturnsTab) => void;
  /** `GET /customer-returns`. */
  returns: Loadable<Page<CustomerReturn>>;
  /** `GET /damage-reports`. */
  reports: Loadable<Page<DamageReport>>;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  /** `returns.create`: «مرتجع جديد» (A12) و«تقرير تالف» (A14). */
  canCreate: boolean;
  onNewReturn?: () => void;
  onNewDamage?: () => void;
  onRetry?: () => void;
};

/** القرار: المسؤولية للمقبول تالفاً، وسبب الرفض للمرفوض. */
function decisionText(row: { status?: string; responsibility?: keyof typeof responsibilityLabels | null; decision_reason?: string | null }) {
  if (row.status === "REJECTED") return row.decision_reason ?? "—";
  if (row.responsibility) return `المسؤولية: ${responsibilityLabels[row.responsibility]}`;
  return null;
}

/**
 * المرتجعات والتالف (A13): «مرتجعات الصيدليات» (معلّق، أعيد للمخزون، تالف مقبول، مرفوض) و«تقارير التالف» بالتاريخ والصنف والكمية والسبب والحالة والقرار.
 */
export function AgentReturnsDamageView({ tab, onTabChange, returns, reports, onPageChange, onPerPageChange, canCreate, onNewReturn, onNewDamage, onRetry }: AgentReturnsDamageViewProps) {
  const returnColumns: DataTableColumn<CustomerReturn>[] = [
    { key: "date", header: "التاريخ", cell: (row) => <DateTimeStackCell value={row.created_at} />, width: "w-32", priority: "high" },
    {
      key: "item",
      header: "الصنف",
      cell: (row) => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-body text-fg">{row.delivery_line?.item?.name ?? "—"}</span>
          <span className="truncate text-label text-fg-muted">{row.customer?.name ?? ""}</span>
        </span>
      ),
      priority: "high",
      role: "primary",
    },
    { key: "quantity", header: "الكمية", cell: (row) => `${formatQuantity(row.quantity ?? 0)} علبة`, align: "end", width: "w-24", priority: "high" },
    { key: "reason", header: "السبب", cell: (row) => <TextCell value={row.reason?.name} />, width: "w-44" },
    { key: "status", header: "الحالة", cell: (row) => (row.status ? <StatusCell entity="customerReturn" status={row.status} /> : null), width: "w-32", priority: "high", role: "status" },
    { key: "decision", header: "القرار", cell: (row) => <span className="line-clamp-2 text-body text-fg">{decisionText(row) ?? "—"}</span>, width: "w-56" },
  ];

  const damageColumns: DataTableColumn<DamageReport>[] = [
    { key: "date", header: "التاريخ", cell: (row) => <DateTimeStackCell value={row.created_at} />, width: "w-32", priority: "high" },
    {
      key: "item",
      header: "الصنف",
      cell: (row) => <span className="line-clamp-2 text-body text-fg">{[...new Set((row.lines ?? []).map((line) => line.item?.name ?? ""))].join("، ")}</span>,
      priority: "high",
      role: "primary",
    },
    { key: "quantity", header: "الكمية", cell: (row) => `${formatQuantity((row.lines ?? []).reduce((sum, line) => sum + (line.quantity ?? 0), 0))} علبة`, align: "end", width: "w-24", priority: "high" },
    { key: "reason", header: "السبب", cell: (row) => <TextCell value={row.reason?.name} />, width: "w-44" },
    { key: "status", header: "الحالة", cell: (row) => (row.status ? <StatusCell entity="damageReport" status={row.status} /> : null), width: "w-32", priority: "high", role: "status" },
    { key: "decision", header: "القرار", cell: (row) => <span className="line-clamp-2 text-body text-fg">{decisionText(row) ?? "—"}</span>, width: "w-56" },
  ];

  const active = tab === "returns" ? returns : reports;

  return (
    <>
      <PageHeader
        title="المرتجعات والتالف"
        description="مرتجعات الصيدليات وتقارير التالف، وقرار الإدارة في كل منها."
        actions={
          canCreate
            ? [
                { id: "damage", label: "تقرير تالف", onSelect: () => onNewDamage?.() },
                { id: "return", label: "مرتجع جديد", primary: true, onSelect: () => onNewReturn?.() },
              ]
            : undefined
        }
      />

      <div className="flex flex-col gap-4">
        <Tabs
          aria-label="المرتجعات والتالف"
          tabs={[
            { value: "returns", label: "مرتجعات الصيدليات" },
            { value: "damage", label: "تقارير التالف" },
          ]}
          value={tab}
          onValueChange={onTabChange}
        />

        {tab === "returns" ? (
          <DataTable
            label="مرتجعات الصيدليات"
            columns={returnColumns}
            rows={returns.status === "ready" ? returns.data.data : []}
            getRowKey={(row) => row.id ?? ""}
            loading={returns.status === "loading"}
            error={returns.status === "error" ? { code: returns.code, onRetry } : undefined}
            empty={<EmptyState icon={ArrowUUpLeft} title="لا مرتجعات" description="سجّل مرتجع صيدلية من «مرتجع جديد»." />}
          />
        ) : (
          <DataTable
            label="تقارير التالف"
            columns={damageColumns}
            rows={reports.status === "ready" ? reports.data.data : []}
            getRowKey={(row) => row.id ?? ""}
            loading={reports.status === "loading"}
            error={reports.status === "error" ? { code: reports.code, onRetry } : undefined}
            empty={<EmptyState icon={ArrowUUpLeft} title="لا تقارير تالف" description="بلّغ عن بضاعة تالفة في رصيدك من «تقرير تالف»." />}
          />
        )}

        {active.status === "ready" ? <Pagination meta={active.data.meta} onPageChange={onPageChange} onPerPageChange={onPerPageChange} /> : null}
      </div>
    </>
  );
}

"use client";

import { Handshake } from "@phosphor-icons/react";
import { DateCell, DateTimeStackCell, MoneyCell, StatusCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { DescriptionList } from "@/components/data/DescriptionList";
import { Pagination, type PaginationMeta } from "@/components/data/Pagination";
import { StatusBadge } from "@/components/data/StatusBadge";
import { PageHeader } from "@/components/layout/PageHeader";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Combobox } from "@/components/ui/Combobox";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import type { Option } from "@/components/ui/OptionList";
import { Skeleton } from "@/components/ui/Skeleton";
import type { AgentRef, Delivery, MonthClosing } from "@/lib/api/types";
import { dayLabel, monthLabel } from "@/lib/calendar";
import { formatDateShort, formatDateTime } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

/** صفحة من `GET /deliveries` (`Paginated`). */
export type AccountingDeliveriesPage = { data: readonly Delivery[]; meta: PaginationMeta };

type AccountingHomeViewProps = {
  /** `GET /month-closings/{month}` للشهر الجاري. */
  closing: Loadable<MonthClosing>;
  /** `GET /deliveries` لكل الوكلاء، للاطلاع. */
  deliveries: Loadable<AccountingDeliveriesPage>;
  agents: readonly AgentRef[];
  agentId: string | null;
  onAgentChange: (agentId: string | null) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  /** إلى المصروف الفعلي (I12). */
  onOpenExpenses: () => void;
  onRetryClosing?: () => void;
  onRetryDeliveries?: () => void;
};

/**
 * لوحة المحاسبة (I11): حالة إغلاق الشهر الجاري، وتذكير المصروف الفعلي حين ينقص بند، والتسليمات والتحصيل لكل الوكلاء للاطلاع بلا إجراءات.
 * `DashboardSummary` بلا حقول في العقد، فاللوحة مركّبة من الإغلاق والتسليمات (§83).
 */
export function AccountingHomeView({ closing, deliveries, agents, agentId, onAgentChange, onPageChange, onPerPageChange, onOpenExpenses, onRetryClosing, onRetryDeliveries }: AccountingHomeViewProps) {
  const close = closing.status === "ready" ? closing.data : null;
  const missing = close && close.status !== "CLOSED" ? (close.missing_expenses ?? []) : [];
  const page = deliveries.status === "ready" ? deliveries.data : null;
  const agentOptions: Option[] = agents.flatMap((agent) => (agent.id !== undefined && agent.name ? [{ value: String(agent.id), label: agent.name }] : []));

  const columns: DataTableColumn<Delivery>[] = [
    {
      key: "reference",
      header: "الرقم",
      cell: (row) => (
        <span dir="ltr" className="block truncate text-end tabular-nums">
          {row.reference}
        </span>
      ),
      width: "w-32",
    },
    { key: "delivered", header: "التاريخ", cell: (row) => <DateTimeStackCell value={row.delivered_at} />, width: "w-28" },
    { key: "customer", header: "العميل", cell: (row) => <TextCell value={row.customer?.name} />, priority: "high", role: "primary" },
    { key: "agent", header: "الوكيل", cell: (row) => <TextCell value={row.agent?.name} />, width: "w-48", priority: "high" },
    { key: "value", header: "القيمة التقديرية", cell: (row) => <MoneyCell value={row.estimated_value} />, align: "end", width: "w-36", priority: "high" },
    {
      key: "collection",
      header: "التحصيل",
      cell: (row) =>
        row.collected_at ? (
          <DateCell value={row.collected_at} />
        ) : (
          <span className="flex min-w-0 flex-col">
            <span className="text-caption text-fg-muted">{row.expected_payment_date ? `السداد ${formatDateShort(row.expected_payment_date)}` : "—"}</span>
            {row.is_payment_overdue ? <span className="text-caption text-danger">متأخر</span> : null}
          </span>
        ),
      width: "w-36",
    },
    { key: "status", header: "الحالة", cell: (row) => (row.status ? <StatusCell entity="delivery" status={row.status} /> : <TextCell value={null} />), width: "w-36", priority: "high", role: "status" },
  ];

  return (
    <>
      <PageHeader title="الرئيسية" description="إغلاق الشهر والمصروف الفعلي، والتسليمات والتحصيل لكل الوكلاء." />

      <div className="flex flex-col gap-4">
        {missing.length > 0 ? (
          <Banner
            kind="warning"
            title="أدخل المصروف الفعلي"
            action={
              <Button variant="secondary" size="sm" onClick={onOpenExpenses}>
                إدخال المصروف
              </Button>
            }
          >
            {`لم يُدخل فعلي ${missing.map((line) => `«${line.name ?? ""}»`).join(" و")} لـ${monthLabel(close?.month ?? "")} بعد. لا يُغلق الشهر حتى يكتمل.`}
          </Banner>
        ) : null}

        <Card title="إغلاق الشهر" action={close?.status ? <StatusBadge entity="monthClosing" status={close.status} /> : undefined}>
          {closing.status === "error" ? <ErrorState code={closing.code} onRetry={onRetryClosing} /> : null}
          {closing.status === "loading" ? <Skeleton className="h-16 w-full" /> : null}
          {close ? (
            <DescriptionList
              items={[
                { label: "الشهر", value: close.month ? monthLabel(close.month) : null },
                { label: "يوم العمل الخامس", value: close.fifth_work_day ? dayLabel(close.fifth_work_day) : null },
                { label: "المصروف الناقص", value: (close.missing_expenses ?? []).length === 0 ? "اكتمل" : (close.missing_expenses ?? []).map((line) => line.name).join("، ") },
                { label: "أُغلق في", value: close.closed_at ? formatDateTime(close.closed_at) : null },
              ]}
            />
          ) : null}
        </Card>

        <Card title="التسليمات والتحصيل">
          <div className="flex flex-col gap-4">
            <div className="w-full max-w-72">
              <Combobox aria-label="الوكيل" placeholder="كل الوكلاء" options={agentOptions} value={agentId} onValueChange={onAgentChange} clearable />
            </div>
            <DataTable
              label="التسليمات"
              columns={columns}
              rows={page?.data ?? []}
              getRowKey={(row) => row.id ?? ""}
              loading={deliveries.status === "loading"}
              error={deliveries.status === "error" ? { code: deliveries.code, onRetry: onRetryDeliveries } : undefined}
              empty={<EmptyState icon={Handshake} title="لا تسليمات" description="لا تسليمات لهذا الوكيل." />}
            />
            {page ? <Pagination meta={page.meta} onPageChange={onPageChange} onPerPageChange={onPerPageChange} /> : null}
          </div>
        </Card>
      </div>
    </>
  );
}

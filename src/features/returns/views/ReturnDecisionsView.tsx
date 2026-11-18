"use client";

import { ArrowUUpLeft, Gavel } from "@phosphor-icons/react";
import { DateTimeStackCell, QuantityCell, StatusCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { Pagination, type PaginationMeta } from "@/components/data/Pagination";
import { returnKindLabels, returnKindOrder, type ReturnKind } from "@/components/data/return-kinds";
import { PageHeader } from "@/components/layout/PageHeader";
import { Checkbox } from "@/components/ui/Checkbox";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import type { AgentReturn, ConflictDecided, CustomerReturn, DamageReport, Location } from "@/lib/api/types";
import type { IsoDate } from "@/lib/calendar";
import { isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";
import { ReturnDecisionDrawer, type ReturnDecisionForm, type ReturnSelection } from "./ReturnDecisionDrawer";

/** صفحة من نقطة النوع المختار (`Paginated`): المرتجعات أو تقارير التالف (مقسومة بنوع الموقع: §47.1) أو الإرجاعات. المعلّق أولاً (ترتيب الحاوية: §47.2). */
export type ReturnsPage =
  | { kind: "customer-return"; data: readonly CustomerReturn[]; meta: PaginationMeta }
  | { kind: "agent-damage" | "warehouse-damage"; data: readonly DamageReport[]; meta: PaginationMeta }
  | { kind: "agent-return"; data: readonly AgentReturn[]; meta: PaginationMeta };

/** عدد المعلّق لكل نوع: `meta.total` من طلب `status=PENDING&per_page=1` لكل نقطة. */
export type PendingCounts = Readonly<Record<ReturnKind, number>>;

type ReturnDecisionsViewProps = {
  kind: ReturnKind;
  onKindChange: (kind: ReturnKind) => void;
  /** صفحة النوع المختار. تفترض الحاوية أن `kind` فيها هو المختار. */
  page: Loadable<ReturnsPage>;
  pendingCounts: PendingCounts;
  /** «المعلّق فقط»: يرسل `status=PENDING`. تغييره يعيد الأب إلى الصفحة الأولى. */
  pendingOnly: boolean;
  onPendingOnlyChange: (pendingOnly: boolean) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  /** الطلب المفتوح في الدرج. */
  selection: ReturnSelection | null;
  onOpen?: (selection: ReturnSelection) => void;
  onClose: () => void;
  /** علم `returns.decide`. */
  canDecide: boolean;
  form: ReturnDecisionForm;
  onFormChange: (form: ReturnDecisionForm) => void;
  warehouses: readonly Location[];
  rejecting: boolean;
  rejectReason: string;
  onRejectReasonChange: (reason: string) => void;
  onStartReject: () => void;
  onRejectClose: () => void;
  onRejectConfirm: () => void;
  onApprove: () => void;
  submitting?: boolean;
  decisionError?: string;
  conflict?: ConflictDecided | null;
  today: IsoDate;
  onRetry?: () => void;
};

const totalOf = (lines: AgentReturn["lines"] | DamageReport["lines"]) => (lines ?? []).reduce((sum, line) => sum + (line.quantity ?? 0), 0);

/** «سطر واحد» · «سطران» · «3 أسطر». */
function linesPhrase(count: number): string {
  if (count === 1) return "سطر واحد";
  if (count === 2) return "سطران";
  return `${isolate(count)} أسطر`;
}

const idCell = (id: number | undefined) => (
  <span dir="ltr" className="block truncate text-end tabular-nums">
    {`#${id}`}
  </span>
);

/** أعمدة كل نوع: مُصدَّرة لتعيد A13 وA16 استعمالها بأعمدتها. */
export const customerReturnColumns: DataTableColumn<CustomerReturn>[] = [
  { key: "id", header: "الطلب", cell: (row) => idCell(row.id), width: "w-24" },
  { key: "customer", header: "الصيدلية", cell: (row) => <TextCell value={row.customer?.name} />, priority: "high", role: "primary" },
  { key: "agent", header: "الوكيل", cell: (row) => <TextCell value={row.agent?.name} />, width: "w-48" },
  { key: "reason", header: "السبب", cell: (row) => <TextCell value={row.reason?.name} />, width: "w-44", priority: "high" },
  { key: "quantity", header: "الكمية", cell: (row) => <QuantityCell value={row.quantity} unit="علبة" />, align: "end", width: "w-28" },
  { key: "created", header: "التاريخ", cell: (row) => <DateTimeStackCell value={row.created_at} />, width: "w-28", priority: "high" },
  { key: "status", header: "الحالة", cell: (row) => (row.status ? <StatusCell entity="customerReturn" status={row.status} /> : <TextCell value={null} />), width: "w-36", priority: "high", role: "status" },
];

export const damageReportColumns: DataTableColumn<DamageReport>[] = [
  { key: "id", header: "الطلب", cell: (row) => idCell(row.id), width: "w-24" },
  {
    key: "items",
    header: "الأصناف",
    cell: (row) => {
      const lines = row.lines ?? [];
      return (
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-body text-fg">{lines[0]?.item?.name ?? "—"}</span>
          <span className="truncate text-caption text-fg-muted">{linesPhrase(lines.length)}</span>
        </span>
      );
    },
    priority: "high",
    role: "primary",
  },
  { key: "location", header: "الموقع", cell: (row) => <TextCell value={row.location?.name} />, width: "w-48" },
  { key: "reason", header: "السبب", cell: (row) => <TextCell value={row.reason?.name} />, width: "w-44", priority: "high" },
  { key: "quantity", header: "الكمية", cell: (row) => <QuantityCell value={totalOf(row.lines)} unit="علبة" />, align: "end", width: "w-28" },
  { key: "created", header: "التاريخ", cell: (row) => <DateTimeStackCell value={row.created_at} />, width: "w-28", priority: "high" },
  { key: "status", header: "الحالة", cell: (row) => (row.status ? <StatusCell entity="damageReport" status={row.status} /> : <TextCell value={null} />), width: "w-36", priority: "high", role: "status" },
];

export const agentReturnColumns: DataTableColumn<AgentReturn>[] = [
  { key: "id", header: "الطلب", cell: (row) => idCell(row.id), width: "w-24" },
  { key: "agent", header: "الوكيل", cell: (row) => <TextCell value={row.agent?.name} />, priority: "high", role: "primary" },
  { key: "reason", header: "السبب", cell: (row) => <TextCell value={row.reason?.name} />, width: "w-48", priority: "high" },
  { key: "quantity", header: "الكمية", cell: (row) => <QuantityCell value={totalOf(row.lines)} unit="علبة" />, align: "end", width: "w-28" },
  { key: "created", header: "التاريخ", cell: (row) => <DateTimeStackCell value={row.created_at} />, width: "w-28", priority: "high" },
  { key: "status", header: "الحالة", cell: (row) => (row.status ? <StatusCell entity="agentReturn" status={row.status} /> : <TextCell value={null} />), width: "w-32", priority: "high", role: "status" },
];

/**
 * قرارات المرتجع والتالف (M08): أربعة تبويبات (مرتجع صيدلية · تالف وكيل · تالف مستودع · إرجاع وكيل) بعدّاد المعلّق في كل منها، وجدول المعلّق أولاً.
 * الصف يفتح درج الطلب وفيه القرار بحسب نوعه. يقرر مدير المبيعات أو المدير التنفيذي والأسبق يسري (القرار 12)، ويشمل التفويضُ القرار.
 */
export function ReturnDecisionsView({
  kind,
  onKindChange,
  page,
  pendingCounts,
  pendingOnly,
  onPendingOnlyChange,
  onPageChange,
  onPerPageChange,
  selection,
  onOpen,
  onClose,
  canDecide,
  form,
  onFormChange,
  warehouses,
  rejecting,
  rejectReason,
  onRejectReasonChange,
  onStartReject,
  onRejectClose,
  onRejectConfirm,
  onApprove,
  submitting,
  decisionError,
  conflict,
  today,
  onRetry,
}: ReturnDecisionsViewProps) {
  const tabs: TabItem<ReturnKind>[] = returnKindOrder.map((value) => ({ value, label: returnKindLabels[value], count: pendingCounts[value] }));

  const loading = page.status === "loading";
  const error = page.status === "error" ? { code: page.code, onRetry } : undefined;
  const ready = page.status === "ready" ? page.data : null;

  const empty = pendingOnly ? (
    <EmptyState icon={Gavel} title="لا طلبات معلّقة" description={`لا يوجد ${returnKindLabels[kind]} بانتظار قرارك الآن.`} />
  ) : (
    <EmptyState icon={ArrowUUpLeft} title="لا طلبات" description={`لم يُرفع ${returnKindLabels[kind]} بعد.`} />
  );

  const table = (() => {
    if (ready === null || ready.kind !== kind) {
      // تحميل أو خطأ أو صفحة نوع آخر لم تصل بعد: هيكل الأعمدة العامة.
      return <DataTable label={returnKindLabels[kind]} columns={agentReturnColumns} rows={[]} getRowKey={(row) => row.id ?? ""} loading={loading || (ready !== null && ready.kind !== kind)} error={error} empty={empty} />;
    }
    if (ready.kind === "customer-return") {
      return <DataTable label={returnKindLabels[kind]} columns={customerReturnColumns} rows={ready.data} getRowKey={(row) => row.id ?? ""} empty={empty} onRowOpen={(item) => onOpen?.({ kind: "customer-return", item })} />;
    }
    if (ready.kind === "agent-return") {
      return <DataTable label={returnKindLabels[kind]} columns={agentReturnColumns} rows={ready.data} getRowKey={(row) => row.id ?? ""} empty={empty} onRowOpen={(item) => onOpen?.({ kind: "agent-return", item })} />;
    }
    const damageKind = ready.kind;
    return <DataTable label={returnKindLabels[kind]} columns={damageReportColumns} rows={ready.data} getRowKey={(row) => row.id ?? ""} empty={empty} onRowOpen={(item) => onOpen?.({ kind: damageKind, item })} />;
  })();

  return (
    <>
      <PageHeader title="قرارات المرتجع والتالف" description="طلبات المرتجع والتالف والإرجاع بانتظار قرارك، المعلّق أولاً. يقرر مدير المبيعات أو المدير التنفيذي والأسبق يسري." />

      <div className="flex flex-col gap-4">
        <Tabs aria-label="أنواع الطلبات" tabs={tabs} value={kind} onValueChange={onKindChange} />

        <Checkbox label="المعلّق فقط" description="الطلبات التي لم يُتخذ فيها قرار بعد." checked={pendingOnly} onCheckedChange={onPendingOnlyChange} />

        {table}

        {ready ? <Pagination meta={ready.meta} onPageChange={onPageChange} onPerPageChange={onPerPageChange} /> : null}
      </div>

      <ReturnDecisionDrawer
        selection={selection}
        canDecide={canDecide}
        form={form}
        onFormChange={onFormChange}
        warehouses={warehouses}
        rejecting={rejecting}
        rejectReason={rejectReason}
        onRejectReasonChange={onRejectReasonChange}
        onStartReject={onStartReject}
        onRejectClose={onRejectClose}
        onRejectConfirm={onRejectConfirm}
        onApprove={onApprove}
        submitting={submitting}
        decisionError={decisionError}
        conflict={conflict}
        today={today}
        onClose={onClose}
      />
    </>
  );
}

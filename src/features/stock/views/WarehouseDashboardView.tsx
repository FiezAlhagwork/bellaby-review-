"use client";

import { CheckCircle } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { DateCell, DateTimeCell, NumberCell, QuantityCell, StatusCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { KpiTile } from "@/components/data/KpiTile";
import { Grid } from "@/components/layout/Grid";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { formatRelative, isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";
import type { AgentReturn, ExpiryAlert, ItemRef, LowStockAlert, StockCount, Task, Transfer } from "@/lib/api/types";

/** ما تجمعه الحاوية للمستخدم الذي يدير المخزون: التنبيهات من نقاط العقد، والمعدودات بأطوال القوائم. */
export type WarehouseOverview = {
  /** `GET /stock/low-stock`. */
  lowStock: readonly LowStockAlert[];
  /** `GET /stock/expiry-alerts`. */
  expiryAlerts: readonly ExpiryAlert[];
  /** `GET /transfers?status=IN_TRANSIT` بعد تصفية ما مضى عليه أكثر من 48 ساعة. */
  staleTransfers: readonly Transfer[];
  /** `GET /agent-returns?status=IN_TRANSIT`: إرجاعات الوكلاء بانتظار استلام المستودع. */
  pendingReturns: readonly AgentReturn[];
  /** `GET /stock-counts?status=IN_PROGRESS`. */
  activeCounts: readonly StockCount[];
};

/** ما يخص عامل المستودع: مهامه والجرد المسند إليه. */
export type WarehouseWorkerWork = {
  tasks: readonly Task[];
  counts: readonly StockCount[];
};

export type WarehouseDashboardTarget = "low-stock" | "expiry" | "transfers" | "returns" | "counts" | "tasks";

type WarehouseDashboardViewProps = {
  /** يدير المخزون (صلاحية): يرى التنبيهات. بدونها يرى مهامه والجرد المسند إليه. */
  canManageStock: boolean;
  /** حين `canManageStock`. */
  overview?: Loadable<WarehouseOverview>;
  /** حين لا. */
  myWork?: Loadable<WarehouseWorkerWork>;
  /** الآن (ISO UTC): للأعمار النسبية. تُمرَّر فيبقى الـ view نقياً. */
  now: string;
  /** مهلة تنبيه الصلاحية من الإعدادات (`expiry_alert_days`). */
  expiryAlertDays?: number;
  onRetry?: () => void;
  /** فتح القائمة الكاملة لقسم (الخلية القابلة للضغط). */
  onOpen?: (target: WarehouseDashboardTarget) => void;
};

/**
 * لوحة المستودع (W01): خلايا المؤشرات ثم قوائم التنبيهات الفعلية تحتها. العدّ من أطوال قوائم العقد.
 * اللوجستي يرى التنبيهات، وعامل المستودع يرى مهامه والجرد المسند إليه.
 */
export function WarehouseDashboardView({ canManageStock, overview, myWork, now, expiryAlertDays = 60, onRetry, onOpen }: WarehouseDashboardViewProps) {
  return (
    <>
      <PageHeader title="لوحة المستودع" description={canManageStock ? "ما يحتاج انتباهاً في المستودع الآن." : "مهامك والجرد المسند إليك."} />
      {canManageStock ? (
        <OverviewBody data={overview ?? { status: "loading" }} now={now} expiryAlertDays={expiryAlertDays} onRetry={onRetry} onOpen={onOpen} />
      ) : (
        <WorkerBody data={myWork ?? { status: "loading" }} now={now} onRetry={onRetry} onOpen={onOpen} />
      )}
    </>
  );
}

// ───── خلايا مشتركة ─────

function ItemCell({ item }: { item: ItemRef | undefined }) {
  if (!item) return <TextCell value={null} />;
  return (
    <span className="flex min-w-0 flex-col">
      <span className="truncate text-body text-fg">{item.name}</span>
      <span dir="ltr" className="block text-end text-caption text-fg-muted">
        {item.sku}
      </span>
    </span>
  );
}

const allClear = (
  <EmptyState icon={CheckCircle} title="لا شيء يحتاج انتباهك الآن" description="لا أصناف تحت الحد الأدنى ولا دفعات قريبة الانتهاء ولا صرف متأخر التأكيد." />
);

function TileGrid({ children }: { children: ReactNode }) {
  return (
    <Section>
      <Grid cols={{ base: 1, tablet: 2, desktop: 5 }} gap={4}>
        {children}
      </Grid>
    </Section>
  );
}

// ───── اللوجستي: التنبيهات ─────

function OverviewBody({
  data,
  now,
  expiryAlertDays,
  onRetry,
  onOpen,
}: {
  data: Loadable<WarehouseOverview>;
  now: string;
  expiryAlertDays: number;
  onRetry?: () => void;
  onOpen?: (target: WarehouseDashboardTarget) => void;
}) {
  if (data.status === "error") return <ErrorState code={data.code} onRetry={onRetry} />;

  const loading = data.status === "loading";
  const ready = data.status === "ready" ? data.data : null;
  const tile = (label: string, count: number | undefined, context: string, target: WarehouseDashboardTarget) => (
    <KpiTile
      key={target}
      label={label}
      value={count === undefined ? "" : String(count)}
      context={context}
      state={loading ? "loading" : "ready"}
      onClick={onOpen ? () => onOpen(target) : undefined}
    />
  );

  const lowStockColumns: DataTableColumn<LowStockAlert>[] = [
    { key: "item", header: "الصنف", cell: (row) => <ItemCell item={row.item} />, priority: "high", role: "primary" },
    { key: "quantity", header: "الرصيد", cell: (row) => <QuantityCell value={row.warehouse_quantity} />, align: "end", width: "w-32", priority: "high" },
    { key: "min", header: "الحد الأدنى", cell: (row) => <NumberCell value={row.min_stock} />, align: "end", width: "w-32", priority: "high" },
    { key: "since", header: "منذ", cell: (row) => <DateCell value={row.since} />, width: "w-40" },
  ];

  const expiryColumns: DataTableColumn<ExpiryAlert>[] = [
    { key: "item", header: "الصنف", cell: (row) => <ItemCell item={row.item} />, priority: "high", role: "primary" },
    {
      key: "batch",
      header: "الدفعة",
      cell: (row) => (
        <span className="flex flex-col items-start gap-1">
          <span dir="ltr" className="tabular-nums">
            {row.batch?.batch_no}
          </span>
          {row.batch?.status === "SUSPENDED" ? <StatusCell entity="batch" status="SUSPENDED" /> : null}
        </span>
      ),
      width: "w-44",
      priority: "high",
    },
    { key: "expiry", header: "تاريخ الانتهاء", cell: (row) => <DateCell value={row.batch?.expiry_date} />, width: "w-44" },
    { key: "location", header: "الموقع", cell: (row) => <TextCell value={row.location?.name} />, width: "w-48" },
    { key: "quantity", header: "الكمية", cell: (row) => <QuantityCell value={row.quantity} />, align: "end", width: "w-28", priority: "high" },
    {
      key: "days",
      header: "المتبقي",
      cell: (row) => (row.days_to_expiry === undefined ? <TextCell value={null} /> : <Badge color="warning">{`${isolate(row.days_to_expiry)} يوماً`}</Badge>),
      width: "w-28",
      role: "status",
    },
  ];

  const transferColumns: DataTableColumn<Transfer>[] = [
    { key: "reference", header: "الصرف", cell: (row) => <span dir="ltr">{row.reference}</span>, width: "w-40", priority: "high", role: "primary" },
    { key: "to", header: "المستلم", cell: (row) => <TextCell value={row.to_location?.name} />, priority: "high" },
    { key: "quantity", header: "الكمية", cell: (row) => <QuantityCell value={row.total_quantity} />, align: "end", width: "w-28", priority: "high" },
    { key: "created", header: "أُنشئ", cell: (row) => <TextCell value={row.created_at ? formatRelative(row.created_at, now) : null} />, width: "w-40" },
    { key: "status", header: "الحالة", cell: (row) => (row.status ? <StatusCell entity="transfer" status={row.status} /> : null), width: "w-32", role: "status" },
  ];

  const returnColumns: DataTableColumn<AgentReturn>[] = [
    { key: "agent", header: "الوكيل", cell: (row) => <TextCell value={row.agent?.name} />, priority: "high", role: "primary" },
    { key: "reason", header: "السبب", cell: (row) => <TextCell value={row.reason?.name} />, width: "w-48" },
    { key: "lines", header: "الأصناف", cell: (row) => <NumberCell value={row.lines?.length} />, align: "end", width: "w-28" },
    {
      key: "quantity",
      header: "الكمية",
      cell: (row) => <QuantityCell value={(row.lines ?? []).reduce((sum, line) => sum + (line.quantity ?? 0), 0)} />,
      align: "end",
      width: "w-28",
      priority: "high",
    },
    { key: "created", header: "أُنشئ", cell: (row) => <TextCell value={row.created_at ? formatRelative(row.created_at, now) : null} />, width: "w-40" },
    { key: "status", header: "الحالة", cell: (row) => (row.status ? <StatusCell entity="agentReturn" status={row.status} /> : null), width: "w-32", role: "status" },
  ];

  const countColumns = countsColumns(now);

  const nothing =
    ready !== null &&
    ready.lowStock.length + ready.expiryAlerts.length + ready.staleTransfers.length + ready.pendingReturns.length + ready.activeCounts.length === 0;

  return (
    <>
      <TileGrid>
        {tile("أصناف تحت الحد الأدنى", ready?.lowStock.length, "رصيد المستودع أقل من الحد الأدنى", "low-stock")}
        {tile("دفعات قريبة الانتهاء", ready?.expiryAlerts.length, `خلال ${isolate(expiryAlertDays)} يوماً`, "expiry")}
        {tile("صرف غير مؤكّد", ready?.staleTransfers.length, "بالطريق منذ أكثر من 48 ساعة", "transfers")}
        {tile("إرجاعات بانتظار الاستلام", ready?.pendingReturns.length, "من الوكلاء إلى المستودع", "returns")}
        {tile("جرد جارٍ", ready?.activeCounts.length, "لم يُرسل للاعتماد بعد", "counts")}
      </TileGrid>

      {loading ? (
        <Section title="أصناف تحت الحد الأدنى">
          <DataTable label="أصناف تحت الحد الأدنى" columns={lowStockColumns} rows={[]} getRowKey={(row) => row.item?.id ?? 0} loading />
        </Section>
      ) : nothing ? (
        allClear
      ) : (
        <>
          {ready && ready.lowStock.length > 0 ? (
            <Section title="أصناف تحت الحد الأدنى">
              <DataTable label="أصناف تحت الحد الأدنى" columns={lowStockColumns} rows={ready.lowStock} getRowKey={(row) => row.item?.id ?? 0} />
            </Section>
          ) : null}
          {ready && ready.expiryAlerts.length > 0 ? (
            <Section title="دفعات قريبة الانتهاء">
              <DataTable label="دفعات قريبة الانتهاء" columns={expiryColumns} rows={ready.expiryAlerts} getRowKey={(row) => `${row.location?.id}-${row.batch?.id}`} />
            </Section>
          ) : null}
          {ready && ready.staleTransfers.length > 0 ? (
            <Section title="صرف بالطريق ولم يُؤكَّد استلامه" description="مضى عليه أكثر من 48 ساعة.">
              <DataTable label="صرف غير مؤكّد" columns={transferColumns} rows={ready.staleTransfers} getRowKey={(row) => row.id ?? 0} />
            </Section>
          ) : null}
          {ready && ready.pendingReturns.length > 0 ? (
            <Section title="إرجاعات بانتظار الاستلام">
              <DataTable label="إرجاعات بانتظار الاستلام" columns={returnColumns} rows={ready.pendingReturns} getRowKey={(row) => row.id ?? 0} />
            </Section>
          ) : null}
          {ready && ready.activeCounts.length > 0 ? (
            <Section title="الجرد الجاري">
              <DataTable label="الجرد الجاري" columns={countColumns} rows={ready.activeCounts} getRowKey={(row) => row.id ?? 0} />
            </Section>
          ) : null}
        </>
      )}
    </>
  );
}

function countsColumns(now: string): DataTableColumn<StockCount>[] {
  return [
    { key: "id", header: "الجرد", cell: (row) => <span dir="ltr">{`#${row.id}`}</span>, width: "w-28", priority: "high", role: "primary" },
    { key: "location", header: "الموقع", cell: (row) => <TextCell value={row.location?.name} />, priority: "high" },
    { key: "assigned", header: "المكلَّف", cell: (row) => <TextCell value={row.assigned_to?.name} />, width: "w-48" },
    { key: "created", header: "أُنشئ", cell: (row) => <TextCell value={row.created_at ? formatRelative(row.created_at, now) : null} />, width: "w-40" },
    { key: "status", header: "الحالة", cell: (row) => (row.status ? <StatusCell entity="stockCount" status={row.status} /> : null), width: "w-40", role: "status" },
  ];
}

// ───── عامل المستودع: مهامه والجرد المسند إليه ─────

function WorkerBody({
  data,
  now,
  onRetry,
  onOpen,
}: {
  data: Loadable<WarehouseWorkerWork>;
  now: string;
  onRetry?: () => void;
  onOpen?: (target: WarehouseDashboardTarget) => void;
}) {
  if (data.status === "error") return <ErrorState code={data.code} onRetry={onRetry} />;

  const loading = data.status === "loading";
  const ready = data.status === "ready" ? data.data : null;
  const open = ready?.tasks.filter((task) => task.status === "NEW" || task.status === "IN_PROGRESS") ?? [];
  const overdue = open.filter((task) => task.is_overdue);

  const taskColumns: DataTableColumn<Task>[] = [
    { key: "title", header: "المهمة", cell: (row) => <TextCell value={row.title} />, priority: "high", role: "primary" },
    { key: "priority", header: "الأولوية", cell: (row) => (row.priority ? <StatusCell entity="priority" status={row.priority} /> : null), width: "w-32" },
    {
      key: "due",
      header: "الموعد",
      cell: (row) => (
        <span className="flex flex-col items-start gap-1">
          <DateTimeCell value={row.due_at} />
          {row.is_overdue ? <Badge color="danger">متأخرة</Badge> : null}
        </span>
      ),
      width: "w-56",
      priority: "high",
    },
    { key: "status", header: "الحالة", cell: (row) => (row.status ? <StatusCell entity="task" status={row.status} /> : null), width: "w-40", role: "status" },
  ];

  const tile = (label: string, count: number | undefined, context: string, target: WarehouseDashboardTarget) => (
    <KpiTile
      key={target + label}
      label={label}
      value={count === undefined ? "" : String(count)}
      context={context}
      state={loading ? "loading" : "ready"}
      onClick={onOpen ? () => onOpen(target) : undefined}
    />
  );

  return (
    <>
      <Section>
        <Grid cols={{ base: 1, tablet: 3 }} gap={4}>
          {tile("مهام مفتوحة", ready ? open.length : undefined, "جديدة أو قيد التنفيذ", "tasks")}
          {tile("مهام متأخرة", ready ? overdue.length : undefined, "تجاوزت موعدها", "tasks")}
          {tile("جرد مسند إليّ", ready?.counts.length, "قيد العدّ", "counts")}
        </Grid>
      </Section>

      <Section title="مهامي">
        <DataTable
          label="مهامي"
          columns={taskColumns}
          rows={ready?.tasks ?? []}
          getRowKey={(row) => row.id ?? 0}
          loading={loading}
          empty={<EmptyState icon={CheckCircle} title="لا مهام عليك الآن" description="حين يُسند إليك المسؤول مهمة تظهر هنا." className="min-h-0 py-8" />}
        />
      </Section>

      <Section title="الجرد المسند إليّ">
        <DataTable
          label="الجرد المسند إليّ"
          columns={countsColumns(now)}
          rows={ready?.counts ?? []}
          getRowKey={(row) => row.id ?? 0}
          loading={loading}
          empty={<EmptyState icon={CheckCircle} title="لا جرد مسند إليك" description="حين يُسند إليك جرد يظهر هنا لتبدأ العدّ." className="min-h-0 py-8" />}
        />
      </Section>
    </>
  );
}

"use client";

import { Handshake, Package, Receipt, Truck, ArrowUUpLeft } from "@phosphor-icons/react";
import { BatchCell, DateCell, DateTimeStackCell, MoneyCell, QuantityCell, StatusCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { DescriptionList } from "@/components/data/DescriptionList";
import { KpiTile } from "@/components/data/KpiTile";
import { Grid } from "@/components/layout/Grid";
import { PageHeader, type PageAction } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { NotFoundState } from "@/components/ui/NotFoundState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import type { Agent, AgentReturn, BalanceLine, CustomerReturn, Delivery, Receivable, Transfer } from "@/lib/api/types";
import { daysBetween, type IsoDate } from "@/lib/calendar";
import { countPhrase, formatMoney, formatPercent, formatPhone, isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

export type AgentTab = "receipts" | "balances" | "deliveries" | "receivables" | "returns";

/** تبويب المستحقات: صف التحصيل لهذا الوكيل (`GET /receivables?agent_id`) وتسليماته غير المسدّدة (`GET /deliveries?agent_id&status=UNPAID`). */
export type AgentReceivables = { summary: Receivable | null; unpaid: readonly Delivery[] };

/** تبويب المرتجعات: إرجاعاته للمستودع (`GET /agent-returns?agent_id`) ومرتجعات صيدلياته (`GET /customer-returns?agent_id`). */
export type AgentReturnsData = { toWarehouse: readonly AgentReturn[]; fromPharmacies: readonly CustomerReturn[] };

/**
 * محتوى كل تبويب من نقطته: `GET /transfers?to_location_id=<location_id>`، و`GET /stock/balances?location_id&group_by=batch`، و`GET /deliveries?agent_id`،
 * و`GET /receivables?agent_id`، و`GET /agent-returns?agent_id`. تبويب بلا بيانات بعد يُجلب عند فتحه. العقد لا يعيد تبويبات الوكيل في `GET /agents/{id}`: §41.
 */
export type AgentTabsData = {
  receipts: Loadable<readonly Transfer[]>;
  balances: Loadable<readonly BalanceLine[]>;
  deliveries: Loadable<readonly Delivery[]>;
  receivables: Loadable<AgentReceivables>;
  returns: Loadable<AgentReturnsData>;
};

type AgentDetailsViewProps = {
  agent: Loadable<Agent>;
  tabs: AgentTabsData;
  tab: AgentTab;
  onTabChange: (tab: AgentTab) => void;
  /** اليوم (بتوقيت دمشق): لأيام التأخر. يُمرَّر فيبقى الـ view نقياً. */
  today: IsoDate;
  /** علم `agent_returns.create`: «إنشاء إرجاع للمستودع عنه» للوكيل المعطّل. */
  canCreateReturn: boolean;
  /** ينقل إلى نموذج الإرجاع عن الوكيل. */
  onCreateReturn?: () => void;
  onBack?: () => void;
  onRetry?: () => void;
  onRetryTab?: (tab: AgentTab) => void;
};

const dayForms = ["يوم", "يومين", "أيام"] as const;

const totalOf = (lines: AgentReturn["lines"]) => (lines ?? []).reduce((sum, line) => sum + (line.quantity ?? 0), 0);

/**
 * صفحة الوكيل (M03): بياناته (الهاتف والمحافظات والعنوان والمستحق) وخمسة تبويبات: الاستلامات · الرصيد بالدفعة · التسليمات · المستحقات · المرتجعات، للقراءة.
 * الوكيل المعطّل يحمل شارة وشريطاً، وزر «إنشاء إرجاع للمستودع عنه» ليسترد المستودع ما بقي عنده.
 */
export function AgentDetailsView({ agent, tabs, tab, onTabChange, today, canCreateReturn, onCreateReturn, onBack, onRetry, onRetryTab }: AgentDetailsViewProps) {
  if (agent.status === "loading") {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (agent.status === "error") {
    return agent.code === "not_found" ? <NotFoundState onBack={onBack} /> : <ErrorState code={agent.code} onRetry={onRetry} />;
  }

  const { data: info } = agent;
  const inactive = info.is_active === false;
  const retry = (target: AgentTab) => (onRetryTab ? () => onRetryTab(target) : undefined);

  const actions: PageAction[] = inactive && canCreateReturn ? [{ id: "create-return", label: "إنشاء إرجاع للمستودع عنه", primary: true, onSelect: () => onCreateReturn?.() }] : [];

  const countOf = <T,>(loadable: Loadable<readonly T[]>) => (loadable.status === "ready" ? loadable.data.length : undefined);
  const tabItems: TabItem<AgentTab>[] = [
    { value: "receipts", label: "الاستلامات", count: countOf(tabs.receipts) },
    { value: "balances", label: "الرصيد بالدفعة", count: countOf(tabs.balances) },
    { value: "deliveries", label: "التسليمات", count: countOf(tabs.deliveries) },
    { value: "receivables", label: "المستحقات", count: tabs.receivables.status === "ready" ? tabs.receivables.data.unpaid.length : undefined },
    { value: "returns", label: "المرتجعات", count: tabs.returns.status === "ready" ? tabs.returns.data.toWarehouse.length + tabs.returns.data.fromPharmacies.length : undefined },
  ];

  return (
    <>
      <PageHeader
        title={info.name ?? "وكيل"}
        badge={inactive ? <Badge>معطّل</Badge> : <Badge color="success">فعّال</Badge>}
        description={info.contact_name ? `جهة الاتصال: ${info.contact_name}` : undefined}
        actions={actions}
      />

      <div className="flex flex-col gap-6">
        {inactive ? (
          <Banner kind="warning" title="الوكيل معطّل">
            لا يدخل الوكيل بنفسه ولا يرفع طلباً. إن بقي عنده رصيد فأنشئ إرجاعاً للمستودع عنه ليستلمه اللوجستي.
          </Banner>
        ) : null}

        <DescriptionList
          items={[
            { label: "الهاتف", value: info.phone ? <span dir="ltr">{formatPhone(info.phone)}</span> : null },
            { label: "المحافظات", value: (info.governorates ?? []).map((governorate) => governorate.name).join("، ") },
            { label: "العنوان", value: info.address },
            { label: "المستحق عليه", value: info.unpaid_value ? <span dir="ltr">{formatMoney(info.unpaid_value)}</span> : null },
          ]}
        />

        <div className="flex flex-col gap-4">
          <Tabs aria-label="أقسام الوكيل" tabs={tabItems} value={tab} onValueChange={onTabChange} />

          {tab === "receipts" ? <ReceiptsPanel data={tabs.receipts} onRetry={retry("receipts")} /> : null}
          {tab === "balances" ? <BalancesPanel data={tabs.balances} onRetry={retry("balances")} /> : null}
          {tab === "deliveries" ? <DeliveriesPanel data={tabs.deliveries} today={today} onRetry={retry("deliveries")} /> : null}
          {tab === "receivables" ? <ReceivablesPanel data={tabs.receivables} today={today} onRetry={retry("receivables")} /> : null}
          {tab === "returns" ? <ReturnsPanel data={tabs.returns} onRetry={retry("returns")} /> : null}
        </div>
      </div>
    </>
  );
}

type PanelProps<T> = { data: Loadable<T>; onRetry?: () => void };

function ReceiptsPanel({ data, onRetry }: PanelProps<readonly Transfer[]>) {
  const columns: DataTableColumn<Transfer>[] = [
    {
      key: "reference",
      header: "الرقم",
      cell: (row) => (
        <span dir="ltr" className="block truncate text-end tabular-nums">
          {row.reference}
        </span>
      ),
      width: "w-36",
      priority: "high",
      role: "primary",
    },
    { key: "from", header: "من", cell: (row) => <TextCell value={row.from_location?.name} />, priority: "high" },
    { key: "created", header: "التاريخ", cell: (row) => <DateTimeStackCell value={row.created_at} />, width: "w-28", priority: "high" },
    { key: "quantity", header: "الكمية", cell: (row) => <QuantityCell value={row.total_quantity} unit="علبة" />, align: "end", width: "w-32" },
    { key: "status", header: "الحالة", cell: (row) => (row.status ? <StatusCell entity="transfer" status={row.status} /> : <TextCell value={null} />), width: "w-32", priority: "high", role: "status" },
  ];
  return (
    <DataTable
      label="استلامات الوكيل"
      columns={columns}
      rows={data.status === "ready" ? data.data : []}
      getRowKey={(row) => row.id ?? row.reference ?? ""}
      loading={data.status === "loading"}
      error={data.status === "error" ? { code: data.code, onRetry } : undefined}
      empty={<EmptyState icon={Truck} title="لا استلامات" description="لم يُصرف لهذا الوكيل شيء من المستودع بعد." />}
    />
  );
}

function BalancesPanel({ data, onRetry }: PanelProps<readonly BalanceLine[]>) {
  const columns: DataTableColumn<BalanceLine>[] = [
    { key: "item", header: "الصنف", cell: (row) => <TextCell value={row.item?.name} />, priority: "high", role: "primary" },
    { key: "batch", header: "الدفعة", cell: (row) => <BatchCell batch={row.batch} />, width: "w-72", priority: "high" },
    { key: "quantity", header: "الكمية", cell: (row) => <QuantityCell value={row.quantity} unit="علبة" />, align: "end", width: "w-32", priority: "high" },
  ];
  return (
    <DataTable
      label="رصيد الوكيل بالدفعة"
      columns={columns}
      rows={data.status === "ready" ? data.data : []}
      getRowKey={(row) => `${row.item?.id}-${row.batch?.id}`}
      loading={data.status === "loading"}
      error={data.status === "error" ? { code: data.code, onRetry } : undefined}
      empty={<EmptyState icon={Package} title="لا رصيد" description="لا يحمل هذا الوكيل أي كمية الآن." />}
    />
  );
}

/** أعمدة التسليمات: المشتركة بين تبويبي التسليمات والمستحقات. */
function deliveryColumns(today: IsoDate): DataTableColumn<Delivery>[] {
  const lateDays = (delivery: Delivery) => (delivery.expected_payment_date ? daysBetween(delivery.expected_payment_date, today) : 0);
  return [
    {
      key: "reference",
      header: "التسليم",
      cell: (row) => (
        <span dir="ltr" className="block truncate text-end tabular-nums">
          {row.reference}
        </span>
      ),
      width: "w-32",
    },
    { key: "customer", header: "العميل", cell: (row) => <TextCell value={row.customer?.name} />, priority: "high", role: "primary" },
    { key: "delivered", header: "التاريخ", cell: (row) => <DateTimeStackCell value={row.delivered_at} />, width: "w-28" },
    { key: "value", header: "القيمة", cell: (row) => <MoneyCell value={row.estimated_value} />, align: "end", width: "w-32", priority: "high" },
    {
      key: "due",
      header: "موعد السداد",
      cell: (row) => (
        <span className="flex min-w-0 flex-col">
          <DateCell value={row.expected_payment_date} />
          {row.is_payment_overdue ? <span className="text-caption text-danger">{`متأخر ${countPhrase(lateDays(row), dayForms)}`}</span> : null}
        </span>
      ),
      width: "w-44",
      priority: "high",
    },
    { key: "status", header: "الحالة", cell: (row) => (row.status ? <StatusCell entity="delivery" status={row.status} /> : <TextCell value={null} />), width: "w-36", priority: "high", role: "status" },
  ];
}

function DeliveriesPanel({ data, today, onRetry }: PanelProps<readonly Delivery[]> & { today: IsoDate }) {
  return (
    <DataTable
      label="تسليمات الوكيل"
      columns={deliveryColumns(today)}
      rows={data.status === "ready" ? data.data : []}
      getRowKey={(row) => row.id ?? row.reference ?? ""}
      loading={data.status === "loading"}
      error={data.status === "error" ? { code: data.code, onRetry } : undefined}
      empty={<EmptyState icon={Handshake} title="لا تسليمات" description="لم يسلّم هذا الوكيل شيئاً لصيدلية بعد." />}
    />
  );
}

function ReceivablesPanel({ data, today, onRetry }: PanelProps<AgentReceivables> & { today: IsoDate }) {
  if (data.status === "error") return <ErrorState code={data.code} onRetry={onRetry} />;
  if (data.status === "loading") {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }
  const { summary, unpaid } = data.data;
  return (
    <div className="flex flex-col gap-6">
      {summary ? (
        <Grid cols={{ base: 1, tablet: 2, desktop: 4 }} gap={4}>
          <KpiTile label="المستحق" value={summary.due_value ? formatMoney(summary.due_value) : "—"} size="md" />
          <KpiTile label="المسدَّد" value={summary.paid_value ? formatMoney(summary.paid_value) : "—"} size="md" />
          <KpiTile
            label="المتأخر"
            value={summary.overdue_value ? formatMoney(summary.overdue_value) : "—"}
            context={summary.overdue_deliveries ? `${isolate(summary.overdue_deliveries)} ${summary.overdue_deliveries === 1 ? "تسليم" : "تسليمات"}` : "لا تسليمات متأخرة"}
            size="md"
          />
          <KpiTile label="نسبة التحصيل" value={formatPercent(summary.collection_rate_pct ?? 0, 1)} progress={Math.round(summary.collection_rate_pct ?? 0)} size="md" />
        </Grid>
      ) : null}
      <Section title="التسليمات غير المسدّدة">
        <DataTable
          label="التسليمات غير المسدّدة للوكيل"
          columns={deliveryColumns(today)}
          rows={unpaid}
          getRowKey={(row) => row.id ?? row.reference ?? ""}
          empty={<EmptyState icon={Receipt} title="لا مستحقات" description="سدّدت كل تسليمات هذا الوكيل." />}
        />
      </Section>
    </div>
  );
}

function ReturnsPanel({ data, onRetry }: PanelProps<AgentReturnsData>) {
  if (data.status === "error") return <ErrorState code={data.code} onRetry={onRetry} />;
  if (data.status === "loading") {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  const { toWarehouse, fromPharmacies } = data.data;

  const toWarehouseColumns: DataTableColumn<AgentReturn>[] = [
    {
      key: "id",
      header: "الإرجاع",
      cell: (row) => (
        <span dir="ltr" className="block truncate text-end tabular-nums">{`#${row.id}`}</span>
      ),
      width: "w-24",
      priority: "high",
      role: "primary",
    },
    { key: "reason", header: "السبب", cell: (row) => <TextCell value={row.reason?.name} />, priority: "high" },
    { key: "quantity", header: "الكمية", cell: (row) => <QuantityCell value={totalOf(row.lines)} unit="علبة" />, align: "end", width: "w-32" },
    { key: "created", header: "التاريخ", cell: (row) => <DateTimeStackCell value={row.created_at} />, width: "w-28", priority: "high" },
    {
      key: "origin",
      header: "المنشئ",
      cell: (row) => (row.created_on_behalf_of_agent ? <Badge color="info">أُنشئ عنه</Badge> : <span className="text-fg-muted">الوكيل</span>),
      width: "w-32",
    },
    { key: "status", header: "الحالة", cell: (row) => (row.status ? <StatusCell entity="agentReturn" status={row.status} /> : <TextCell value={null} />), width: "w-32", priority: "high", role: "status" },
  ];

  const fromPharmaciesColumns: DataTableColumn<CustomerReturn>[] = [
    { key: "customer", header: "الصيدلية", cell: (row) => <TextCell value={row.customer?.name} />, priority: "high", role: "primary" },
    { key: "reason", header: "السبب", cell: (row) => <TextCell value={row.reason?.name} />, priority: "high" },
    { key: "quantity", header: "الكمية", cell: (row) => <QuantityCell value={row.quantity} unit="علبة" />, align: "end", width: "w-32" },
    { key: "created", header: "التاريخ", cell: (row) => <DateTimeStackCell value={row.created_at} />, width: "w-28", priority: "high" },
    { key: "status", header: "الحالة", cell: (row) => (row.status ? <StatusCell entity="customerReturn" status={row.status} /> : <TextCell value={null} />), width: "w-36", priority: "high", role: "status" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Section title="إرجاعات للمستودع">
        <DataTable
          label="إرجاعات الوكيل للمستودع"
          columns={toWarehouseColumns}
          rows={toWarehouse}
          getRowKey={(row) => row.id ?? ""}
          empty={<EmptyState icon={ArrowUUpLeft} title="لا إرجاعات للمستودع" description="لم يُرجع هذا الوكيل بضاعة إلى المستودع." />}
        />
      </Section>
      <Section title="مرتجعات الصيدليات">
        <DataTable
          label="مرتجعات صيدليات الوكيل"
          columns={fromPharmaciesColumns}
          rows={fromPharmacies}
          getRowKey={(row) => row.id ?? ""}
          empty={<EmptyState icon={ArrowUUpLeft} title="لا مرتجعات" description="لم ترجع صيدليات هذا الوكيل بضاعة." />}
        />
      </Section>
    </div>
  );
}

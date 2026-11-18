"use client";

import { ArrowUUpLeft, Handshake, MapPin, Receipt } from "@phosphor-icons/react";
import { DateCell, DateTimeCell, DateTimeStackCell, MoneyCell, QuantityCell, StatusCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { DescriptionList } from "@/components/data/DescriptionList";
import { KpiTile } from "@/components/data/KpiTile";
import { Grid } from "@/components/layout/Grid";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { NotFoundState } from "@/components/ui/NotFoundState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import type { Customer, CustomerReturn, Delivery, ManagerVisit, Visit, VisitPoint } from "@/lib/api/types";
import { daysBetween, type IsoDate } from "@/lib/calendar";
import { countPhrase, formatDateTime, formatMoney, formatPhone, isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

export type CustomerTab = "deliveries" | "payment" | "returns" | "rep-visits" | "my-visits";

/** محتوى كل قسم من نقطته. زيارات المندوبين وزياراتي لمدير المبيعات (`showVisits`) فقط: docs/backend-requests.md §45. */
export type CustomerTabsData = {
  /** `GET /deliveries?customer_id=`. */
  deliveries: Loadable<readonly Delivery[]>;
  /** `GET /customer-returns` بعميله (المعامل غير موجود في العقد بعد: §45.1). */
  returns: Loadable<readonly CustomerReturn[]>;
  /** `GET /visits?visit_point_id=` للجهة المربوطة. */
  repVisits: Loadable<readonly Visit[]>;
  /** `GET /manager-visits` بعميله (المعامل غير موجود: §45.1). */
  myVisits: Loadable<readonly ManagerVisit[]>;
};

type CustomerDetailsViewProps = {
  customer: Loadable<Customer>;
  /** الجهة المربوطة (`GET /visit-points/{visit_point_id}`). null = غير مربوط. */
  point: VisitPoint | null;
  tabs: CustomerTabsData;
  tab: CustomerTab;
  onTabChange: (tab: CustomerTab) => void;
  /** يعرض قسمَي «زيارات المندوبين» و«زياراتي» (مدير المبيعات). للوكيل بلا هذين القسمين. */
  showVisits: boolean;
  /** اليوم (بتوقيت دمشق): لأيام التأخر. يُمرَّر فيبقى الـ view نقياً. */
  today: IsoDate;
  onOpenDelivery?: (delivery: Delivery) => void;
  onBack?: () => void;
  onRetry?: () => void;
  onRetryTab?: (tab: CustomerTab) => void;
};

const dayForms = ["يوم", "يومين", "أيام"] as const;

/**
 * صفحة العميل (A07 · M05): بياناته وهل هو مربوط بجهة زيارة (اسمها ونوعها وآخر زيارة)، وأقسام للقراءة: التسليمات، والسداد، والمرتجعات.
 * وفي M05 قسمان إضافيان لمدير المبيعات: زيارات المندوبين للجهة المربوطة، وزياراتي له.
 */
export function CustomerDetailsView({ customer, point, tabs, tab, onTabChange, showVisits, today, onOpenDelivery, onBack, onRetry, onRetryTab }: CustomerDetailsViewProps) {
  if (customer.status === "loading") {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (customer.status === "error") {
    return customer.code === "not_found" ? <NotFoundState onBack={onBack} /> : <ErrorState code={customer.code} onRetry={onRetry} />;
  }

  const { data: info } = customer;
  const retry = (target: CustomerTab) => (onRetryTab ? () => onRetryTab(target) : undefined);
  const countOf = <T,>(loadable: Loadable<readonly T[]>) => (loadable.status === "ready" ? loadable.data.length : undefined);

  const tabItems: TabItem<CustomerTab>[] = [
    { value: "deliveries", label: "التسليمات", count: countOf(tabs.deliveries) },
    { value: "payment", label: "السداد" },
    { value: "returns", label: "المرتجعات", count: countOf(tabs.returns) },
    ...(showVisits
      ? [
          { value: "rep-visits" as const, label: "زيارات المندوبين", count: countOf(tabs.repVisits) },
          { value: "my-visits" as const, label: "زياراتي", count: countOf(tabs.myVisits) },
        ]
      : []),
  ];

  return (
    <>
      <PageHeader title={info.name ?? "عميل"} badge={point ? <Badge color="success">مربوط بجهة زيارة</Badge> : <Badge>غير مربوط</Badge>} description={`${info.governorate?.name ?? "—"} · وكيله ${info.agent?.name ?? "—"}`} />

      <div className="flex flex-col gap-6">
        <Grid cols={{ base: 1, tablet: 2 }} gap={4}>
          <Card title="البيانات">
            <DescriptionList
              items={[
                { label: "الهاتف", value: info.phone ? <span dir="ltr">{formatPhone(info.phone)}</span> : null },
                { label: "المحافظة", value: info.governorate?.name },
                { label: "العنوان", value: info.address },
                { label: "الوكيل", value: info.agent?.name },
                { label: "أول تسليم", value: info.first_delivery_at ? formatDateTime(info.first_delivery_at) : null },
                { label: "المستحق عليه", value: info.unpaid_value ? <span dir="ltr">{formatMoney(info.unpaid_value)}</span> : null },
              ]}
            />
          </Card>

          <Card title="جهة الزيارة المربوطة">
            {point ? (
              <DescriptionList
                items={[
                  { label: "الجهة", value: point.name },
                  { label: "النوع", value: point.type?.name },
                  { label: "المحافظة", value: point.governorate?.name },
                  { label: "آخر زيارة", value: point.last_visit_at ? formatDateTime(point.last_visit_at) : null },
                  { label: "الإجراء القادم", value: point.next_action },
                ]}
              />
            ) : (
              <EmptyState icon={MapPin} title="غير مربوط بجهة زيارة" description="لم يرتبط هذا العميل بصيدلية من جهات الزيارة، فلا زيارات مندوبين له." />
            )}
          </Card>
        </Grid>

        <div className="flex flex-col gap-4">
          <Tabs aria-label="أقسام العميل" tabs={tabItems} value={tab} onValueChange={onTabChange} />

          {tab === "deliveries" ? <DeliveriesPanel data={tabs.deliveries} today={today} onOpen={onOpenDelivery} onRetry={retry("deliveries")} /> : null}
          {tab === "payment" ? <PaymentPanel customer={info} data={tabs.deliveries} onRetry={retry("deliveries")} /> : null}
          {tab === "returns" ? <ReturnsPanel data={tabs.returns} onRetry={retry("returns")} /> : null}
          {showVisits && tab === "rep-visits" ? <RepVisitsPanel data={tabs.repVisits} linked={point !== null} onRetry={retry("rep-visits")} /> : null}
          {showVisits && tab === "my-visits" ? <MyVisitsPanel data={tabs.myVisits} onRetry={retry("my-visits")} /> : null}
        </div>
      </div>
    </>
  );
}

type PanelProps<T> = { data: Loadable<T>; onRetry?: () => void };

function DeliveriesPanel({ data, today, onOpen, onRetry }: PanelProps<readonly Delivery[]> & { today: IsoDate; onOpen?: (delivery: Delivery) => void }) {
  const lateDays = (delivery: Delivery) => (delivery.expected_payment_date ? daysBetween(delivery.expected_payment_date, today) : 0);
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
      priority: "high",
      role: "primary",
    },
    { key: "delivered", header: "التاريخ", cell: (row) => <DateTimeStackCell value={row.delivered_at} />, width: "w-28", priority: "high" },
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
    },
    { key: "status", header: "الحالة", cell: (row) => (row.status ? <StatusCell entity="delivery" status={row.status} /> : <TextCell value={null} />), width: "w-36", priority: "high", role: "status" },
  ];
  return (
    <DataTable
      label="تسليمات العميل"
      columns={columns}
      rows={data.status === "ready" ? data.data : []}
      getRowKey={(row) => row.id ?? row.reference ?? ""}
      loading={data.status === "loading"}
      error={data.status === "error" ? { code: data.code, onRetry } : undefined}
      empty={<EmptyState icon={Handshake} title="لا تسليمات" description="لم يُسلَّم لهذا العميل شيء بعد." />}
      onRowOpen={onOpen}
    />
  );
}

function PaymentPanel({ customer, data, onRetry }: PanelProps<readonly Delivery[]> & { customer: Customer }) {
  if (data.status === "error") return <ErrorState code={data.code} onRetry={onRetry} />;
  if (data.status === "loading") return <Skeleton className="h-28 w-full" />;
  const list = data.data;
  const unpaid = list.filter((delivery) => delivery.status === "UNPAID");
  const overdue = list.filter((delivery) => delivery.is_payment_overdue);
  const paid = list.filter((delivery) => delivery.status === "PAID");
  const onTime = paid.filter((delivery) => delivery.paid_on_time === true);
  if (list.length === 0) return <EmptyState icon={Receipt} title="لا سداد بعد" description="يظهر هنا سداد العميل حين يُسجَّل له تسليم." />;
  return (
    <Grid cols={{ base: 1, tablet: 2, desktop: 4 }} gap={4}>
      <KpiTile label="المستحق عليه" value={customer.unpaid_value ? formatMoney(customer.unpaid_value) : "—"} context={unpaid.length ? `${isolate(unpaid.length)} ${unpaid.length === 1 ? "تسليم غير مسدّد" : "تسليمات غير مسدّدة"}` : "لا تسليمات غير مسدّدة"} size="md" />
      <KpiTile label="المتأخر" value={String(overdue.length)} context={overdue.length ? "تسليمات فات موعد سدادها" : "لا تأخر"} size="md" />
      <KpiTile label="المسدَّد" value={String(paid.length)} context="تسليمات سُدِّدت كاملةً" size="md" />
      <KpiTile label="سُدِّد في موعده" value={paid.length ? `${isolate(onTime.length)} من ${isolate(paid.length)}` : "—"} progress={paid.length ? Math.round((onTime.length / paid.length) * 100) : undefined} size="md" />
    </Grid>
  );
}

function ReturnsPanel({ data, onRetry }: PanelProps<readonly CustomerReturn[]>) {
  const columns: DataTableColumn<CustomerReturn>[] = [
    { key: "id", header: "المرتجع", cell: (row) => <span dir="ltr" className="block truncate text-end tabular-nums">{`#${row.id}`}</span>, width: "w-24", priority: "high", role: "primary" },
    { key: "reason", header: "السبب", cell: (row) => <TextCell value={row.reason?.name} />, priority: "high" },
    { key: "quantity", header: "الكمية", cell: (row) => <QuantityCell value={row.quantity} unit="علبة" />, align: "end", width: "w-28" },
    { key: "created", header: "التاريخ", cell: (row) => <DateTimeStackCell value={row.created_at} />, width: "w-28", priority: "high" },
    { key: "status", header: "الحالة", cell: (row) => (row.status ? <StatusCell entity="customerReturn" status={row.status} /> : <TextCell value={null} />), width: "w-36", priority: "high", role: "status" },
  ];
  return (
    <DataTable
      label="مرتجعات العميل"
      columns={columns}
      rows={data.status === "ready" ? data.data : []}
      getRowKey={(row) => row.id ?? ""}
      loading={data.status === "loading"}
      error={data.status === "error" ? { code: data.code, onRetry } : undefined}
      empty={<EmptyState icon={ArrowUUpLeft} title="لا مرتجعات" description="لم يُرجع هذا العميل بضاعة." />}
    />
  );
}

function RepVisitsPanel({ data, linked, onRetry }: PanelProps<readonly Visit[]> & { linked: boolean }) {
  const columns: DataTableColumn<Visit>[] = [
    { key: "rep", header: "المندوب", cell: (row) => <TextCell value={row.rep?.name} />, priority: "high", role: "primary" },
    { key: "purpose", header: "الهدف", cell: (row) => <TextCell value={row.purpose?.name} />, priority: "high" },
    { key: "outcome", header: "النتيجة", cell: (row) => <TextCell value={row.outcome?.name} /> },
    { key: "started", header: "الوقت", cell: (row) => <DateTimeCell value={row.started_at} />, width: "w-56", priority: "high" },
    { key: "status", header: "الحالة", cell: (row) => (row.status ? <StatusCell entity="visit" status={row.status} /> : <TextCell value={null} />), width: "w-32", priority: "high", role: "status" },
  ];
  return (
    <DataTable
      label="زيارات المندوبين للجهة"
      columns={columns}
      rows={data.status === "ready" ? data.data : []}
      getRowKey={(row) => row.id ?? ""}
      loading={data.status === "loading"}
      error={data.status === "error" ? { code: data.code, onRetry } : undefined}
      empty={<EmptyState icon={MapPin} title={linked ? "لا زيارات" : "لا جهة مربوطة"} description={linked ? "لم يزر المندوبون هذه الجهة بعد." : "العميل غير مربوط بجهة زيارة، فلا تُحتسب له زيارات المندوبين."} />}
    />
  );
}

function MyVisitsPanel({ data, onRetry }: PanelProps<readonly ManagerVisit[]>) {
  const columns: DataTableColumn<ManagerVisit>[] = [
    { key: "purpose", header: "الهدف", cell: (row) => <TextCell value={row.purpose?.name} />, priority: "high", role: "primary" },
    { key: "outcome", header: "النتيجة", cell: (row) => <TextCell value={row.outcome?.name} />, priority: "high" },
    { key: "notes", header: "الملاحظات", cell: (row) => <TextCell value={row.notes} /> },
    { key: "visited", header: "الوقت", cell: (row) => <DateTimeCell value={row.visited_at} />, width: "w-56", priority: "high" },
  ];
  return (
    <DataTable
      label="زياراتي للعميل"
      columns={columns}
      rows={data.status === "ready" ? data.data : []}
      getRowKey={(row) => row.id ?? ""}
      loading={data.status === "loading"}
      error={data.status === "error" ? { code: data.code, onRetry } : undefined}
      empty={<EmptyState icon={MapPin} title="لا زيارات لك" description="لم تزر هذا العميل بعد. تُسجَّل زيارتك من «زياراتي»." />}
    />
  );
}

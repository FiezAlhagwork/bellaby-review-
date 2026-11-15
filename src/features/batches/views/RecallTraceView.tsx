"use client";

import { Cube, MapPin, UsersThree } from "@phosphor-icons/react";
import { DateTimeStackCell, QuantityCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { DescriptionList } from "@/components/data/DescriptionList";
import { StatusBadge } from "@/components/data/StatusBadge";
import { itemTypeLabels } from "@/components/data/item-types";
import { PageHeader, type PageAction } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { NotFoundState } from "@/components/ui/NotFoundState";
import { Skeleton } from "@/components/ui/Skeleton";
import type { RecallTrace } from "@/lib/api/types";
import { dayLabel } from "@/lib/calendar";
import { formatDateTime, formatPhone, formatQuantity, isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

/** صيغتا التصدير في العقد: `GET /batches/{id}/recall-trace?format=`. */
export type RecallTraceExportFormat = "pdf" | "xlsx";

type RecallTraceViewProps = {
  /** `GET /batches/{id}/recall-trace`. خطأ `not_found` يعرض «غير موجود أو خارج نطاقك». */
  trace: Loadable<RecallTrace>;
  /** الصيغة قيد التصدير الآن: يعطّل أزرار التصدير ويُظهر التحميل على الزر. */
  exporting?: RecallTraceExportFormat | null;
  onExport?: (format: RecallTraceExportFormat) => void;
  /** يعود إلى تفاصيل الدفعة (W18). */
  onBack?: () => void;
  onRetry?: () => void;
};

type Holder = NonNullable<RecallTrace["holders"]>[number];
type CustomerDelivery = NonNullable<RecallTrace["customer_deliveries"]>[number];
type VisitDistribution = NonNullable<RecallTrace["visit_distributions"]>[number];

const locationTypeLabels = { WAREHOUSE: "مستودع", AGENT: "وكيل", REP: "مندوب" } as const;
const sum = (values: readonly (number | undefined)[]) => values.reduce<number>((total, value) => total + (value ?? 0), 0);

/**
 * تقرير تتبع السحب (W19): أين الدفعة الآن وإلى أين وصلت. الباقي في كل موقع (مع ما هو بالطريق)، وما وصل لكل عميل عبر وكيله بتاريخه،
 * وما وُزّع في الزيارات، وفيه ما وُزّع بعد الإيقاف من جهاز كان دون اتصال (معلّم). تصدير PDF أو Excel.
 */
export function RecallTraceView({ trace, exporting = null, onExport, onBack, onRetry }: RecallTraceViewProps) {
  if (trace.status === "loading") {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <div className="flex flex-col gap-2 pb-4">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  if (trace.status === "error") {
    return trace.code === "not_found" ? <NotFoundState onBack={onBack} /> : <ErrorState code={trace.code} onRetry={onRetry} />;
  }

  const data = trace.data;
  const batch = data.batch;
  const holders = data.holders ?? [];
  const deliveries = data.customer_deliveries ?? [];
  const distributions = data.visit_distributions ?? [];
  const after = distributions.filter((row) => row.after_suspension);
  const batchNo = batch?.batch_no ? isolate(batch.batch_no) : "";

  const actions: PageAction[] = onExport
    ? [
        { id: "export-pdf", label: exporting === "pdf" ? "جارٍ التصدير…" : "تصدير PDF", disabled: exporting !== null, onSelect: () => onExport("pdf") },
        { id: "export-xlsx", label: exporting === "xlsx" ? "جارٍ التصدير…" : "تصدير Excel", disabled: exporting !== null, onSelect: () => onExport("xlsx") },
      ]
    : [];

  const holderColumns: DataTableColumn<Holder>[] = [
    { key: "location", header: "الموقع", cell: (row) => <TextCell value={row.location?.name} />, priority: "high", role: "primary" },
    { key: "type", header: "النوع", cell: (row) => <TextCell value={row.location?.type ? locationTypeLabels[row.location.type] : null} />, width: "w-28", priority: "high" },
    { key: "on-hand", header: "الباقي", cell: (row) => <QuantityCell value={row.on_hand} />, align: "end", width: "w-32", priority: "high" },
    { key: "in-transit", header: "بالطريق", cell: (row) => (row.in_transit ? <QuantityCell value={row.in_transit} /> : <span className="text-fg-muted">—</span>), align: "end", width: "w-32", priority: "high" },
  ];

  const deliveryColumns: DataTableColumn<CustomerDelivery>[] = [
    { key: "customer", header: "العميل", cell: (row) => <TextCell value={row.customer_name} />, priority: "high", role: "primary" },
    { key: "phone", header: "الهاتف", cell: (row) => (row.phone ? <span dir="ltr" className="block text-end">{formatPhone(row.phone)}</span> : <TextCell value={null} />), width: "w-44" },
    { key: "agent", header: "الوكيل", cell: (row) => <TextCell value={row.agent?.name} />, width: "w-52", priority: "high" },
    { key: "quantity", header: "الكمية", cell: (row) => <QuantityCell value={row.quantity} />, align: "end", width: "w-28", priority: "high" },
    { key: "delivered", header: "التاريخ", cell: (row) => <DateTimeStackCell value={row.delivered_at} />, width: "w-28", priority: "high" },
  ];

  const distributionColumns: DataTableColumn<VisitDistribution>[] = [
    { key: "visit-point", header: "جهة الزيارة", cell: (row) => <TextCell value={row.visit_point_name} />, priority: "high", role: "primary" },
    { key: "rep", header: "المندوب", cell: (row) => <TextCell value={row.rep?.name} />, width: "w-40", priority: "high" },
    { key: "quantity", header: "الكمية", cell: (row) => <QuantityCell value={row.quantity} />, align: "end", width: "w-28", priority: "high" },
    { key: "at", header: "التاريخ", cell: (row) => <DateTimeStackCell value={row.at} />, width: "w-28", priority: "high" },
    {
      key: "after",
      header: "ملاحظة",
      cell: (row) => (row.after_suspension ? <Badge color="danger">بعد الإيقاف</Badge> : <span className="text-fg-muted">—</span>),
      width: "w-32",
      priority: "high",
      role: "status",
    },
  ];

  const totalOf = (label: string, value: number) => <span className="text-label text-fg-muted">{`${label} ${isolate(formatQuantity(value))}`}</span>;

  return (
    <>
      <PageHeader
        title="تقرير تتبع السحب"
        description={`الدفعة ${batchNo}${batch?.item?.name ? ` · ${batch.item.name}` : ""}${data.generated_at ? ` · أُنشئ ${formatDateTime(data.generated_at)}` : ""}`}
        actions={actions}
      />

      <div className="flex flex-col gap-4">
        {after.length > 0 ? (
          <Banner kind="danger" title="وُزّع منها بعد الإيقاف">
            {`${isolate(formatQuantity(sum(after.map((row) => row.quantity))))} علبة في ${isolate(after.length)} زيارات بعد إيقاف الدفعة، من أجهزة كانت دون اتصال حينها. راجع الصفوف المعلّمة.`}
          </Banner>
        ) : null}

        <Card title="الدفعة">
          <DescriptionList
            items={[
              { label: "الصنف", value: batch?.item ? `${batch.item.name}${batch.item.type ? ` · ${itemTypeLabels[batch.item.type]}` : ""}` : null },
              { label: "رقم الدفعة", value: batch?.batch_no ? <span dir="ltr" className="tabular-nums">{batch.batch_no}</span> : null },
              { label: "تاريخ الانتهاء", value: batch?.expiry_date ? dayLabel(batch.expiry_date) : null },
              { label: "الحالة", value: batch?.status ? <StatusBadge entity="batch" status={batch.status} /> : null },
              { label: "الكمية الكلية (المستلمة)", value: batch?.received_total === undefined ? null : <QuantityCell value={batch.received_total} unit="علبة" /> },
              ...(batch?.status === "SUSPENDED" ? [{ label: "سبب الإيقاف", value: batch.suspended_reason }] : []),
            ]}
          />
        </Card>

        <Card title="الباقي في كل موقع" action={holders.length > 0 ? totalOf("المجموع", sum(holders.map((row) => (row.on_hand ?? 0) + (row.in_transit ?? 0)))) : undefined}>
          <DataTable
            label="الباقي من الدفعة في المواقع"
            columns={holderColumns}
            rows={holders}
            getRowKey={(row) => row.location?.id ?? row.location?.name ?? ""}
            empty={<EmptyState className="py-6" icon={Cube} title="لا شيء باقٍ" description="لا رصيد من هذه الدفعة في أي موقع." />}
          />
        </Card>

        <Card title="ما وصل للعملاء" action={deliveries.length > 0 ? totalOf("المجموع", sum(deliveries.map((row) => row.quantity))) : undefined}>
          <DataTable
            label="تسليمات الدفعة للعملاء"
            columns={deliveryColumns}
            rows={deliveries}
            getRowKey={(row) => `${row.customer_id}-${row.delivered_at}`}
            empty={<EmptyState className="py-6" icon={UsersThree} title="لم تصل لأي عميل" description="لا تسليمات لعملاء من هذه الدفعة." />}
          />
        </Card>

        <Card title="التوزيع في الزيارات" action={distributions.length > 0 ? totalOf("المجموع", sum(distributions.map((row) => row.quantity))) : undefined}>
          <DataTable
            label="توزيع الدفعة في الزيارات"
            columns={distributionColumns}
            rows={distributions}
            getRowKey={(row) => `${row.rep?.id}-${row.visit_point_name}-${row.at}`}
            empty={<EmptyState className="py-6" icon={MapPin} title="لم تُوزَّع في زيارات" description="لا توزيع من هذه الدفعة في زيارات المندوبين (العيّنات والمواد وحدها)." />}
          />
        </Card>
      </div>
    </>
  );
}

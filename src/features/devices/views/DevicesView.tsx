"use client";

import { DeviceMobile } from "@phosphor-icons/react";
import { TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { Pagination, type PaginationMeta } from "@/components/data/Pagination";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Device } from "@/lib/api/types";
import { formatDateTime, isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

export type DevicesPage = { data: readonly Device[]; meta: PaginationMeta };

type DevicesViewProps = {
  devices: Loadable<DevicesPage>;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  onRetry?: () => void;
};

const columns: DataTableColumn<Device>[] = [
  { key: "user", header: "المندوب", cell: (row) => <TextCell value={row.user?.name} />, width: "w-40", priority: "high", role: "primary" },
  {
    key: "device",
    header: "الجهاز",
    cell: (row) => (
      <span className="flex min-w-0 flex-col">
        <span dir="auto" className="truncate text-start text-body text-fg">
          {row.device_name ?? "جهاز بلا اسم"}
        </span>
        <span dir="ltr" className="block truncate text-end text-caption text-fg-muted">
          {row.device_id}
        </span>
      </span>
    ),
    priority: "high",
  },
  {
    key: "bound",
    header: "الربط",
    cell: (row) => (
      <span className="flex min-w-0 flex-col">
        <span className="text-body text-fg">{row.bound_at ? formatDateTime(row.bound_at) : "—"}</span>
        <span className="text-caption text-fg-muted">{row.approved_by ? `بموافقة ${row.approved_by.name ?? ""}` : "أول دخول"}</span>
      </span>
    ),
    width: "w-48",
  },
  { key: "sync", header: "آخر مزامنة", cell: (row) => <TextCell value={row.last_sync_at ? formatDateTime(row.last_sync_at) : "لم يزامن بعد"} />, width: "w-44", priority: "high" },
  { key: "version", header: "الإصدار", cell: (row) => <TextCell value={row.app_version ? isolate(row.app_version) : null} />, width: "w-24" },
  { key: "status", header: "الحالة", cell: (row) => <Badge color={row.status === "ACTIVE" ? "success" : "neutral"}>{row.status === "ACTIVE" ? "مربوط" : "مفكوك"}</Badge>, width: "w-24", role: "status" },
];

/**
 * الأجهزة (I05): أجهزة المندوبين المربوطة والمفكوكة: الجهاز ومعرّفه، ومتى رُبط (أول دخول أو بموافقة طلب تغيير)، وآخر مزامنة، وإصدار التطبيق.
 * جهاز واحد مربوط لكل مندوب. التغيير بطلب في «طلبات تغيير الجهاز».
 */
export function DevicesView({ devices, onPageChange, onPerPageChange, onRetry }: DevicesViewProps) {
  return (
    <>
      <PageHeader title="الأجهزة" description="جهاز واحد مربوط لكل مندوب. يُربط عند أول دخول، ويتغيّر بطلب يوافق عليه IT." />
      <div className="flex flex-col gap-4">
        <DataTable
          label="الأجهزة"
          columns={columns}
          rows={devices.status === "ready" ? devices.data.data : []}
          getRowKey={(row) => row.id ?? ""}
          loading={devices.status === "loading"}
          error={devices.status === "error" ? { code: devices.code, onRetry } : undefined}
          empty={<EmptyState icon={DeviceMobile} title="لا أجهزة بعد" description="يُربط جهاز المندوب عند أول دخول للتطبيق." />}
        />
        {devices.status === "ready" ? <Pagination meta={devices.data.meta} onPageChange={onPageChange} onPerPageChange={onPerPageChange} /> : null}
      </div>
    </>
  );
}

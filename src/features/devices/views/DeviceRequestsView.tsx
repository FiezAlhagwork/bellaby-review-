"use client";

import { DeviceMobile } from "@phosphor-icons/react";
import { TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { FilterBar } from "@/components/data/FilterBar";
import { Pagination, type PaginationMeta } from "@/components/data/Pagination";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { Combobox } from "@/components/ui/Combobox";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Option } from "@/components/ui/OptionList";
import { ReasonDialog } from "@/components/ui/ReasonDialog";
import { errorMessage } from "@/lib/api/error-messages";
import type { DeviceChangeRequest } from "@/lib/api/types";
import { formatDateShort, formatDateTime, formatTime } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

type RequestStatus = NonNullable<DeviceChangeRequest["status"]>;
export type DeviceRequestsPage = { data: readonly DeviceChangeRequest[]; meta: PaginationMeta };

/** القرار قيد الكتابة: `POST /device-change-requests/{id}/decision { decision, reason }`. */
export type DeviceDecision = { request: DeviceChangeRequest; decision: "APPROVED" | "REJECTED" };

type DeviceRequestsViewProps = {
  /** المعلّقة أولاً. */
  requests: Loadable<DeviceRequestsPage>;
  status: RequestStatus | null;
  onStatusChange: (status: RequestStatus | null) => void;
  /** `devices.manage`. */
  canDecide: boolean;
  /** آخر مزامنة للجهاز القديم قبل هذا الوقت = «لم يُزامن منذ مدة» (الحدّ من الحاوية؛ غير معرّف في العقد §78). */
  staleBefore: string;
  deciding: DeviceDecision | null;
  onDecidingChange: (deciding: DeviceDecision | null) => void;
  reason: string;
  onReasonChange: (reason: string) => void;
  reasonError?: string;
  onDecide?: () => void;
  submitting?: boolean;
  /** رمز خطأ القرار (409 `invalid_status`: قُرّر الطلب قبلك). */
  decisionError?: string;
  onDismissError?: () => void;
  onPageChange: (page: number) => void;
  onRetry?: () => void;
};

const statusLabels: Record<RequestStatus, string> = { PENDING: "معلّق", APPROVED: "مقبول", REJECTED: "مرفوض" };
const statusColor = { PENDING: "warning", APPROVED: "success", REJECTED: "danger" } as const satisfies Record<RequestStatus, "warning" | "success" | "danger">;
const statusOptions: Option[] = (["PENDING", "APPROVED", "REJECTED"] as const).map((value) => ({ value, label: statusLabels[value] }));

/**
 * طلبات تغيير الجهاز (I06): المعلّقة أولاً: المندوب، والجهاز الجديد، والجهاز القديم وآخر مزامنة له (ليعرف IT إن بقي عمل لم يُرفع).
 * «موافقة» تنقل الربط وتنهي جلسة القديم، و«رفض»، وكلاهما بسبب. المهلة 24 ساعة عمل.
 */
export function DeviceRequestsView({
  requests,
  status,
  onStatusChange,
  canDecide,
  staleBefore,
  deciding,
  onDecidingChange,
  reason,
  onReasonChange,
  reasonError,
  onDecide,
  submitting = false,
  decisionError,
  onDismissError,
  onPageChange,
  onRetry,
}: DeviceRequestsViewProps) {
  const stale = (row: DeviceChangeRequest) => row.status === "PENDING" && row.old_device !== null && (row.old_device_last_sync_at === null || (row.old_device_last_sync_at ?? "") < staleBefore);

  const columns: DataTableColumn<DeviceChangeRequest>[] = [
    { key: "user", header: "المندوب", cell: (row) => <TextCell value={row.user?.name} />, width: "w-40", priority: "high", role: "primary" },
    {
      key: "new",
      header: "الجهاز الجديد",
      cell: (row) => (
        <span className="flex min-w-0 flex-col">
          <span dir="auto" className="truncate text-start text-body text-fg">
            {row.new_device_name ?? "جهاز بلا اسم"}
          </span>
          <span dir="ltr" className="block truncate text-end text-caption text-fg-muted">
            {row.new_device_id}
          </span>
        </span>
      ),
      priority: "high",
    },
    {
      key: "old",
      header: "الجهاز القديم · آخر مزامنة",
      cell: (row) => (
        <span className="flex min-w-0 flex-col items-start gap-1">
          <span dir="auto" className="truncate text-start text-body text-fg">
            {row.old_device ? (row.old_device.device_name ?? "جهاز بلا اسم") : "لا جهاز سابق"}
          </span>
          {stale(row) ? (
            <Badge color="warning">{row.old_device_last_sync_at ? `لم يُزامن منذ ${formatDateShort(row.old_device_last_sync_at)}` : "لم يزامن قط"}</Badge>
          ) : row.old_device ? (
            <span className="text-caption text-fg-muted">{row.old_device_last_sync_at ? formatDateTime(row.old_device_last_sync_at) : "لم يزامن قط"}</span>
          ) : null}
        </span>
      ),
      width: "w-60",
      priority: "high",
    },
    { key: "requested", header: "الطلب", cell: (row) => <TextCell value={row.requested_at ? `${formatDateShort(row.requested_at)} · ${formatTime(row.requested_at)}` : null} />, width: "w-44" },
    {
      key: "status",
      header: "الحالة",
      cell: (row) => (
        <span className="flex min-w-0 flex-col items-start gap-1">
          {row.status ? <Badge color={statusColor[row.status]}>{statusLabels[row.status]}</Badge> : null}
          {row.decided_by ? <span className="text-caption text-fg-muted">{`${row.decided_by.name ?? ""} · ${row.decided_at ? formatDateTime(row.decided_at) : ""}`}</span> : null}
        </span>
      ),
      width: "w-48",
      role: "status",
    },
  ];

  const staleDecision = deciding?.decision === "APPROVED" && stale(deciding.request);
  const description =
    deciding === null
      ? ""
      : deciding.decision === "APPROVED"
        ? `يُنقل ربط ${deciding.request.user?.name ?? ""} إلى «${deciding.request.new_device_name ?? deciding.request.new_device_id ?? ""}» وتنتهي جلسة الجهاز القديم.${staleDecision ? " الجهاز القديم لم يُزامن منذ مدة: قد يضيع عمل لم يُرفع. تواصل مع السوبرفايزر قبل الموافقة." : ""}`
        : `يبقى ${deciding.request.user?.name ?? ""} على جهازه الحالي، ولا يدخل من الجهاز الجديد.`;

  return (
    <>
      <PageHeader title="طلبات تغيير الجهاز" description="المندوب يطلب ربط جهاز جديد. راجع آخر مزامنة للجهاز القديم قبل الموافقة. المهلة 24 ساعة عمل." />

      <div className="flex flex-col gap-4">
        {decisionError ? (
          <Banner kind="danger" title="تعذّر تسجيل القرار" onClose={onDismissError}>
            {errorMessage(decisionError)}
          </Banner>
        ) : null}

        <FilterBar
          quickFilters={[
            <Combobox key="status" aria-label="الحالة" placeholder="كل الحالات" options={statusOptions} value={status} onValueChange={(value) => onStatusChange(value as RequestStatus | null)} clearable />,
          ]}
          active={status ? [{ key: "status", label: `الحالة: ${statusLabels[status]}`, onRemove: () => onStatusChange(null) }] : []}
          onClearAll={() => onStatusChange(null)}
        />

        <DataTable
          label="طلبات تغيير الجهاز"
          columns={columns}
          rows={requests.status === "ready" ? requests.data.data : []}
          getRowKey={(row) => row.id ?? ""}
          loading={requests.status === "loading"}
          error={requests.status === "error" ? { code: requests.code, onRetry } : undefined}
          empty={<EmptyState icon={DeviceMobile} title={status ? "لا طلبات بهذه الحالة" : "لا طلبات"} description="تصل هنا طلبات المندوبين لربط جهاز جديد." />}
          rowActions={
            canDecide
              ? (row) =>
                  row.status === "PENDING"
                    ? [
                        { id: "approve", label: "موافقة", onSelect: () => onDecidingChange({ request: row, decision: "APPROVED" }) },
                        { id: "reject", label: "رفض", danger: true, onSelect: () => onDecidingChange({ request: row, decision: "REJECTED" }) },
                      ]
                    : [{ id: "decided", label: "قُرّر", disabled: true, reason: row.reason ? `السبب: ${row.reason}` : "قُرّر الطلب.", onSelect: () => {} }]
              : undefined
          }
        />

        {requests.status === "ready" ? <Pagination meta={requests.data.meta} onPageChange={onPageChange} /> : null}
      </div>

      <ReasonDialog
        open={deciding !== null}
        onOpenChange={(open) => {
          if (!open) onDecidingChange(null);
        }}
        title={deciding?.decision === "APPROVED" ? "الموافقة على الجهاز الجديد؟" : "رفض الطلب؟"}
        description={description}
        confirmLabel={deciding?.decision === "APPROVED" ? "موافقة" : "رفض"}
        reason={reason}
        onReasonChange={onReasonChange}
        error={reasonError}
        danger={deciding?.decision === "REJECTED"}
        loading={submitting}
        onConfirm={() => onDecide?.()}
      />
    </>
  );
}

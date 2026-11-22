"use client";

import { CalendarCheck, MagnifyingGlass } from "@phosphor-icons/react";
import { StatusCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { FilterBar, type ActiveFilter } from "@/components/data/FilterBar";
import { Pagination } from "@/components/data/Pagination";
import { statusMap } from "@/components/data/status-map";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Option } from "@/components/ui/OptionList";
import { ReasonDialog } from "@/components/ui/ReasonDialog";
import { leaveDays, leavePeriod } from "@/features/leaves/components/leave-format";
import type { LeavesPage } from "@/features/leaves/views/MyLeavesView";
import { errorMessage } from "@/lib/api/error-messages";
import type { Leave, LeaveStatus } from "@/lib/api/types";
import type { IsoDate } from "@/lib/calendar";
import { formatDateTime } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

/** النافذة المفتوحة: تأكيد الاعتماد، أو الرفض بسبب. */
export type LeaveDialog = { kind: "approve" | "reject"; leave: Leave; reason: string } | null;

export type LeaveFilters = { status: LeaveStatus | null };
export const noLeaveFilters: LeaveFilters = { status: null };

type LeaveApprovalsViewProps = {
  leaves: Loadable<LeavesPage>;
  /** المدير المباشر (`scope=to_decide`): أزرار القرار. المحاسب (`scope=all`) يطّلع بلا أزرار. */
  canDecide: boolean;
  filters: LeaveFilters;
  onFiltersChange: (filters: LeaveFilters) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  today: IsoDate;
  dialog: LeaveDialog;
  onDialogChange: (dialog: LeaveDialog) => void;
  onConfirm?: () => void;
  deciding?: boolean;
  errors?: Readonly<Record<string, string>>;
  /** `already_decided` أو `invalid_status`. */
  actionError?: string;
  conflict?: { decidedBy: string; decidedAt: string };
  onRetry?: () => void;
};

const statusOptions: Option[] = (Object.keys(statusMap.leave) as LeaveStatus[]).map((value) => ({ value, label: statusMap.leave[value].label }));

/**
 * طلبات الإجازة للموافقة (G18): المعلّقة أولاً بالموظف والفترة والسبب والمدة، ولكل معلّقة «اعتماد» و«رفض» بسبب.
 * الموافق هو المدير المباشر وقت الطلب، واعتماد أيام مضت يُغلق علامات الغياب لها (القراران 9 و15). إجازة رئيس القسم لا يشملها التفويض.
 */
export function LeaveApprovalsView({ leaves, canDecide, filters, onFiltersChange, onPageChange, onPerPageChange, today, dialog, onDialogChange, onConfirm, deciding = false, errors = {}, actionError, conflict, onRetry }: LeaveApprovalsViewProps) {
  const active: ActiveFilter[] = filters.status ? [{ key: "status", label: `الحالة: ${statusMap.leave[filters.status].label}`, onRemove: () => onFiltersChange(noLeaveFilters) }] : [];
  const pastDays = dialog?.leave.from ? dialog.leave.from < today : false;

  const columns: DataTableColumn<Leave>[] = [
    { key: "employee", header: "الموظف", cell: (row) => <span className="text-body text-fg">{row.employee?.name ?? "—"}</span>, width: "w-44", priority: "high", role: "primary" },
    { key: "period", header: "الفترة", cell: (row) => <span className="line-clamp-2 text-body text-fg">{leavePeriod(row.from, row.to)}</span>, width: "w-60", priority: "high" },
    { key: "days", header: "المدة", cell: (row) => leaveDays(row.from, row.to), width: "w-24", priority: "high" },
    { key: "reason", header: "السبب", cell: (row) => <span className="line-clamp-2 text-body text-fg">{row.reason ?? "—"}</span> },
    ...(canDecide ? [] : [{ key: "approver", header: "الموافق", cell: (row: Leave) => <span className="text-body text-fg">{row.decided_by?.name ?? row.approver?.name ?? "—"}</span>, width: "w-40" }]),
    {
      key: "status",
      header: "الحالة",
      cell: (row) => (
        <span className="flex flex-wrap items-center gap-1">
          {row.status ? <StatusCell entity="leave" status={row.status} /> : null}
          {row.status === "PENDING" && row.from && row.from < today ? <Badge color="warning">أيام مضت</Badge> : null}
        </span>
      ),
      width: "w-40",
      priority: "high",
      role: "status",
    },
    ...(canDecide
      ? [
          {
            key: "actions",
            header: "",
            cell: (row: Leave) =>
              row.status === "PENDING" ? (
                <span className="flex gap-2">
                  <Button variant="primary" size="sm" onClick={() => onDialogChange({ kind: "approve", leave: row, reason: "" })}>
                    اعتماد
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => onDialogChange({ kind: "reject", leave: row, reason: "" })}>
                    رفض
                  </Button>
                </span>
              ) : (
                <span className="line-clamp-2 text-label text-fg-muted">{row.decision_reason ?? (row.decided_at ? formatDateTime(row.decided_at) : "")}</span>
              ),
            width: "w-48",
            priority: "high" as const,
          },
        ]
      : []),
  ];

  const empty =
    active.length > 0 ? (
      <EmptyState
        icon={MagnifyingGlass}
        title="لا نتائج للفلتر"
        description="لا طلبات تطابق ما اخترته."
        action={
          <Button variant="secondary" onClick={() => onFiltersChange(noLeaveFilters)}>
            مسح الفلاتر
          </Button>
        }
      />
    ) : (
      <EmptyState icon={CalendarCheck} title={canDecide ? "لا طلبات بانتظار قرارك" : "لا طلبات إجازة"} description={canDecide ? "تظهر هنا طلبات من تديرهم مباشرة." : "تظهر هنا طلبات الإجازة لكل الموظفين."} />
    );

  return (
    <>
      <PageHeader title={canDecide ? "طلبات الإجازة" : "الإجازات"} description={canDecide ? "طلبات من تديرهم مباشرة، المعلّقة أولاً." : "كل طلبات الإجازة وحالاتها، للاطلاع."} />

      <div className="flex flex-col gap-4">
        {actionError ? (
          <Banner kind="warning" title={actionError === "already_decided" ? "قرّر غيرك أولاً" : "تعذّر تنفيذ القرار"}>
            {conflict ? `${errorMessage(actionError)} قرّر ${conflict.decidedBy} ${formatDateTime(conflict.decidedAt)}.` : errorMessage(actionError)}
          </Banner>
        ) : null}

        <FilterBar
          quickFilters={[<Combobox key="status" aria-label="الحالة" placeholder="كل الحالات" options={statusOptions} value={filters.status} onValueChange={(status) => onFiltersChange({ status: status as LeaveStatus | null })} clearable />]}
          active={active}
          onClearAll={() => onFiltersChange(noLeaveFilters)}
        />

        <DataTable
          label="طلبات الإجازة"
          columns={columns}
          rows={leaves.status === "ready" ? leaves.data.data : []}
          getRowKey={(row) => row.id ?? ""}
          loading={leaves.status === "loading"}
          error={leaves.status === "error" ? { code: leaves.code, onRetry } : undefined}
          empty={empty}
        />

        {leaves.status === "ready" ? <Pagination meta={leaves.data.meta} onPageChange={onPageChange} onPerPageChange={onPerPageChange} /> : null}
      </div>

      <ConfirmDialog
        open={dialog?.kind === "approve"}
        onOpenChange={(next) => (next ? undefined : onDialogChange(null))}
        title="اعتماد الإجازة؟"
        description={dialog ? `إجازة ${dialog.leave.employee?.name ?? ""} ${leavePeriod(dialog.leave.from, dialog.leave.to)} (${leaveDays(dialog.leave.from, dialog.leave.to)}).${pastDays ? " ستُغلق علامات الغياب لتلك الأيام." : ""}` : ""}
        confirmLabel="اعتماد"
        cancelLabel="تراجع"
        loading={deciding}
        onConfirm={() => onConfirm?.()}
      />

      <ReasonDialog
        open={dialog?.kind === "reject"}
        onOpenChange={(next) => (next ? undefined : onDialogChange(null))}
        title="رفض الإجازة؟"
        description={dialog ? `يصل السبب إلى ${dialog.leave.employee?.name ?? "الموظف"}.` : ""}
        confirmLabel="رفض الإجازة"
        cancelLabel="تراجع"
        reasonLabel="السبب"
        reason={dialog?.kind === "reject" ? dialog.reason : ""}
        onReasonChange={(reason) => (dialog ? onDialogChange({ ...dialog, reason }) : undefined)}
        error={errors.reason}
        danger
        loading={deciding}
        onConfirm={() => onConfirm?.()}
      />
    </>
  );
}

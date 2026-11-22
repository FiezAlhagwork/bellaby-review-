"use client";

import { CalendarCheck } from "@phosphor-icons/react";
import { StatusCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { Pagination, type PaginationMeta } from "@/components/data/Pagination";
import { Grid } from "@/components/layout/Grid";
import { PageHeader } from "@/components/layout/PageHeader";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DatePicker } from "@/components/ui/DatePicker";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field } from "@/components/ui/Field";
import { Textarea } from "@/components/ui/Textarea";
import { leaveDays, leavePeriod } from "@/features/leaves/components/leave-format";
import { errorMessage } from "@/lib/api/error-messages";
import type { Leave } from "@/lib/api/types";
import type { IsoDate } from "@/lib/calendar";
import type { Loadable } from "@/lib/loadable";

/** نافذة «طلب إجازة» كما يرسلها `POST /leaves`. */
export type LeaveRequestForm = { from: IsoDate | null; to: IsoDate | null; reason: string };
export const emptyLeaveRequest: LeaveRequestForm = { from: null, to: null, reason: "" };

export type LeavesPage = { data: readonly Leave[]; meta: PaginationMeta };

type MyLeavesViewProps = {
  leaves: Loadable<LeavesPage>;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  request: LeaveRequestForm | null;
  onRequestChange: (form: LeaveRequestForm | null) => void;
  onSubmitRequest?: () => void;
  submitting?: boolean;
  /** `validation_failed` لحقول النافذة (`from`، `to`، `reason`). */
  requestErrors?: Readonly<Record<string, string>>;
  /** رمز بلا حقل (`leave_before_current_month`). */
  requestError?: string;
  /** اليوم وأول الشهر الحالي: يجوز يوم مضى ضمن الشهر الحالي. */
  today: IsoDate;
  monthStart: IsoDate;
  /** الطلب المراد إلغاؤه (نافذة التأكيد). */
  cancelTarget: Leave | null;
  onCancelTargetChange: (leave: Leave | null) => void;
  onConfirmCancel?: () => void;
  cancelling?: boolean;
  /** `leave_already_decided`: بُتّ فيها قبل الإلغاء. */
  actionError?: string;
  onRetry?: () => void;
};

/**
 * إجازاتي (G17): «طلب إجازة» (من، وإلى، والسبب) وسجل الطلبات بحالاتها وقرار المدير المباشر.
 * يجوز أن تبدأ بيوم مضى ضمن الشهر الحالي، والمعلّقة تُلغى قبل البت.
 */
export function MyLeavesView({
  leaves,
  onPageChange,
  onPerPageChange,
  request,
  onRequestChange,
  onSubmitRequest,
  submitting = false,
  requestErrors = {},
  requestError,
  today,
  monthStart,
  cancelTarget,
  onCancelTargetChange,
  onConfirmCancel,
  cancelling = false,
  actionError,
  onRetry,
}: MyLeavesViewProps) {
  const inverted = request?.from && request.to ? request.to < request.from : false;
  const pastDays = request?.from ? request.from < today : false;

  const columns: DataTableColumn<Leave>[] = [
    { key: "period", header: "الفترة", cell: (row) => <span className="text-body text-fg">{leavePeriod(row.from, row.to)}</span>, priority: "high", role: "primary" },
    { key: "days", header: "المدة", cell: (row) => leaveDays(row.from, row.to), width: "w-24", priority: "high" },
    { key: "reason", header: "السبب", cell: (row) => <span className="line-clamp-2 text-body text-fg">{row.reason ?? "—"}</span> },
    { key: "status", header: "الحالة", cell: (row) => (row.status ? <StatusCell entity="leave" status={row.status} /> : null), width: "w-28", priority: "high", role: "status" },
    {
      key: "decision",
      header: "القرار",
      cell: (row) =>
        row.status === "PENDING" ? (
          <span className="text-body text-fg-muted">{`عند ${row.approver?.name ?? "مديرك"}`}</span>
        ) : row.decided_by ? (
          <span className="flex min-w-0 flex-col">
            <span className="text-body text-fg">{row.decided_by.name}</span>
            {row.decision_reason ? <span className="line-clamp-1 text-label text-fg-muted">{row.decision_reason}</span> : null}
          </span>
        ) : (
          "—"
        ),
      width: "w-48",
    },
    {
      key: "actions",
      header: "",
      cell: (row) =>
        row.status === "PENDING" ? (
          <Button variant="ghost" size="sm" onClick={() => onCancelTargetChange(row)}>
            إلغاء الطلب
          </Button>
        ) : null,
      width: "w-32",
      priority: "high",
    },
  ];

  return (
    <>
      <PageHeader title="إجازاتي" description="يعتمدها مديرك المباشر. يجوز أن تبدأ بيوم مضى من الشهر الحالي." actions={[{ id: "request", label: "طلب إجازة", primary: true, onSelect: () => onRequestChange(emptyLeaveRequest) }]} />

      <div className="flex flex-col gap-4">
        {actionError ? (
          <Banner kind="warning" title="تعذّر إلغاء الطلب">
            {errorMessage(actionError)}
          </Banner>
        ) : null}

        <DataTable
          label="إجازاتي"
          columns={columns}
          rows={leaves.status === "ready" ? leaves.data.data : []}
          getRowKey={(row) => row.id ?? ""}
          loading={leaves.status === "loading"}
          error={leaves.status === "error" ? { code: leaves.code, onRetry } : undefined}
          empty={<EmptyState icon={CalendarCheck} title="لا طلبات إجازة بعد" description="اطلب إجازة من «طلب إجازة»." />}
        />

        {leaves.status === "ready" ? <Pagination meta={leaves.data.meta} onPageChange={onPageChange} onPerPageChange={onPerPageChange} /> : null}
      </div>

      <Dialog
        open={request !== null}
        onOpenChange={(next) => (next ? undefined : onRequestChange(null))}
        dismissible={!submitting}
        size="sm"
        title="طلب إجازة"
        description="يصل الطلب إلى مديرك المباشر."
        actions={[
          <Button key="cancel" variant="secondary" disabled={submitting} onClick={() => onRequestChange(null)}>
            تراجع
          </Button>,
          <Button key="ok" variant="primary" loading={submitting} disabled={!request?.from || !request.to || inverted} onClick={() => onSubmitRequest?.()}>
            إرسال الطلب
          </Button>,
        ]}
      >
        {request ? (
          <div className="flex flex-col gap-4">
            {requestError ? (
              <Banner kind="danger" title="تعذّر إرسال الطلب">
                {errorMessage(requestError)}
              </Banner>
            ) : null}
            <Grid cols={{ base: 1, tablet: 2 }} gap={4}>
              <Field label="من" required error={requestErrors.from}>
                <DatePicker aria-label="من" value={request.from} onValueChange={(from) => onRequestChange({ ...request, from })} min={monthStart} today={today} invalid={Boolean(requestErrors.from)} disabled={submitting} />
              </Field>
              <Field label="إلى" required error={requestErrors.to ?? (inverted ? "قبل تاريخ البداية." : undefined)}>
                <DatePicker aria-label="إلى" value={request.to} onValueChange={(to) => onRequestChange({ ...request, to })} min={request.from ?? monthStart} today={today} invalid={inverted || Boolean(requestErrors.to)} disabled={submitting} />
              </Field>
            </Grid>
            {pastDays ? (
              <Banner kind="info" title="تبدأ بيوم مضى">
                إن اعتمدها مديرك تُغلق علامات الغياب لتلك الأيام.
              </Banner>
            ) : null}
            <Field label="السبب" optional error={requestErrors.reason}>
              <Textarea aria-label="السبب" value={request.reason} onChange={(event) => onRequestChange({ ...request, reason: event.target.value })} disabled={submitting} />
            </Field>
          </div>
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={cancelTarget !== null}
        onOpenChange={(next) => (next ? undefined : onCancelTargetChange(null))}
        title="إلغاء طلب الإجازة؟"
        description={cancelTarget ? `يُلغى طلب ${leavePeriod(cancelTarget.from, cancelTarget.to)} ولا يصل إلى مديرك للبت.` : ""}
        confirmLabel="إلغاء الطلب"
        cancelLabel="تراجع"
        danger
        loading={cancelling}
        onConfirm={() => onConfirmCancel?.()}
      />
    </>
  );
}

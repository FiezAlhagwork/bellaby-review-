"use client";

import { PlusCircle, Truck, XCircle } from "@phosphor-icons/react";
import { ActivityLog, type ActivityEvent } from "@/components/data/ActivityLog";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { DescriptionList } from "@/components/data/DescriptionList";
import { StatusBadge } from "@/components/data/StatusBadge";
import { itemTypeLabels } from "@/components/data/item-types";
import { QuantityCell, TextCell } from "@/components/data/cells";
import { PageHeader, type PageAction } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { NotFoundState } from "@/components/ui/NotFoundState";
import { ReasonDialog } from "@/components/ui/ReasonDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { errorMessage } from "@/lib/api/error-messages";
import type { SampleRequest } from "@/lib/api/types";
import { formatDateTime, isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

/** نافذة «رفض الطلب» المفتوحة: السبب المكتوب وحالة الطلب. null = مغلقة. */
export type SampleRequestRejection = { reason: string; loading?: boolean; /** رمز خطأ العقد (invalid_status وvalidation_failed…). */ errorCode?: string };

type SampleRequestDetailsViewProps = {
  /** `GET /sample-requests/{id}`. خطأ `not_found` يعرض «غير موجود أو خارج نطاقك». */
  request: Loadable<SampleRequest>;
  /** صلاحية الصرف والرفض: `transfers.create` في العقد (اللوجستي). */
  canDecide: boolean;
  rejection?: SampleRequestRejection | null;
  onStartReject?: () => void;
  onRejectReasonChange?: (reason: string) => void;
  onConfirmReject?: () => void;
  onDismissReject?: () => void;
  /** ينقل إلى W06 معبّأً من الطلب (`sample_request_id`). */
  onDispatch?: () => void;
  /** يفتح الصرف المرتبط (W08). بدونه يظهر رقمه نصاً. */
  onOpenTransfer?: (transferId: number) => void;
  onBack?: () => void;
  onRetry?: () => void;
};

type Line = NonNullable<SampleRequest["lines"]>[number];

/** أحداث السجل من حقول الطلب نفسها (لا endpoint للسجل ولا `decided_by`): الأحدث أولاً. */
function buildEvents(request: SampleRequest): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  if (request.created_at) {
    events.push({ id: "created", icon: PlusCircle, sentence: `رفع ${request.requested_by?.name ?? "—"} الطلب للمندوب ${request.rep?.name ?? "—"}`, at: request.created_at });
  }
  if (request.decided_at) {
    if (request.status === "DISPATCHED") events.push({ id: "dispatched", icon: Truck, sentence: "صُرف الطلب", at: request.decided_at });
    if (request.status === "REJECTED") events.push({ id: "rejected", icon: XCircle, sentence: "رُفض الطلب", reason: request.reject_reason ?? undefined, at: request.decided_at });
    if (request.status === "CANCELLED") events.push({ id: "cancelled", icon: XCircle, sentence: `ألغى ${request.requested_by?.name ?? "الطالب"} الطلب قبل الصرف`, at: request.decided_at });
  }
  return events.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}

const isShort = (line: Line) => line.dispatched_quantity !== null && line.dispatched_quantity !== undefined && (line.requested_quantity ?? 0) > line.dispatched_quantity;

/**
 * تفاصيل طلب العينات (W10): المطلوب والمصروف لكل صنف، والسبب، والحالة. للجديد يصرفه اللوجستي (يفتح W06 معبّأً) أو يرفضه بسبب إلزامي.
 * الإلغاء للطالب وحده (قبل الصرف) فلا زر له هنا. المصروف يرتبط بصرفه، وإن صُرف أقل من المطلوب يظهر ذلك في الأصناف.
 */
export function SampleRequestDetailsView({
  request,
  canDecide,
  rejection = null,
  onStartReject,
  onRejectReasonChange,
  onConfirmReject,
  onDismissReject,
  onDispatch,
  onOpenTransfer,
  onBack,
  onRetry,
}: SampleRequestDetailsViewProps) {
  if (request.status === "loading") {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <div className="flex flex-col gap-2 pb-4">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (request.status === "error") {
    return request.code === "not_found" ? <NotFoundState onBack={onBack} /> : <ErrorState code={request.code} onRetry={onRetry} />;
  }

  const data = request.data;
  const lines = data.lines ?? [];
  const isNew = data.status === "NEW";
  const shortLines = lines.filter(isShort).length;

  const actions: PageAction[] =
    isNew && canDecide
      ? [
          { id: "reject", label: "رفض", danger: true, onSelect: () => onStartReject?.() },
          { id: "dispatch", label: "صرف", primary: true, onSelect: () => onDispatch?.() },
        ]
      : [];

  const transferLink =
    data.transfer_id === null || data.transfer_id === undefined ? null : onOpenTransfer ? (
      <button type="button" onClick={() => onOpenTransfer(data.transfer_id as number)} className="text-link hover:underline">
        {`الصرف ${isolate(`#${data.transfer_id}`)}`}
      </button>
    ) : (
      `الصرف ${isolate(`#${data.transfer_id}`)}`
    );

  const columns: DataTableColumn<Line>[] = [
    {
      key: "item",
      header: "الصنف",
      cell: (row) => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-body text-fg">{row.item?.name}</span>
          <span className="truncate text-caption text-fg-muted">{row.item?.type ? itemTypeLabels[row.item.type] : ""}</span>
        </span>
      ),
      priority: "high",
      role: "primary",
    },
    { key: "requested", header: "المطلوب", cell: (row) => <QuantityCell value={row.requested_quantity} />, align: "end", width: "w-28", priority: "high" },
    {
      key: "dispatched",
      header: "المصروف",
      cell: (row) =>
        row.dispatched_quantity === null || row.dispatched_quantity === undefined ? (
          <TextCell value={null} />
        ) : (
          <span className="inline-flex items-center gap-2">
            {isShort(row) ? <Badge color="warning">أقل من المطلوب</Badge> : null}
            <QuantityCell value={row.dispatched_quantity} />
          </span>
        ),
      align: "end",
      width: "w-56",
      priority: "high",
    },
  ];

  return (
    <>
      <PageHeader
        title={`طلب عينات ${isolate(`#${data.id}`)}`}
        badge={data.status ? <StatusBadge entity="sampleRequest" status={data.status} /> : undefined}
        description={`للمندوب ${data.rep?.name ?? "—"} · رفعه ${data.requested_by?.name ?? "—"}${data.created_at ? ` · ${formatDateTime(data.created_at)}` : ""}`}
        actions={actions}
      />

      <div className="flex flex-col gap-4">
        {data.status === "REJECTED" ? (
          <Banner kind="danger" title="رُفض الطلب">
            {data.reject_reason ?? "—"}
          </Banner>
        ) : null}

        {data.status === "DISPATCHED" ? (
          <Banner
            kind="success"
            title="صُرف الطلب"
            action={
              data.transfer_id !== null && data.transfer_id !== undefined && onOpenTransfer ? (
                <Button variant="ghost" size="sm" onClick={() => onOpenTransfer(data.transfer_id as number)}>
                  عرض الصرف
                </Button>
              ) : undefined
            }
          >
            {shortLines > 0 ? `صُرف أقل من المطلوب في ${isolate(shortLines)} من أصل ${isolate(lines.length)}.` : "صُرف كل ما طُلب."}
          </Banner>
        ) : null}

        {data.status === "CANCELLED" ? (
          <Banner kind="info" title="أُلغي الطلب">
            {`ألغاه ${data.requested_by?.name ?? "الطالب"} قبل الصرف.`}
          </Banner>
        ) : null}

        <Card title="التفاصيل">
          <DescriptionList
            items={[
              { label: "المندوب", value: data.rep?.name },
              { label: "الطالب", value: data.requested_by?.name },
              { label: "السبب", value: data.reason },
              { label: "الوقت", value: data.created_at ? formatDateTime(data.created_at) : null },
              { label: "وقت القرار", value: data.decided_at ? formatDateTime(data.decided_at) : null },
              { label: "الصرف المرتبط", value: transferLink },
            ]}
          />
        </Card>

        <Card title="الأصناف">
          <DataTable label="أصناف الطلب" columns={columns} rows={lines} getRowKey={(row) => row.item?.id ?? row.item?.name ?? ""} />
        </Card>

        <Card title="السجل">
          <ActivityLog events={buildEvents(data)} />
        </Card>
      </div>

      <ReasonDialog
        open={rejection !== null}
        onOpenChange={(open) => (open ? undefined : onDismissReject?.())}
        title={`رفض الطلب ${isolate(`#${data.id}`)}؟`}
        description="يُسجَّل الرفض بسببه ويراه من رفع الطلب."
        confirmLabel="رفض الطلب"
        cancelLabel="تراجع"
        reason={rejection?.reason ?? ""}
        onReasonChange={(reason) => onRejectReasonChange?.(reason)}
        error={rejection?.errorCode ? errorMessage(rejection.errorCode) : undefined}
        danger
        loading={rejection?.loading}
        onConfirm={() => onConfirmReject?.()}
      />
    </>
  );
}

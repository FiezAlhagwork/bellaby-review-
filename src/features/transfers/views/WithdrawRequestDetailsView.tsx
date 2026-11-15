"use client";

import { ArrowUUpLeft, PlusCircle } from "@phosphor-icons/react";
import { ActivityLog, type ActivityEvent } from "@/components/data/ActivityLog";
import { BatchChip } from "@/components/data/BatchChip";
import { BatchCell, QuantityCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { DescriptionList } from "@/components/data/DescriptionList";
import { StatusBadge } from "@/components/data/StatusBadge";
import { itemTypeLabels } from "@/components/data/item-types";
import { PageHeader, type PageAction } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { ErrorState } from "@/components/ui/ErrorState";
import { NotFoundState } from "@/components/ui/NotFoundState";
import { NumberInput } from "@/components/ui/NumberInput";
import { ReasonDialog } from "@/components/ui/ReasonDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { errorMessage } from "@/lib/api/error-messages";
import type { WithdrawRequest } from "@/lib/api/types";
import { formatDateTime, formatQuantity, isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

type Line = NonNullable<WithdrawRequest["lines"]>[number];

/** مفتاح السطر في نافذة التأكيد: الصنف والدفعة (كما يرسلها `confirm-on-behalf`). */
export const withdrawLineKey = (line: Line) => `${line.item?.id}-${line.batch?.id}`;

/** نافذة «إلغاء الطلب» المفتوحة: السبب المكتوب وحالة الطلب. null = مغلقة. */
export type WithdrawCancellation = { reason: string; loading?: boolean; /** رمز خطأ العقد (invalid_status وvalidation_failed…). */ errorCode?: string };

/** نافذة «تأكيد الاستلام عن المندوب» المفتوحة: الكمية الفعلية لكل سطر (null = لم تُدخل بعد). null = مغلقة. */
export type WithdrawOnBehalf = { quantities: Readonly<Record<string, number | null>>; loading?: boolean; /** رمز خطأ العقد (rep_active وinvalid_status…). */ errorCode?: string };

type WithdrawRequestDetailsViewProps = {
  /** `GET /withdraw-requests/{id}`. خطأ `not_found` يعرض «غير موجود أو خارج نطاقك». */
  request: Loadable<WithdrawRequest>;
  /**
   * هل المندوب فعّال؟ العقد لا يعيد حالة المندوب في `rep` (`UserRef`): مضاف في الواجهة وطلبه في docs/backend-requests.md §15.1.
   * المعطَّل لا يستطيع التسليم من التطبيق، فيؤكد اللوجستي الاستلام عنه.
   */
  repActive: boolean;
  /** الإلغاء قبل التسليم: `withdraw.create`. */
  canCancel: boolean;
  /** التأكيد عن مندوب معطَّل: `withdraw.confirm_on_behalf`. */
  canConfirmOnBehalf: boolean;
  cancellation?: WithdrawCancellation | null;
  onStartCancel?: () => void;
  onCancelReasonChange?: (reason: string) => void;
  onConfirmCancel?: () => void;
  onDismissCancel?: () => void;
  onBehalf?: WithdrawOnBehalf | null;
  onStartOnBehalf?: () => void;
  onOnBehalfQuantityChange?: (lineKey: string, quantity: number | null) => void;
  onConfirmOnBehalf?: () => void;
  onDismissOnBehalf?: () => void;
  onBack?: () => void;
  onRetry?: () => void;
};

/** أحداث السجل من حقول الطلب (لا `cancelled_at` فلا وقت للإلغاء، وهو في الشريط بسببه): الأحدث أولاً. */
function buildEvents(request: WithdrawRequest): ActivityEvent[] {
  const rep = request.rep?.name ?? "—";
  const events: ActivityEvent[] = [];
  if (request.created_at) {
    events.push({ id: "created", icon: PlusCircle, sentence: `طلب ${request.created_by?.name ?? "—"} سحب ما في رصيد ${rep}`, at: request.created_at });
  }
  if (request.confirmed_at) {
    events.push({
      id: "confirmed",
      icon: ArrowUUpLeft,
      sentence: request.confirmed_on_behalf ? `أكّد ${request.confirmed_by?.name ?? "—"} الاستلام عن ${rep} (معطَّل)` : `سلّم ${request.confirmed_by?.name ?? rep} الطلب من التطبيق`,
      at: request.confirmed_at,
    });
  }
  return events.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}

const differs = (line: Line) => line.actual_quantity !== null && line.actual_quantity !== undefined && line.actual_quantity !== line.requested_quantity;

/**
 * تفاصيل طلب السحب (W12): المطلوب والفعلي لكل صنف ودفعة، والسبب، والحالة. الإلغاء قبل التسليم بسبب إلزامي (`withdraw.create`).
 * المندوب المعطَّل لا يسلّم من التطبيق: يؤكد اللوجستي الاستلام عنه بالكمية الفعلية (`withdraw.confirm_on_behalf`)، والفرق فرق مخزون للمراقبة.
 */
export function WithdrawRequestDetailsView({
  request,
  repActive,
  canCancel,
  canConfirmOnBehalf,
  cancellation = null,
  onStartCancel,
  onCancelReasonChange,
  onConfirmCancel,
  onDismissCancel,
  onBehalf = null,
  onStartOnBehalf,
  onOnBehalfQuantityChange,
  onConfirmOnBehalf,
  onDismissOnBehalf,
  onBack,
  onRetry,
}: WithdrawRequestDetailsViewProps) {
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
  const requested = data.status === "REQUESTED";
  const rep = data.rep?.name ?? "—";
  const differing = lines.filter(differs).length;

  const showOnBehalf = requested && !repActive && canConfirmOnBehalf;
  const actions: PageAction[] = [
    ...(requested && canCancel ? [{ id: "cancel", label: "إلغاء الطلب", danger: true, onSelect: () => onStartCancel?.() }] : []),
    ...(showOnBehalf ? [{ id: "on-behalf", label: "تأكيد الاستلام عنه", primary: true, onSelect: () => onStartOnBehalf?.() }] : []),
  ];

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
    { key: "batch", header: "الدفعة", cell: (row) => <BatchCell batch={row.batch} />, width: "w-64", priority: "high" },
    { key: "requested", header: "المطلوب", cell: (row) => <QuantityCell value={row.requested_quantity} />, align: "end", width: "w-28", priority: "high" },
    {
      key: "actual",
      header: "الفعلي",
      cell: (row) =>
        row.actual_quantity === null || row.actual_quantity === undefined ? (
          <TextCell value={null} />
        ) : (
          <span className="inline-flex items-center gap-2">
            {differs(row) ? <Badge color="warning">{(row.actual_quantity ?? 0) < (row.requested_quantity ?? 0) ? "أقل من المطلوب" : "أكثر من المطلوب"}</Badge> : null}
            <QuantityCell value={row.actual_quantity} />
          </span>
        ),
      align: "end",
      width: "w-56",
      priority: "high",
    },
  ];

  const repValue = (
    <span className="flex flex-wrap items-center gap-2">
      <span>{rep}</span>
      {repActive ? null : <Badge color="danger">معطَّل</Badge>}
    </span>
  );

  // ---- نافذة التأكيد عن المندوب
  const quantities = onBehalf?.quantities ?? {};
  const allEntered = lines.length > 0 && lines.every((line) => quantities[withdrawLineKey(line)] !== null && quantities[withdrawLineKey(line)] !== undefined);
  const totalRequested = lines.reduce((sum, line) => sum + (line.requested_quantity ?? 0), 0);
  const totalActual = lines.reduce((sum, line) => sum + (quantities[withdrawLineKey(line)] ?? 0), 0);

  return (
    <>
      <PageHeader
        title={`طلب سحب ${isolate(`#${data.id}`)}`}
        badge={data.status ? <StatusBadge entity="withdrawRequest" status={data.status} /> : undefined}
        description={`من المندوب ${rep} · رفعه ${data.created_by?.name ?? "—"}${data.created_at ? ` · ${formatDateTime(data.created_at)}` : ""}`}
        actions={actions}
      />

      <div className="flex flex-col gap-4">
        {requested && repActive ? (
          <Banner kind="info" title="بانتظار تسليم المندوب">
            لا ينقص رصيد المندوب إلا بتسليمه الأصناف من تطبيقه.
          </Banner>
        ) : null}

        {requested && !repActive ? (
          <Banner kind="warning" title="المندوب معطَّل">
            لا يستطيع التسليم من التطبيق. يؤكد اللوجستي الاستلام عنه بالكمية الفعلية، والفرق عن رصيده فرق مخزون يراه المراقب.
          </Banner>
        ) : null}

        {data.status === "HANDED_OVER" ? (
          <Banner kind="success" title={data.confirmed_on_behalf ? "أُكِّد الاستلام عن المندوب" : "سلّم المندوب الطلب"}>
            {data.confirmed_on_behalf
              ? `أكّد ${data.confirmed_by?.name ?? "اللوجستي"} الاستلام عن ${rep} لأنه معطَّل، بالكمية الفعلية. ${differing > 0 ? `الفرق في ${isolate(differing)} من أصل ${isolate(lines.length)} فرق مخزون يراه المراقب.` : "لا فرق عن المطلوب."}`
              : differing > 0
                ? `سلّم ${rep} الأصناف من تطبيقه، وفي ${isolate(differing)} من أصل ${isolate(lines.length)} كمية مختلفة عن المطلوب.`
                : `سلّم ${rep} كل ما طُلب من تطبيقه.`}
          </Banner>
        ) : null}

        {data.status === "CANCELLED" ? (
          <Banner kind="neutral" title="أُلغي الطلب">
            {`${data.cancelled_by?.name ?? "اللوجستي"} ألغى الطلب قبل التسليم: ${data.cancel_reason ?? "—"}`}
          </Banner>
        ) : null}

        <Card title="التفاصيل">
          <DescriptionList
            items={[
              { label: "المندوب", value: repValue },
              { label: "مستودع الاستلام", value: data.to_location?.name },
              { label: "السبب", value: data.reason },
              { label: "رفعه", value: data.created_by?.name },
              { label: "وقت الطلب", value: data.created_at ? formatDateTime(data.created_at) : null },
              { label: data.confirmed_on_behalf ? "أكّده" : "سلّمه", value: data.confirmed_by?.name },
              { label: "وقت التسليم", value: data.confirmed_at ? formatDateTime(data.confirmed_at) : null },
            ]}
          />
        </Card>

        <Card title="الأصناف">
          <DataTable label="أصناف الطلب" columns={columns} rows={lines} getRowKey={(row) => withdrawLineKey(row)} />
        </Card>

        <Card title="السجل">
          <ActivityLog events={buildEvents(data)} />
        </Card>
      </div>

      <ReasonDialog
        open={cancellation !== null}
        onOpenChange={(open) => (open ? undefined : onDismissCancel?.())}
        title={`إلغاء الطلب ${isolate(`#${data.id}`)}؟`}
        description="يُلغى الطلب قبل أن يسلّم المندوب، ولا يتغيّر رصيده."
        confirmLabel="إلغاء الطلب"
        cancelLabel="تراجع"
        reason={cancellation?.reason ?? ""}
        onReasonChange={(reason) => onCancelReasonChange?.(reason)}
        error={cancellation?.errorCode ? errorMessage(cancellation.errorCode) : undefined}
        danger
        loading={cancellation?.loading}
        onConfirm={() => onConfirmCancel?.()}
      />

      <Dialog
        open={onBehalf !== null}
        onOpenChange={(open) => (open ? undefined : onDismissOnBehalf?.())}
        dismissible={!onBehalf?.loading}
        size="md"
        title="تأكيد الاستلام عن المندوب"
        description={`${rep} معطَّل. أدخل الكمية التي استلمتها فعلاً من كل سطر. الفرق عن رصيده فرق مخزون يراه المراقب.`}
        actions={[
          <Button key="back" variant="secondary" disabled={onBehalf?.loading} onClick={onDismissOnBehalf}>
            تراجع
          </Button>,
          <Button key="confirm" variant="primary" loading={onBehalf?.loading} disabled={!allEntered} onClick={onConfirmOnBehalf}>
            تأكيد الاستلام
          </Button>,
        ]}
      >
        <div className="flex flex-col gap-4">
          {onBehalf?.errorCode ? (
            <Banner kind="danger" title="تعذّر تأكيد الاستلام">
              {errorMessage(onBehalf.errorCode)}
            </Banner>
          ) : null}

          <div className="flex flex-col gap-3">
            {lines.map((line) => {
              const key = withdrawLineKey(line);
              return (
                <div key={key} className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="truncate text-body font-medium text-fg">{line.item?.name}</span>
                    {line.batch ? <BatchChip batch={line.batch} /> : null}
                  </div>
                  <p className="text-label text-fg-muted">{`المطلوب: ${formatQuantity(line.requested_quantity ?? 0, "علبة")}`}</p>
                  <NumberInput aria-label={`الكمية الفعلية: ${line.item?.name ?? ""}`} min={0} unit="علبة" value={quantities[key] ?? null} onValueChange={(value) => onOnBehalfQuantityChange?.(key, value)} disabled={onBehalf?.loading} />
                </div>
              );
            })}
          </div>

          <p className="text-body text-fg-muted">{`المجموع الفعلي: ${formatQuantity(totalActual, "علبة")} من ${formatQuantity(totalRequested, "علبة")} مطلوبة.`}</p>
          {allEntered ? null : <p className="text-label text-fg-muted">أدخل الكمية الفعلية لكل الأسطر.</p>}
        </div>
      </Dialog>
    </>
  );
}

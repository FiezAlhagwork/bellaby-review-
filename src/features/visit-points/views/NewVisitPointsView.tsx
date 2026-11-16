"use client";

import { Binoculars } from "@phosphor-icons/react";
import { DateTimeStackCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { Pagination, type PaginationMeta } from "@/components/data/Pagination";
import { PageHeader } from "@/components/layout/PageHeader";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ReasonDialog } from "@/components/ui/ReasonDialog";
import { errorMessage } from "@/lib/api/error-messages";
import type { Flag, VisitPoint } from "@/lib/api/types";
import { isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

/**
 * جهة أضافها مندوب وتنتظر مراجعة المراقبة: علامتها `NEW_VISIT_POINT` (قرارها عليها)، والجهة نفسها (الاسم والنوع والمحافظة ومن أضافها).
 * `visits_count` (عدد زيارات الجهة) غير موجود في العقد: أُضيف في الواجهة ويُطلب من الباك (docs/backend-requests.md §33.3).
 */
export type NewPointRow = { flag: Flag; point: VisitPoint; visits_count: number };

/** صفحة من الجهات بانتظار المراجعة (`GET /qa-flags?type=NEW_VISIT_POINT` مع `GET /visit-points`). */
export type NewPointsPage = { data: readonly NewPointRow[]; meta: PaginationMeta };

/** نافذة رفض جهة واحدة: السبب. null مغلقة. */
export type PointRejectDialog = { row: NewPointRow; reason: string; loading?: boolean; /** رمز خطأ العقد (already_decided وvalidation_failed…). */ errorCode?: string };

/** نافذة الرفض الجماعي لزيارات الجهات المحدّدة. */
export type PointBulkDialog = { reason: string; loading?: boolean; errorCode?: string };

type NewVisitPointsViewProps = {
  points: Loadable<NewPointsPage>;
  /** `flags.decide`: «مقبولة» و«مرفوضة». */
  canDecide: boolean;
  /** `visits.decide`: الرفض الجماعي لزيارات الجهات المحدّدة. */
  canRejectVisits: boolean;
  /** معرّفات الجهات المحدّدة. */
  selected: readonly number[];
  onSelectedChange?: (ids: number[]) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  /** «مقبولة»: `CLEARED` فوراً. */
  onAccept?: (row: NewPointRow) => void;
  /** خطأ آخر قرار (رمز العقد): شريط فوق الجدول. */
  actionError?: string;
  rejectDialog?: PointRejectDialog | null;
  onStartReject?: (row: NewPointRow) => void;
  onRejectReasonChange?: (reason: string) => void;
  onConfirmReject?: () => void;
  onDismissReject?: () => void;
  bulkDialog?: PointBulkDialog | null;
  onStartBulk?: () => void;
  onBulkReasonChange?: (reason: string) => void;
  onConfirmBulk?: () => void;
  onDismissBulk?: () => void;
  /** نتيجة الرفض الجماعي: `rejected_count`. */
  bulkResult?: { rejectedCount: number } | null;
  onRetry?: () => void;
};

/** «جهة» · «جهتين» · «5 جهات» · «14 جهة»، بصيغة المجرور بعد «رفض زيارات». */
function pointsCount(count: number): string {
  if (count === 1) return "جهة";
  if (count === 2) return "جهتين";
  return count <= 10 ? `${isolate(count)} جهات` : `${isolate(count)} جهة`;
}

/**
 * الجهات الجديدة (S10): الجهات التي أضافها المندوبون وتنتظر المراجعة: الاسم والنوع والمحافظة ومن أضافها وعدد زياراتها. لكل جهة «مقبولة» (تُغلق علامتها بلا مشكلة)
 * أو «مرفوضة» (تُعطَّل وتعود زياراتها «مشكوكاً فيها»). تحديد عدة جهات يتيح الرفض الجماعي لزياراتها (`BulkBar`) وتُستبعد من المؤشرات.
 */
export function NewVisitPointsView({
  points,
  canDecide,
  canRejectVisits,
  selected,
  onSelectedChange,
  onPageChange,
  onPerPageChange,
  onAccept,
  actionError,
  rejectDialog = null,
  onStartReject,
  onRejectReasonChange,
  onConfirmReject,
  onDismissReject,
  bulkDialog = null,
  onStartBulk,
  onBulkReasonChange,
  onConfirmBulk,
  onDismissBulk,
  bulkResult = null,
  onRetry,
}: NewVisitPointsViewProps) {
  const columns: DataTableColumn<NewPointRow>[] = [
    {
      key: "name",
      header: "الجهة",
      cell: (row) => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-body text-fg">{row.point.name}</span>
          <span className="truncate text-caption text-fg-muted">{[row.point.type?.name, row.point.specialty?.name].filter(Boolean).join(" · ")}</span>
        </span>
      ),
      priority: "high",
      role: "primary",
    },
    { key: "governorate", header: "المحافظة", cell: (row) => <TextCell value={row.point.governorate?.name} />, width: "w-36" },
    { key: "by", header: "أضافها", cell: (row) => <TextCell value={row.point.created_by?.name} />, width: "w-36" },
    { key: "created", header: "تاريخ الإضافة", cell: (row) => <DateTimeStackCell value={row.point.created_at} />, width: "w-32" },
    { key: "visits", header: "الزيارات", cell: (row) => <span dir="ltr">{row.visits_count}</span>, width: "w-24", align: "end", priority: "high" },
    {
      key: "actions",
      header: "القرار",
      cell: (row) => (
        <span className="flex items-center gap-2">
          <Button variant="secondary" size="sm" disabled={!canDecide} onClick={() => onAccept?.(row)}>
            مقبولة
          </Button>
          <Button variant="danger" size="sm" disabled={!canDecide} onClick={() => onStartReject?.(row)}>
            مرفوضة
          </Button>
        </span>
      ),
      width: "w-52",
      priority: "high",
      role: "status",
    },
  ];

  const ready = points.status === "ready" ? points.data : null;
  const selectedRows = ready ? ready.data.filter((row) => row.point.id !== undefined && selected.includes(row.point.id)) : [];
  const bulkVisits = selectedRows.reduce((sum, row) => sum + row.visits_count, 0);

  return (
    <>
      <PageHeader title="الجهات الجديدة" description="الجهات التي أضافها المندوبون وتنتظر مراجعتك: تقبلها أو ترفضها." />

      <div className="flex flex-col gap-4">
        {actionError ? (
          <Banner kind={actionError === "already_decided" ? "warning" : "danger"} title={actionError === "already_decided" ? "قرّر غيرك قبلك" : "تعذّر حفظ القرار"}>
            {errorMessage(actionError)}
          </Banner>
        ) : null}

        {bulkResult ? (
          <Banner kind="success" title="رُفضت الزيارات">
            {`رُفضت ${isolate(bulkResult.rejectedCount)} زيارة واستُبعدت من المؤشرات.`}
          </Banner>
        ) : null}

        <DataTable
          label="الجهات الجديدة"
          columns={columns}
          rows={ready ? ready.data : []}
          getRowKey={(row) => row.point.id ?? ""}
          loading={points.status === "loading"}
          error={points.status === "error" ? { code: points.code, onRetry } : undefined}
          empty={<EmptyState icon={Binoculars} title="لا جهات بانتظار المراجعة" description="تظهر هنا الجهات التي يضيفها المندوبون من الميدان حين تنتظر قرارك." />}
          selection={canRejectVisits ? { selected: [...selected], onChange: (keys) => onSelectedChange?.(keys.map(Number)) } : undefined}
          bulkActions={
            canRejectVisits
              ? [
                  <Button key="reject-visits" variant="danger" size="sm" onClick={onStartBulk}>
                    رفض زياراتها
                  </Button>,
                ]
              : undefined
          }
        />

        {ready ? <Pagination meta={ready.meta} onPageChange={onPageChange} onPerPageChange={onPerPageChange} /> : null}
      </div>

      <ReasonDialog
        open={rejectDialog !== null}
        onOpenChange={(open) => (open ? undefined : onDismissReject?.())}
        title="رفض الجهة؟"
        description={`تُعطَّل «${rejectDialog?.row.point.name ?? ""}» وتعود زياراتها (${isolate(rejectDialog?.row.visits_count ?? 0)}) «مشكوكاً فيها». لا يُلغى القرار.`}
        confirmLabel="رفض الجهة"
        cancelLabel="تراجع"
        reason={rejectDialog?.reason ?? ""}
        onReasonChange={(reason) => onRejectReasonChange?.(reason)}
        error={rejectDialog?.errorCode ? errorMessage(rejectDialog.errorCode) : undefined}
        danger
        loading={rejectDialog?.loading}
        onConfirm={() => onConfirmReject?.()}
      />

      <ReasonDialog
        open={bulkDialog !== null}
        onOpenChange={(open) => (open ? undefined : onDismissBulk?.())}
        title={`رفض زيارات ${pointsCount(selectedRows.length)}؟`}
        description={`تُرفض كل زيارات الجهات المحدّدة (${isolate(bulkVisits)} زيارة) وتُستبعد من المؤشرات. لا يُلغى القرار.`}
        confirmLabel="رفض الزيارات"
        cancelLabel="تراجع"
        reason={bulkDialog?.reason ?? ""}
        onReasonChange={(reason) => onBulkReasonChange?.(reason)}
        error={bulkDialog?.errorCode ? errorMessage(bulkDialog.errorCode) : undefined}
        danger
        loading={bulkDialog?.loading}
        onConfirm={() => onConfirmBulk?.()}
      />
    </>
  );
}

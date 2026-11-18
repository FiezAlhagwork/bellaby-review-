"use client";

import { MagnifyingGlass, Tag } from "@phosphor-icons/react";
import { DateTimeStackCell, StatusCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { FilterBar, type ActiveFilter } from "@/components/data/FilterBar";
import { Pagination, type PaginationMeta } from "@/components/data/Pagination";
import { statusMap } from "@/components/data/status-map";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { DateRangePicker, type DateRange } from "@/components/ui/DateRangePicker";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Option } from "@/components/ui/OptionList";
import type { Location, SampleRequest } from "@/lib/api/types";
import { dayLabel, type IsoDate } from "@/lib/calendar";
import { isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

type SampleRequestStatus = NonNullable<SampleRequest["status"]>;

/**
 * الفلاتر كما يرسلها العقد: `status` و`rep_id` (معرّف **المستخدم** لا الموقع). والفترة `from`/`to` على `created_at` غير موجودة في
 * `GET /sample-requests` بعد، مضافة هنا بصفة مؤقتة وطلبها في docs/backend-requests.md §12.1. تغيّرها يعيد الأب إلى الصفحة الأولى.
 */
export type SampleRequestFilters = {
  status: SampleRequestStatus | null;
  repUserId: string | null;
  range: DateRange;
};

export const noSampleRequestFilters: SampleRequestFilters = { status: null, repUserId: null, range: { from: null, to: null } };

/** صفحة من `GET /sample-requests` (`Paginated`): الطلبات و`meta` بأسلوب Laravel. */
export type SampleRequestsPage = { data: readonly SampleRequest[]; meta: PaginationMeta };

type SampleRequestsListViewProps = {
  requests: Loadable<SampleRequestsPage>;
  /** مواقع المندوبين `GET /locations?type=REP`: خيارات فلتر المندوب بقيمة `location.user.id` (= `rep_id`). */
  reps: readonly Location[];
  filters: SampleRequestFilters;
  onFiltersChange: (filters: SampleRequestFilters) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  /** اليوم (بتوقيت دمشق): حدّ منتقي الفترة. يُمرَّر فيبقى الـ view نقياً. */
  today: IsoDate;
  /** يفتح تفاصيل الطلب (W10). بدونه الصفوف للقراءة فقط. */
  onOpenRequest?: (request: SampleRequest) => void;
  /**
   * «طلباتي» (M18): الطالب (مدير المكتب العلمي) يرى طلباته هو: لا عمود «الطالب»، وتظهر ملاحظة الرفض، وتتبدّل عناوين الصفحة.
   * الترشيح على `requested_by` من الحاوية (لا معامل له في العقد بعد: docs/backend-requests.md §56).
   */
  ownRequests?: boolean;
  /** «طلب عينات» في الرأس (`sample_requests.create`). غيابه = لا زر. */
  onNewRequest?: () => void;
  /** «إلغاء الطلب» في قائمة صف الطلب الجديد فقط (`POST /sample-requests/{id}/cancel`). */
  onCancelRequest?: (request: SampleRequest) => void;
  onRetry?: () => void;
};

const statusOptions: Option[] = (Object.keys(statusMap.sampleRequest) as SampleRequestStatus[]).map((status) => ({ value: status, label: statusMap.sampleRequest[status].label }));

/** «سطر واحد» · «سطران» · «3 أسطر». */
function linesPhrase(count: number): string {
  if (count === 1) return "سطر واحد";
  if (count === 2) return "سطران";
  return `${isolate(count)} أسطر`;
}

/**
 * طلبات العينات (W09): ما يرفعه مدير المكتب العلمي للمندوبين من عينات ومواد دعائية، ويعالجه اللوجستي بالصرف (W06) أو الرفض (W10).
 * كل طلب في صف (المندوب والطالب والأصناف والسبب والتاريخ والحالة). فلاتر الحالة والمندوب والفترة، وترقيم. الصف يفتح W10.
 */
export function SampleRequestsListView({ requests, reps, filters, onFiltersChange, onPageChange, onPerPageChange, today, onOpenRequest, ownRequests = false, onNewRequest, onCancelRequest, onRetry }: SampleRequestsListViewProps) {
  const repOptions: Option[] = reps.flatMap((rep) => (rep.user?.id !== undefined && rep.name ? [{ value: String(rep.user.id), label: rep.name }] : []));

  const set = (patch: Partial<SampleRequestFilters>) => onFiltersChange({ ...filters, ...patch });
  const clearAll = () => onFiltersChange(noSampleRequestFilters);

  const { from, to } = filters.range;
  const rangeLabel = from === null ? null : to === null || to === from ? `الفترة: ${dayLabel(from)}` : `الفترة: ${dayLabel(from)} ← ${dayLabel(to)}`;

  const active: ActiveFilter[] = [
    ...(filters.status ? [{ key: "status", label: `الحالة: ${statusMap.sampleRequest[filters.status].label}`, onRemove: () => set({ status: null }) }] : []),
    ...(filters.repUserId ? [{ key: "rep", label: `المندوب: ${repOptions.find((o) => o.value === filters.repUserId)?.label ?? ""}`, onRemove: () => set({ repUserId: null }) }] : []),
    ...(rangeLabel ? [{ key: "range", label: rangeLabel, onRemove: () => set({ range: { from: null, to: null } }) }] : []),
  ];

  const columns: DataTableColumn<SampleRequest>[] = [
    { key: "rep", header: "المندوب", cell: (row) => <TextCell value={row.rep?.name} />, width: "w-40", priority: "high", role: "primary" },
    ...(ownRequests ? [] : [{ key: "requested_by", header: "الطالب", cell: (row: SampleRequest) => <TextCell value={row.requested_by?.name} />, width: "w-36" }]),
    {
      key: "items",
      header: "الأصناف",
      cell: (row) => {
        const lines = row.lines ?? [];
        return (
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-body text-fg">{lines[0]?.item?.name ?? "—"}</span>
            <span className="truncate text-caption text-fg-muted">{linesPhrase(lines.length)}</span>
          </span>
        );
      },
      priority: "high",
    },
    { key: "reason", header: "السبب", cell: (row) => <TextCell value={row.reason} />, width: "w-56" },
    { key: "created_at", header: "التاريخ", cell: (row) => <DateTimeStackCell value={row.created_at} />, width: "w-28", priority: "high" },
    ...(ownRequests ? [{ key: "reject_reason", header: "سبب الرفض", cell: (row: SampleRequest) => <TextCell value={row.status === "REJECTED" ? row.reject_reason : null} />, width: "w-56" }] : []),
    { key: "status", header: "الحالة", cell: (row) => (row.status ? <StatusCell entity="sampleRequest" status={row.status} /> : <TextCell value={null} />), width: "w-28", priority: "high", role: "status" },
  ];

  const empty =
    active.length > 0 ? (
      <EmptyState
        icon={MagnifyingGlass}
        title="لا نتائج للفلتر"
        description="لا توجد طلبات تطابق ما اخترته. غيّر الفلاتر أو امسحها."
        action={
          <Button variant="secondary" onClick={clearAll}>
            مسح الفلاتر
          </Button>
        }
      />
    ) : (
      <EmptyState
        icon={Tag}
        title={ownRequests ? "لم ترفع طلبات بعد" : "لا طلبات عينات بعد"}
        description={ownRequests ? "اضغط «طلب عينات» لتطلب عينات أو مواد دعائية لمندوب." : "تصل هنا الطلبات التي يرفعها مدير المكتب العلمي للمندوبين لتصرفها أو ترفضها."}
      />
    );

  return (
    <>
      <PageHeader
        title={ownRequests ? "طلباتي" : "طلبات العينات"}
        description={ownRequests ? "طلبات العينات والمواد التي رفعتها للمندوبين، من الأحدث إلى الأقدم. يُلغى الطلب الجديد قبل أن يُصرف." : "طلبات العينات والمواد الدعائية للمندوبين، من الأحدث إلى الأقدم."}
        actions={onNewRequest ? [{ id: "new-request", label: "طلب عينات", primary: true, onSelect: onNewRequest }] : undefined}
      />

      <div className="flex flex-col gap-4">
        <FilterBar
          quickFilters={[
            <Combobox
              key="status"
              aria-label="الحالة"
              placeholder="كل الحالات"
              options={statusOptions}
              value={filters.status}
              onValueChange={(status) => set({ status: status as SampleRequestStatus | null })}
              clearable
            />,
            <Combobox key="rep" aria-label="المندوب" placeholder="كل المندوبين" options={repOptions} value={filters.repUserId} onValueChange={(repUserId) => set({ repUserId })} clearable />,
            <DateRangePicker key="range" aria-label="الفترة" placeholder="كل الأوقات" value={filters.range} onValueChange={(range) => set({ range })} max={today} today={today} />,
          ]}
          active={active}
          onClearAll={clearAll}
        />

        <DataTable
          label="طلبات العينات"
          columns={columns}
          rows={requests.status === "ready" ? requests.data.data : []}
          getRowKey={(row) => row.id ?? ""}
          loading={requests.status === "loading"}
          error={requests.status === "error" ? { code: requests.code, onRetry } : undefined}
          empty={empty}
          onRowOpen={onOpenRequest}
          rowActions={onCancelRequest ? (row) => (row.status === "NEW" ? [{ id: "cancel", label: "إلغاء الطلب", danger: true, onSelect: () => onCancelRequest(row) }] : []) : undefined}
        />

        {requests.status === "ready" ? <Pagination meta={requests.data.meta} onPageChange={onPageChange} onPerPageChange={onPerPageChange} /> : null}
      </div>
    </>
  );
}

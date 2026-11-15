"use client";

import { MagnifyingGlass, ArrowUUpLeft } from "@phosphor-icons/react";
import { DateTimeStackCell, StatusCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { FilterBar, type ActiveFilter } from "@/components/data/FilterBar";
import { Pagination, type PaginationMeta } from "@/components/data/Pagination";
import { statusMap } from "@/components/data/status-map";
import { PageHeader, type PageAction } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Option } from "@/components/ui/OptionList";
import type { Location, WithdrawRequest } from "@/lib/api/types";
import { isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

type WithdrawStatus = NonNullable<WithdrawRequest["status"]>;

/** الفلاتر كما يرسلها العقد: `status` و`rep_id` (معرّف **المستخدم** لا الموقع). تغيّرها يعيد الأب إلى الصفحة الأولى. */
export type WithdrawRequestFilters = {
  status: WithdrawStatus | null;
  repUserId: string | null;
};

export const noWithdrawRequestFilters: WithdrawRequestFilters = { status: null, repUserId: null };

/** صفحة من `GET /withdraw-requests` (`Paginated`): الطلبات و`meta` بأسلوب Laravel. */
export type WithdrawRequestsPage = { data: readonly WithdrawRequest[]; meta: PaginationMeta };

type WithdrawRequestsListViewProps = {
  requests: Loadable<WithdrawRequestsPage>;
  /** مواقع المندوبين `GET /locations?type=REP`: خيارات فلتر المندوب بقيمة `location.user.id` (= `rep_id`). */
  reps: readonly Location[];
  filters: WithdrawRequestFilters;
  onFiltersChange: (filters: WithdrawRequestFilters) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  /** صلاحية الطلب: `withdraw.create`. بدونها لا زر «طلب سحب». */
  canCreate: boolean;
  /** يفتح نافذة «طلب سحب». */
  onCreate?: () => void;
  /** يفتح تفاصيل الطلب (W12). بدونه الصفوف للقراءة فقط. */
  onOpenRequest?: (request: WithdrawRequest) => void;
  onRetry?: () => void;
};

const statusOptions: Option[] = (Object.keys(statusMap.withdrawRequest) as WithdrawStatus[]).map((status) => ({ value: status, label: statusMap.withdrawRequest[status].label }));

/** «سطر واحد» · «سطران» · «3 أسطر». */
function linesPhrase(count: number): string {
  if (count === 1) return "سطر واحد";
  if (count === 2) return "سطران";
  return `${isolate(count)} أسطر`;
}

/**
 * طلبات السحب (W11): ما يطلبه المستودع استلامه من أرصدة المندوبين من عينات ومواد، يسلّمه المندوب من تطبيقه (أو يؤكده اللوجستي عن مندوب معطَّل في W12).
 * كل طلب في صف (المندوب والأصناف والسبب والتاريخ والحالة). فلاتر الحالة والمندوب، وترقيم. الصف يفتح W12. «طلب سحب» يفتح النافذة.
 */
export function WithdrawRequestsListView({ requests, reps, filters, onFiltersChange, onPageChange, onPerPageChange, canCreate, onCreate, onOpenRequest, onRetry }: WithdrawRequestsListViewProps) {
  const repOptions: Option[] = reps.flatMap((rep) => (rep.user?.id !== undefined && rep.name ? [{ value: String(rep.user.id), label: rep.name }] : []));

  const set = (patch: Partial<WithdrawRequestFilters>) => onFiltersChange({ ...filters, ...patch });
  const clearAll = () => onFiltersChange(noWithdrawRequestFilters);

  const active: ActiveFilter[] = [
    ...(filters.status ? [{ key: "status", label: `الحالة: ${statusMap.withdrawRequest[filters.status].label}`, onRemove: () => set({ status: null }) }] : []),
    ...(filters.repUserId ? [{ key: "rep", label: `المندوب: ${repOptions.find((o) => o.value === filters.repUserId)?.label ?? ""}`, onRemove: () => set({ repUserId: null }) }] : []),
  ];

  const actions: PageAction[] = canCreate ? [{ id: "create", label: "طلب سحب", primary: true, onSelect: () => onCreate?.() }] : [];

  const columns: DataTableColumn<WithdrawRequest>[] = [
    { key: "rep", header: "المندوب", cell: (row) => <TextCell value={row.rep?.name} />, width: "w-40", priority: "high", role: "primary" },
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
    { key: "reason", header: "السبب", cell: (row) => <TextCell value={row.reason} />, width: "w-64" },
    { key: "created_at", header: "التاريخ", cell: (row) => <DateTimeStackCell value={row.created_at} />, width: "w-28", priority: "high" },
    { key: "status", header: "الحالة", cell: (row) => (row.status ? <StatusCell entity="withdrawRequest" status={row.status} /> : <TextCell value={null} />), width: "w-28", priority: "high", role: "status" },
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
        icon={ArrowUUpLeft}
        title="لا طلبات سحب بعد"
        description="اطلب من مندوب تسليم ما في رصيده من عينات ومواد إلى المستودع."
        action={
          canCreate ? (
            <Button variant="primary" onClick={onCreate}>
              طلب سحب
            </Button>
          ) : undefined
        }
      />
    );

  return (
    <>
      <PageHeader title="طلبات السحب" description="طلبات استلام العينات والمواد من أرصدة المندوبين، من الأحدث إلى الأقدم." actions={actions} />

      <div className="flex flex-col gap-4">
        <FilterBar
          quickFilters={[
            <Combobox
              key="status"
              aria-label="الحالة"
              placeholder="كل الحالات"
              options={statusOptions}
              value={filters.status}
              onValueChange={(status) => set({ status: status as WithdrawStatus | null })}
              clearable
            />,
            <Combobox key="rep" aria-label="المندوب" placeholder="كل المندوبين" options={repOptions} value={filters.repUserId} onValueChange={(repUserId) => set({ repUserId })} clearable />,
          ]}
          active={active}
          onClearAll={clearAll}
        />

        <DataTable
          label="طلبات السحب"
          columns={columns}
          rows={requests.status === "ready" ? requests.data.data : []}
          getRowKey={(row) => row.id ?? ""}
          loading={requests.status === "loading"}
          error={requests.status === "error" ? { code: requests.code, onRetry } : undefined}
          empty={empty}
          onRowOpen={onOpenRequest}
        />

        {requests.status === "ready" ? <Pagination meta={requests.data.meta} onPageChange={onPageChange} onPerPageChange={onPerPageChange} /> : null}
      </div>
    </>
  );
}

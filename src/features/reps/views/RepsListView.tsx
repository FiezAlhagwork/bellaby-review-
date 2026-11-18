"use client";

import { MagnifyingGlass, UserList } from "@phosphor-icons/react";
import { DateTimeStackCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { FilterBar, type ActiveFilter } from "@/components/data/FilterBar";
import { Pagination, type PaginationMeta } from "@/components/data/Pagination";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Option } from "@/components/ui/OptionList";
import type { AttendanceSession, Governorate, User, UserRef } from "@/lib/api/types";
import { formatTime, isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

/**
 * صف مندوب: حسابه من `GET /users` (فيه `governorates` و`manager` و`last_sync_at`)، ودوام اليوم من جلسته (`GET /attendance-sessions`)،
 * وعدد زياراته اليوم. العقد لا يجمعها في صف واحد، فتجمعها الحاوية (docs/backend-requests.md §52).
 */
export type RepRow = {
  rep: User;
  /** جلسة دوام اليوم. null = لم يبدأ دوامه بعد. */
  session: AttendanceSession | null;
  visitsToday: number;
};

/** الفلاتر: المنطقة (محافظة) والسوبرفايزر (`manager`). تغيّرها يعيد الأب إلى الصفحة الأولى. */
export type RepsFilters = { governorateId: string | null; supervisorId: string | null };

export const noRepsFilters: RepsFilters = { governorateId: null, supervisorId: null };

/** صفحة من `GET /users` للمندوبين (`Paginated`). */
export type RepsPage = { data: readonly RepRow[]; meta: PaginationMeta };

type RepsListViewProps = {
  reps: Loadable<RepsPage>;
  governorates: readonly Governorate[];
  /** السوبرفايزرون: خيارات الفلتر. */
  supervisors: readonly UserRef[];
  filters: RepsFilters;
  onFiltersChange: (filters: RepsFilters) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  /** يفتح صفحة المندوب (S07). بدونه الصفوف للقراءة فقط. */
  onOpenRep?: (rep: User) => void;
  onRetry?: () => void;
};

/** دوام اليوم: لم يبدأ، أو يعمل منذ وقت البدء، أو انتهى (ومدته إن وُجدت). */
function AttendanceCell({ session }: { session: AttendanceSession | null }) {
  if (!session) return <Badge color="neutral">لم يبدأ</Badge>;
  if (!session.ended_at) {
    return (
      <span className="flex items-center gap-2">
        <Badge color="info">يعمل الآن</Badge>
        <span className="text-caption text-fg-muted">{`منذ ${isolate(formatTime(session.started_at ?? ""))}`}</span>
      </span>
    );
  }
  return (
    <span className="flex items-center gap-2">
      <Badge color="success">انتهى</Badge>
      <span className="text-caption text-fg-muted">{`حتى ${isolate(formatTime(session.ended_at))}`}</span>
    </span>
  );
}

/**
 * المندوبون (M13): جدول بحسب المنطقة والسوبرفايزر: المندوب ودوام اليوم وزياراته اليوم وآخر مزامنة. الصف يفتح صفحة المندوب (S07).
 */
export function RepsListView({ reps, governorates, supervisors, filters, onFiltersChange, onPageChange, onPerPageChange, onOpenRep, onRetry }: RepsListViewProps) {
  const governorateOptions: Option[] = governorates.flatMap((governorate) => (governorate.id !== undefined && governorate.name ? [{ value: String(governorate.id), label: governorate.name }] : []));
  const supervisorOptions: Option[] = supervisors.flatMap((supervisor) => (supervisor.id !== undefined && supervisor.name ? [{ value: String(supervisor.id), label: supervisor.name }] : []));

  const set = (patch: Partial<RepsFilters>) => onFiltersChange({ ...filters, ...patch });
  const clearAll = () => onFiltersChange(noRepsFilters);

  const active: ActiveFilter[] = [
    ...(filters.governorateId ? [{ key: "governorate", label: `المنطقة: ${governorateOptions.find((o) => o.value === filters.governorateId)?.label ?? ""}`, onRemove: () => set({ governorateId: null }) }] : []),
    ...(filters.supervisorId ? [{ key: "supervisor", label: `السوبرفايزر: ${supervisorOptions.find((o) => o.value === filters.supervisorId)?.label ?? ""}`, onRemove: () => set({ supervisorId: null }) }] : []),
  ];

  const columns: DataTableColumn<RepRow>[] = [
    { key: "rep", header: "المندوب", cell: (row) => <TextCell value={row.rep.name} />, width: "w-44", priority: "high", role: "primary" },
    { key: "region", header: "المنطقة", cell: (row) => <TextCell value={(row.rep.governorates ?? []).map((governorate) => governorate.name).join("، ")} />, width: "w-36" },
    { key: "supervisor", header: "السوبرفايزر", cell: (row) => <TextCell value={row.rep.manager?.name} />, width: "w-36" },
    { key: "attendance", header: "دوام اليوم", cell: (row) => <AttendanceCell session={row.session} />, priority: "high", role: "status" },
    { key: "visits", header: "زياراته اليوم", cell: (row) => <span className="text-body text-fg">{isolate(row.visitsToday)}</span>, align: "end", width: "w-32", priority: "high" },
    { key: "last_sync_at", header: "آخر مزامنة", cell: (row) => <DateTimeStackCell value={row.rep.last_sync_at} />, width: "w-28" },
  ];

  const empty =
    active.length > 0 ? (
      <EmptyState
        icon={MagnifyingGlass}
        title="لا نتائج للفلتر"
        description="لا يوجد مندوبون يطابقون ما اخترته. غيّر الفلاتر أو امسحها."
        action={
          <Button variant="secondary" onClick={clearAll}>
            مسح الفلاتر
          </Button>
        }
      />
    ) : (
      <EmptyState icon={UserList} title="لا مندوبون بعد" description="تظهر هنا حسابات المندوبين حين يُنشئها قسم IT." />
    );

  return (
    <>
      <PageHeader title="المندوبون" description="مندوبو المكتب العلمي بحسب المنطقة والسوبرفايزر: دوام اليوم وزياراتهم وآخر مزامنة." />

      <div className="flex flex-col gap-4">
        <FilterBar
          quickFilters={[
            <Combobox key="governorate" aria-label="المنطقة" placeholder="كل المناطق" options={governorateOptions} value={filters.governorateId} onValueChange={(governorateId) => set({ governorateId })} clearable />,
            <Combobox key="supervisor" aria-label="السوبرفايزر" placeholder="كل السوبرفايزرين" options={supervisorOptions} value={filters.supervisorId} onValueChange={(supervisorId) => set({ supervisorId })} clearable />,
          ]}
          active={active}
          onClearAll={clearAll}
        />

        <DataTable
          label="المندوبون"
          columns={columns}
          rows={reps.status === "ready" ? reps.data.data : []}
          getRowKey={(row) => row.rep.id ?? ""}
          loading={reps.status === "loading"}
          error={reps.status === "error" ? { code: reps.code, onRetry } : undefined}
          empty={empty}
          onRowOpen={onOpenRep ? (row) => onOpenRep(row.rep) : undefined}
        />

        {reps.status === "ready" ? <Pagination meta={reps.data.meta} onPageChange={onPageChange} onPerPageChange={onPerPageChange} /> : null}
      </div>
    </>
  );
}

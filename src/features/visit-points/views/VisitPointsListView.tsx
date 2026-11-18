"use client";

import { ListBullets, MagnifyingGlass, MapPin, MapTrifold } from "@phosphor-icons/react";
import { DateTimeStackCell, StatusCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { FilterBar, type ActiveFilter } from "@/components/data/FilterBar";
import { MapPlaceholder, type MapPoint } from "@/components/data/MapPlaceholder";
import { Pagination, type PaginationMeta } from "@/components/data/Pagination";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Combobox } from "@/components/ui/Combobox";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import type { Option } from "@/components/ui/OptionList";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Governorate, ListEntry, VisitPoint } from "@/lib/api/types";
import { isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";
import { disabledReason, disabledReasonLabels } from "../point-labels";

/** الفلاتر كما يرسلها العقد: `type_id` و`specialty_id` و`governorate_id` و`status`. تغيّرها يعيد الأب إلى الصفحة الأولى. */
export type VisitPointFilters = {
  typeId: string | null;
  specialtyId: string | null;
  governorateId: string | null;
  status: NonNullable<VisitPoint["status"]> | null;
};

export const noVisitPointFilters: VisitPointFilters = { typeId: null, specialtyId: null, governorateId: null, status: null };

/** صفحة من `GET /visit-points` (`Paginated`). */
export type VisitPointsPage = { data: readonly VisitPoint[]; meta: PaginationMeta };

export type VisitPointsMode = "list" | "map";

type VisitPointsListViewProps = {
  points: Loadable<VisitPointsPage>;
  mode: VisitPointsMode;
  onModeChange: (mode: VisitPointsMode) => void;
  /** قوائم الاختيار (`ListEntry`): أنواع الجهات والاختصاصات، ومفاتيحها غير مسمّاة في العقد (docs/backend-requests.md §53). */
  types: readonly ListEntry[];
  specialties: readonly ListEntry[];
  governorates: readonly Governorate[];
  filters: VisitPointFilters;
  onFiltersChange: (filters: VisitPointFilters) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  /** الجهة المحدّدة على الخريطة. */
  selectedId?: number | null;
  onSelectPoint?: (id: number) => void;
  /** يفتح صفحة الجهة (M15). */
  onOpenPoint?: (point: VisitPoint) => void;
  onRetry?: () => void;
};

const statusOptions: Option[] = [
  { value: "ACTIVE", label: "فعّالة" },
  { value: "DISABLED", label: "معطّلة" },
];

const entryOptions = (entries: readonly ListEntry[]): Option[] => entries.flatMap((entry) => (entry.id !== undefined && entry.name ? [{ value: String(entry.id), label: entry.name }] : []));

/**
 * جهات الزيارة (M14): عيادات ومستوصفات وصيدليات يزورها المندوبون. قائمة أو خريطة بالفلاتر نفسها: النوع، والاختصاص، والمحافظة، وفعّالة أو معطّلة.
 * المعطّلة (مرفوضة أو مدمجة) تُعلَّم بسببها. الصف يفتح صفحة الجهة. على الخريطة تعرض الصفحة الحالية وتُحدَّد الجهة بالضغط.
 */
export function VisitPointsListView({ points, mode, onModeChange, types, specialties, governorates, filters, onFiltersChange, onPageChange, onPerPageChange, selectedId, onSelectPoint, onOpenPoint, onRetry }: VisitPointsListViewProps) {
  const typeOptions = entryOptions(types);
  const specialtyOptions = entryOptions(specialties);
  const governorateOptions: Option[] = governorates.flatMap((governorate) => (governorate.id !== undefined && governorate.name ? [{ value: String(governorate.id), label: governorate.name }] : []));

  const set = (patch: Partial<VisitPointFilters>) => onFiltersChange({ ...filters, ...patch });
  const clearAll = () => onFiltersChange(noVisitPointFilters);

  const labelOf = (options: Option[], value: string | null) => options.find((option) => option.value === value)?.label ?? "";
  const active: ActiveFilter[] = [
    ...(filters.typeId ? [{ key: "type", label: `النوع: ${labelOf(typeOptions, filters.typeId)}`, onRemove: () => set({ typeId: null }) }] : []),
    ...(filters.specialtyId ? [{ key: "specialty", label: `الاختصاص: ${labelOf(specialtyOptions, filters.specialtyId)}`, onRemove: () => set({ specialtyId: null }) }] : []),
    ...(filters.governorateId ? [{ key: "governorate", label: `المحافظة: ${labelOf(governorateOptions, filters.governorateId)}`, onRemove: () => set({ governorateId: null }) }] : []),
    ...(filters.status ? [{ key: "status", label: `الحالة: ${labelOf(statusOptions, filters.status)}`, onRemove: () => set({ status: null }) }] : []),
  ];

  const columns: DataTableColumn<VisitPoint>[] = [
    {
      key: "name",
      header: "الجهة",
      cell: (row) => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-body text-fg">{row.name}</span>
          <span className="truncate text-caption text-fg-muted">{row.address ?? "—"}</span>
        </span>
      ),
      priority: "high",
      role: "primary",
    },
    { key: "type", header: "النوع", cell: (row) => <TextCell value={row.type?.name} />, width: "w-28", priority: "high" },
    { key: "specialty", header: "الاختصاص", cell: (row) => <TextCell value={row.specialty?.name} />, width: "w-28" },
    { key: "governorate", header: "المحافظة", cell: (row) => <TextCell value={row.governorate?.name} />, width: "w-32" },
    { key: "last_visit_at", header: "آخر زيارة", cell: (row) => <DateTimeStackCell value={row.last_visit_at} />, width: "w-28" },
    {
      key: "status",
      header: "الحالة",
      cell: (row) => {
        const reason = disabledReason(row);
        return (
          <span className="flex items-center gap-2">
            {row.status ? <StatusCell entity="visitPoint" status={row.status} /> : <TextCell value={null} />}
            {reason ? <Badge color="warning">{disabledReasonLabels[reason]}</Badge> : null}
          </span>
        );
      },
      width: "w-44",
      priority: "high",
      role: "status",
    },
  ];

  const empty =
    active.length > 0 ? (
      <EmptyState
        icon={MagnifyingGlass}
        title="لا نتائج للفلتر"
        description="لا توجد جهات تطابق ما اخترته. غيّر الفلاتر أو امسحها."
        action={
          <Button variant="secondary" onClick={clearAll}>
            مسح الفلاتر
          </Button>
        }
      />
    ) : (
      <EmptyState icon={MapPin} title="لا جهات زيارة بعد" description="تظهر هنا الجهات التي يضيفها المندوبون أثناء زياراتهم." />
    );

  const ready = points.status === "ready" ? points.data : null;
  const selected = ready?.data.find((point) => point.id === selectedId) ?? null;
  const mapPoints: MapPoint[] = (ready?.data ?? []).flatMap((point) =>
    point.id !== undefined && point.location ? [{ id: String(point.id), lat: point.location.lat, lng: point.location.lng, kind: "start" as const, tone: point.status === "DISABLED" ? ("warning" as const) : ("default" as const), label: point.name ?? "جهة" }] : [],
  );

  const body =
    mode === "list" ? (
      <DataTable
        label="جهات الزيارة"
        columns={columns}
        rows={ready?.data ?? []}
        getRowKey={(row) => row.id ?? ""}
        loading={points.status === "loading"}
        error={points.status === "error" ? { code: points.code, onRetry } : undefined}
        empty={empty}
        onRowOpen={onOpenPoint}
      />
    ) : points.status === "loading" ? (
      <Skeleton className="h-96 w-full" />
    ) : points.status === "error" ? (
      <ErrorState code={points.code} onRetry={onRetry} />
    ) : ready && ready.data.length === 0 ? (
      empty
    ) : (
      <div className="flex flex-col gap-4">
        <MapPlaceholder points={mapPoints} selectedId={selected ? String(selected.id) : null} onSelect={(id) => onSelectPoint?.(Number(id))} aria-label="مواقع جهات الزيارة" />
        <p className="text-label text-fg-muted">{`تعرض الخريطة جهات هذه الصفحة (${isolate(ready?.data.length ?? 0)}). اضغط نقطة لعرض جهتها.`}</p>
        {selected ? (
          <Card
            title={selected.name ?? "جهة"}
            action={
              onOpenPoint ? (
                <Button variant="secondary" size="sm" onClick={() => onOpenPoint(selected)}>
                  فتح الجهة
                </Button>
              ) : undefined
            }
          >
            <div className="flex flex-wrap items-center gap-2">
              {selected.status ? <StatusCell entity="visitPoint" status={selected.status} /> : null}
              {disabledReason(selected) ? <Badge color="warning">{disabledReasonLabels[disabledReason(selected)!]}</Badge> : null}
              <span className="text-body text-fg-muted">{[selected.type?.name, selected.specialty?.name, selected.governorate?.name].filter(Boolean).join(" · ")}</span>
            </div>
          </Card>
        ) : null}
      </div>
    );

  return (
    <>
      <PageHeader title="جهات الزيارة" description="العيادات والمستوصفات والصيدليات التي يزورها المندوبون، في قائمة أو على الخريطة." />

      <div className="flex flex-col gap-4">
        <SegmentedControl
          aria-label="عرض الجهات"
          value={mode}
          onValueChange={onModeChange}
          options={[
            { value: "list", label: "قائمة", icon: ListBullets },
            { value: "map", label: "خريطة", icon: MapTrifold },
          ]}
        />

        <FilterBar
          quickFilters={[
            <Combobox key="type" aria-label="النوع" placeholder="كل الأنواع" options={typeOptions} value={filters.typeId} onValueChange={(typeId) => set({ typeId })} clearable />,
            <Combobox key="specialty" aria-label="الاختصاص" placeholder="كل الاختصاصات" options={specialtyOptions} value={filters.specialtyId} onValueChange={(specialtyId) => set({ specialtyId })} clearable />,
            <Combobox key="governorate" aria-label="المحافظة" placeholder="كل المحافظات" options={governorateOptions} value={filters.governorateId} onValueChange={(governorateId) => set({ governorateId })} clearable />,
            <Combobox key="status" aria-label="الحالة" placeholder="كل الحالات" options={statusOptions} value={filters.status} onValueChange={(status) => set({ status: status as VisitPointFilters["status"] })} clearable />,
          ]}
          active={active}
          onClearAll={clearAll}
        />

        {body}

        {ready ? <Pagination meta={ready.meta} onPageChange={onPageChange} onPerPageChange={onPerPageChange} /> : null}
      </div>
    </>
  );
}

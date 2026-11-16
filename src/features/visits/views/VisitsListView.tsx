"use client";

import { ListBullets, MapPin, MapTrifold, MagnifyingGlass } from "@phosphor-icons/react";
import { DateTimeStackCell, StatusCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { FilterBar, type ActiveFilter } from "@/components/data/FilterBar";
import { flagTypeLabels } from "@/components/data/flag-types";
import { MapPlaceholder, type MapPoint } from "@/components/data/MapPlaceholder";
import { Pagination, type PaginationMeta } from "@/components/data/Pagination";
import { getStatusDefinition } from "@/components/data/status-map";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Combobox } from "@/components/ui/Combobox";
import { DateRangePicker, type DateRange } from "@/components/ui/DateRangePicker";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import type { Option } from "@/components/ui/OptionList";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Location, Visit, VisitVerification } from "@/lib/api/types";
import { dayLabel, type IsoDate } from "@/lib/calendar";
import { formatDateTime, isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

/** الفلاتر كما يرسلها العقد: `rep_id` و`from`/`to` و`verification_status`. تغيّرها يعيد الأب إلى الصفحة الأولى. */
export type VisitFilters = {
  /** معرّف المستخدم (المندوب). */
  repId: string | null;
  range: DateRange;
  verification: VisitVerification | null;
};

export const noVisitFilters: VisitFilters = { repId: null, range: { from: null, to: null }, verification: null };

/** صفحة من `GET /visits` (`Paginated`): الزيارات و`meta` بأسلوب Laravel. */
export type VisitsPage = { data: readonly Visit[]; meta: PaginationMeta };

export type VisitsMode = "list" | "map";

type VisitsListViewProps = {
  visits: Loadable<VisitsPage>;
  /** مندوبو نطاق المستخدم كمواقع `GET /locations?type=REP`: خيارات فلتر المندوب (`location.user.id` = `rep_id`). */
  reps: readonly Location[];
  filters: VisitFilters;
  onFiltersChange: (filters: VisitFilters) => void;
  /** قائمة أو خريطة: العرضان للبيانات نفسها. */
  mode: VisitsMode;
  onModeChange: (mode: VisitsMode) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  /** اليوم: حدّ الفترة. */
  today: IsoDate;
  /** الزيارة المحددة على الخريطة (بطاقتها تحت الخريطة). */
  selectedVisitId?: number | null;
  onSelectVisit?: (id: number | null) => void;
  /** يفتح الزيارة (S06). */
  onOpenVisit?: (visit: Visit) => void;
  onRetry?: () => void;
};

const verificationValues = ["OK", "FLAGGED", "CONFIRMED", "REJECTED"] as const satisfies readonly VisitVerification[];
const verificationOptions: Option[] = verificationValues.map((value) => ({ value, label: getStatusDefinition("visitVerification", value).label }));

const rangeLabel = ({ from, to }: DateRange) => (from && to ? (from === to ? dayLabel(from) : `${dayLabel(from)} – ${dayLabel(to)}`) : from ? `من ${dayLabel(from)}` : to ? `حتى ${dayLabel(to)}` : "");

/** المسافة عن الجهة تجاوزت نطاق التحقق المستعمل. */
const outOfRange = (visit: Visit) => visit.distance_m !== null && visit.distance_m !== undefined && visit.range_m_used !== undefined && visit.distance_m > visit.range_m_used;

/** نقاط الخريطة: بدء الزيارة وإنهاؤها (لا مسار بينهما). النقطتان تُحدَّدان معاً بمعرّف الزيارة. */
function mapPoints(visits: readonly Visit[]): MapPoint[] {
  return visits.flatMap((visit) => {
    const name = visit.visit_point?.name ?? "جهة";
    const tone: MapPoint["tone"] = visit.verification_status === "FLAGGED" ? "warning" : visit.verification_status === "REJECTED" ? "danger" : "default";
    const group = String(visit.id);
    return [
      ...(visit.start_location ? [{ id: `${visit.id}:start`, group, lat: visit.start_location.lat, lng: visit.start_location.lng, kind: "start" as const, tone, label: `بدء زيارة ${name} · ${visit.rep?.name ?? ""}` }] : []),
      ...(visit.end_location ? [{ id: `${visit.id}:end`, group, lat: visit.end_location.lat, lng: visit.end_location.lng, kind: "end" as const, tone, label: `إنهاء زيارة ${name} · ${visit.rep?.name ?? ""}` }] : []),
    ];
  });
}

/**
 * الزيارات (S05): قائمة وخريطة لزيارات المندوبين: الجهة والوقت والمدة والمسافة وحالة التحقق وعلاماتها. الخريطة بنقطتي بدء الزيارة وإنهائها (لا مسار).
 * الفلاتر: المندوب والفترة وحالة التحقق («مشكوك فيها» لمراجعة المراقبة). الصف أو النقطة يقود إلى S06.
 */
export function VisitsListView({ visits, reps, filters, onFiltersChange, mode, onModeChange, onPageChange, onPerPageChange, today, selectedVisitId = null, onSelectVisit, onOpenVisit, onRetry }: VisitsListViewProps) {
  const repOptions: Option[] = reps.flatMap((rep) => (rep.user?.id !== undefined && rep.name ? [{ value: String(rep.user.id), label: rep.name }] : []));

  const set = (patch: Partial<VisitFilters>) => onFiltersChange({ ...filters, ...patch });
  const clearAll = () => onFiltersChange(noVisitFilters);

  const active: ActiveFilter[] = [
    ...(filters.repId ? [{ key: "rep", label: `المندوب: ${repOptions.find((o) => o.value === filters.repId)?.label ?? ""}`, onRemove: () => set({ repId: null }) }] : []),
    ...(filters.range.from || filters.range.to ? [{ key: "range", label: `الفترة: ${rangeLabel(filters.range)}`, onRemove: () => set({ range: { from: null, to: null } }) }] : []),
    ...(filters.verification ? [{ key: "verification", label: `التحقق: ${getStatusDefinition("visitVerification", filters.verification).label}`, onRemove: () => set({ verification: null }) }] : []),
  ];

  const columns: DataTableColumn<Visit>[] = [
    { key: "rep", header: "المندوب", cell: (row) => <TextCell value={row.rep?.name} />, width: "w-36", priority: "high", role: "primary" },
    {
      key: "point",
      header: "الجهة",
      cell: (row) => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-body text-fg">{row.visit_point?.name ?? "—"}</span>
          <span className="truncate text-caption text-fg-muted">{[row.visit_point?.type, row.visit_point?.specialty].filter(Boolean).join(" · ")}</span>
        </span>
      ),
      priority: "high",
    },
    { key: "started", header: "الوقت", cell: (row) => <DateTimeStackCell value={row.started_at} />, width: "w-28" },
    {
      key: "duration",
      header: "المدة",
      cell: (row) => (row.status === "IN_PROGRESS" ? <Badge color="info">جارية</Badge> : row.duration_minutes === null || row.duration_minutes === undefined ? <TextCell value={null} /> : <span dir="ltr">{`${row.duration_minutes} د`}</span>),
      width: "w-24",
      align: "end",
    },
    {
      key: "distance",
      header: "المسافة",
      cell: (row) =>
        row.distance_m === null || row.distance_m === undefined ? (
          <TextCell value={null} />
        ) : (
          <span dir="ltr" className={outOfRange(row) ? "text-warning" : undefined}>{`${Math.round(row.distance_m)} م`}</span>
        ),
      width: "w-24",
      align: "end",
    },
    { key: "verification", header: "التحقق", cell: (row) => (row.verification_status ? <StatusCell entity="visitVerification" status={row.verification_status} /> : <TextCell value={null} />), width: "w-32", priority: "high", role: "status" },
    {
      key: "flags",
      header: "العلامات",
      cell: (row) =>
        (row.flags ?? []).length > 0 ? (
          <span className="flex flex-wrap items-center gap-1">
            {(row.flags ?? []).map((flag) => (
              <Badge key={flag.id} color={flag.status === "OPEN" ? "warning" : "neutral"}>
                {flag.type ? flagTypeLabels[flag.type] : "—"}
              </Badge>
            ))}
          </span>
        ) : (
          <span className="text-fg-muted">—</span>
        ),
      width: "w-52",
      priority: "high",
    },
  ];

  const empty =
    active.length > 0 ? (
      <EmptyState
        icon={MagnifyingGlass}
        title="لا نتائج للفلتر"
        description="لا توجد زيارات تطابق ما اخترته. غيّر الفلاتر أو امسحها."
        action={
          <Button variant="secondary" onClick={clearAll}>
            مسح الفلاتر
          </Button>
        }
      />
    ) : (
      <EmptyState icon={MapPin} title="لا زيارات بعد" description="تظهر هنا زيارات المندوبين حين يسجّلونها." />
    );

  const ready = visits.status === "ready" ? visits.data : null;
  const selected = ready?.data.find((visit) => visit.id === selectedVisitId) ?? null;

  const mapBody = (() => {
    if (visits.status === "loading") return <Skeleton className="h-96 w-full" />;
    if (visits.status === "error") return <ErrorState code={visits.code} onRetry={onRetry} />;
    if (visits.data.data.length === 0) return <div className="rounded-lg border border-border bg-surface">{empty}</div>;
    return (
      <div className="flex flex-col gap-4">
        <MapPlaceholder points={mapPoints(visits.data.data)} selectedId={selected ? String(selected.id) : null} onSelect={(group) => onSelectVisit?.(Number(group))} aria-label="مواقع بدء الزيارات وإنهائها" />
        <p className="text-label text-fg-muted">{`تعرض الخريطة زيارات هذه الصفحة (${isolate(visits.data.data.length)}). اضغط نقطة لعرض زيارتها.`}</p>
        {selected ? (
          <Card title={selected.visit_point?.name ?? "زيارة"}>
            <div className="flex flex-wrap items-center gap-2">
              {selected.verification_status ? <StatusCell entity="visitVerification" status={selected.verification_status} /> : null}
              {(selected.flags ?? []).map((flag) => (
                <Badge key={flag.id} color={flag.status === "OPEN" ? "warning" : "neutral"}>
                  {flag.type ? flagTypeLabels[flag.type] : "—"}
                </Badge>
              ))}
            </div>
            <p className="text-body text-fg">{`${selected.rep?.name ?? "—"} · ${selected.started_at ? formatDateTime(selected.started_at) : "—"}`}</p>
            <div>
              <Button variant="primary" onClick={() => onOpenVisit?.(selected)}>
                فتح الزيارة
              </Button>
            </div>
          </Card>
        ) : null}
      </div>
    );
  })();

  return (
    <>
      <PageHeader title="الزيارات" description="زيارات المندوبين ضمن نطاقك، من الأحدث إلى الأقدم." />

      <div className="flex flex-col gap-4">
        <SegmentedControl
          aria-label="عرض الزيارات"
          value={mode}
          onValueChange={onModeChange}
          options={[
            { value: "list", label: "قائمة", icon: ListBullets },
            { value: "map", label: "خريطة", icon: MapTrifold },
          ]}
        />

        <FilterBar
          quickFilters={[
            <Combobox key="rep" aria-label="المندوب" placeholder="كل المندوبين" options={repOptions} value={filters.repId} onValueChange={(repId) => set({ repId })} clearable />,
            <DateRangePicker key="range" aria-label="الفترة" placeholder="كل الأوقات" value={filters.range} onValueChange={(range) => set({ range })} max={today} today={today} />,
            <Combobox
              key="verification"
              aria-label="التحقق"
              placeholder="كل الحالات"
              options={verificationOptions}
              value={filters.verification}
              onValueChange={(verification) => set({ verification: verification as VisitVerification | null })}
              clearable
            />,
          ]}
          active={active}
          onClearAll={clearAll}
        />

        {mode === "list" ? (
          <DataTable
            label="الزيارات"
            columns={columns}
            rows={ready ? ready.data : []}
            getRowKey={(row) => row.id ?? ""}
            loading={visits.status === "loading"}
            error={visits.status === "error" ? { code: visits.code, onRetry } : undefined}
            empty={empty}
            onRowOpen={onOpenVisit}
          />
        ) : (
          mapBody
        )}

        {ready ? <Pagination meta={ready.meta} onPageChange={onPageChange} onPerPageChange={onPerPageChange} /> : null}
      </div>
    </>
  );
}

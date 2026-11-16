"use client";

import { Clock, MagnifyingGlass } from "@phosphor-icons/react";
import { TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { FilterBar, type ActiveFilter } from "@/components/data/FilterBar";
import { Pagination, type PaginationMeta } from "@/components/data/Pagination";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { DateRangePicker, type DateRange } from "@/components/ui/DateRangePicker";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Option } from "@/components/ui/OptionList";
import type { AttendanceSession, Location, UserRef } from "@/lib/api/types";
import { dayLabel, type IsoDate } from "@/lib/calendar";
import { formatTime, isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

/**
 * صف في جدول الدوام: جلسة من العقد، أو يوم غياب (لا جلسة له في `GET /attendance-sessions`).
 * صف الغياب أُضيف في الواجهة ومصدره مطلوب من الباك: docs/backend-requests.md §28.2.
 */
export type AttendanceRow = { kind: "session"; session: AttendanceSession } | { kind: "absence"; rep: UserRef; work_date: IsoDate };

/** ما يُعرض: كل الصفوف، أو نوع واحد. `auto-closed` يقابل `close_source=AUTO` في العقد، والباقي مشتق (§28.1). */
export type AttendanceView = "all" | "short-day" | "absent" | "auto-closed";

/** الفلاتر: `rep_id` و`from`/`to`، ومفتاح العرض. تغيّرها يعيد الأب إلى الصفحة الأولى. */
export type AttendanceFilters = { repId: string | null; range: DateRange; view: AttendanceView };

export const noAttendanceFilters: AttendanceFilters = { repId: null, range: { from: null, to: null }, view: "all" };

/** صفحة من `GET /attendance-sessions` (`Paginated`) مع صفوف الغياب. */
export type AttendancePage = { data: readonly AttendanceRow[]; meta: PaginationMeta };

type AttendanceSessionsViewProps = {
  rows: Loadable<AttendancePage>;
  /** مندوبو نطاق المستخدم كمواقع `GET /locations?type=REP`: خيارات فلتر المندوب. */
  reps: readonly Location[];
  filters: AttendanceFilters;
  onFiltersChange: (filters: AttendanceFilters) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  today: IsoDate;
  onRetry?: () => void;
};

const viewOptions: Option[] = [
  { value: "short-day", label: "دوام ناقص" },
  { value: "absent", label: "غياب" },
  { value: "auto-closed", label: "إغلاق آلي" },
];

const viewLabels: Record<Exclude<AttendanceView, "all">, string> = { "short-day": "دوام ناقص", absent: "غياب", "auto-closed": "إغلاق آلي" };

const rangeLabel = ({ from, to }: DateRange) => (from && to ? (from === to ? dayLabel(from) : `${dayLabel(from)} – ${dayLabel(to)}`) : from ? `من ${dayLabel(from)}` : to ? `حتى ${dayLabel(to)}` : "");

/** «8 س 20 د». */
function durationLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours === 0 ? `${isolate(rest)} د` : `${isolate(hours)} س${rest === 0 ? "" : ` ${isolate(rest)} د`}`;
}

/** دوام ناقص: جلسة منتهية بأقل من 8 ساعات (`is_full_day === false`) ولا عطلة. */
export const isShortDay = (session: AttendanceSession) => session.is_full_day === false && !session.is_holiday;

/**
 * الدوام (S04): جلسات دوام المندوبين: البدء والانتهاء والمدة و«يوم كامل؟» والعلامات (إغلاق آلي، عطلة، دوام ناقص، غياب).
 * الخصم قرار يدوي للمدير التنفيذي لا آلي، فالشاشة للاطلاع وحده.
 */
export function AttendanceSessionsView({ rows, reps, filters, onFiltersChange, onPageChange, onPerPageChange, today, onRetry }: AttendanceSessionsViewProps) {
  const repOptions: Option[] = reps.flatMap((rep) => (rep.user?.id !== undefined && rep.name ? [{ value: String(rep.user.id), label: rep.name }] : []));

  const set = (patch: Partial<AttendanceFilters>) => onFiltersChange({ ...filters, ...patch });
  const clearAll = () => onFiltersChange(noAttendanceFilters);

  const active: ActiveFilter[] = [
    ...(filters.repId ? [{ key: "rep", label: `المندوب: ${repOptions.find((o) => o.value === filters.repId)?.label ?? ""}`, onRemove: () => set({ repId: null }) }] : []),
    ...(filters.range.from || filters.range.to ? [{ key: "range", label: `الفترة: ${rangeLabel(filters.range)}`, onRemove: () => set({ range: { from: null, to: null } }) }] : []),
    ...(filters.view !== "all" ? [{ key: "view", label: `العرض: ${viewLabels[filters.view]}`, onRemove: () => set({ view: "all" }) }] : []),
  ];

  const repOf = (row: AttendanceRow) => (row.kind === "session" ? row.session.rep : row.rep);
  const dateOf = (row: AttendanceRow) => (row.kind === "session" ? row.session.work_date : row.work_date);

  const columns: DataTableColumn<AttendanceRow>[] = [
    { key: "rep", header: "المندوب", cell: (row) => <TextCell value={repOf(row)?.name} />, width: "w-44", priority: "high", role: "primary" },
    { key: "work_date", header: "يوم العمل", cell: (row) => <span className="whitespace-nowrap">{dateOf(row) ? dayLabel(dateOf(row) as IsoDate) : "—"}</span>, width: "w-44", priority: "high" },
    {
      key: "started",
      header: "البدء",
      cell: (row) => (row.kind === "session" && row.session.started_at ? <span dir="ltr">{formatTime(row.session.started_at)}</span> : <span className="text-fg-muted">—</span>),
      width: "w-24",
      align: "end",
    },
    {
      key: "ended",
      header: "الانتهاء",
      cell: (row) => (row.kind === "session" && row.session.ended_at ? <span dir="ltr">{formatTime(row.session.ended_at)}</span> : <span className="text-fg-muted">—</span>),
      width: "w-28",
      align: "end",
    },
    {
      key: "duration",
      header: "المدة",
      cell: (row) => (row.kind === "session" && row.session.duration_minutes !== null && row.session.duration_minutes !== undefined ? <span className="whitespace-nowrap">{durationLabel(row.session.duration_minutes)}</span> : <span className="text-fg-muted">—</span>),
      width: "w-28",
      align: "end",
      priority: "high",
    },
    {
      key: "full_day",
      header: "يوم كامل؟",
      cell: (row) => (row.kind === "session" && row.session.is_full_day !== null && row.session.is_full_day !== undefined ? <span>{row.session.is_full_day ? "نعم" : "لا"}</span> : <span className="text-fg-muted">—</span>),
      width: "w-28",
    },
    {
      key: "flags",
      header: "العلامات",
      cell: (row) => {
        if (row.kind === "absence") return <Badge color="danger">غياب</Badge>;
        const { session } = row;
        const badges = [
          session.ended_at ? null : <Badge key="open" color="info">جارية</Badge>,
          session.close_source === "AUTO" ? <Badge key="auto" color="warning">إغلاق آلي</Badge> : null,
          session.is_holiday ? <Badge key="holiday" color="neutral">عطلة</Badge> : null,
          isShortDay(session) ? <Badge key="short" color="warning">دوام ناقص</Badge> : null,
        ].filter(Boolean);
        return badges.length > 0 ? <span className="flex flex-wrap items-center gap-1">{badges}</span> : <span className="text-fg-muted">—</span>;
      },
      priority: "high",
      role: "status",
    },
  ];

  const empty =
    active.length > 0 ? (
      <EmptyState
        icon={MagnifyingGlass}
        title="لا نتائج للفلتر"
        description="لا توجد جلسات دوام تطابق ما اخترته. غيّر الفلاتر أو امسحها."
        action={
          <Button variant="secondary" onClick={clearAll}>
            مسح الفلاتر
          </Button>
        }
      />
    ) : (
      <EmptyState icon={Clock} title="لا جلسات دوام بعد" description="تظهر هنا جلسات دوام المندوبين حين يبدؤون يومهم." />
    );

  return (
    <>
      <PageHeader title="الدوام" description="جلسات دوام مندوبي محافظاتك، من الأحدث إلى الأقدم." />

      <div className="flex flex-col gap-4">
        <FilterBar
          quickFilters={[
            <Combobox key="rep" aria-label="المندوب" placeholder="كل المندوبين" options={repOptions} value={filters.repId} onValueChange={(repId) => set({ repId })} clearable />,
            <DateRangePicker key="range" aria-label="الفترة" placeholder="كل الأوقات" value={filters.range} onValueChange={(range) => set({ range })} max={today} today={today} />,
            <Combobox key="view" aria-label="العرض" placeholder="كل الجلسات" options={viewOptions} value={filters.view === "all" ? null : filters.view} onValueChange={(view) => set({ view: (view ?? "all") as AttendanceView })} clearable />,
          ]}
          active={active}
          onClearAll={clearAll}
        />

        <DataTable
          label="جلسات الدوام"
          columns={columns}
          rows={rows.status === "ready" ? rows.data.data : []}
          getRowKey={(row) => (row.kind === "session" ? `s-${row.session.id}` : `a-${row.rep.id}-${row.work_date}`)}
          loading={rows.status === "loading"}
          error={rows.status === "error" ? { code: rows.code, onRetry } : undefined}
          empty={empty}
        />

        {rows.status === "ready" ? <Pagination meta={rows.data.meta} onPageChange={onPageChange} onPerPageChange={onPerPageChange} /> : null}

        <p className="text-label text-fg-muted">الخصم قرار يدوي للمدير التنفيذي، لا آلي.</p>
      </div>
    </>
  );
}

"use client";

import { Flag as FlagIcon, MagnifyingGlass } from "@phosphor-icons/react";
import { StatusCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { FilterBar, type ActiveFilter } from "@/components/data/FilterBar";
import { flagRefLabels, flagTypeLabels } from "@/components/data/flag-types";
import { Pagination, type PaginationMeta } from "@/components/data/Pagination";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Combobox } from "@/components/ui/Combobox";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import type { Option } from "@/components/ui/OptionList";
import { Skeleton } from "@/components/ui/Skeleton";
import type { FlagType, UserRef } from "@/lib/api/types";
import { flagDeadline } from "@/lib/deadline";
import { formatRelative, isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";
import type { FlagRow } from "../deadline";

/**
 * مرشّح الحالة: «مفتوحة» (`status=OPEN`)، و«قاربت المهلة» و«مغلقة» مشتقان في الواجهة (الأول من `due_at`، والثاني كل ما ليس OPEN)
 * لأن العقد يقبل حالة واحدة في `status` (docs/backend-requests.md §31.5).
 */
export type FlagStatusFilter = "OPEN" | "NEAR" | "CLOSED";

/** الفلاتر: `type` و`subject_user_id` ومرشّح الحالة. تغيّرها يعيد الأب إلى الصفحة الأولى. */
export type FlagFilters = { type: FlagType | null; status: FlagStatusFilter | null; personId: string | null };

export const noFlagFilters: FlagFilters = { type: null, status: null, personId: null };

/** صفحة من `GET /qa-flags` (`Paginated`). */
export type FlagsPage = { data: readonly FlagRow[]; meta: PaginationMeta };

type FlagsListViewProps = {
  flags: Loadable<FlagsPage>;
  /** من تقع عليهم العلامات: خيارات فلتر «الشخص». */
  people: readonly UserRef[];
  filters: FlagFilters;
  onFiltersChange: (filters: FlagFilters) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  /** الآن (ISO UTC): للعمر والوقت المتبقي من المهلة. */
  now: string;
  /** يفتح العلامة: المعالجة (S09)، أو الزيارة (S06)، أو الجهة (S10 وS11) بحسب نوعها. */
  onOpenFlag?: (flag: FlagRow) => void;
  onRetry?: () => void;
};

const flagTypeValues = Object.keys(flagTypeLabels) as FlagType[];
const typeOptions: Option[] = flagTypeValues.map((value) => ({ value, label: flagTypeLabels[value] }));

const statusLabels: Record<FlagStatusFilter, string> = { OPEN: "مفتوحة", NEAR: "قاربت المهلة", CLOSED: "مغلقة" };
const statusOptions: Option[] = (Object.keys(statusLabels) as FlagStatusFilter[]).map((value) => ({ value, label: statusLabels[value] }));

type Group = { person: UserRef; rows: FlagRow[] };

/** «علامة» · «علامتان» · «5 علامات» · «14 علامة». */
function flagsCount(count: number): string {
  if (count === 1) return "علامة";
  if (count === 2) return "علامتان";
  return count <= 10 ? `${isolate(count)} علامات` : `${isolate(count)} علامة`;
}

/** تجميع صفحة العلامات حسب الشخص: أكثرهم علامات مفتوحة أولاً. التجميع في الواجهة لأن العقد يعيد قائمة مسطّحة (§31.1). */
function groupByPerson(rows: readonly FlagRow[]): Group[] {
  const groups = new Map<number, Group>();
  for (const row of rows) {
    const person = row.subject_user;
    if (!person?.id) continue;
    const group = groups.get(person.id) ?? { person, rows: [] };
    group.rows.push(row);
    groups.set(person.id, group);
  }
  const openCount = (group: Group) => group.rows.filter((row) => row.status === "OPEN").length;
  return [...groups.values()].sort((a, b) => openCount(b) - openCount(a) || (a.person.name ?? "").localeCompare(b.person.name ?? "", "ar"));
}

/**
 * العلامات (S08): قائمة واحدة لكل الأنواع مجمّعة حسب الشخص. لكل علامة نوعها والسجل المرتبط وعمرها والوقت المتبقي من مهلة 72 ساعة عمل.
 * الفلاتر: النوع والحالة والشخص. المراقبة لا تملك عقوبة (القرار 4): معالجة العلامة تنتهي بـ«لا مشكلة» أو «مشكلة مسجّلة» أو «تحويل لتحقيق».
 */
export function FlagsListView({ flags, people, filters, onFiltersChange, onPageChange, onPerPageChange, now, onOpenFlag, onRetry }: FlagsListViewProps) {
  const personOptions: Option[] = people.flatMap((person) => (person.id !== undefined && person.name ? [{ value: String(person.id), label: person.name }] : []));

  const set = (patch: Partial<FlagFilters>) => onFiltersChange({ ...filters, ...patch });
  const clearAll = () => onFiltersChange(noFlagFilters);

  const active: ActiveFilter[] = [
    ...(filters.type ? [{ key: "type", label: `النوع: ${flagTypeLabels[filters.type]}`, onRemove: () => set({ type: null }) }] : []),
    ...(filters.status ? [{ key: "status", label: `الحالة: ${statusLabels[filters.status]}`, onRemove: () => set({ status: null }) }] : []),
    ...(filters.personId ? [{ key: "person", label: `الشخص: ${personOptions.find((o) => o.value === filters.personId)?.label ?? ""}`, onRemove: () => set({ personId: null }) }] : []),
  ];

  const columns: DataTableColumn<FlagRow>[] = [
    { key: "type", header: "النوع", cell: (row) => <TextCell value={row.type ? flagTypeLabels[row.type] : null} />, priority: "high", role: "primary" },
    {
      key: "ref",
      header: "السجل المرتبط",
      cell: (row) => <span className="whitespace-nowrap">{row.ref_type ? `${flagRefLabels[row.ref_type]} ${isolate(`#${row.ref_id}`)}` : "—"}</span>,
      width: "w-36",
      priority: "high",
    },
    { key: "age", header: "العمر", cell: (row) => <span className="whitespace-nowrap">{row.created_at ? formatRelative(row.created_at, now) : "—"}</span>, width: "w-36" },
    {
      key: "deadline",
      header: "المهلة",
      cell: (row) => {
        if (row.status !== "OPEN") return row.handling_work_hours === null || row.handling_work_hours === undefined ? <span className="text-fg-muted">—</span> : <span className="text-fg-muted">{`عولجت خلال ${isolate(row.handling_work_hours)} ساعة عمل`}</span>;
        const deadline = flagDeadline(row.due_at, now);
        if (!deadline) return <span className="text-fg-muted">—</span>;
        return deadline.late ? <Badge color="danger">متأخر</Badge> : <span className={deadline.urgent ? "text-caption text-warning" : "text-caption text-fg-muted"}>{deadline.label}</span>;
      },
      width: "w-40",
      priority: "high",
    },
    { key: "status", header: "الحالة", cell: (row) => (row.status ? <StatusCell entity="flag" status={row.status} /> : <TextCell value={null} />), width: "w-32", priority: "high", role: "status" },
  ];

  const empty =
    active.length > 0 ? (
      <EmptyState
        icon={MagnifyingGlass}
        title="لا نتائج للفلتر"
        description="لا توجد علامات تطابق ما اخترته. غيّر الفلاتر أو امسحها."
        action={
          <Button variant="secondary" onClick={clearAll}>
            مسح الفلاتر
          </Button>
        }
      />
    ) : (
      <EmptyState icon={FlagIcon} title="لا علامات" description="تظهر هنا علامات الزيارات والدوام والمخزون حين تُرفع." />
    );

  const groups = flags.status === "ready" ? groupByPerson(flags.data.data) : [];

  return (
    <>
      <PageHeader title="العلامات" description="كل أنواع العلامات في قائمة واحدة مجمّعة حسب الشخص، ولكل علامة مهلة معالجة 72 ساعة عمل." />

      <div className="flex flex-col gap-4">
        <FilterBar
          quickFilters={[
            <Combobox key="type" aria-label="النوع" placeholder="كل الأنواع" options={typeOptions} value={filters.type} onValueChange={(type) => set({ type: type as FlagType | null })} clearable />,
            <Combobox key="status" aria-label="الحالة" placeholder="كل الحالات" options={statusOptions} value={filters.status} onValueChange={(status) => set({ status: status as FlagStatusFilter | null })} clearable />,
            <Combobox key="person" aria-label="الشخص" placeholder="كل الأشخاص" options={personOptions} value={filters.personId} onValueChange={(personId) => set({ personId })} clearable />,
          ]}
          active={active}
          onClearAll={clearAll}
        />

        {flags.status === "loading" ? (
          <div aria-busy="true" className="flex flex-col gap-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : flags.status === "error" ? (
          <div className="rounded-lg border border-border bg-surface">
            <ErrorState code={flags.code} onRetry={onRetry} />
          </div>
        ) : groups.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface">{empty}</div>
        ) : (
          groups.map((group) => {
            const open = group.rows.filter((row) => row.status === "OPEN").length;
            return (
              <Card key={group.person.id} title={group.person.name ?? "—"} action={<Badge color={open > 0 ? "warning" : "neutral"}>{`${flagsCount(group.rows.length)} · ${open === 0 ? "لا مفتوحة" : open === 1 ? "مفتوحة واحدة" : `${isolate(open)} مفتوحة`}`}</Badge>}>
                <DataTable label={`علامات ${group.person.name ?? ""}`} columns={columns} rows={group.rows} getRowKey={(row) => row.id ?? ""} onRowOpen={onOpenFlag} />
              </Card>
            );
          })
        )}

        {flags.status === "ready" ? <Pagination meta={flags.data.meta} onPageChange={onPageChange} onPerPageChange={onPerPageChange} /> : null}
      </div>
    </>
  );
}

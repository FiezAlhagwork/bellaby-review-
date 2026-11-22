"use client";

import { CalendarCheck, MagnifyingGlass } from "@phosphor-icons/react";
import { StatusCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { FilterBar, type ActiveFilter } from "@/components/data/FilterBar";
import { Pagination, type PaginationMeta } from "@/components/data/Pagination";
import { statusMap } from "@/components/data/status-map";
import { taskSourceLabels, taskSourceOrder } from "@/components/data/task-sources";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Combobox } from "@/components/ui/Combobox";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Option } from "@/components/ui/OptionList";
import { Tabs } from "@/components/ui/Tabs";
import type { Task, TaskSource, TaskStatus } from "@/lib/api/types";
import { formatDateShort, formatTime } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

/** `scope` في `GET /tasks`. */
export type TaskScope = "assigned_to_me" | "assigned_by_me";

/** الفلاتر كما يرسلها العقد: `status` و`overdue` و`source`. تغيّرها يعيد الأب إلى الصفحة الأولى. */
export type TaskFilters = { status: TaskStatus | null; overdueOnly: boolean; source: TaskSource | null };
export const noTaskFilters: TaskFilters = { status: null, overdueOnly: false, source: null };

export type TasksPage = { data: readonly Task[]; meta: PaginationMeta };

type TasksListViewProps = {
  tasks: Loadable<TasksPage>;
  scope: TaskScope;
  onScopeChange: (scope: TaskScope) => void;
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  /** «إسناد مهمة»: لمن له مكلَّفون (`GET /me/assignees` غير فارغة). */
  canAssign: boolean;
  onNewTask?: () => void;
  /** يفتح تفاصيل المهمة (G07). */
  onOpenTask?: (task: Task) => void;
  onRetry?: () => void;
};

const statusOptions: Option[] = (Object.keys(statusMap.task) as TaskStatus[]).map((value) => ({ value, label: statusMap.task[value].label }));
const sourceOptions: Option[] = taskSourceOrder.map((value) => ({ value, label: taskSourceLabels[value] }));

/**
 * المهام (G06): «المسندة إليّ» و«التي أسندتها». لكل مهمة عنوانها ومصدرها، والمكلَّف أو المُسند، والموعد وعلامة «متأخرة»، والحالة والأولوية.
 * فلاتر الحالة والمتأخرة والمصدر، وترقيم. «إسناد مهمة» لمن له فريق. الصف يفتح التفاصيل.
 */
export function TasksListView({ tasks, scope, onScopeChange, filters, onFiltersChange, onPageChange, onPerPageChange, canAssign, onNewTask, onOpenTask, onRetry }: TasksListViewProps) {
  const set = (patch: Partial<TaskFilters>) => onFiltersChange({ ...filters, ...patch });
  const mine = scope === "assigned_to_me";

  const active: ActiveFilter[] = [
    ...(filters.status ? [{ key: "status", label: `الحالة: ${statusMap.task[filters.status].label}`, onRemove: () => set({ status: null }) }] : []),
    ...(filters.overdueOnly ? [{ key: "overdue", label: "المتأخرة فقط", onRemove: () => set({ overdueOnly: false }) }] : []),
    ...(filters.source ? [{ key: "source", label: `المصدر: ${taskSourceLabels[filters.source]}`, onRemove: () => set({ source: null }) }] : []),
  ];

  const columns: DataTableColumn<Task>[] = [
    {
      key: "title",
      header: "المهمة",
      cell: (row) => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-body text-fg">{row.title}</span>
          <span className="text-caption text-fg-muted">{row.source ? taskSourceLabels[row.source] : ""}</span>
        </span>
      ),
      priority: "high",
      role: "primary",
    },
    { key: "person", header: mine ? "المُسند" : "المكلَّف", cell: (row) => <TextCell value={(mine ? row.assigned_by : row.assignee)?.name} />, width: "w-40", priority: "high" },
    {
      key: "due",
      header: "الموعد",
      cell: (row) => (
        <span className={row.is_overdue ? "text-body text-danger" : "text-body text-fg"}>{row.due_at ? `${formatDateShort(row.due_at)} · ${formatTime(row.due_at)}` : "—"}</span>
      ),
      width: "w-44",
      priority: "high",
    },
    { key: "priority", header: "الأولوية", cell: (row) => (row.priority ? <StatusCell entity="priority" status={row.priority} /> : <TextCell value={null} />), width: "w-28" },
    {
      key: "status",
      header: "الحالة",
      cell: (row) => (
        <span className="flex flex-wrap items-center gap-1">
          {row.status ? <StatusCell entity="task" status={row.status} /> : null}
          {row.is_overdue ? <Badge color="danger">متأخرة</Badge> : null}
        </span>
      ),
      width: "w-48",
      priority: "high",
      role: "status",
    },
  ];

  const empty =
    active.length > 0 ? (
      <EmptyState
        icon={MagnifyingGlass}
        title="لا نتائج للفلتر"
        description="لا مهام تطابق ما اخترته."
        action={
          <Button variant="secondary" onClick={() => onFiltersChange(noTaskFilters)}>
            مسح الفلاتر
          </Button>
        }
      />
    ) : (
      <EmptyState icon={CalendarCheck} title={mine ? "لا مهام مسندة إليك" : "لم تسند مهام بعد"} description={mine ? "تظهر هنا المهام التي يسندها إليك مديرك." : "أسند مهمة إلى أحد فريقك."} />
    );

  return (
    <>
      <PageHeader title="المهام" description="المهمة تُبدأ ثم تُسلَّم، ويقبلها من أسندها أو يرفضها بسبب." actions={canAssign && onNewTask ? [{ id: "new", label: "إسناد مهمة", primary: true, onSelect: onNewTask }] : undefined} />

      <div className="flex flex-col gap-4">
        <Tabs
          aria-label="المهام"
          tabs={[
            { value: "assigned_to_me", label: "المسندة إليّ" },
            { value: "assigned_by_me", label: "التي أسندتها" },
          ]}
          value={scope}
          onValueChange={onScopeChange}
        />

        <FilterBar
          quickFilters={[
            <Combobox key="status" aria-label="الحالة" placeholder="كل الحالات" options={statusOptions} value={filters.status} onValueChange={(status) => set({ status: status as TaskStatus | null })} clearable />,
            <Combobox key="source" aria-label="المصدر" placeholder="كل المصادر" options={sourceOptions} value={filters.source} onValueChange={(source) => set({ source: source as TaskSource | null })} clearable />,
          ]}
          moreFilters={<Checkbox label="المتأخرة فقط" description="فات موعدها وهي جديدة أو قيد التنفيذ." checked={filters.overdueOnly} onCheckedChange={(overdueOnly) => set({ overdueOnly })} />}
          active={active}
          onClearAll={() => onFiltersChange(noTaskFilters)}
        />

        <DataTable
          label="المهام"
          columns={columns}
          rows={tasks.status === "ready" ? tasks.data.data : []}
          getRowKey={(row) => row.id ?? ""}
          loading={tasks.status === "loading"}
          error={tasks.status === "error" ? { code: tasks.code, onRetry } : undefined}
          empty={empty}
          onRowOpen={onOpenTask}
        />

        {tasks.status === "ready" ? <Pagination meta={tasks.data.meta} onPageChange={onPageChange} onPerPageChange={onPerPageChange} /> : null}
      </div>
    </>
  );
}

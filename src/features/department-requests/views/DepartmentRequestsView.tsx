"use client";

import { MagnifyingGlass, Newspaper } from "@phosphor-icons/react";
import { DateCell, StatusCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { departmentLabels } from "@/components/data/departments";
import { FilterBar, type ActiveFilter } from "@/components/data/FilterBar";
import { Pagination, type PaginationMeta } from "@/components/data/Pagination";
import { statusMap } from "@/components/data/status-map";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Combobox } from "@/components/ui/Combobox";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Option } from "@/components/ui/OptionList";
import { Tabs } from "@/components/ui/Tabs";
import type { DepartmentRequest, DeptRequestStatus } from "@/lib/api/types";
import { dayLabel } from "@/lib/calendar";
import type { Loadable } from "@/lib/loadable";

/** `direction` في `GET /department-requests`. */
export type RequestDirection = "incoming" | "outgoing";

/** الفلاتر كما يرسلها العقد: `status` و`overdue`. */
export type RequestFilters = { status: DeptRequestStatus | null; overdueOnly: boolean };
export const noRequestFilters: RequestFilters = { status: null, overdueOnly: false };

export type DepartmentRequestsPage = { data: readonly DepartmentRequest[]; meta: PaginationMeta };

type DepartmentRequestsViewProps = {
  requests: Loadable<DepartmentRequestsPage>;
  direction: RequestDirection;
  onDirectionChange: (direction: RequestDirection) => void;
  filters: RequestFilters;
  onFiltersChange: (filters: RequestFilters) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  /** يفتح تفاصيل الطلب (G10). */
  onOpen?: (request: DepartmentRequest) => void;
  onRetry?: () => void;
};

const statusOptions: Option[] = (Object.keys(statusMap.departmentRequest) as DeptRequestStatus[]).map((value) => ({ value, label: statusMap.departmentRequest[value].label }));

/**
 * الطلبات بين الأقسام (G09): «الواردة إلى قسمي» و«الصادرة من قسمي». لكل طلب وصفه، والقسم الآخر، والموعد، والحالة وعلامة التأخر.
 * تُنشأ الطلبات من «الاحتياجات من الأقسام الأخرى» عند إرسال التقرير الدوري، فلا زر إنشاء هنا (القرار 11). الصف يفتح التفاصيل.
 */
export function DepartmentRequestsView({ requests, direction, onDirectionChange, filters, onFiltersChange, onPageChange, onPerPageChange, onOpen, onRetry }: DepartmentRequestsViewProps) {
  const set = (patch: Partial<RequestFilters>) => onFiltersChange({ ...filters, ...patch });
  const incoming = direction === "incoming";

  const active: ActiveFilter[] = [
    ...(filters.status ? [{ key: "status", label: `الحالة: ${statusMap.departmentRequest[filters.status].label}`, onRemove: () => set({ status: null }) }] : []),
    ...(filters.overdueOnly ? [{ key: "overdue", label: "المتأخرة فقط", onRemove: () => set({ overdueOnly: false }) }] : []),
  ];

  const columns: DataTableColumn<DepartmentRequest>[] = [
    { key: "description", header: "الطلب", cell: (row) => <span className="line-clamp-2 text-body text-fg">{row.description}</span>, priority: "high", role: "primary" },
    {
      key: "department",
      header: incoming ? "من قسم" : "إلى قسم",
      cell: (row) => {
        const department = incoming ? row.from_department : row.to_department;
        return <TextCell value={department ? departmentLabels[department] : null} />;
      },
      width: "w-36",
      priority: "high",
    },
    { key: "due", header: "الموعد", cell: (row) => <span className={row.is_overdue ? "text-body text-danger" : "text-body text-fg"}>{row.due_date ? dayLabel(row.due_date) : "—"}</span>, width: "w-40", priority: "high" },
    {
      key: "status",
      header: "الحالة",
      cell: (row) => (
        <span className="flex flex-wrap items-center gap-1">
          {row.status ? <StatusCell entity="departmentRequest" status={row.status} /> : null}
          {row.is_overdue ? <Badge color="danger">متأخر</Badge> : null}
        </span>
      ),
      width: "w-44",
      priority: "high",
      role: "status",
    },
    { key: "created", header: "التاريخ", cell: (row) => <DateCell value={row.created_at} />, width: "w-32" },
  ];

  const empty =
    active.length > 0 ? (
      <EmptyState
        icon={MagnifyingGlass}
        title="لا نتائج للفلتر"
        description="لا طلبات تطابق ما اخترته."
        action={
          <Button variant="secondary" onClick={() => onFiltersChange(noRequestFilters)}>
            مسح الفلاتر
          </Button>
        }
      />
    ) : (
      <EmptyState icon={Newspaper} title={incoming ? "لا طلبات واردة" : "لا طلبات صادرة"} description={incoming ? "تظهر هنا طلبات الأقسام الأخرى إلى قسمك." : "تُرسل الطلبات من «الاحتياجات من الأقسام الأخرى» في التقرير الدوري."} />
    );

  return (
    <>
      <PageHeader title="الطلبات بين الأقسام" description="الطلبات تُرسل من التقرير الدوري. يقبلها رئيس القسم المطلوب منه أو يرفضها، ثم يغلقها منجزة." />

      <div className="flex flex-col gap-4">
        <Tabs
          aria-label="الطلبات بين الأقسام"
          tabs={[
            { value: "incoming", label: "الواردة إلى قسمي" },
            { value: "outgoing", label: "الصادرة من قسمي" },
          ]}
          value={direction}
          onValueChange={onDirectionChange}
        />

        <FilterBar
          quickFilters={[<Combobox key="status" aria-label="الحالة" placeholder="كل الحالات" options={statusOptions} value={filters.status} onValueChange={(status) => set({ status: status as DeptRequestStatus | null })} clearable />]}
          moreFilters={<Checkbox label="المتأخرة فقط" description="تجاوزت موعدها ولم تُنجز." checked={filters.overdueOnly} onCheckedChange={(overdueOnly) => set({ overdueOnly })} />}
          active={active}
          onClearAll={() => onFiltersChange(noRequestFilters)}
        />

        <DataTable
          label="الطلبات بين الأقسام"
          columns={columns}
          rows={requests.status === "ready" ? requests.data.data : []}
          getRowKey={(row) => row.id ?? ""}
          loading={requests.status === "loading"}
          error={requests.status === "error" ? { code: requests.code, onRetry } : undefined}
          empty={empty}
          onRowOpen={onOpen}
        />

        {requests.status === "ready" ? <Pagination meta={requests.data.meta} onPageChange={onPageChange} onPerPageChange={onPerPageChange} /> : null}
      </div>
    </>
  );
}

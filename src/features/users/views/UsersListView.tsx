"use client";

import { MagnifyingGlass, UsersThree } from "@phosphor-icons/react";
import { TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { departmentLabels, departmentOrder, userTypeLabels } from "@/components/data/departments";
import { FilterBar, type ActiveFilter } from "@/components/data/FilterBar";
import { Pagination, type PaginationMeta } from "@/components/data/Pagination";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Option } from "@/components/ui/OptionList";
import type { Department, RoleRef, User } from "@/lib/api/types";
import { formatDateTime, formatPhone } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

/** الفلاتر كما يرسلها العقد: `q` و`role_id` و`department` و`is_active`. تغيّرها يعيد الأب إلى الصفحة الأولى. */
export type UserFilters = { q: string; roleId: string | null; department: Department | null; status: "active" | "inactive" | null };
export const noUserFilters: UserFilters = { q: "", roleId: null, department: null, status: null };

export type UsersPage = { data: readonly User[]; meta: PaginationMeta };

type UsersListViewProps = {
  users: Loadable<UsersPage>;
  /** خيارات فلتر الدور (`GET /roles`). */
  roles: readonly RoleRef[];
  filters: UserFilters;
  onFiltersChange: (filters: UserFilters) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  /** `users.manage`: «حساب جديد». */
  canCreate: boolean;
  onNewUser?: () => void;
  /** يفتح صفحة المستخدم (I03). */
  onOpenUser?: (user: User) => void;
  onRetry?: () => void;
};

const departmentOptions: Option[] = departmentOrder.map((value) => ({ value, label: departmentLabels[value] }));
const statusOptions: Option[] = [
  { value: "active", label: "مفعّل" },
  { value: "inactive", label: "معطّل" },
];

const columns: DataTableColumn<User>[] = [
  {
    key: "name",
    header: "الاسم",
    cell: (row) => (
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-body text-fg">{row.name}</span>
        <span dir="ltr" className="block truncate text-end text-caption text-fg-muted">
          {row.type === "REP" ? (row.phone ? formatPhone(row.phone) : "") : (row.email ?? "")}
        </span>
      </span>
    ),
    priority: "high",
    role: "primary",
  },
  { key: "role", header: "الدور", cell: (row) => <TextCell value={row.is_department_head ? `${row.role?.name ?? ""} · رئيس قسم` : row.role?.name} />, width: "w-44", priority: "high" },
  { key: "department", header: "القسم", cell: (row) => <TextCell value={row.department ? departmentLabels[row.department] : null} />, width: "w-36" },
  { key: "governorates", header: "المحافظات", cell: (row) => <TextCell value={(row.governorates ?? []).map((item) => item.name).join("، ") || null} />, width: "w-40" },
  { key: "type", header: "النوع", cell: (row) => <TextCell value={row.type ? userTypeLabels[row.type] : null} />, width: "w-20" },
  { key: "status", header: "الحالة", cell: (row) => <Badge color={row.is_active ? "success" : "neutral"}>{row.is_active ? "مفعّل" : "معطّل"}</Badge>, width: "w-24", priority: "high", role: "status" },
  { key: "last_login", header: "آخر دخول", cell: (row) => <TextCell value={row.last_login_at ? formatDateTime(row.last_login_at) : "لم يدخل بعد"} />, width: "w-44" },
];

/**
 * المستخدمون (I01): كل الحسابات (ويب ومندوب) بدورها وقسمها ومحافظاتها وحالتها وآخر دخول. بحث وفلاتر الدور والقسم والحالة، وترقيم.
 * «حساب جديد» لمن يملك `users.manage` (لا تسجيل ذاتي). الصف يفتح صفحة المستخدم.
 */
export function UsersListView({ users, roles, filters, onFiltersChange, onPageChange, onPerPageChange, canCreate, onNewUser, onOpenUser, onRetry }: UsersListViewProps) {
  const set = (patch: Partial<UserFilters>) => onFiltersChange({ ...filters, ...patch });
  const roleOptions: Option[] = roles.map((item) => ({ value: String(item.id), label: item.name ?? "" }));
  const roleName = roles.find((item) => String(item.id) === filters.roleId)?.name;

  const active: ActiveFilter[] = [
    ...(filters.roleId ? [{ key: "role", label: `الدور: ${roleName ?? ""}`, onRemove: () => set({ roleId: null }) }] : []),
    ...(filters.department ? [{ key: "department", label: `القسم: ${departmentLabels[filters.department]}`, onRemove: () => set({ department: null }) }] : []),
    ...(filters.status ? [{ key: "status", label: `الحالة: ${filters.status === "active" ? "مفعّل" : "معطّل"}`, onRemove: () => set({ status: null }) }] : []),
  ];

  const empty =
    active.length > 0 || filters.q !== "" ? (
      <EmptyState
        icon={MagnifyingGlass}
        title="لا نتائج"
        description="لا حسابات تطابق البحث أو الفلاتر."
        action={
          <Button variant="secondary" onClick={() => onFiltersChange(noUserFilters)}>
            مسح الفلاتر
          </Button>
        }
      />
    ) : (
      <EmptyState icon={UsersThree} title="لا حسابات بعد" description="أنشئ أول حساب. لا تسجيل ذاتي في النظام." />
    );

  return (
    <>
      <PageHeader
        title="المستخدمون"
        description="حسابات الويب والمندوبين. الحساب يُعطَّل ولا يُحذف، ويُنشأ من هنا وحده."
        actions={canCreate && onNewUser ? [{ id: "new", label: "حساب جديد", primary: true, onSelect: onNewUser }] : undefined}
      />

      <div className="flex flex-col gap-4">
        <FilterBar
          search={{ value: filters.q, onChange: (q) => set({ q }), placeholder: "ابحث بالاسم أو البريد أو الهاتف" }}
          quickFilters={[
            <Combobox key="role" aria-label="الدور" placeholder="كل الأدوار" options={roleOptions} value={filters.roleId} onValueChange={(roleId) => set({ roleId })} clearable />,
            <Combobox key="department" aria-label="القسم" placeholder="كل الأقسام" options={departmentOptions} value={filters.department} onValueChange={(department) => set({ department: department as Department | null })} clearable />,
            <Combobox key="status" aria-label="الحالة" placeholder="كل الحالات" options={statusOptions} value={filters.status} onValueChange={(status) => set({ status: status as UserFilters["status"] })} clearable />,
          ]}
          active={active}
          onClearAll={() => onFiltersChange(noUserFilters)}
        />

        <DataTable
          label="المستخدمون"
          columns={columns}
          rows={users.status === "ready" ? users.data.data : []}
          getRowKey={(row) => row.id ?? ""}
          loading={users.status === "loading"}
          error={users.status === "error" ? { code: users.code, onRetry } : undefined}
          empty={empty}
          onRowOpen={onOpenUser}
        />

        {users.status === "ready" ? <Pagination meta={users.data.meta} onPageChange={onPageChange} onPerPageChange={onPerPageChange} /> : null}
      </div>
    </>
  );
}

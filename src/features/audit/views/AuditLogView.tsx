"use client";

import { MagnifyingGlass, ShieldCheck } from "@phosphor-icons/react";
import { DateTimeStackCell, TextCell } from "@/components/data/cells";
import { accessEntityLabels, type AccessEntityType, actionLabel, auditActionLabels, auditEntityLabels, entityLabel } from "@/components/data/audit-labels";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { DescriptionList } from "@/components/data/DescriptionList";
import { FilterBar, type ActiveFilter } from "@/components/data/FilterBar";
import { Pagination, type PaginationMeta } from "@/components/data/Pagination";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { DateRangePicker, type DateRange } from "@/components/ui/DateRangePicker";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Option } from "@/components/ui/OptionList";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import type { AccessLog, AuditLog, UserRef } from "@/lib/api/types";
import { dayLabel, type IsoDate } from "@/lib/calendar";
import { formatDateTime, isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

export type AuditTab = "audit" | "access";

/** فلاتر `GET /audit-logs`: `user_id` و`entity_type` و`action` و`from`/`to`. */
export type AuditFilters = { userId: string | null; entityType: string | null; action: string | null; range: DateRange };
export const noAuditFilters: AuditFilters = { userId: null, entityType: null, action: null, range: { from: null, to: null } };

/** فلتر `GET /access-logs`: `entity_type` (لا فترة ولا منفّذ في العقد: §57.3). */
export type AccessFilters = { entityType: AccessEntityType | null };

export type AuditPage = { data: readonly AuditLog[]; meta: PaginationMeta };
export type AccessPage = { data: readonly AccessLog[]; meta: PaginationMeta };

type AuditLogViewProps = {
  tab: AuditTab;
  onTabChange: (tab: AuditTab) => void;
  /** تبويب «سجل الاطلاع على السري» لمن يملك `access_logs.view`. */
  canViewAccess: boolean;
  audit: Loadable<AuditPage>;
  access: Loadable<AccessPage>;
  /** المستخدمون: خيارات فلتر المنفّذ. */
  users: readonly UserRef[];
  auditFilters: AuditFilters;
  onAuditFiltersChange: (filters: AuditFilters) => void;
  accessFilters: AccessFilters;
  onAccessFiltersChange: (filters: AccessFilters) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  /** السجل المفتوح في الدرج. */
  selected: AuditLog | null;
  onSelect: (log: AuditLog | null) => void;
  today: IsoDate;
  onRetry?: () => void;
};

const toOptions = (labels: Readonly<Record<string, string>>): Option[] => Object.entries(labels).map(([value, label]) => ({ value, label }));

/** قيمة من `changes.before/after` نصاً. */
function valueText(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/**
 * سجل التدقيق (E02): كل إجراء في النظام بوقته ومنفّذه وكيانه، و«بالتفويض عن» إن نُفّذ بتفويض. الصف يفتح درجاً بالتغييرات قبل وبعد.
 * وتبويب «سجل الاطلاع على السري»: من فتح ملف تحقيق أو نزاع أو وثيقة قانونية أو عقد، ومتى. للقراءة فقط.
 */
export function AuditLogView({ tab, onTabChange, canViewAccess, audit, access, users, auditFilters, onAuditFiltersChange, accessFilters, onAccessFiltersChange, onPageChange, onPerPageChange, selected, onSelect, today, onRetry }: AuditLogViewProps) {
  const userOptions: Option[] = users.flatMap((user) => (user.id !== undefined && user.name ? [{ value: String(user.id), label: user.name }] : []));
  const entityOptions = toOptions(auditEntityLabels);
  const actionOptions = toOptions(auditActionLabels);
  const accessOptions = toOptions(accessEntityLabels);

  const tabs: TabItem<AuditTab>[] = [{ value: "audit", label: "سجل التدقيق" }, ...(canViewAccess ? [{ value: "access" as const, label: "سجل الاطلاع على السري" }] : [])];

  const setAudit = (patch: Partial<AuditFilters>) => onAuditFiltersChange({ ...auditFilters, ...patch });
  const { from, to } = auditFilters.range;
  const rangeLabel = from === null ? null : to === null || to === from ? `الفترة: ${dayLabel(from)}` : `الفترة: ${dayLabel(from)} ← ${dayLabel(to)}`;
  const labelOf = (options: Option[], value: string | null) => options.find((option) => option.value === value)?.label ?? value ?? "";

  const auditActive: ActiveFilter[] = [
    ...(auditFilters.userId ? [{ key: "user", label: `المنفّذ: ${labelOf(userOptions, auditFilters.userId)}`, onRemove: () => setAudit({ userId: null }) }] : []),
    ...(auditFilters.entityType ? [{ key: "entity", label: `الكيان: ${labelOf(entityOptions, auditFilters.entityType)}`, onRemove: () => setAudit({ entityType: null }) }] : []),
    ...(auditFilters.action ? [{ key: "action", label: `الإجراء: ${labelOf(actionOptions, auditFilters.action)}`, onRemove: () => setAudit({ action: null }) }] : []),
    ...(rangeLabel ? [{ key: "range", label: rangeLabel, onRemove: () => setAudit({ range: { from: null, to: null } }) }] : []),
  ];
  const accessActive: ActiveFilter[] = accessFilters.entityType ? [{ key: "entity", label: `النوع: ${accessEntityLabels[accessFilters.entityType]}`, onRemove: () => onAccessFiltersChange({ entityType: null }) }] : [];

  const auditColumns: DataTableColumn<AuditLog>[] = [
    { key: "created_at", header: "الوقت", cell: (row) => <DateTimeStackCell value={row.created_at} />, width: "w-28", priority: "high" },
    { key: "user", header: "المنفّذ", cell: (row) => <TextCell value={row.user?.name ?? "النظام"} />, width: "w-40", priority: "high", role: "primary" },
    { key: "action", header: "الإجراء", cell: (row) => <TextCell value={actionLabel(row.action)} />, width: "w-28", priority: "high" },
    { key: "entity", header: "الكيان", cell: (row) => <TextCell value={`${entityLabel(row.entity_type)} ${isolate(`#${row.entity_id ?? ""}`)}`} /> },
    { key: "on_behalf_of", header: "بالتفويض", cell: (row) => (row.on_behalf_of ? <Badge color="info">{`عن ${row.on_behalf_of.name ?? ""}`}</Badge> : <TextCell value={null} />), width: "w-44", role: "status" },
  ];

  const accessColumns: DataTableColumn<AccessLog>[] = [
    { key: "viewed_at", header: "الوقت", cell: (row) => <DateTimeStackCell value={row.viewed_at} />, width: "w-28", priority: "high" },
    { key: "user", header: "من اطّلع", cell: (row) => <TextCell value={row.user?.name} />, priority: "high", role: "primary" },
    { key: "entity", header: "الملف", cell: (row) => <TextCell value={`${entityLabel(row.entity_type)} ${isolate(`#${row.entity_id ?? ""}`)}`} />, width: "w-48", priority: "high" },
  ];

  const filtered = (count: number, clear: () => void) =>
    count > 0 ? (
      <EmptyState
        icon={MagnifyingGlass}
        title="لا نتائج للفلتر"
        description="لا توجد سجلات تطابق ما اخترته. غيّر الفلاتر أو امسحها."
        action={
          <Button variant="secondary" onClick={clear}>
            مسح الفلاتر
          </Button>
        }
      />
    ) : (
      <EmptyState icon={ShieldCheck} title="لا سجلات بعد" description="تظهر هنا الإجراءات حين تُنفَّذ." />
    );

  const page = tab === "audit" ? audit : access;
  const before = (selected?.changes?.before ?? {}) as Record<string, unknown>;
  const after = (selected?.changes?.after ?? {}) as Record<string, unknown>;
  const changedKeys = [...new Set([...Object.keys(before), ...Object.keys(after)])];

  return (
    <>
      <PageHeader title="سجل التدقيق" description="كل إجراء في النظام بمنفّذه ووقته، وما نُفّذ بالتفويض. للقراءة فقط." />

      <div className="flex flex-col gap-4">
        {tabs.length > 1 ? <Tabs aria-label="السجل" tabs={tabs} value={tab} onValueChange={onTabChange} /> : null}

        {tab === "audit" ? (
          <>
            <FilterBar
              quickFilters={[
                <Combobox key="user" aria-label="المنفّذ" placeholder="كل المنفّذين" options={userOptions} value={auditFilters.userId} onValueChange={(userId) => setAudit({ userId })} clearable />,
                <Combobox key="entity" aria-label="الكيان" placeholder="كل الكيانات" options={entityOptions} value={auditFilters.entityType} onValueChange={(entityType) => setAudit({ entityType })} clearable />,
                <Combobox key="action" aria-label="الإجراء" placeholder="كل الإجراءات" options={actionOptions} value={auditFilters.action} onValueChange={(action) => setAudit({ action })} clearable />,
                <DateRangePicker key="range" aria-label="الفترة" placeholder="كل الأوقات" value={auditFilters.range} onValueChange={(range) => setAudit({ range })} max={today} today={today} />,
              ]}
              active={auditActive}
              onClearAll={() => onAuditFiltersChange(noAuditFilters)}
            />
            <DataTable
              label="سجل التدقيق"
              columns={auditColumns}
              rows={audit.status === "ready" ? audit.data.data : []}
              getRowKey={(row) => row.id ?? ""}
              loading={audit.status === "loading"}
              error={audit.status === "error" ? { code: audit.code, onRetry } : undefined}
              empty={filtered(auditActive.length, () => onAuditFiltersChange(noAuditFilters))}
              onRowOpen={(row) => onSelect(row)}
            />
          </>
        ) : (
          <>
            <FilterBar
              quickFilters={[
                <Combobox key="entity" aria-label="نوع الملف" placeholder="كل الأنواع" options={accessOptions} value={accessFilters.entityType} onValueChange={(entityType) => onAccessFiltersChange({ entityType: entityType as AccessFilters["entityType"] })} clearable />,
              ]}
              active={accessActive}
              onClearAll={() => onAccessFiltersChange({ entityType: null })}
            />
            <DataTable
              label="سجل الاطلاع على السري"
              columns={accessColumns}
              rows={access.status === "ready" ? access.data.data : []}
              getRowKey={(row) => `${row.user?.id}-${row.entity_type}-${row.entity_id}-${row.viewed_at}`}
              loading={access.status === "loading"}
              error={access.status === "error" ? { code: access.code, onRetry } : undefined}
              empty={filtered(accessActive.length, () => onAccessFiltersChange({ entityType: null }))}
            />
          </>
        )}

        {page.status === "ready" ? <Pagination meta={page.data.meta} onPageChange={onPageChange} onPerPageChange={onPerPageChange} /> : null}
      </div>

      <Drawer
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) onSelect(null);
        }}
        title={selected ? `${actionLabel(selected.action)} · ${entityLabel(selected.entity_type)} ${isolate(`#${selected.entity_id ?? ""}`)}` : "السجل"}
        description={selected?.created_at ? formatDateTime(selected.created_at) : undefined}
      >
        {selected ? (
          <div className="flex flex-col gap-4">
            <DescriptionList
              items={[
                { label: "المنفّذ", value: selected.user?.name ?? "النظام" },
                { label: "بالتفويض عن", value: selected.on_behalf_of?.name },
                { label: "عنوان IP", value: selected.ip ? <span dir="ltr">{selected.ip}</span> : null },
              ]}
            />
            <div className="flex flex-col gap-2">
              <h3 className="text-h3 font-semibold text-fg">التغييرات</h3>
              {changedKeys.length === 0 ? (
                <p className="text-body text-fg-muted">لا تغييرات في الحقول لهذا الإجراء.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
                  {changedKeys.map((key) => (
                    <li key={key} className="flex flex-col gap-1 px-3 py-2">
                      <span dir="ltr" className="text-end text-caption text-fg-muted">
                        {key}
                      </span>
                      <span className="text-body text-fg-muted line-through">{valueText(before[key])}</span>
                      <span className="text-body text-fg">{valueText(after[key])}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}
      </Drawer>
    </>
  );
}

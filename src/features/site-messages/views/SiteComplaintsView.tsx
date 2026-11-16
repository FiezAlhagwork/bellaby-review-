"use client";

import { ChatCircleText, MagnifyingGlass } from "@phosphor-icons/react";
import { DateTimeStackCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { DescriptionList } from "@/components/data/DescriptionList";
import { FilterBar, type ActiveFilter } from "@/components/data/FilterBar";
import { Pagination, type PaginationMeta } from "@/components/data/Pagination";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Option } from "@/components/ui/OptionList";
import type { SiteMessage } from "@/lib/api/types";
import { formatDateTime, formatPhone } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

type SiteMessageStatus = NonNullable<SiteMessage["status"]>;

/** الفلتر: `status` (NEW · HANDLED). النوع ثابت `COMPLAINT`. تغيّره يعيد الأب إلى الصفحة الأولى. */
export type ComplaintFilters = { status: SiteMessageStatus | null };

export const noComplaintFilters: ComplaintFilters = { status: null };

/** صفحة من `GET /site/messages?type=COMPLAINT` (`Paginated`). */
export type ComplaintsPage = { data: readonly SiteMessage[]; meta: PaginationMeta };

type SiteComplaintsViewProps = {
  complaints: Loadable<ComplaintsPage>;
  filters: ComplaintFilters;
  onFiltersChange: (filters: ComplaintFilters) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  /** الشكوى المفتوحة في الدرج للقراءة. null مغلق. */
  selected: SiteMessage | null;
  onOpen?: (message: SiteMessage) => void;
  onClose: () => void;
  onRetry?: () => void;
};

const statusLabels: Record<SiteMessageStatus, { label: string; color: "warning" | "success" }> = {
  NEW: { label: "جديدة", color: "warning" },
  HANDLED: { label: "عولجت", color: "success" },
};

const statusOptions: Option[] = (Object.keys(statusLabels) as SiteMessageStatus[]).map((value) => ({ value, label: statusLabels[value].label }));

/**
 * شكاوى الموقع (S12): رسائل الموقع من نوع «شكوى»، للاطلاع. المراقبة ترى الشكوى ومعالجتها إن وُجدت، ولا تعالجها (المعالجة لمدير المبيعات).
 * الصف يفتح درجاً يعرض النص كاملاً.
 */
export function SiteComplaintsView({ complaints, filters, onFiltersChange, onPageChange, onPerPageChange, selected, onOpen, onClose, onRetry }: SiteComplaintsViewProps) {
  const set = (patch: Partial<ComplaintFilters>) => onFiltersChange({ ...filters, ...patch });
  const clearAll = () => onFiltersChange(noComplaintFilters);

  const active: ActiveFilter[] = filters.status ? [{ key: "status", label: `الحالة: ${statusLabels[filters.status].label}`, onRemove: () => set({ status: null }) }] : [];

  const columns: DataTableColumn<SiteMessage>[] = [
    { key: "name", header: "الاسم", cell: (row) => <TextCell value={row.name} />, width: "w-40", priority: "high", role: "primary" },
    { key: "phone", header: "الهاتف", cell: (row) => (row.phone ? <span dir="ltr">{formatPhone(row.phone)}</span> : <TextCell value={null} />), width: "w-40" },
    { key: "message", header: "الشكوى", cell: (row) => <TextCell value={row.message} />, priority: "high" },
    { key: "created", header: "التاريخ", cell: (row) => <DateTimeStackCell value={row.created_at} />, width: "w-32" },
    {
      key: "status",
      header: "الحالة",
      cell: (row) => (row.status ? <Badge color={statusLabels[row.status].color}>{statusLabels[row.status].label}</Badge> : <TextCell value={null} />),
      width: "w-28",
      priority: "high",
      role: "status",
    },
  ];

  const empty =
    active.length > 0 ? (
      <EmptyState
        icon={MagnifyingGlass}
        title="لا نتائج للفلتر"
        description="لا توجد شكاوى تطابق ما اخترته. غيّر الفلاتر أو امسحها."
        action={
          <Button variant="secondary" onClick={clearAll}>
            مسح الفلاتر
          </Button>
        }
      />
    ) : (
      <EmptyState icon={ChatCircleText} title="لا شكاوى" description="تظهر هنا الشكاوى التي يرسلها الزوار من موقع الشركة." />
    );

  const ready = complaints.status === "ready" ? complaints.data : null;

  return (
    <>
      <PageHeader title="شكاوى الموقع" description="رسائل الموقع من نوع «شكوى»، للاطلاع." />

      <div className="flex flex-col gap-4">
        <FilterBar
          quickFilters={[<Combobox key="status" aria-label="الحالة" placeholder="كل الحالات" options={statusOptions} value={filters.status} onValueChange={(status) => set({ status: status as SiteMessageStatus | null })} clearable />]}
          active={active}
          onClearAll={clearAll}
        />

        <DataTable
          label="شكاوى الموقع"
          columns={columns}
          rows={ready ? ready.data : []}
          getRowKey={(row) => row.id ?? ""}
          loading={complaints.status === "loading"}
          error={complaints.status === "error" ? { code: complaints.code, onRetry } : undefined}
          empty={empty}
          onRowOpen={onOpen}
        />

        {ready ? <Pagination meta={ready.meta} onPageChange={onPageChange} onPerPageChange={onPerPageChange} /> : null}
      </div>

      <Drawer open={selected !== null} onOpenChange={(open) => (open ? undefined : onClose())} size="md" title={selected ? `شكوى ${selected.name ?? ""}` : "شكوى"} description={selected?.created_at ? formatDateTime(selected.created_at) : undefined}>
        {selected ? (
          <div className="flex flex-col gap-6">
            <span className="flex flex-wrap items-center gap-2">{selected.status ? <Badge color={statusLabels[selected.status].color}>{statusLabels[selected.status].label}</Badge> : null}</span>
            <DescriptionList
              items={[
                { label: "الاسم", value: selected.name },
                { label: "الهاتف", value: selected.phone ? <span dir="ltr">{formatPhone(selected.phone)}</span> : null },
              ]}
            />
            <section aria-label="نص الشكوى" className="flex flex-col gap-2">
              <h3 className="text-h3 font-semibold text-fg">نص الشكوى</h3>
              <p className="text-body text-fg">{selected.message}</p>
            </section>
            {selected.status === "HANDLED" ? (
              <section aria-label="المعالجة" className="flex flex-col gap-2 rounded-lg border border-border bg-surface-sunken p-4">
                <h3 className="text-h3 font-semibold text-fg">المعالجة</h3>
                <p className="text-body text-fg">{selected.handled_by?.name ?? "—"}</p>
                <p className="text-caption text-fg-muted">{selected.handled_at ? formatDateTime(selected.handled_at) : "—"}</p>
                {selected.handling_note ? <blockquote className="rounded-md bg-surface px-3 py-2 text-body text-fg">{selected.handling_note}</blockquote> : null}
              </section>
            ) : null}
          </div>
        ) : null}
      </Drawer>
    </>
  );
}

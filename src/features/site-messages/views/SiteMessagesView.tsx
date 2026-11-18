"use client";

import { ChatCircleText, MagnifyingGlass } from "@phosphor-icons/react";
import { DateTimeStackCell, StatusCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { DescriptionList } from "@/components/data/DescriptionList";
import { FilterBar, type ActiveFilter } from "@/components/data/FilterBar";
import { Pagination, type PaginationMeta } from "@/components/data/Pagination";
import { siteMessageTypeLabels, siteMessageTypeOrder } from "@/components/data/site-message-types";
import { statusMap } from "@/components/data/status-map";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Option } from "@/components/ui/OptionList";
import { ReasonDialog } from "@/components/ui/ReasonDialog";
import { errorMessage } from "@/lib/api/error-messages";
import type { SiteMessage, SiteMessageType } from "@/lib/api/types";
import { formatDateTime, formatPhone } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

type SiteMessageStatus = NonNullable<SiteMessage["status"]>;

/** الفلاتر كما يقبلها العقد: `type` و`status`. تغيّرها يعيد الأب إلى الصفحة الأولى. */
export type SiteMessageFilters = { type: SiteMessageType | null; status: SiteMessageStatus | null };

export const noSiteMessageFilters: SiteMessageFilters = { type: null, status: null };

/** صفحة من `GET /site/messages` (`Paginated`): الجديدة أولاً (ترتيب الحاوية). */
export type SiteMessagesPage = { data: readonly SiteMessage[]; meta: PaginationMeta };

type SiteMessagesViewProps = {
  messages: Loadable<SiteMessagesPage>;
  filters: SiteMessageFilters;
  onFiltersChange: (filters: SiteMessageFilters) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  /** علم `site_messages.handle`: «تعليم: عولجت». */
  canHandle: boolean;
  /** الرسالة المفتوحة في الدرج. null مغلق. */
  selected: SiteMessage | null;
  onOpen?: (message: SiteMessage) => void;
  onClose: () => void;
  /** الرسالة المفتوحة في نافذة المعالجة. null مغلقة. */
  handling: SiteMessage | null;
  note: string;
  onNoteChange: (note: string) => void;
  /** يفتح نافذة المعالجة لرسالة. */
  onHandle?: (message: SiteMessage) => void;
  onHandleClose: () => void;
  onHandleConfirm?: () => void;
  handleSubmitting?: boolean;
  /** رمز خطأ فشل المعالجة (409 «عولجت مسبقاً» أو غيره): شريط أعلى الصفحة. */
  handleError?: string;
  onRetry?: () => void;
};

const statusOptions: Option[] = (Object.keys(statusMap.siteMessage) as SiteMessageStatus[]).map((value) => ({ value, label: statusMap.siteMessage[value].label }));
const typeOptions: Option[] = siteMessageTypeOrder.map((value) => ({ value, label: siteMessageTypeLabels[value] }));

/**
 * رسائل الموقع (M11): كل ما يرسله الزوار من موقع الشركة، الجديد أولاً: الاسم والهاتف والنوع (استفسار · شراء صيدلية · شكوى) والرسالة والحالة.
 * «تعليم: عولجت» يفتح نافذة بملاحظة إلزامية، وبعدها تحمل الرسالة من عالجها ومتى وملاحظته. الصف يفتح الرسالة كاملة في درج.
 */
export function SiteMessagesView({
  messages,
  filters,
  onFiltersChange,
  onPageChange,
  onPerPageChange,
  canHandle,
  selected,
  onOpen,
  onClose,
  handling,
  note,
  onNoteChange,
  onHandle,
  onHandleClose,
  onHandleConfirm,
  handleSubmitting = false,
  handleError,
  onRetry,
}: SiteMessagesViewProps) {
  const set = (patch: Partial<SiteMessageFilters>) => onFiltersChange({ ...filters, ...patch });
  const clearAll = () => onFiltersChange(noSiteMessageFilters);

  const active: ActiveFilter[] = [
    ...(filters.type ? [{ key: "type", label: `النوع: ${siteMessageTypeLabels[filters.type]}`, onRemove: () => set({ type: null }) }] : []),
    ...(filters.status ? [{ key: "status", label: `الحالة: ${statusMap.siteMessage[filters.status].label}`, onRemove: () => set({ status: null }) }] : []),
  ];

  const handleButton = (message: SiteMessage, size: "sm" | "md" = "sm") =>
    canHandle && message.status === "NEW" ? (
      <Button
        key="handle"
        variant="secondary"
        size={size}
        onClick={(event) => {
          event.stopPropagation();
          onHandle?.(message);
        }}
      >
        تعليم: عولجت
      </Button>
    ) : null;

  const columns: DataTableColumn<SiteMessage>[] = [
    { key: "name", header: "الاسم", cell: (row) => <TextCell value={row.name} />, width: "w-40", priority: "high", role: "primary" },
    { key: "phone", header: "الهاتف", cell: (row) => (row.phone ? <span dir="ltr">{formatPhone(row.phone)}</span> : <TextCell value={null} />), width: "w-40" },
    { key: "type", header: "النوع", cell: (row) => (row.type ? <Badge>{siteMessageTypeLabels[row.type]}</Badge> : <TextCell value={null} />), width: "w-32", priority: "high" },
    { key: "message", header: "الرسالة", cell: (row) => <TextCell value={row.message} />, priority: "high" },
    { key: "created", header: "التاريخ", cell: (row) => <DateTimeStackCell value={row.created_at} />, width: "w-28" },
    { key: "status", header: "الحالة", cell: (row) => (row.status ? <StatusCell entity="siteMessage" status={row.status} /> : <TextCell value={null} />), width: "w-28", priority: "high", role: "status" },
    { key: "action", header: "الإجراء", cell: (row) => handleButton(row) ?? <span className="text-fg-muted">—</span>, width: "w-40", priority: "high" },
  ];

  const empty =
    active.length > 0 ? (
      <EmptyState
        icon={MagnifyingGlass}
        title="لا نتائج للفلتر"
        description="لا توجد رسائل تطابق ما اخترته. غيّر الفلاتر أو امسحها."
        action={
          <Button variant="secondary" onClick={clearAll}>
            مسح الفلاتر
          </Button>
        }
      />
    ) : (
      <EmptyState icon={ChatCircleText} title="لا رسائل" description="تظهر هنا الاستفسارات وطلبات الشراء والشكاوى التي يرسلها الزوار من موقع الشركة." />
    );

  const ready = messages.status === "ready" ? messages.data : null;
  const drawerAction = selected ? handleButton(selected, "md") : null;

  return (
    <>
      <PageHeader title="رسائل الموقع" description="استفسارات وطلبات شراء وشكاوى زوار موقع الشركة. الجديد أولاً." />

      <div className="flex flex-col gap-4">
        {handleError ? (
          <Banner kind="warning" title="تعذّر تعليم الرسالة">
            {handleError === "invalid_status" ? "عولجت هذه الرسالة من قبل. حدّث الصفحة لرؤية ملاحظة المعالجة." : errorMessage(handleError)}
          </Banner>
        ) : null}

        <FilterBar
          quickFilters={[
            <Combobox key="type" aria-label="النوع" placeholder="كل الأنواع" options={typeOptions} value={filters.type} onValueChange={(type) => set({ type: type as SiteMessageType | null })} clearable />,
            <Combobox key="status" aria-label="الحالة" placeholder="كل الحالات" options={statusOptions} value={filters.status} onValueChange={(status) => set({ status: status as SiteMessageStatus | null })} clearable />,
          ]}
          active={active}
          onClearAll={clearAll}
        />

        <DataTable
          label="رسائل الموقع"
          columns={columns}
          rows={ready ? ready.data : []}
          getRowKey={(row) => row.id ?? ""}
          loading={messages.status === "loading"}
          error={messages.status === "error" ? { code: messages.code, onRetry } : undefined}
          empty={empty}
          onRowOpen={onOpen}
        />

        {ready ? <Pagination meta={ready.meta} onPageChange={onPageChange} onPerPageChange={onPerPageChange} /> : null}
      </div>

      <Drawer
        open={selected !== null}
        onOpenChange={(open) => (open ? undefined : onClose())}
        size="md"
        title={selected ? `${selected.type ? siteMessageTypeLabels[selected.type] : "رسالة"} من ${selected.name ?? ""}` : "رسالة"}
        description={selected?.created_at ? formatDateTime(selected.created_at) : undefined}
        actions={drawerAction ? [drawerAction] : undefined}
      >
        {selected ? (
          <div className="flex flex-col gap-6">
            <span className="flex flex-wrap items-center gap-2">
              {selected.type ? <Badge>{siteMessageTypeLabels[selected.type]}</Badge> : null}
              {selected.status ? <StatusCell entity="siteMessage" status={selected.status} /> : null}
            </span>
            <DescriptionList
              items={[
                { label: "الاسم", value: selected.name },
                { label: "الهاتف", value: selected.phone ? <span dir="ltr">{formatPhone(selected.phone)}</span> : null },
              ]}
            />
            <section aria-label="نص الرسالة" className="flex flex-col gap-2">
              <h3 className="text-h3 font-semibold text-fg">نص الرسالة</h3>
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

      <ReasonDialog
        open={handling !== null}
        onOpenChange={(open) => {
          if (!open) onHandleClose();
        }}
        title="تعليم الرسالة «عولجت»؟"
        description={handling ? `تُسجَّل معالجتك لرسالة ${handling.name ?? ""} بملاحظتك، ولا تتغير بعدها.` : ""}
        confirmLabel="تعليم: عولجت"
        reasonLabel="ملاحظة المعالجة"
        placeholder="اكتب ما فعلته: ردّ، أو أُحيلت إلى جهة"
        reason={note}
        onReasonChange={onNoteChange}
        loading={handleSubmitting}
        onConfirm={() => onHandleConfirm?.()}
      />
    </>
  );
}

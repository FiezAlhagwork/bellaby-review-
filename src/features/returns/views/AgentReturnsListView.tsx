"use client";

import { ArrowUUpLeft, MagnifyingGlass } from "@phosphor-icons/react";
import { DateTimeStackCell, StatusCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { DescriptionList } from "@/components/data/DescriptionList";
import { FilterBar, type ActiveFilter } from "@/components/data/FilterBar";
import { Pagination, type PaginationMeta } from "@/components/data/Pagination";
import { StatusBadge } from "@/components/data/StatusBadge";
import { StockLine } from "@/components/data/StockLine";
import { PageHeader } from "@/components/layout/PageHeader";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Option } from "@/components/ui/OptionList";
import { errorMessage } from "@/lib/api/error-messages";
import type { AgentReturn, Location } from "@/lib/api/types";
import type { IsoDate } from "@/lib/calendar";
import { formatDateTime, formatQuantity, isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

/** حالتا الإرجاع اللتان تعرضهما الشاشة. بانتظار القرار والمرفوض قرار مدير المبيعات (`returns.decide`) وليسا في مستودع اللوجستي (docs/backend-requests.md §16.1). */
export type AgentReturnListStatus = "IN_TRANSIT" | "RECEIVED";

/** الفلاتر كما يرسلها العقد: `status` و`agent_id` (معرّف **الوكيل** لا الموقع). تغيّرها يعيد الأب إلى الصفحة الأولى. */
export type AgentReturnFilters = {
  status: AgentReturnListStatus;
  agentId: string | null;
};

export const noAgentReturnFilters: AgentReturnFilters = { status: "IN_TRANSIT", agentId: null };

/** صفحة من `GET /agent-returns` (`Paginated`): الإرجاعات و`meta` بأسلوب Laravel. */
export type AgentReturnsPage = { data: readonly AgentReturn[]; meta: PaginationMeta };

type AgentReturnsListViewProps = {
  returns: Loadable<AgentReturnsPage>;
  /** مواقع الوكلاء `GET /locations?type=AGENT`: خيارات فلتر الوكيل بقيمة `location.agent.id` (= `agent_id`). */
  agents: readonly Location[];
  filters: AgentReturnFilters;
  onFiltersChange: (filters: AgentReturnFilters) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  /** الإرجاع المفتوح في الدرج. null = مغلق. بياناته كاملة من القائمة (لا `GET /agent-returns/{id}` في العقد). */
  selected: AgentReturn | null;
  onOpenReturn?: (item: AgentReturn) => void;
  onCloseReturn?: () => void;
  /** تأكيد الاستلام كاملاً: `agent_returns.receive`. */
  canReceive: boolean;
  /** نافذة «تأكيد الاستلام» مفتوحة. */
  confirmOpen?: boolean;
  /** طلب الاستلام يُنفَّذ. */
  receiving?: boolean;
  /** رمز خطأ الاستلام (invalid_status): يظهر في الدرج. */
  receiveError?: string;
  onStartReceive?: () => void;
  onConfirmReceive?: () => void;
  onDismissReceive?: () => void;
  today: IsoDate;
  onRetry?: () => void;
};

const statusOptions: Option[] = [
  { value: "IN_TRANSIT", label: "بالطريق" },
  { value: "RECEIVED", label: "مستلم" },
];

/** «سطر واحد» · «سطران» · «3 أسطر». */
function linesPhrase(count: number): string {
  if (count === 1) return "سطر واحد";
  if (count === 2) return "سطران";
  return `${isolate(count)} أسطر`;
}

const totalOf = (item: AgentReturn) => (item.lines ?? []).reduce((sum, line) => sum + (line.quantity ?? 0), 0);

/**
 * إرجاعات الوكلاء (W13): ما اعتمده مدير المبيعات من بضاعة يعيدها وكيل إلى المستودع. تظهر «بالطريق» حتى يؤكد اللوجستي الاستلام كاملاً (لا جزئي)،
 * ثم «مستلم». الصف يفتح تفاصيل الإرجاع في درج، وفيه «تأكيد الاستلام» ونافذته. فلتر الوكيل، وترقيم.
 */
export function AgentReturnsListView({
  returns,
  agents,
  filters,
  onFiltersChange,
  onPageChange,
  onPerPageChange,
  selected,
  onOpenReturn,
  onCloseReturn,
  canReceive,
  confirmOpen = false,
  receiving = false,
  receiveError,
  onStartReceive,
  onConfirmReceive,
  onDismissReceive,
  today,
  onRetry,
}: AgentReturnsListViewProps) {
  const agentOptions: Option[] = agents.flatMap((agent) => (agent.agent?.id !== undefined && agent.name ? [{ value: String(agent.agent.id), label: agent.name }] : []));

  const set = (patch: Partial<AgentReturnFilters>) => onFiltersChange({ ...filters, ...patch });
  const clearAll = () => set({ agentId: null });

  // الحالة اختيار دائم (لا مسح): الفلاتر الفعّالة المعروضة هي الوكيل وحده.
  const active: ActiveFilter[] = filters.agentId ? [{ key: "agent", label: `الوكيل: ${agentOptions.find((o) => o.value === filters.agentId)?.label ?? ""}`, onRemove: () => set({ agentId: null }) }] : [];

  const columns: DataTableColumn<AgentReturn>[] = [
    { key: "agent", header: "الوكيل", cell: (row) => <TextCell value={row.agent?.name} />, width: "w-48", priority: "high", role: "primary" },
    {
      key: "items",
      header: "الأصناف",
      cell: (row) => {
        const lines = row.lines ?? [];
        return (
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-body text-fg">{lines[0]?.item?.name ?? "—"}</span>
            <span className="truncate text-caption text-fg-muted">{`${linesPhrase(lines.length)} · ${formatQuantity(totalOf(row), "علبة")}`}</span>
          </span>
        );
      },
      priority: "high",
    },
    { key: "reason", header: "السبب", cell: (row) => <TextCell value={row.reason?.name} />, width: "w-48" },
    { key: "to", header: "الوجهة", cell: (row) => <TextCell value={row.to_location?.name} />, width: "w-44" },
    { key: "decided_at", header: "الاعتماد", cell: (row) => <DateTimeStackCell value={row.decided_at} />, width: "w-28", priority: "high" },
    { key: "status", header: "الحالة", cell: (row) => (row.status ? <StatusCell entity="agentReturn" status={row.status} /> : <TextCell value={null} />), width: "w-28", priority: "high", role: "status" },
  ];

  const empty =
    active.length > 0 ? (
      <EmptyState
        icon={MagnifyingGlass}
        title="لا نتائج للفلتر"
        description="لا توجد إرجاعات لهذا الوكيل في هذه الحالة. غيّر الفلاتر أو امسحها."
        action={
          <Button variant="secondary" onClick={clearAll}>
            مسح الفلاتر
          </Button>
        }
      />
    ) : filters.status === "IN_TRANSIT" ? (
      <EmptyState icon={ArrowUUpLeft} title="لا إرجاعات بالطريق" description="تظهر هنا الإرجاعات التي اعتمدها مدير المبيعات ولم تصل المستودع بعد." />
    ) : (
      <EmptyState icon={ArrowUUpLeft} title="لا إرجاعات مستلمة بعد" description="يظهر هنا ما أكّدت استلامه من إرجاعات الوكلاء." />
    );

  const lines = selected?.lines ?? [];
  const inTransit = selected?.status === "IN_TRANSIT";
  const to = selected?.to_location?.name ?? "المستودع";

  return (
    <>
      <PageHeader title="إرجاعات الوكلاء" description="البضاعة التي يعيدها الوكلاء إلى المستودع بعد اعتماد مدير المبيعات. أكّد استلامها كاملةً عند وصولها." />

      <div className="flex flex-col gap-4">
        <FilterBar
          quickFilters={[
            <Combobox key="status" aria-label="الحالة" placeholder="الحالة" options={statusOptions} value={filters.status} onValueChange={(status) => set({ status: (status ?? "IN_TRANSIT") as AgentReturnListStatus })} />,
            <Combobox key="agent" aria-label="الوكيل" placeholder="كل الوكلاء" options={agentOptions} value={filters.agentId} onValueChange={(agentId) => set({ agentId })} clearable />,
          ]}
          active={active}
          onClearAll={clearAll}
        />

        <DataTable
          label="إرجاعات الوكلاء"
          columns={columns}
          rows={returns.status === "ready" ? returns.data.data : []}
          getRowKey={(row) => row.id ?? ""}
          loading={returns.status === "loading"}
          error={returns.status === "error" ? { code: returns.code, onRetry } : undefined}
          empty={empty}
          onRowOpen={onOpenReturn}
        />

        {returns.status === "ready" ? <Pagination meta={returns.data.meta} onPageChange={onPageChange} onPerPageChange={onPerPageChange} /> : null}
      </div>

      <Drawer
        open={selected !== null}
        onOpenChange={(open) => (open ? undefined : onCloseReturn?.())}
        size="md"
        title={selected ? `إرجاع ${isolate(`#${selected.id}`)}` : "إرجاع"}
        description={selected ? `من ${selected.agent?.name ?? "—"}` : undefined}
        actions={inTransit && canReceive ? [<Button key="receive" variant="primary" onClick={onStartReceive}>تأكيد الاستلام</Button>] : undefined}
      >
        {selected ? (
          <div className="flex flex-col gap-4">
            <span className="flex flex-wrap items-center gap-2">
              {selected.status ? <StatusBadge entity="agentReturn" status={selected.status} /> : null}
            </span>

            {receiveError ? (
              <Banner kind="danger" title="تعذّر تأكيد الاستلام">
                {errorMessage(receiveError)}
              </Banner>
            ) : null}

            {selected.status === "IN_TRANSIT" ? (
              <Banner kind="info" title="بالطريق إلى المستودع">
                {`اعتمده ${selected.decided_by?.name ?? "مدير المبيعات"}${selected.decided_at ? ` في ${formatDateTime(selected.decided_at)}` : ""}. أكّد استلامه كاملاً عند وصوله إلى ${to}.`}
              </Banner>
            ) : null}

            {selected.status === "RECEIVED" ? (
              <Banner kind="success" title="استُلم كاملاً">
                {`أكّد ${selected.received_by?.name ?? "اللوجستي"} الاستلام${selected.received_at ? ` في ${formatDateTime(selected.received_at)}` : ""}.`}
              </Banner>
            ) : null}

            <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
              {lines.map((line, index) => (
                <StockLine key={`${line.batch?.id}-${index}`} item={line.item ?? {}} batch={line.batch} quantity={line.quantity ?? 0} today={today} />
              ))}
            </div>
            <p className="text-body text-fg-muted">{`المجموع: ${formatQuantity(totalOf(selected), "علبة")} · إلى ${to}`}</p>

            <DescriptionList
              items={[
                { label: "الوكيل", value: selected.agent?.name },
                { label: "السبب", value: selected.reason?.name },
                { label: "ملاحظة", value: selected.note },
                { label: "رفعه", value: selected.created_by ? `${selected.created_by.name}${selected.created_on_behalf_of_agent ? " (عن وكيل معطَّل)" : ""}` : null },
                { label: "وقت الطلب", value: selected.created_at ? formatDateTime(selected.created_at) : null },
                { label: "اعتمده", value: selected.decided_by?.name },
                { label: "وقت الاعتماد", value: selected.decided_at ? formatDateTime(selected.decided_at) : null },
                { label: "استلمه", value: selected.received_by?.name },
                { label: "وقت الاستلام", value: selected.received_at ? formatDateTime(selected.received_at) : null },
              ]}
            />
          </div>
        ) : null}
      </Drawer>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => (open ? undefined : onDismissReceive?.())}
        title={selected ? `تأكيد استلام الإرجاع ${isolate(`#${selected.id}`)}؟` : "تأكيد الاستلام؟"}
        description={`يُسجَّل استلام كل الأصناف (${formatQuantity(selected ? totalOf(selected) : 0, "علبة")}) كاملةً في ${to}. لا استلام جزئي.`}
        confirmLabel="تأكيد الاستلام"
        cancelLabel="تراجع"
        loading={receiving}
        onConfirm={() => onConfirmReceive?.()}
      />
    </>
  );
}

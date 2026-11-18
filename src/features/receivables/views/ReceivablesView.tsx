"use client";

import { MagnifyingGlass, Receipt } from "@phosphor-icons/react";
import { DateCell, MoneyCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { FilterBar, type ActiveFilter } from "@/components/data/FilterBar";
import { KpiTile } from "@/components/data/KpiTile";
import { Pagination, type PaginationMeta } from "@/components/data/Pagination";
import { Grid } from "@/components/layout/Grid";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Combobox } from "@/components/ui/Combobox";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import type { Option } from "@/components/ui/OptionList";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { Dialog } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { errorMessage } from "@/lib/api/error-messages";
import type { AgentRef, Delivery, Receivable } from "@/lib/api/types";
import { daysBetween, type IsoDate } from "@/lib/calendar";
import { countPhrase, formatMoney, formatPercent, isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

/** الفلاتر: `agent_id` و`payment_overdue` من `GET /deliveries?status=UNPAID`. تغيّرها يعيد الأب إلى الصفحة الأولى. */
export type ReceivableFilters = { agentId: string | null; overdueOnly: boolean };

export const noReceivableFilters: ReceivableFilters = { agentId: null, overdueOnly: false };

/** صفحة من `GET /deliveries?status=UNPAID` (`Paginated`): المتأخر أولاً (ترتيب الحاوية: §43). */
export type UnpaidDeliveriesPage = { data: readonly Delivery[]; meta: PaginationMeta };

type ReceivablesViewProps = {
  /** `GET /receivables`: صف لكل وكيل. */
  summary: Loadable<readonly Receivable[]>;
  /** التسليمات غير المسدّدة، المتأخر أولاً. */
  deliveries: Loadable<UnpaidDeliveriesPage>;
  /** وكلاء الفلتر. */
  agents: readonly AgentRef[];
  filters: ReceivableFilters;
  onFiltersChange: (filters: ReceivableFilters) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  /** اليوم (بتوقيت دمشق): لأيام التأخر. يُمرَّر فيبقى الـ view نقياً. */
  today: IsoDate;
  /** علم `disputes.refer`: زر «إحالة للقانوني». */
  canRefer: boolean;
  /** التسليم المفتوح في نافذة الإحالة. null مغلقة. */
  referring: Delivery | null;
  referNote: string;
  onReferNoteChange: (note: string) => void;
  /** يفتح نافذة الإحالة لتسليم. */
  onRefer?: (delivery: Delivery) => void;
  onReferClose: () => void;
  onReferConfirm?: () => void;
  /** الإحالة قيد الإرسال. */
  referSubmitting?: boolean;
  /** رمز خطأ 409 (محال مسبقاً أو ليس غير مسدّد) أو غيره، يظهر شريطاً في النافذة. */
  referError?: string;
  onRetry?: () => void;
};

const dayForms = ["يوم", "يومين", "أيام"] as const;

/**
 * المستحقات (M07): فوقها التحصيل لكل وكيل (بطاقة تفلتر الجدول بوكيلها)، وتحتها التسليمات غير المسدّدة المتأخر أولاً: الوكيل والعميل والقيمة والموعد.
 * في التسليم المتأخر زر «إحالة للقانوني» يفتح نافذة تؤكد فتح ملف نزاع بمرحلته الأولى مربوطاً بالتسليم. المحال يعرض رقم نزاعه بلا زر.
 */
export function ReceivablesView({
  summary,
  deliveries,
  agents,
  filters,
  onFiltersChange,
  onPageChange,
  onPerPageChange,
  today,
  canRefer,
  referring,
  referNote,
  onReferNoteChange,
  onRefer,
  onReferClose,
  onReferConfirm,
  referSubmitting = false,
  referError,
  onRetry,
}: ReceivablesViewProps) {
  const agentOptions: Option[] = agents.flatMap((agent) => (agent.id !== undefined && agent.name ? [{ value: String(agent.id), label: agent.name }] : []));

  const set = (patch: Partial<ReceivableFilters>) => onFiltersChange({ ...filters, ...patch });
  const clearAll = () => onFiltersChange(noReceivableFilters);

  const active: ActiveFilter[] = [
    ...(filters.agentId ? [{ key: "agent", label: `الوكيل: ${agentOptions.find((option) => option.value === filters.agentId)?.label ?? ""}`, onRemove: () => set({ agentId: null }) }] : []),
    ...(filters.overdueOnly ? [{ key: "overdue", label: "المتأخر فقط", onRemove: () => set({ overdueOnly: false }) }] : []),
  ];

  const lateDays = (delivery: Delivery) => (delivery.expected_payment_date ? daysBetween(delivery.expected_payment_date, today) : 0);

  const columns: DataTableColumn<Delivery>[] = [
    {
      key: "reference",
      header: "التسليم",
      cell: (row) => (
        <span dir="ltr" className="block truncate text-end tabular-nums">
          {row.reference}
        </span>
      ),
      width: "w-32",
    },
    { key: "agent", header: "الوكيل", cell: (row) => <TextCell value={row.agent?.name} />, width: "w-52", priority: "high" },
    { key: "customer", header: "العميل", cell: (row) => <TextCell value={row.customer?.name} />, priority: "high", role: "primary" },
    { key: "value", header: "القيمة", cell: (row) => <MoneyCell value={row.estimated_value} />, align: "end", width: "w-32", priority: "high" },
    {
      key: "due",
      header: "موعد السداد",
      cell: (row) => (
        <span className="flex min-w-0 flex-col">
          <DateCell value={row.expected_payment_date} />
          {row.is_payment_overdue ? <span className="text-caption text-danger">{`متأخر ${countPhrase(lateDays(row), dayForms)}`}</span> : null}
        </span>
      ),
      width: "w-44",
      priority: "high",
    },
    {
      key: "action",
      header: "الإجراء",
      cell: (row) =>
        row.dispute_id ? (
          <Badge color="info">{`أُحيل · نزاع #${row.dispute_id}`}</Badge>
        ) : canRefer && row.is_payment_overdue ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              onRefer?.(row);
            }}
          >
            إحالة للقانوني
          </Button>
        ) : (
          <span className="text-fg-muted">—</span>
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
        description="لا توجد تسليمات غير مسدّدة تطابق ما اخترته. غيّر الفلاتر أو امسحها."
        action={
          <Button variant="secondary" onClick={clearAll}>
            مسح الفلاتر
          </Button>
        }
      />
    ) : (
      <EmptyState icon={Receipt} title="لا مستحقات" description="لا توجد تسليمات غير مسدّدة على أي وكيل." />
    );

  return (
    <>
      <PageHeader title="المستحقات" description="ما لم يُسدَّد من تسليمات الوكلاء للصيدليات، والمتأخر أولاً." />

      <Section title="التحصيل لكل وكيل" description="اضغط وكيلاً لعرض تسليماته غير المسدّدة وحدها.">
        {summary.status === "error" ? (
          <ErrorState code={summary.code} onRetry={onRetry} />
        ) : summary.status === "loading" ? (
          <Grid cols={{ base: 1, tablet: 2, desktop: 3 }} gap={4}>
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-36 w-full" />
            ))}
          </Grid>
        ) : summary.data.length === 0 ? (
          <EmptyState icon={Receipt} title="لا بيانات تحصيل" description="تظهر هنا نسبة التحصيل لكل وكيل حين تُسجَّل تسليماته." />
        ) : (
          <Grid cols={{ base: 1, tablet: 2, desktop: 3 }} gap={4}>
            {summary.data.map((row) => (
              <KpiTile
                key={row.agent?.id}
                label={row.agent?.name ?? ""}
                value={formatPercent(row.collection_rate_pct ?? 0, 1)}
                context={
                  row.overdue_deliveries
                    ? `متأخر ${row.overdue_value ? isolate(formatMoney(row.overdue_value)) : "—"} · ${isolate(row.overdue_deliveries)} ${row.overdue_deliveries === 1 ? "تسليم" : "تسليمات"}`
                    : "لا تسليمات متأخرة"
                }
                progress={Math.round(row.collection_rate_pct ?? 0)}
                size="md"
                onClick={() => set({ agentId: filters.agentId === String(row.agent?.id) ? null : String(row.agent?.id) })}
              />
            ))}
          </Grid>
        )}
      </Section>

      <Section title="التسليمات غير المسدّدة">
        <div className="flex flex-col gap-4">
          <FilterBar
            quickFilters={[<Combobox key="agent" aria-label="الوكيل" placeholder="كل الوكلاء" options={agentOptions} value={filters.agentId} onValueChange={(agentId) => set({ agentId })} clearable />]}
            moreFilters={<Checkbox label="المتأخر فقط" description="التسليمات التي فات موعد سدادها." checked={filters.overdueOnly} onCheckedChange={(overdueOnly) => set({ overdueOnly })} />}
            active={active}
            onClearAll={clearAll}
          />

          <DataTable
            label="التسليمات غير المسدّدة"
            columns={columns}
            rows={deliveries.status === "ready" ? deliveries.data.data : []}
            getRowKey={(row) => row.id ?? row.reference ?? ""}
            loading={deliveries.status === "loading"}
            error={deliveries.status === "error" ? { code: deliveries.code, onRetry } : undefined}
            empty={empty}
          />

          {deliveries.status === "ready" ? <Pagination meta={deliveries.data.meta} onPageChange={onPageChange} onPerPageChange={onPerPageChange} /> : null}
        </div>
      </Section>

      <Dialog
        open={referring !== null}
        onOpenChange={(open) => {
          if (!open && !referSubmitting) onReferClose();
        }}
        dismissible={!referSubmitting}
        size="sm"
        title="إحالة التسليم للقانوني؟"
        description={referring ? `يُفتح ملف نزاع بالمرحلة الأولى مربوطاً بالتسليم ${referring.reference} على ${referring.customer?.name ?? ""}. يتابعه القسم القانوني.` : ""}
        actions={[
          <Button key="cancel" variant="secondary" disabled={referSubmitting} className="flex-1 @tablet:flex-none" onClick={onReferClose}>
            إلغاء
          </Button>,
          <Button key="confirm" variant="primary" loading={referSubmitting} className="flex-1 @tablet:flex-none" onClick={onReferConfirm}>
            إحالة للقانوني
          </Button>,
        ]}
      >
        <div className="flex flex-col gap-4">
          {referError ? (
            <Banner kind="danger" title="تعذّرت الإحالة">
              {referError === "invalid_status" ? "أُحيل هذا التسليم مسبقاً أو لم يعد غير مسدّد. حدّث الصفحة لرؤية حالته." : errorMessage(referError)}
            </Banner>
          ) : null}
          <Field label="ملاحظة للقانوني" optional hint="تظهر في ملف النزاع.">
            <Textarea aria-label="ملاحظة للقانوني" value={referNote} onChange={(event) => onReferNoteChange(event.target.value)} />
          </Field>
        </div>
      </Dialog>
    </>
  );
}

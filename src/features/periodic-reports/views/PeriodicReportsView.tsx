"use client";

import { FileText, MagnifyingGlass } from "@phosphor-icons/react";
import { StatusCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { departmentLabels } from "@/components/data/departments";
import { FilterBar, type ActiveFilter } from "@/components/data/FilterBar";
import { Pagination, type PaginationMeta } from "@/components/data/Pagination";
import { optionalReportKinds, reportKindLabels, reportKindOrder } from "@/components/data/report-kinds";
import { statusMap } from "@/components/data/status-map";
import { Grid } from "@/components/layout/Grid";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { DatePicker } from "@/components/ui/DatePicker";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field } from "@/components/ui/Field";
import type { Option } from "@/components/ui/OptionList";
import { Radio, RadioGroup } from "@/components/ui/Radio";
import { Tabs } from "@/components/ui/Tabs";
import { errorMessage } from "@/lib/api/error-messages";
import type { Department, OptionalReportKind, PeriodicReport, ReportKind, ReportStatus } from "@/lib/api/types";
import type { IsoDate } from "@/lib/calendar";
import { formatDateShort } from "@/lib/format";
import { periodLabel } from "@/features/periodic-reports/components/ReportSections";
import type { Loadable } from "@/lib/loadable";

/** `scope` في `GET /periodic-reports`. */
export type ReportScope = "mine" | "to_review" | "to_decide" | "all";

const scopeLabels: Record<ReportScope, string> = { mine: "تقاريري", to_review: "بانتظار المراجعة", to_decide: "بانتظار القرار", all: "كل التقارير" };

export type ReportFilters = { kind: ReportKind | null; status: ReportStatus | null; department: Department | null };
export const noReportFilters: ReportFilters = { kind: null, status: null, department: null };

/** نافذة «تقرير اختياري»: الحقول كما يرسلها `POST /periodic-reports`. */
export type NewReportForm = { kind: OptionalReportKind | null; periodStart: IsoDate | null; periodEnd: IsoDate | null };
export const emptyNewReport: NewReportForm = { kind: null, periodStart: null, periodEnd: null };

export type PeriodicReportsPage = { data: readonly PeriodicReport[]; meta: PaginationMeta };

type PeriodicReportsViewProps = {
  reports: Loadable<PeriodicReportsPage>;
  /** النطاقات المتاحة بحسب الصلاحيات (`periodic_reports.create` و`.review` و`.decide`)، الأول افتراضي. */
  scopes: readonly ReportScope[];
  scope: ReportScope;
  onScopeChange: (scope: ReportScope) => void;
  filters: ReportFilters;
  onFiltersChange: (filters: ReportFilters) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  /** الآن (UTC): لتلوين المهلة الفائتة. */
  now: string;
  /** `periodic_reports.create`: زر «تقرير اختياري». */
  canCreate: boolean;
  /** النافذة مفتوحة حين لا تكون null. */
  newReport: NewReportForm | null;
  onNewReportChange: (form: NewReportForm | null) => void;
  onCreate?: () => void;
  creating?: boolean;
  /** أخطاء `validation_failed` لحقول النافذة. */
  createErrors?: Readonly<Record<string, string>>;
  createError?: string;
  today: IsoDate;
  onOpen?: (report: PeriodicReport) => void;
  onRetry?: () => void;
};

const kindOptions: Option[] = reportKindOrder.map((value) => ({ value, label: reportKindLabels[value] }));
const statusOptions: Option[] = (Object.keys(statusMap.report) as ReportStatus[]).map((value) => ({ value, label: statusMap.report[value].label }));
const departmentOptions: Option[] = (Object.keys(departmentLabels) as Department[]).map((value) => ({ value, label: departmentLabels[value] }));

const editable = (status: ReportStatus | undefined) => status === "DRAFT" || status === "RETURNED";

/**
 * التقارير الدورية (G11). رئيس القسم يرى تقاريره، والمراقبة «بانتظار المراجعة» أولاً، والمدير التنفيذي «بانتظار القرار» أولاً.
 * الإجبارية (شهري، ربع سنوي، سنوي) مسودات تلقائية عند نهاية الفترة، والاختيارية (يومي، أسبوعي، استثنائي) من «تقرير اختياري».
 */
export function PeriodicReportsView({
  reports,
  scopes,
  scope,
  onScopeChange,
  filters,
  onFiltersChange,
  onPageChange,
  onPerPageChange,
  now,
  canCreate,
  newReport,
  onNewReportChange,
  onCreate,
  creating = false,
  createErrors = {},
  createError,
  today,
  onOpen,
  onRetry,
}: PeriodicReportsViewProps) {
  const set = (patch: Partial<ReportFilters>) => onFiltersChange({ ...filters, ...patch });
  const showDepartment = scope !== "mine";
  const periodInverted = newReport?.periodStart && newReport.periodEnd ? newReport.periodEnd < newReport.periodStart : false;

  const active: ActiveFilter[] = [
    ...(filters.kind ? [{ key: "kind", label: `النوع: ${reportKindLabels[filters.kind]}`, onRemove: () => set({ kind: null }) }] : []),
    ...(filters.status ? [{ key: "status", label: `الحالة: ${statusMap.report[filters.status].label}`, onRemove: () => set({ status: null }) }] : []),
    ...(filters.department ? [{ key: "department", label: `القسم: ${departmentLabels[filters.department]}`, onRemove: () => set({ department: null }) }] : []),
  ];

  const columns: DataTableColumn<PeriodicReport>[] = [
    {
      key: "kind",
      header: "التقرير",
      cell: (row) => (
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-body text-fg">{row.kind ? reportKindLabels[row.kind] : "—"}</span>
          {row.is_mandatory === false ? <Badge>اختياري</Badge> : null}
        </span>
      ),
      width: "w-44",
      priority: "high",
      role: "primary",
    },
    { key: "period", header: "الفترة", cell: (row) => <span className="text-body text-fg">{periodLabel(row.period_start, row.period_end)}</span>, priority: "high" },
    ...(showDepartment ? [{ key: "department", header: "القسم", cell: (row: PeriodicReport) => <TextCell value={row.department ? departmentLabels[row.department] : null} />, width: "w-36", priority: "high" as const }] : []),
    { key: "status", header: "الحالة", cell: (row) => (row.status ? <StatusCell entity="report" status={row.status} /> : null), width: "w-40", priority: "high", role: "status" },
    {
      key: "deadline",
      header: "المهلة",
      cell: (row) => {
        if (!row.deadline_at) return <span className="text-body text-fg-muted">—</span>;
        const missed = editable(row.status) && row.deadline_at < now;
        return <span className={missed ? "text-body text-danger" : "text-body text-fg"}>{formatDateShort(row.deadline_at)}</span>;
      },
      width: "w-36",
    },
    {
      key: "onTime",
      header: "بوقته",
      cell: (row) => (row.on_time === true ? <span className="text-body text-fg">نعم</span> : row.on_time === false ? <Badge color="danger">متأخر</Badge> : <span className="text-body text-fg-muted">—</span>),
      width: "w-24",
    },
  ];

  const empty =
    active.length > 0 ? (
      <EmptyState
        icon={MagnifyingGlass}
        title="لا نتائج للفلتر"
        description="لا تقارير تطابق ما اخترته."
        action={
          <Button variant="secondary" onClick={() => onFiltersChange(noReportFilters)}>
            مسح الفلاتر
          </Button>
        }
      />
    ) : (
      <EmptyState
        icon={FileText}
        title={scope === "to_review" ? "لا تقارير بانتظار المراجعة" : scope === "to_decide" ? "لا تقارير بانتظار قرارك" : "لا تقارير بعد"}
        description={scope === "mine" ? "تُنشأ مسودة التقرير الشهري تلقائياً عند نهاية الشهر." : "تظهر هنا التقارير حين تصل إليك."}
      />
    );

  return (
    <>
      <PageHeader
        title="التقارير الدورية"
        description="الشهري والربع سنوي والسنوي مسودات تلقائية عند نهاية الفترة، والمهلة بأيام العمل."
        actions={canCreate ? [{ id: "new", label: "تقرير اختياري", primary: true, onSelect: () => onNewReportChange(emptyNewReport) }] : undefined}
      />

      <div className="flex flex-col gap-4">
        {scopes.length > 1 ? <Tabs aria-label="نطاق التقارير" tabs={scopes.map((value) => ({ value, label: scopeLabels[value] }))} value={scope} onValueChange={onScopeChange} /> : null}

        <FilterBar
          quickFilters={[
            <Combobox key="kind" aria-label="النوع" placeholder="كل الأنواع" options={kindOptions} value={filters.kind} onValueChange={(kind) => set({ kind: kind as ReportKind | null })} clearable />,
            <Combobox key="status" aria-label="الحالة" placeholder="كل الحالات" options={statusOptions} value={filters.status} onValueChange={(status) => set({ status: status as ReportStatus | null })} clearable />,
            ...(showDepartment ? [<Combobox key="department" aria-label="القسم" placeholder="كل الأقسام" options={departmentOptions} value={filters.department} onValueChange={(department) => set({ department: department as Department | null })} clearable />] : []),
          ]}
          active={active}
          onClearAll={() => onFiltersChange(noReportFilters)}
        />

        <DataTable
          label="التقارير الدورية"
          columns={columns}
          rows={reports.status === "ready" ? reports.data.data : []}
          getRowKey={(row) => row.id ?? ""}
          loading={reports.status === "loading"}
          error={reports.status === "error" ? { code: reports.code, onRetry } : undefined}
          empty={empty}
          onRowOpen={onOpen}
        />

        {reports.status === "ready" ? <Pagination meta={reports.data.meta} onPageChange={onPageChange} onPerPageChange={onPerPageChange} /> : null}
      </div>

      <Dialog
        open={newReport !== null}
        onOpenChange={(next) => (next ? undefined : onNewReportChange(null))}
        dismissible={!creating}
        size="sm"
        title="تقرير اختياري"
        description="يُنشأ مسودة تملؤها وترسلها كالتقرير الشهري."
        actions={[
          <Button key="cancel" variant="secondary" disabled={creating} onClick={() => onNewReportChange(null)}>
            تراجع
          </Button>,
          <Button key="ok" variant="primary" loading={creating} disabled={!newReport?.kind || !newReport.periodStart || !newReport.periodEnd || periodInverted} onClick={() => onCreate?.()}>
            إنشاء المسودة
          </Button>,
        ]}
      >
        {newReport ? (
          <div className="flex flex-col gap-4">
            {createError ? (
              <Banner kind="danger" title="تعذّر إنشاء التقرير">
                {errorMessage(createError)}
              </Banner>
            ) : null}
            <Field label="النوع" required error={createErrors.kind}>
              <RadioGroup aria-label="النوع" orientation="horizontal" value={newReport.kind} onValueChange={(kind) => onNewReportChange({ ...newReport, kind })} disabled={creating}>
                {optionalReportKinds.map((kind) => (
                  <Radio key={kind} value={kind} label={reportKindLabels[kind]} />
                ))}
              </RadioGroup>
            </Field>
            <Grid cols={{ base: 1, tablet: 2 }} gap={4}>
              <Field label="من" required error={createErrors.period_start}>
                <DatePicker aria-label="من" value={newReport.periodStart} onValueChange={(periodStart) => onNewReportChange({ ...newReport, periodStart })} max={today} today={today} invalid={Boolean(createErrors.period_start)} disabled={creating} />
              </Field>
              <Field label="إلى" required error={createErrors.period_end ?? (periodInverted ? "قبل تاريخ البداية." : undefined)}>
                <DatePicker aria-label="إلى" value={newReport.periodEnd} onValueChange={(periodEnd) => onNewReportChange({ ...newReport, periodEnd })} min={newReport.periodStart ?? undefined} today={today} invalid={periodInverted || Boolean(createErrors.period_end)} disabled={creating} />
              </Field>
            </Grid>
          </div>
        ) : null}
      </Dialog>
    </>
  );
}

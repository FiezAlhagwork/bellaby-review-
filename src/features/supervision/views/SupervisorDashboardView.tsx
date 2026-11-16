"use client";

import { CheckCircle } from "@phosphor-icons/react";
import { TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { KpiTile } from "@/components/data/KpiTile";
import { Grid } from "@/components/layout/Grid";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import type { UserRef } from "@/lib/api/types";
import { dayLabel, type IsoDate } from "@/lib/calendar";
import { isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";
import { ratingDeadline } from "@/lib/deadline";

/** تنبيه دوام: مندوب بدوام ناقص (أقل من 8 ساعات) أو غائب في يوم عمل. */
export type AttendanceAlert = { rep: UserRef; work_date: IsoDate; kind: "short-day" | "absent" };

/**
 * ما تجمعه الحاوية لنطاق السوبرفايزر. `GET /dashboard/summary` بلا حقول في العقد، فتُحسب من القوائم المعرّفة:
 * `/attendance-sessions` و`/visits` و`/daily-reports?rated=false` و`/leaves?status=PENDING`. docs/backend-requests.md §25.1.
 */
export type SupervisorOverview = {
  /** زيارات اليوم: المنفَّذة والمخطط لها (مجموع `planned_visits` للجلسات). */
  visits: { done: number; planned: number };
  /** مندوبو نطاقك الذين بدؤوا دوام اليوم من كل المندوبين. */
  attendance: { present: number; total: number };
  /** تقارير بانتظار تقييمك، وأقرب موعد لانتهاء مهلتها (UTC). */
  pendingReports: { count: number; nextDueAt: string | null };
  /** طلبات الإجازة المعلّقة بانتظار موافقتك. */
  pendingLeaves: number;
  /** دوام ناقص أو غياب في أيام العمل الأخيرة. */
  alerts: readonly AttendanceAlert[];
};

export type SupervisorDashboardTarget = "visits" | "attendance" | "reports" | "leaves" | "alerts";

type SupervisorDashboardViewProps = {
  overview: Loadable<SupervisorOverview>;
  /** الآن (ISO UTC) واليوم: للموعد المتبقي ولليوم. تُمرَّر فيبقى الـ view نقياً. */
  now: string;
  onRetry?: () => void;
  /** فتح القائمة الكاملة لقسم (الخلية القابلة للضغط). */
  onOpen?: (target: SupervisorDashboardTarget) => void;
};

const percent = (done: number, planned: number) => (planned > 0 ? Math.min(100, Math.round((done / planned) * 100)) : 0);

/**
 * لوحة السوبرفايزر (S01): خمس خلايا لمندوبي محافظاته: الزيارات مقابل الخطة، والدوام، والتقارير بانتظار تقييمه، وطلبات الإجازة، وتنبيهات الدوام.
 * تحتها تنبيهات الدوام (ناقص أو غياب). النطاق يُفحص على الخادم في كل طلب.
 */
export function SupervisorDashboardView({ overview, now, onRetry, onOpen }: SupervisorDashboardViewProps) {
  const loading = overview.status === "loading";
  const ready = overview.status === "ready" ? overview.data : null;

  const header = <PageHeader title="لوحة السوبرفايزر" description="مندوبو محافظاتك اليوم: ما يحتاج متابعتك الآن." />;

  if (overview.status === "error") {
    return (
      <>
        {header}
        <ErrorState code={overview.code} onRetry={onRetry} />
      </>
    );
  }

  const nextDeadline = ready ? ratingDeadline(ready.pendingReports.nextDueAt, now) : null;
  const open = (target: SupervisorDashboardTarget) => (onOpen ? () => onOpen(target) : undefined);

  const alertColumns: DataTableColumn<AttendanceAlert>[] = [
    { key: "rep", header: "المندوب", cell: (row) => <TextCell value={row.rep.name} />, priority: "high", role: "primary" },
    { key: "date", header: "يوم العمل", cell: (row) => <span className="whitespace-nowrap">{dayLabel(row.work_date)}</span>, width: "w-52", priority: "high" },
    { key: "kind", header: "التنبيه", cell: (row) => (row.kind === "absent" ? <Badge color="danger">غياب</Badge> : <Badge color="warning">دوام ناقص</Badge>), width: "w-36", priority: "high", role: "status" },
  ];

  return (
    <>
      {header}

      <Section>
        <Grid cols={{ base: 1, tablet: 2, desktop: 5 }} gap={4}>
          <KpiTile
            label="الزيارات اليوم"
            value={ready ? `${isolate(ready.visits.done)} من ${isolate(ready.visits.planned)}` : ""}
            context="المنفَّذة مقابل المخطط لها"
            progress={ready ? percent(ready.visits.done, ready.visits.planned) : undefined}
            state={loading ? "loading" : "ready"}
            onClick={open("visits")}
          />
          <KpiTile
            label="الدوام اليوم"
            value={ready ? `${isolate(ready.attendance.present)} من ${isolate(ready.attendance.total)}` : ""}
            context="مندوبون بدؤوا دوامهم"
            state={loading ? "loading" : "ready"}
            onClick={open("attendance")}
          />
          <KpiTile
            label="تقارير بانتظار تقييمي"
            value={ready ? String(ready.pendingReports.count) : ""}
            context={nextDeadline ? (nextDeadline.late ? "فيها ما تجاوز المهلة" : `أقربها: ${nextDeadline.label}`) : "لا تقارير معلّقة"}
            state={loading ? "loading" : "ready"}
            onClick={open("reports")}
          />
          <KpiTile label="طلبات إجازة" value={ready ? String(ready.pendingLeaves) : ""} context="بانتظار موافقتك" state={loading ? "loading" : "ready"} onClick={open("leaves")} />
          <KpiTile
            label="تنبيهات الدوام"
            value={ready ? String(ready.alerts.length) : ""}
            context="دوام ناقص أو غياب"
            state={loading ? "loading" : "ready"}
            onClick={open("alerts")}
          />
        </Grid>
      </Section>

      {loading ? (
        <Section title="تنبيهات الدوام">
          <DataTable label="تنبيهات الدوام" columns={alertColumns} rows={[]} getRowKey={() => 0} loading />
        </Section>
      ) : ready && ready.alerts.length === 0 ? (
        <EmptyState icon={CheckCircle} title="لا تنبيهات دوام" description="لا دوام ناقص ولا غياب في أيام العمل الأخيرة." />
      ) : ready ? (
        <Section title="تنبيهات الدوام" description="دوام ناقص (أقل من 8 ساعات) أو غياب في أيام العمل الأخيرة. الخصم قرار يدوي للمدير التنفيذي.">
          <DataTable label="تنبيهات الدوام" columns={alertColumns} rows={ready.alerts} getRowKey={(row) => `${row.rep.id}-${row.work_date}-${row.kind}`} />
        </Section>
      ) : null}
    </>
  );
}

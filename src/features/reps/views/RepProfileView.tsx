"use client";

import type { ReactNode } from "react";
import { BatchCell, DateTimeStackCell, StatusCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { DescriptionList } from "@/components/data/DescriptionList";
import { flagTypeLabels } from "@/components/data/flag-types";
import { itemTypeLabels } from "@/components/data/item-types";
import { KpiTile } from "@/components/data/KpiTile";
import { ratingScaleLabels } from "@/components/data/rating-scale";
import { Grid } from "@/components/layout/Grid";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { NotFoundState } from "@/components/ui/NotFoundState";
import { Skeleton } from "@/components/ui/Skeleton";
import type { AttendanceSession, BalanceLine, DailyReport, ItemRef, MonthlyScore, User, Visit } from "@/lib/api/types";
import { dayLabel, monthLabel } from "@/lib/calendar";
import { formatDateTime, formatPhone, formatQuantity, isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

/** ما وزّعه المندوب في الشهر: كمية كل صنف (عينة أو مادة دعائية). مجموعها يحسبه الأب من زياراته (docs/backend-requests.md §30.3). */
export type RepDistribution = { item: ItemRef; quantity: number };

type RepProfileViewProps = {
  /** `GET /users/{id}`. خطأ `not_found` يعرض «غير موجود أو خارج نطاقك». */
  rep: Loadable<User>;
  /** جلسة دوام اليوم (`GET /attendance-sessions?rep_id=&from=&to=`)، أو null: لم يبدأ دوامه. */
  session: Loadable<AttendanceSession | null>;
  /** زيارات اليوم: `GET /visits?rep_id=&from=&to=`. */
  todayVisits: Loadable<readonly Visit[]>;
  /** رصيده بمعرّف موقعه: `GET /stock/balances?location_id=` (عينات ومواد فقط). */
  balances: Loadable<readonly BalanceLine[]>;
  /** ما وزّعه هذا الشهر. */
  distributed: Loadable<readonly RepDistribution[]>;
  /** آخر تقاريره اليومية: `GET /daily-reports?rep_id=`، الأحدث أولاً. */
  reports: Loadable<readonly DailyReport[]>;
  /** نقاطه الشهرية: `GET /scores?user_id=&month=`، الأحدث أولاً. */
  scores: Loadable<readonly MonthlyScore[]>;
  /** يفتح الزيارة (S06). */
  onOpenVisit?: (visit: Visit) => void;
  /** «كل زياراته»: S05 بفلتر المندوب. */
  onOpenAllVisits?: () => void;
  /** يفتح التقرير (S03). */
  onOpenReport?: (report: DailyReport) => void;
  onBack?: () => void;
  onRetry?: () => void;
};

/** بطاقة قسم بحالتها المستقلة: فشل قسم أو تحميله لا يهدم الصفحة. */
function SectionCard<T>({ title, state, action, onRetry, children }: { title: string; state: Loadable<T>; action?: ReactNode; onRetry?: () => void; children: (data: T) => ReactNode }) {
  return (
    <Card title={title} action={action}>
      {state.status === "loading" ? (
        <div aria-busy="true" className="flex flex-col gap-3">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-5 w-3/4" />
        </div>
      ) : state.status === "error" ? (
        <ErrorState code={state.code} onRetry={onRetry} />
      ) : (
        children(state.data)
      )}
    </Card>
  );
}

const durationLabel = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours === 0 ? `${isolate(rest)} د` : `${isolate(hours)} س${rest === 0 ? "" : ` ${isolate(rest)} د`}`;
};

/**
 * صفحة المندوب (S07): بياناته، ودوام اليوم، وزياراته، ورصيده من العينات والمواد وما وزّعه، وتقاريره، ومؤشراته الشهرية.
 * لكل قسم حالته (تحميل وخطأ) فلا يهدم قسمٌ الصفحة. الرصيد السالب جائز للمندوب وحده ويظهر بشريط وشارة. المندوب تابع للشركة (المكتب العلمي) لا لوكيل.
 */
export function RepProfileView({ rep, session, todayVisits, balances, distributed, reports, scores, onOpenVisit, onOpenAllVisits, onOpenReport, onBack, onRetry }: RepProfileViewProps) {
  if (rep.status === "loading") {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <div className="flex flex-col gap-2 pb-4">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>
        <Skeleton className="h-52 w-full" />
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (rep.status === "error") {
    return rep.code === "not_found" ? <NotFoundState onBack={onBack} /> : <ErrorState code={rep.code} onRetry={onRetry} />;
  }

  const user = rep.data;
  const negative = balances.status === "ready" ? balances.data.filter((line) => (line.quantity ?? 0) < 0) : [];

  const visitColumns: DataTableColumn<Visit>[] = [
    { key: "point", header: "الجهة", cell: (row) => <TextCell value={row.visit_point?.name} />, priority: "high", role: "primary" },
    { key: "started", header: "الوقت", cell: (row) => <DateTimeStackCell value={row.started_at} />, width: "w-28", priority: "high" },
    {
      key: "duration",
      header: "المدة",
      cell: (row) => (row.status === "IN_PROGRESS" ? <Badge color="info">جارية</Badge> : row.duration_minutes === null || row.duration_minutes === undefined ? <TextCell value={null} /> : <span dir="ltr">{`${row.duration_minutes} د`}</span>),
      width: "w-24",
      align: "end",
    },
    {
      key: "flags",
      header: "العلامات",
      cell: (row) =>
        (row.flags ?? []).length > 0 ? (
          <span className="flex flex-wrap items-center gap-1">
            {(row.flags ?? []).map((flag) => (
              <Badge key={flag.id} color={flag.status === "OPEN" ? "warning" : "neutral"}>
                {flag.type ? flagTypeLabels[flag.type] : "—"}
              </Badge>
            ))}
          </span>
        ) : (
          <span className="text-fg-muted">—</span>
        ),
      width: "w-52",
    },
    { key: "verification", header: "التحقق", cell: (row) => (row.verification_status ? <StatusCell entity="visitVerification" status={row.verification_status} /> : <TextCell value={null} />), width: "w-32", priority: "high", role: "status" },
  ];

  const balanceColumns: DataTableColumn<BalanceLine>[] = [
    { key: "item", header: "الصنف", cell: (row) => <TextCell value={row.item?.name} />, priority: "high", role: "primary" },
    { key: "type", header: "النوع", cell: (row) => <span>{row.item?.type ? itemTypeLabels[row.item.type] : "—"}</span>, width: "w-32" },
    { key: "batch", header: "الدفعة", cell: (row) => <BatchCell batch={row.batch} />, width: "w-72" },
    {
      key: "quantity",
      header: "الكمية",
      cell: (row) => (
        <span className="flex items-center justify-end gap-2">
          {(row.quantity ?? 0) < 0 ? <Badge color="danger">سالب</Badge> : null}
          <span dir="ltr" className={(row.quantity ?? 0) < 0 ? "text-danger" : undefined}>
            {formatQuantity(row.quantity ?? 0, "علبة")}
          </span>
        </span>
      ),
      width: "w-44",
      align: "end",
      priority: "high",
      role: "status",
    },
  ];

  const reportColumns: DataTableColumn<DailyReport>[] = [
    { key: "date", header: "يوم العمل", cell: (row) => <span className="whitespace-nowrap">{row.work_date ? dayLabel(row.work_date) : "—"}</span>, priority: "high", role: "primary" },
    { key: "received", header: "الاستلام", cell: (row) => <DateTimeStackCell value={row.received_at} />, width: "w-32" },
    {
      key: "rating",
      header: "التقييم",
      cell: (row) => (row.rating?.score ? <span>{`${ratingScaleLabels[row.rating.score]} · ${isolate(row.rating.score)}`}</span> : <Badge color="warning">بانتظار التقييم</Badge>),
      width: "w-52",
      priority: "high",
      role: "status",
    },
  ];

  const latest = scores.status === "ready" ? scores.data[0] : undefined;
  const previous = scores.status === "ready" ? scores.data.slice(1) : [];

  return (
    <>
      <PageHeader
        title={user.name ?? "—"}
        badge={user.is_active === false ? <Badge color="neutral">معطّل</Badge> : <Badge color="success">نشط</Badge>}
        description={`${user.role?.name ?? "مندوب"}${user.manager?.name ? ` · يتبع ${user.manager.name}` : ""}`}
      />

      <div className="flex flex-col gap-4">
        {negative.length > 0 ? (
          <Banner kind="warning" title="رصيد سالب">
            {`رصيد المندوب من «${negative.map((line) => line.item?.name).join("» و«")}» سالب بعد تعارض في المزامنة. السالب جائز لرصيد المندوب وحده.`}
          </Banner>
        ) : null}

        <Card title="البيانات">
          <DescriptionList
            items={[
              { label: "الاسم", value: user.name },
              { label: "الهاتف", value: user.phone ? <span dir="ltr">{formatPhone(user.phone)}</span> : null },
              { label: "المحافظات", value: (user.governorates ?? []).length > 0 ? (user.governorates ?? []).map((governorate) => governorate.name).join("، ") : null },
              { label: "المدير المباشر", value: user.manager?.name },
              { label: "آخر مزامنة", value: user.last_sync_at ? formatDateTime(user.last_sync_at) : null },
              { label: "آخر دخول", value: user.last_login_at ? formatDateTime(user.last_login_at) : null },
            ]}
          />
        </Card>

        <Grid cols={{ base: 1, desktop: 2 }} gap={4}>
          <SectionCard title="دوام اليوم" state={session} onRetry={onRetry}>
            {(current) =>
              current ? (
                <DescriptionList
                  items={[
                    { label: "البدء", value: current.started_at ? formatDateTime(current.started_at) : null },
                    { label: "الانتهاء", value: current.ended_at ? formatDateTime(current.ended_at) : <Badge color="info">جارية</Badge> },
                    { label: "المدة", value: current.duration_minutes === null || current.duration_minutes === undefined ? null : durationLabel(current.duration_minutes) },
                    { label: "الزيارات المخطط لها", value: current.planned_visits === undefined ? null : isolate(current.planned_visits) },
                  ]}
                />
              ) : (
                <p className="text-body text-fg-muted">لم يبدأ دوامه اليوم.</p>
              )
            }
          </SectionCard>

          <SectionCard title="ما وزّعه هذا الشهر" state={distributed} onRetry={onRetry}>
            {(rows) =>
              rows.length > 0 ? (
                <DescriptionList items={rows.map((row) => ({ label: `${row.item.name ?? "—"} (${row.item.type ? itemTypeLabels[row.item.type] : "—"})`, value: <span dir="ltr">{formatQuantity(row.quantity)}</span> }))} />
              ) : (
                <p className="text-body text-fg-muted">لم يوزّع شيئاً هذا الشهر.</p>
              )
            }
          </SectionCard>
        </Grid>

        <SectionCard
          title="زيارات اليوم"
          state={todayVisits}
          onRetry={onRetry}
          action={
            <Button variant="secondary" size="sm" onClick={onOpenAllVisits}>
              كل زياراته
            </Button>
          }
        >
          {(rows) => (
            <DataTable label="زيارات اليوم" columns={visitColumns} rows={rows} getRowKey={(row) => row.id ?? ""} onRowOpen={onOpenVisit} empty={<p className="py-8 text-center text-body text-fg-muted">لا زيارات اليوم بعد.</p>} />
          )}
        </SectionCard>

        <SectionCard title="رصيد العينات والمواد" state={balances} onRetry={onRetry}>
          {(rows) => <DataTable label="رصيد المندوب" columns={balanceColumns} rows={rows} getRowKey={(row) => `${row.item?.id}-${row.batch?.id}`} empty={<p className="py-8 text-center text-body text-fg-muted">لا رصيد مسجّل.</p>} />}
        </SectionCard>

        <SectionCard title="آخر التقارير اليومية" state={reports} onRetry={onRetry}>
          {(rows) => <DataTable label="التقارير اليومية" columns={reportColumns} rows={rows} getRowKey={(row) => row.id ?? ""} onRowOpen={onOpenReport} empty={<p className="py-8 text-center text-body text-fg-muted">لا تقارير بعد.</p>} />}
        </SectionCard>

        <SectionCard title="المؤشرات الشهرية" state={scores} onRetry={onRetry}>
          {() =>
            latest ? (
              <div className="flex flex-col gap-4">
                <KpiTile
                  label={`نقاط ${monthLabel(latest.month ?? "")}`}
                  value={isolate(latest.total ?? 0)}
                  context={latest.comparison_group?.name ? `مجموعة المقارنة: ${latest.comparison_group.name}` : undefined}
                  provisional={latest.status === "PROVISIONAL"}
                  size="md"
                />
                <DescriptionList
                  items={(latest.kpis ?? []).map((kpi) => ({
                    label: `${kpi.label ?? kpi.key} (الوزن ${isolate(kpi.weight ?? 0)})`,
                    value: <span dir="ltr">{`${kpi.score} / ${kpi.weight}`}</span>,
                  }))}
                />
                {previous.length > 0 ? (
                  <ul className="flex flex-col gap-1 border-t border-border pt-4">
                    {previous.map((score) => (
                      <li key={score.month} className="text-body text-fg-muted">
                        {`${monthLabel(score.month ?? "")}: ${isolate(score.total ?? 0)} · ${score.status === "FINAL" ? "نهائية" : "مبدئية"}${score.manual_rating ? ` · تقييم يدوي: ${ratingScaleLabels[score.manual_rating.score ?? "60"]}` : ""}`}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : (
              <p className="text-body text-fg-muted">لا نقاط بعد.</p>
            )
          }
        </SectionCard>
      </div>
    </>
  );
}

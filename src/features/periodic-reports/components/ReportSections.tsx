"use client";

import type { ReactNode } from "react";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { departmentLabels } from "@/components/data/departments";
import { DescriptionList } from "@/components/data/DescriptionList";
import { ratingScaleLabels } from "@/components/data/rating-scale";
import { likelihoodLabels, riskLevelBadge, targetMetricLabels } from "@/components/data/report-kinds";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { PeriodicReport, PlanTarget, RatingScale } from "@/lib/api/types";
import { dayLabel, monthLabel } from "@/lib/calendar";
import { formatDateShort, formatDateTime, formatPercent, formatQuantity, isolate } from "@/lib/format";

type Report = PeriodicReport;
type OverdueLine = NonNullable<Report["overdue_work"]>[number];
type TeamLine = NonNullable<Report["team_evaluation"]>[number];
type PlanLine = NonNullable<Report["next_period_plan"]>[number];
type FailureLine = NonNullable<NonNullable<Report["executive_summary"]>["failures"]>[number];

/** فترة التقرير: «تشرين الأول 2026» لشهر كامل، وإلا «من – إلى». */
export function periodLabel(start: string | undefined, end: string | undefined): string {
  if (!start || !end) return "—";
  const [year, month] = start.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (start.endsWith("-01") && end === `${start.slice(0, 8)}${lastDay}`) return monthLabel(start.slice(0, 7));
  return `${isolate(formatDateShort(start))} – ${isolate(formatDateShort(end))}`;
}

/** وسم «تلقائي» لقسم يملؤه النظام (حيّ في المسودة، مثبّت بعد الإرسال). */
export function AutoBadge() {
  return <Badge color="info">تلقائي</Badge>;
}

const num = (value: number | null | undefined) => (value === null || value === undefined ? "—" : formatQuantity(Math.round(value)));
const pct = (value: number | null | undefined) => (value === null || value === undefined ? "—" : formatPercent(value));
const rating = (value: RatingScale | undefined) => (value ? ratingScaleLabels[value] : "—");
const text = (value: string | null | undefined) => (value ? <p className="whitespace-pre-line text-body text-fg">{value}</p> : <p className="text-body text-fg-muted">لا شيء مكتوب.</p>);

/** عمود الهدف: اسمه (تحسبه الحاوية من المعرّفات) والمقياس. */
export function targetColumns<Row>(pick: (row: Row) => PlanTarget | undefined, targetLabel: (target: PlanTarget) => string): DataTableColumn<Row>[] {
  return [
    {
      key: "target",
      header: "الهدف",
      cell: (row) => {
        const target = pick(row);
        return target ? (
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-body text-fg">{targetLabel(target)}</span>
            <span className="text-label text-fg-muted">{target.metric ? targetMetricLabels[target.metric] : "—"}</span>
          </span>
        ) : (
          "—"
        );
      },
      priority: "high",
      role: "primary",
    },
    { key: "planned", header: "المخطط", cell: (row) => num(pick(row)?.target), align: "end", width: "w-28", priority: "high" },
  ];
}

/** الأعمال المتأخرة: الآلي (العنوان والمسؤول والموعد والتأخر) ثم اليدوي (السبب والإجراء والموعد الجديد). */
export const overdueBaseColumns: DataTableColumn<OverdueLine>[] = [
  {
    key: "title",
    header: "العمل",
    cell: (row) => (
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-body text-fg">{row.title}</span>
        <span className="text-label text-fg-muted">{`${row.kind === "DEPARTMENT_REQUEST" ? "طلب" : "مهمة"} ${isolate(`#${row.ref_id}`)} · ${row.responsible?.name ?? "—"}`}</span>
      </span>
    ),
    priority: "high",
    role: "primary",
  },
  { key: "due", header: "الموعد الأصلي", cell: (row) => (row.original_due ? formatDateShort(row.original_due) : "—"), width: "w-32" },
  { key: "delay", header: "التأخر", cell: (row) => <span className="text-body text-danger">{`${isolate(row.delay_days ?? 0)} يوم`}</span>, width: "w-24", priority: "high" },
];

type ReportSectionsProps = {
  report: Report;
  /** اسم الهدف من معرّفاته (المنطقة والوكيل والصنف والفئة والاختصاص). */
  targetLabel: (target: PlanTarget) => string;
  /** اسم المسؤول عن بند الخطة من `responsible_id`. */
  memberName: (id: number) => string;
};

/**
 * التقرير الدوري للقراءة: كل أقسامه بترتيب النموذج. يُعرض بعد الإرسال (G12)، وفي مراجعة المراقبة (G13) وقرار المدير التنفيذي (G14) والنسخ (G15).
 * الأقسام التلقائية بوسم «تلقائي»، وأرقامها مثبّتة في النسخة المرسلة.
 */
export function ReportSections({ report, targetLabel, memberName }: ReportSectionsProps) {
  const summary = report.executive_summary;
  const failures = summary?.failures ?? [];
  const overdue = report.overdue_work ?? [];
  const problems = report.problems ?? [];
  const risks = report.risks ?? [];
  const needs = report.needs_from_departments ?? [];
  const team = report.team_evaluation;
  const plan = report.next_period_plan ?? [];
  const targets = report.next_period_targets ?? [];
  const head = report.head_evaluation;

  const failureColumns: DataTableColumn<FailureLine>[] = [
    ...targetColumns<FailureLine>((row) => row.target, targetLabel),
    { key: "actual", header: "الفعلي", cell: (row) => num(row.target?.actual), align: "end", width: "w-28", priority: "high" },
    { key: "pct", header: "النسبة", cell: (row) => pct(row.target?.achievement_pct), align: "end", width: "w-24", priority: "high" },
    { key: "reason", header: "السبب", cell: (row) => <span className="line-clamp-2 text-body text-fg">{row.reason ?? "—"}</span> },
  ];

  const overdueColumns: DataTableColumn<OverdueLine>[] = [
    ...overdueBaseColumns,
    { key: "reason", header: "السبب والإجراء", cell: (row) => <span className="line-clamp-2 text-body text-fg">{[row.reason, row.action].filter(Boolean).join(" · ") || "—"}</span> },
    { key: "new", header: "الموعد الجديد", cell: (row) => (row.new_due ? dayLabel(row.new_due) : "—"), width: "w-36" },
  ];

  const teamColumns: DataTableColumn<TeamLine>[] = [
    { key: "user", header: "الموظف", cell: (row) => row.user?.name ?? "—", priority: "high", role: "primary" },
    { key: "tasks", header: "المهام", cell: (row) => pct(row.tasks_auto), align: "end", width: "w-24" },
    { key: "commitment", header: "الالتزام", cell: (row) => pct(row.commitment_auto), align: "end", width: "w-24" },
    { key: "quality", header: "الجودة", cell: (row) => rating(row.quality), width: "w-24" },
    { key: "productivity", header: "الإنتاجية", cell: (row) => rating(row.productivity), width: "w-24" },
    { key: "overall", header: "العام", cell: (row) => rating(row.overall), width: "w-24", priority: "high" },
  ];

  const planColumns: DataTableColumn<PlanLine>[] = [
    { key: "title", header: "البند", cell: (row) => <span className="line-clamp-2 text-body text-fg">{row.title}</span>, priority: "high", role: "primary" },
    { key: "responsible", header: "المسؤول", cell: (row) => (row.responsible_id ? memberName(row.responsible_id) : "—"), width: "w-40", priority: "high" },
    { key: "due", header: "الموعد", cell: (row) => (row.due_date ? dayLabel(row.due_date) : "—"), width: "w-36" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Card title="الملخص التنفيذي">
        <div className="flex flex-col gap-4">
          <Labeled label="الملخص">{text(summary?.summary)}</Labeled>
          <Labeled label="الإنجازات">{text(summary?.achievements)}</Labeled>
          {failures.length > 0 ? (
            <Labeled label="ما لم يتحقق من الخطة" badge={<AutoBadge />}>
              <DataTable label="ما لم يتحقق من الخطة" columns={failureColumns} rows={failures} getRowKey={(row) => failures.indexOf(row)} />
            </Labeled>
          ) : null}
        </div>
      </Card>

      <Card title="الأعمال المتأخرة" action={<AutoBadge />}>
        {overdue.length > 0 ? <DataTable label="الأعمال المتأخرة" columns={overdueColumns} rows={overdue} getRowKey={(row) => `${row.kind}-${row.ref_id}`} /> : <p className="text-body text-fg-muted">لا أعمال متأخرة في الفترة.</p>}
      </Card>

      <Card title="المشاكل والعوائق">
        {problems.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {problems.map((problem, index) => (
              <li key={problem.id ?? index} className="flex flex-col gap-1">
                <span className="flex flex-wrap items-center gap-2">
                  <Badge color={problem.status === "CLOSED" ? "success" : "warning"}>{problem.status === "CLOSED" ? "مغلقة" : "مفتوحة"}</Badge>
                  {problem.origin_report_id ? <span className="text-label text-fg-muted">{`منقولة من التقرير ${isolate(`#${problem.origin_report_id}`)}`}</span> : null}
                </span>
                <span className="text-body text-fg">{problem.text}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-body text-fg-muted">لا مشاكل.</p>
        )}
      </Card>

      <Card title="المخاطر">
        {risks.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {risks.map((risk, index) => (
              <li key={index} className="flex flex-col gap-1">
                <span className="text-body text-fg">{risk.text}</span>
                <span className="flex flex-wrap items-center gap-2 text-label text-fg-muted">
                  {`الاحتمال ${risk.probability ? likelihoodLabels[risk.probability] : "—"} · الأثر ${risk.impact ? likelihoodLabels[risk.impact] : "—"}`}
                  {risk.level ? <Badge color={riskLevelBadge[risk.level].color}>{riskLevelBadge[risk.level].label}</Badge> : null}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-body text-fg-muted">لا مخاطر.</p>
        )}
      </Card>

      <Card title="الاحتياجات">
        <div className="flex flex-col gap-4">
          <Labeled label="من الإدارة">{text(report.needs_from_management)}</Labeled>
          <Labeled label="من الأقسام الأخرى">
            {needs.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {needs.map((need, index) => (
                  <li key={index} className="text-body text-fg">
                    <span className="text-label text-fg-muted">{`${need.to_department ? departmentLabels[need.to_department] : "—"}${need.due_date ? ` · حتى ${dayLabel(need.due_date)}` : ""}: `}</span>
                    {need.description}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-body text-fg-muted">لا شيء.</p>
            )}
          </Labeled>
          <Labeled label="التعاون مع الأقسام">{text(report.cooperation)}</Labeled>
        </div>
      </Card>

      {team ? (
        <Card title="تقييم الفريق">
          <DataTable label="تقييم الفريق" columns={teamColumns} rows={team} getRowKey={(row) => row.user?.id ?? ""} />
        </Card>
      ) : null}

      <Card title="تقييم رئيس القسم">
        <DescriptionList
          items={[
            { label: "تحقيق الخطة", value: pct(head?.plan_achievement_pct) },
            { label: "درجة النظام", value: num(head?.system_score) },
            { label: "التقييم العام", value: rating(head?.overall) },
            { label: "الدرجة من 100", value: head?.score_100 === undefined ? null : isolate(head.score_100) },
          ]}
        />
      </Card>

      <Card title="خطة الفترة القادمة">
        {plan.length > 0 ? <DataTable label="خطة الفترة القادمة" columns={planColumns} rows={plan} getRowKey={(row) => plan.indexOf(row)} /> : <p className="text-body text-fg-muted">لا بنود.</p>}
      </Card>

      {targets.length > 0 ? (
        <Card title="أهداف الفترة القادمة">
          <DataTable label="أهداف الفترة القادمة" columns={targetColumns<PlanTarget>((row) => row, targetLabel)} rows={targets} getRowKey={(row) => targets.indexOf(row)} />
        </Card>
      ) : null}
    </div>
  );
}

/** مراجعة المراقبة كما وصلت (G13 بعد الإرسال، وG14). */
export function MonitoringReviewCard({ review }: { review: NonNullable<Report["monitoring_review"]> }) {
  return (
    <Card title="مراجعة المراقبة">
      <DescriptionList
        items={[
          { label: "المراجِع", value: review.reviewed_by?.name },
          { label: "تاريخ الاستلام", value: review.received_at ? formatDateTime(review.received_at) : null },
          { label: "مكتمل", value: review.is_complete ? "نعم" : <span className="text-danger">لا</span> },
          { label: "يحتاج تحققاً", value: review.needs_verification ? <span className="text-warning">نعم</span> : "لا" },
          { label: "الملاحظات", value: review.notes },
        ]}
      />
    </Card>
  );
}

function Labeled({ label, badge, children }: { label: string; badge?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="flex items-center gap-2 text-label text-fg-muted">
        {label}
        {badge}
      </span>
      {children}
    </div>
  );
}

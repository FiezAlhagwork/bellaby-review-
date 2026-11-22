"use client";

import { departmentLabels } from "@/components/data/departments";
import { reportKindLabels } from "@/components/data/report-kinds";
import { PageHeader } from "@/components/layout/PageHeader";
import { Banner } from "@/components/ui/Banner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { NotFoundState } from "@/components/ui/NotFoundState";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Skeleton } from "@/components/ui/Skeleton";
import { periodLabel, ReportSections } from "@/features/periodic-reports/components/ReportSections";
import type { PeriodicReport, PlanTarget } from "@/lib/api/types";
import { formatDateShort, formatDateTime } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";
import { Files } from "@phosphor-icons/react";

/** نسخة مرسلة: رقمها ووقت إرسالها والتقرير بأرقامه المثبّتة (من `snapshot`، تحوّله الحاوية: §106). */
export type ReportVersionItem = { version: number; submittedAt: string; report: PeriodicReport };

type ReportVersionsViewProps = {
  versions: Loadable<readonly ReportVersionItem[]>;
  /** رقم النسخة المعروضة. */
  selected: number | null;
  onSelect: (version: number) => void;
  targetLabel: (target: PlanTarget) => string;
  memberName: (id: number) => string;
  onBack?: () => void;
  onRetry?: () => void;
};

/**
 * نسخ التقرير الدوري (G15): كل إرسال يثبّت الأرقام في نسخة. تُختار النسخة بتاريخها وتُعرض كما أُرسلت.
 * النسخة الثانية تأتي بعد «إعادة للتعديل» أو «طلب معلومات».
 */
export function ReportVersionsView({ versions, selected, onSelect, targetLabel, memberName, onBack, onRetry }: ReportVersionsViewProps) {
  if (versions.status === "loading") {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-11 w-80" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (versions.status === "error") return versions.code === "not_found" ? <NotFoundState onBack={onBack} /> : <ErrorState code={versions.code} onRetry={onRetry} />;

  const list = versions.data;
  const current = list.find((item) => item.version === selected) ?? list[list.length - 1];
  if (!current) {
    return (
      <>
        <PageHeader title="النسخ المرسلة" />
        <EmptyState icon={Files} title="لا نسخ مرسلة بعد" description="تُثبّت النسخة الأولى عند أول إرسال." />
      </>
    );
  }
  const report = current.report;
  const latest = list[list.length - 1]?.version;

  return (
    <>
      <PageHeader
        title={`النسخ المرسلة · تقرير ${report.kind ? reportKindLabels[report.kind] : ""} · ${report.department ? departmentLabels[report.department] : "—"}`}
        description={`الفترة ${periodLabel(report.period_start, report.period_end)} · ${report.author?.name ?? ""}`}
      />

      <div className="flex flex-col gap-4">
        <SegmentedControl aria-label="النسخة" options={list.map((item) => ({ value: String(item.version), label: `النسخة ${item.version} · ${formatDateShort(item.submittedAt)}` }))} value={String(current.version)} onValueChange={(value) => onSelect(Number(value))} />

        <Banner kind={current.version === latest ? "info" : "neutral"} title={current.version === latest ? "آخر نسخة مرسلة" : "نسخة سابقة"}>
          {`أُرسلت ${formatDateTime(current.submittedAt)}. الأرقام كما ثُبّتت عند إرسالها.`}
        </Banner>

        <ReportSections report={report} targetLabel={targetLabel} memberName={memberName} />
      </div>
    </>
  );
}

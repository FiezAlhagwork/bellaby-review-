"use client";

import { Coins } from "@phosphor-icons/react";
import { DateCell, MoneyCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { departmentLabels } from "@/components/data/departments";
import { DescriptionList } from "@/components/data/DescriptionList";
import { StatusBadge } from "@/components/data/StatusBadge";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { deductionSourceLabels } from "@/features/deductions/views/DeductionsView";
import type { Deduction, Profile } from "@/lib/api/types";
import { monthLabel } from "@/lib/calendar";
import { countPhrase, formatPhone } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

type Score = NonNullable<Profile["scores"]>[number];

type MyProfileViewProps = {
  /** `GET /me/profile`. العقد والراتب لا يُعرضان هنا (§96). */
  profile: Loadable<Profile>;
  /** إلى «المهام» (G06) مصفّاة بالمسندة إليّ. */
  onOpenTasks: () => void;
  onRetry?: () => void;
};

const scoreColumns: DataTableColumn<Score>[] = [
  { key: "month", header: "الشهر", cell: (row) => <TextCell value={row.month ? monthLabel(row.month) : null} />, priority: "high", role: "primary" },
  { key: "total", header: "المجموع", cell: (row) => <span dir="ltr">{row.total ?? "—"}</span>, align: "end", width: "w-28", priority: "high" },
  { key: "status", header: "الحالة", cell: (row) => (row.status ? <StatusBadge entity="score" status={row.status} /> : <TextCell value={null} />), width: "w-28", priority: "high", role: "status" },
];

const deductionColumns: DataTableColumn<Deduction>[] = [
  { key: "date", header: "التاريخ", cell: (row) => <DateCell value={row.created_at} />, width: "w-32", priority: "high" },
  {
    key: "reason",
    header: "السبب",
    cell: (row) => (
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-body text-fg">{row.reason}</span>
        <span className="text-caption text-fg-muted">{row.source ? deductionSourceLabels[row.source] : ""}</span>
      </span>
    ),
    priority: "high",
    role: "primary",
  },
  { key: "amount", header: "المبلغ", cell: (row) => <MoneyCell value={row.amount} />, align: "end", width: "w-28", priority: "high" },
  { key: "kind", header: "", cell: (row) => (row.reverses_id ? <Badge color="success">قيد معاكس</Badge> : row.reversed_by_id ? <Badge color="neutral">عُكس</Badge> : null), width: "w-28", role: "status" },
];

/**
 * ملفي الشخصي (G05): بياناتي، ودوري ووصف مهامه، وتقييماتي الشهرية (الشهر الجاري مبدئي حتى الإغلاق)، وخصوماتي، وعدد مهامي المفتوحة.
 * العقد والراتب لا يظهران هنا: للمدير التنفيذي ومدير المحاسبة وحدهما.
 */
export function MyProfileView({ profile, onOpenTasks, onRetry }: MyProfileViewProps) {
  if (profile.status === "error") return <ErrorState code={profile.code} onRetry={onRetry} />;
  if (profile.status === "loading") {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  const { user, job_description: jobDescription, scores = [], deductions = [], open_tasks: openTasks = 0 } = profile.data;
  const provisional = scores.some((score) => score.status === "PROVISIONAL");
  const contact = user?.type === "REP" ? (user.phone ? <span dir="ltr">{formatPhone(user.phone)}</span> : null) : user?.email ? <span dir="ltr">{user.email}</span> : null;

  return (
    <>
      <PageHeader title={user?.name ?? "ملفي الشخصي"} description={[user?.role?.name, user?.department ? departmentLabels[user.department] : null].filter(Boolean).join(" · ")} />

      <div className="flex flex-col gap-4">
        <Card title="بياناتي">
            <DescriptionList
              items={[
                { label: user?.type === "REP" ? "الهاتف" : "البريد", value: contact },
                { label: "الدور", value: user?.is_department_head ? `${user.role?.name ?? ""} · رئيس قسم` : user?.role?.name },
                { label: "القسم", value: user?.department ? departmentLabels[user.department] : null },
                { label: "المدير المباشر", value: user?.manager?.name },
                { label: "المحافظات", value: (user?.governorates ?? []).map((item) => item.name).join("، ") },
              ]}
            />
        </Card>

        <Card title="وصف المهام">
          <p className="text-body text-fg">{jobDescription ?? "لم يُكتب وصف مهام لهذا الدور بعد."}</p>
        </Card>

        <Card
          title="المهام المفتوحة"
          action={
            <Button variant="secondary" size="sm" onClick={onOpenTasks}>
              عرض مهامي
            </Button>
          }
        >
          <p className="text-body text-fg">{openTasks > 0 ? `${countPhrase(openTasks, ["مهمة مفتوحة", "مهمتان مفتوحتان", "مهام مفتوحة"])} مسندة إليك.` : "لا مهام مفتوحة مسندة إليك."}</p>
        </Card>

        {provisional ? (
          <Banner kind="info" title="تقييم الشهر الجاري مبدئي">
            يتغيّر حتى إغلاق الشهر، ويصير نهائياً بعده.
          </Banner>
        ) : null}

        <Card title="التقييمات الشهرية">
          <DataTable label="التقييمات الشهرية" columns={scoreColumns} rows={scores} getRowKey={(row) => row.month ?? ""} empty={<EmptyState icon={Coins} title="لا تقييمات بعد" description="يظهر تقييمك بعد أول شهر." />} />
        </Card>

        <Card title="الخصومات">
          <DataTable label="الخصومات" columns={deductionColumns} rows={deductions} getRowKey={(row) => row.id ?? ""} empty={<EmptyState icon={Coins} title="لا خصومات" description="لا خصومات عليك." />} />
        </Card>
      </div>
    </>
  );
}

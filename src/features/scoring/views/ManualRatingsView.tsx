"use client";

import { Star } from "@phosphor-icons/react";
import { TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { ratingScaleLabels, ratingScaleOrder } from "@/components/data/rating-scale";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { EmptyState } from "@/components/ui/EmptyState";
import { MonthPicker } from "@/components/ui/MonthPicker";
import type { Option } from "@/components/ui/OptionList";
import { Select } from "@/components/ui/Select";
import { errorMessage } from "@/lib/api/error-messages";
import type { MonthlyScore, RatingScale } from "@/lib/api/types";
import { monthLabel, type IsoDate, type IsoMonth } from "@/lib/calendar";
import { countPhrase } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

type ManualRatingsViewProps = {
  month: IsoMonth;
  onMonthChange: (month: IsoMonth) => void;
  closedMonths: readonly IsoMonth[];
  /** موظفو البند اليدوي: `GET /scores?month=` (من يحمل بنداً يدوياً: docs/backend-requests.md §61.1). */
  scores: Loadable<readonly MonthlyScore[]>;
  /** `ratings.manual`. */
  canRate: boolean;
  /** الشهر مغلق: التقييمات مقفلة للقراءة. */
  locked: boolean;
  /** الموظف الذي يُحفظ تقييمه الآن (`PUT /manual-ratings`). */
  savingUserId?: number | null;
  onRate?: (userId: number, score: RatingScale) => void;
  /** رمز خطأ آخر حفظ (`month_closed`). */
  saveError?: string;
  today: IsoDate;
  onRetry?: () => void;
};

const options: Option<RatingScale>[] = ratingScaleOrder.map((value) => ({ value, label: `${ratingScaleLabels[value]} · ${value}` }));

/**
 * التقييم اليدوي (E07): لكل موظف له بند يدوي تقييم بالسلّم الموحّد، يُحفظ عند اختياره ويُعدَّل حتى إغلاق الشهر. الناقص يُعلَّم ويمنع الإغلاق.
 */
export function ManualRatingsView({ month, onMonthChange, closedMonths, scores, canRate, locked, savingUserId = null, onRate, saveError, today, onRetry }: ManualRatingsViewProps) {
  const rows = scores.status === "ready" ? scores.data : [];
  const missing = rows.filter((row) => !row.manual_rating).length;
  const editable = canRate && !locked;

  const columns: DataTableColumn<MonthlyScore>[] = [
    { key: "user", header: "الموظف", cell: (row) => <TextCell value={row.user?.name} />, priority: "high", role: "primary" },
    { key: "group", header: "المجموعة", cell: (row) => <TextCell value={row.comparison_group?.name} />, width: "w-40" },
    {
      key: "rating",
      header: "التقييم",
      cell: (row) =>
        editable && row.user?.id !== undefined ? (
          <Select
            aria-label={`تقييم ${row.user.name ?? ""}`}
            placeholder="اختر التقييم"
            options={options}
            value={row.manual_rating?.score ?? null}
            onValueChange={(score) => onRate?.(row.user!.id!, score)}
            disabled={savingUserId === row.user.id}
            invalid={!row.manual_rating}
          />
        ) : (
          <TextCell value={row.manual_rating?.score ? `${ratingScaleLabels[row.manual_rating.score]} · ${row.manual_rating.score}` : null} />
        ),
      width: "w-56",
      priority: "high",
    },
    { key: "by", header: "قيّمه", cell: (row) => <TextCell value={row.manual_rating?.rated_by?.name} />, width: "w-36" },
    {
      key: "state",
      header: "الحالة",
      cell: (row) => (row.manual_rating ? <Badge color="success">مُقيَّم</Badge> : <Badge color="warning">ناقص</Badge>),
      width: "w-24",
      role: "status",
    },
  ];

  return (
    <>
      <PageHeader title="التقييم اليدوي" description="تقييم كل موظف له بند يدوي بالسلّم الموحّد: ممتاز 100، جيد جداً 80، جيد 60، مقبول 40، ضعيف 20. يُحفظ عند الاختيار." />

      <div className="flex flex-col gap-4">
        <div className="w-full max-w-64">
          <MonthPicker aria-label="الشهر" value={month} onValueChange={onMonthChange} closedMonths={closedMonths} today={today} />
        </div>

        {locked ? (
          <Banner kind="info" title={`${monthLabel(month)} مغلق`}>
            التقييمات مثبّتة مع النقاط ولا تُعدَّل.
          </Banner>
        ) : missing > 0 && scores.status === "ready" ? (
          <Banner kind="warning" title={countPhrase(missing, ["تقييم ناقص", "تقييمان ناقصان", "تقييمات ناقصة"])}>
            لا يُغلق الشهر حتى تكتمل كل التقييمات اليدوية.
          </Banner>
        ) : null}

        {saveError ? (
          <Banner kind="danger" title="تعذّر حفظ التقييم">
            {errorMessage(saveError)}
          </Banner>
        ) : null}

        <DataTable
          label="التقييم اليدوي"
          columns={columns}
          rows={rows}
          getRowKey={(row) => row.user?.id ?? ""}
          loading={scores.status === "loading"}
          error={scores.status === "error" ? { code: scores.code, onRetry } : undefined}
          empty={<EmptyState icon={Star} title="لا بنود يدوية هذا الشهر" description="يظهر هنا من له بند تقييم يدوي في أوزان دوره." />}
        />
      </div>
    </>
  );
}

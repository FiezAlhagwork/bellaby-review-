"use client";

import { CheckCircle, Circle } from "@phosphor-icons/react";
import { StatusBadge } from "@/components/data/StatusBadge";
import { PageHeader } from "@/components/layout/PageHeader";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { MonthPicker } from "@/components/ui/MonthPicker";
import { Skeleton } from "@/components/ui/Skeleton";
import type { MonthClosing } from "@/lib/api/types";
import { dayLabel, monthLabel, type IsoDate, type IsoMonth } from "@/lib/calendar";
import { countPhrase, formatDateTime } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

type MonthClosingViewProps = {
  month: IsoMonth;
  onMonthChange: (month: IsoMonth) => void;
  closedMonths: readonly IsoMonth[];
  closing: Loadable<MonthClosing>;
  /** اليوم (بتوقيت دمشق): هل مضى يوم العمل الخامس. يُمرَّر فيبقى الـ view نقياً. */
  today: IsoDate;
  onOpenRatings?: () => void;
  onOpenBudget?: () => void;
  onOpenScores?: () => void;
  onRetry?: () => void;
};

/** شرط في قائمة ما ينتظره الإغلاق: مكتمل أو ناقص، ومعه تفصيله وإجراؤه. */
function Condition({ done, title, detail, action }: { done: boolean; title: string; detail: string; action?: { label: string; onClick: () => void } }) {
  const Icon = done ? CheckCircle : Circle;
  return (
    <li className="flex flex-wrap items-start justify-between gap-3 py-3">
      <span className="flex min-w-0 items-start gap-3">
        <Icon size={20} weight={done ? "fill" : "regular"} className={done ? "shrink-0 text-success" : "shrink-0 text-fg-muted"} aria-hidden="true" />
        <span className="flex min-w-0 flex-col">
          <span className="text-body text-fg">{title}</span>
          <span className="text-caption text-fg-muted">{detail}</span>
        </span>
      </span>
      {!done && action ? (
        <Button variant="secondary" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
    </li>
  );
}

/**
 * إغلاق الشهر (E06): حالة الشهر (مفتوح، بانتظار الإغلاق، مغلق) وما ينتظره: التقييمات اليدوية الناقصة، والمصروف الفعلي الناقص، ويوم العمل الخامس.
 * الإغلاق آلي بعد نهاية يوم العمل الخامس إن اكتملت الشروط (القرار 13)، فلا زر إغلاق هنا.
 */
export function MonthClosingView({ month, onMonthChange, closedMonths, closing, today, onOpenRatings, onOpenBudget, onOpenScores, onRetry }: MonthClosingViewProps) {
  const ready = closing.status === "ready" ? closing.data : null;
  const ratings = ready?.missing_manual_ratings ?? [];
  const expenses = ready?.missing_expenses ?? [];
  const fifth = ready?.fifth_work_day ?? null;
  const fifthPassed = fifth !== null && today > fifth;

  return (
    <>
      <PageHeader
        title="إغلاق الشهر"
        badge={ready?.status ? <StatusBadge entity="monthClosing" status={ready.status} /> : undefined}
        description="يُغلق الشهر آلياً بعد نهاية يوم العمل الخامس من الشهر التالي إن اكتملت التقييمات اليدوية والمصاريف. بعد الإغلاق تُثبَّت النقاط."
      />

      <div className="flex flex-col gap-4">
        <div className="w-full max-w-64">
          <MonthPicker aria-label="الشهر" value={month} onValueChange={onMonthChange} closedMonths={closedMonths} today={today} />
        </div>

        {closing.status === "error" ? <ErrorState code={closing.code} onRetry={onRetry} /> : null}
        {closing.status === "loading" ? <Skeleton className="h-64 w-full" /> : null}

        {ready?.status === "CLOSED" ? (
          <Banner
            kind="success"
            title={`أُغلق ${monthLabel(month)}`}
            action={
              onOpenScores ? (
                <Button variant="ghost" size="sm" onClick={onOpenScores}>
                  النقاط النهائية
                </Button>
              ) : undefined
            }
          >
            {`النقاط مثبّتة والبيانات للقراءة فقط منذ ${ready.closed_at ? formatDateTime(ready.closed_at) : "الإغلاق"}. يُصحَّح أي خطأ بقيد معاكس.`}
          </Banner>
        ) : null}

        {ready?.status === "WAITING" ? (
          <Banner kind="warning" title="بانتظار إدخالات">
            مضى يوم العمل الخامس ولم تكتمل الشروط. يُغلق الشهر آلياً حين تكتمل.
          </Banner>
        ) : null}

        {ready ? (
          <Card title="ما ينتظره الإغلاق">
            <ul className="flex flex-col divide-y divide-border">
              <Condition
                done={ratings.length === 0}
                title="التقييمات اليدوية"
                detail={ratings.length === 0 ? "اكتملت كل التقييمات." : `${countPhrase(ratings.length, ["تقييم ناقص", "تقييمان ناقصان", "تقييمات ناقصة"])}: ${ratings.map((user) => user.name).join("، ")}.`}
                action={onOpenRatings ? { label: "التقييم اليدوي", onClick: onOpenRatings } : undefined}
              />
              <Condition
                done={expenses.length === 0}
                title="المصروف الفعلي"
                detail={expenses.length === 0 ? "أدخل المحاسب فعلي كل البنود." : `لم يُدخل المحاسب فعلي: ${expenses.map((line) => `«${line.name ?? ""}»`).join(" و")}.`}
                action={onOpenBudget ? { label: "الميزانية", onClick: onOpenBudget } : undefined}
              />
              <Condition
                done={fifthPassed || ready.status === "CLOSED"}
                title="يوم العمل الخامس"
                detail={fifth ? `${fifthPassed || ready.status === "CLOSED" ? "انتهى" : "ينتهي"} يوم ${dayLabel(fifth)}.` : "—"}
              />
            </ul>
          </Card>
        ) : null}
      </div>
    </>
  );
}

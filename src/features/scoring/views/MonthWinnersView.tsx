"use client";

import { Trophy } from "@phosphor-icons/react";
import { DescriptionList } from "@/components/data/DescriptionList";
import { Grid } from "@/components/layout/Grid";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Field } from "@/components/ui/Field";
import { MonthPicker } from "@/components/ui/MonthPicker";
import type { Option } from "@/components/ui/OptionList";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { errorMessage } from "@/lib/api/error-messages";
import type { MonthWinner } from "@/lib/api/types";
import { type IsoDate, type IsoMonth } from "@/lib/calendar";
import { formatDateTime, isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

/** مفتاح بطاقة: النوع والمجموعة (`EMPLOYEE-3` أو `CUSTOMER`). */
export const winnerKey = (winner: MonthWinner) => `${winner.kind}-${winner.group?.id ?? ""}`;

/** نافذة «اختيار غيره»: المرشّح المختار وسببه الإلزامي (`POST /month-winners/{month}/approve` بـ`subject_id` و`reason`). */
export type ChooseOther = { key: string; subjectId: string | null; reason: string };

type MonthWinnersViewProps = {
  month: IsoMonth;
  onMonthChange: (month: IsoMonth) => void;
  closedMonths: readonly IsoMonth[];
  winners: Loadable<readonly MonthWinner[]>;
  /** `month_winners.approve`. لا يشمله التفويض. */
  canApprove: boolean;
  /** «اعتماد» مرشّح بعينه (الوحيد، أو أحد المتعادلين). */
  onApprove?: (winner: MonthWinner, subjectId: number) => void;
  choosing: ChooseOther | null;
  onChoosingChange: (choosing: ChooseOther | null) => void;
  onChooseOther?: () => void;
  submitting?: boolean;
  submitError?: string;
  today: IsoDate;
  onRetry?: () => void;
};

/**
 * موظف الشهر (E09): لكل مجموعة المرشّح (أو المتعادلون)، ومن تُخطّي لخصم عليه، وعميل الشهر. «اعتماد» المرشّح أو «اختيار غيره» بسبب إلزامي.
 * بعد الاعتماد يظهر من اعتُمد ومن اعتمده ومتى وسببه. يظهر بعد إغلاق الشهر فقط، ولا يشمله التفويض.
 */
export function MonthWinnersView({ month, onMonthChange, closedMonths, winners, canApprove, onApprove, choosing, onChoosingChange, onChooseOther, submitting = false, submitError, today, onRetry }: MonthWinnersViewProps) {
  const list = winners.status === "ready" ? winners.data : [];
  const current = choosing ? list.find((winner) => winnerKey(winner) === choosing.key) : undefined;
  const candidates: Option[] = current ? [...(current.nominees ?? []), ...(current.excluded_for_deduction ?? [])].map((entry) => ({ value: String(entry.subject_id), label: `${entry.name ?? ""} · ${entry.total ?? 0}` })) : [];
  const reasonMissing = choosing !== null && (choosing.subjectId === null || choosing.reason.trim() === "");

  return (
    <>
      <PageHeader title="موظف الشهر" description="المرشّح الأعلى نقاطاً في كل مجموعة بلا خصم عليه، وعميل الشهر. اعتمده أو اختر غيره بسبب." />

      <div className="flex flex-col gap-4">
        <div className="w-full max-w-64">
          <MonthPicker aria-label="الشهر" value={month} onValueChange={onMonthChange} closedMonths={closedMonths} today={today} />
        </div>

        {winners.status === "loading" ? <Skeleton className="h-64 w-full" /> : null}
        {winners.status === "error" ? (
          winners.code === "month_not_closed" ? (
            <EmptyState icon={Trophy} title="لم يُغلق الشهر بعد" description={errorMessage("month_not_closed")} />
          ) : (
            <ErrorState code={winners.code} onRetry={onRetry} />
          )
        ) : null}
        {submitError && choosing === null ? (
          <Banner kind="danger" title="تعذّر الاعتماد">
            {errorMessage(submitError)}
          </Banner>
        ) : null}

        <Grid cols={{ base: 1, desktop: 2 }} gap={4}>
          {list.map((winner) => {
            const nominees = winner.nominees ?? [];
            const tied = nominees.length > 1 || nominees.some((nominee) => nominee.tied);
            const title = winner.kind === "CUSTOMER" ? "عميل الشهر" : (winner.group?.name ?? "مجموعة");
            return (
              <Card key={winnerKey(winner)} title={title} action={winner.approved ? <Badge color="success">معتمد</Badge> : tied ? <Badge color="warning">متعادلون</Badge> : undefined}>
                <div className="flex flex-col gap-4">
                  {winner.approved ? (
                    <DescriptionList
                      items={[
                        { label: winner.kind === "CUSTOMER" ? "العميل" : "الموظف", value: winner.approved.name },
                        { label: "اعتمده", value: winner.approved.by?.name },
                        { label: "في", value: winner.approved.at ? formatDateTime(winner.approved.at) : null },
                        { label: "سبب اختيار غير المرشّح", value: winner.approved.reason },
                      ]}
                    />
                  ) : (
                    <ul className="flex flex-col divide-y divide-border">
                      {nominees.map((nominee) => (
                        <li key={nominee.subject_id} className="flex flex-wrap items-center justify-between gap-3 py-2">
                          <span className="flex min-w-0 flex-col">
                            <span className="text-body font-semibold text-fg">{nominee.name}</span>
                            <span className="text-caption text-fg-muted">{`${isolate(nominee.total ?? 0)} نقطة${nominee.tied ? " · متعادل" : ""}`}</span>
                          </span>
                          {canApprove && nominee.subject_id !== undefined ? (
                            <Button variant="primary" size="sm" onClick={() => onApprove?.(winner, nominee.subject_id!)}>
                              {tied ? `اعتماد ${nominee.name ?? ""}` : "اعتماد"}
                            </Button>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}

                  {(winner.excluded_for_deduction ?? []).length > 0 ? (
                    <div className="flex flex-col gap-1 rounded-lg bg-surface-sunken px-3 py-2">
                      <span className="text-label text-fg">تُخطّي لخصم عليه</span>
                      {(winner.excluded_for_deduction ?? []).map((entry) => (
                        <span key={entry.subject_id} className="text-caption text-fg-muted">{`${entry.name ?? ""} · ${isolate(entry.total ?? 0)} نقطة`}</span>
                      ))}
                    </div>
                  ) : null}

                  {canApprove && !winner.approved ? (
                    <div>
                      <Button variant="secondary" size="sm" onClick={() => onChoosingChange({ key: winnerKey(winner), subjectId: null, reason: "" })}>
                        اختيار غيره
                      </Button>
                    </div>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </Grid>
      </div>

      <Dialog
        open={choosing !== null}
        onOpenChange={(open) => {
          if (!open) onChoosingChange(null);
        }}
        dismissible={!submitting}
        size="sm"
        title="اختيار غير المرشّح"
        description={current ? `${current.kind === "CUSTOMER" ? "عميل الشهر" : (current.group?.name ?? "")}: اختر من تعتمده واكتب السبب. يجوز اختيار من عليه خصم.` : ""}
        actions={[
          <Button key="cancel" variant="secondary" disabled={submitting} onClick={() => onChoosingChange(null)}>
            إلغاء
          </Button>,
          <Button key="save" variant="primary" loading={submitting} disabled={reasonMissing} onClick={onChooseOther}>
            اعتماد الاختيار
          </Button>,
        ]}
      >
        {choosing ? (
          <div className="flex flex-col gap-4">
            {submitError ? (
              <Banner kind="danger" title="تعذّر الاعتماد">
                {errorMessage(submitError)}
              </Banner>
            ) : null}
            <Field label="الاختيار" required>
              <Select aria-label="الاختيار" placeholder="اختر" options={candidates} value={choosing.subjectId} onValueChange={(subjectId) => onChoosingChange({ ...choosing, subjectId })} />
            </Field>
            <Field label="السبب" required hint={reasonMissing ? "اختر واكتب السبب ليُفعَّل «اعتماد الاختيار»." : undefined}>
              <Textarea aria-label="السبب" value={choosing.reason} onChange={(event) => onChoosingChange({ ...choosing, reason: event.target.value })} placeholder="لماذا تختار غير المرشّح؟" />
            </Field>
          </div>
        ) : null}
      </Dialog>
    </>
  );
}

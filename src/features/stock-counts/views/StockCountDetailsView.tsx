"use client";

import { ArrowUUpLeft, CheckCircle, ClipboardText, PlusCircle } from "@phosphor-icons/react";
import { ActivityLog, type ActivityEvent } from "@/components/data/ActivityLog";
import { BatchCell, QuantityCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { DecisionPanel, DecisionRecord } from "@/components/data/DecisionPanel";
import { StatusBadge } from "@/components/data/StatusBadge";
import { itemTypeLabels } from "@/components/data/item-types";
import type { EditorBatch, EditorItem } from "@/components/data/LineItemsEditor";
import { Grid } from "@/components/layout/Grid";
import { PageHeader, type PageAction } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Combobox } from "@/components/ui/Combobox";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorState } from "@/components/ui/ErrorState";
import { Field } from "@/components/ui/Field";
import { NotFoundState } from "@/components/ui/NotFoundState";
import { NumberInput } from "@/components/ui/NumberInput";
import type { Option, OptionsState } from "@/components/ui/OptionList";
import { ReasonDialog } from "@/components/ui/ReasonDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { errorMessage } from "@/lib/api/error-messages";
import type { StockCount, StockCountLine } from "@/lib/api/types";
import { dayLabel } from "@/lib/calendar";
import { formatDateTime, formatQuantity, isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";
import { currentLines } from "./StockCountsListView";

/** السطر قيد الإدخال: الصنف والدفعة والكمية الفعلية (`null` = لم تُختر بعد). الأب يملكه، وحفظه يرسل `POST /stock-counts/{id}/lines`. */
export type CountEntry = { itemId: number | null; batchId: number | null; quantity: number | null };

export const emptyCountEntry: CountEntry = { itemId: null, batchId: null, quantity: null };

/** نافذة سبب مفتوحة (إلغاء الجرد أو إرجاعه): السبب المكتوب وحالة الطلب. null = مغلقة. */
export type CountReasonDialog = { reason: string; loading?: boolean; /** رمز خطأ العقد (invalid_status وvalidation_failed…). */ errorCode?: string };

type StockCountDetailsViewProps = {
  /** `GET /stock-counts/{id}` (الجرد مع أسطره). خطأ `not_found` يعرض «غير موجود أو خارج نطاقك». */
  count: Loadable<StockCount>;
  /** العدّ والإرسال: `stock_counts.count` (عامل المستودع واللوجستي). */
  canCount: boolean;
  /** الإلغاء قبل الإرسال: `stock_counts.create` (اللوجستي). */
  canCancel: boolean;
  /** الاعتماد والإرجاع: `stock_counts.approve` (المدير التنفيذي أو المفوَّض). */
  canDecide: boolean;
  /** حالة لوحة القرار: `self-decision-forbidden` حين الجرد يخصّ صاحب القرار نفسه (المفوَّض لا يقرر في جرده). */
  decisionState?: "awaiting-me" | "self-decision-forbidden";

  /** أصناف الموقع ودفعاتها لاختيار السطر (`GET /stock/balances?location_id=…&group_by=batch`). الدفعات الموقوفة قابلة للعدّ (القرار 2). */
  items: readonly EditorItem[];
  batches: Readonly<Record<string, Loadable<readonly EditorBatch[]>>>;
  entry: CountEntry;
  onEntryChange?: (entry: CountEntry) => void;
  onSaveLine?: () => void;
  savingLine?: boolean;
  /** رمز خطأ بلا حقل عند الحفظ (`lines_locked`…). */
  lineError?: string;
  /** `errors` من `validation_failed`: `{ actual_qty: "نص" }` كما هي. */
  lineErrors?: Readonly<Record<string, string>>;
  /** السطر الذي حُفظ للتو (معرّفه): يظهر ملخصه بمتوقعه وفرقه. */
  savedLineId?: number | null;

  /** نافذة «إرسال للاعتماد» مفتوحة. null = مغلقة. */
  submit?: { loading?: boolean } | null;
  /** رمز خطأ الإرسال (invalid_status). */
  submitError?: string;
  onStartSubmit?: () => void;
  onConfirmSubmit?: () => void;
  onDismissSubmit?: () => void;

  cancellation?: CountReasonDialog | null;
  onStartCancel?: () => void;
  onCancelReasonChange?: (reason: string) => void;
  onConfirmCancel?: () => void;
  onDismissCancel?: () => void;

  /** نافذة «إرجاع لإعادة العدّ» (للمدير التنفيذي). */
  returning?: CountReasonDialog | null;
  onStartReturn?: () => void;
  onReturnReasonChange?: (reason: string) => void;
  onConfirmReturn?: () => void;
  onDismissReturn?: () => void;

  /** الاعتماد يُنفَّذ الآن. */
  approving?: boolean;
  /** رمز خطأ الاعتماد (invalid_status). */
  approveError?: string;
  onApprove?: () => void;

  onBack?: () => void;
  onRetry?: () => void;
};

const signed = (difference: number) => (difference === 0 ? "0" : `${difference > 0 ? "+" : "-"}${formatQuantity(Math.abs(difference))}`);

function DifferenceCell({ difference }: { difference: number | undefined }) {
  if (difference === undefined) return <TextCell value={null} />;
  if (difference === 0) return <Badge color="success">مطابق</Badge>;
  return (
    <Badge color={difference < 0 ? "danger" : "warning"}>
      <span dir="ltr">{signed(difference)}</span>
    </Badge>
  );
}

/** أحداث السجل من حقول الجرد (لا `submitted_by` ولا `cancelled_at` في العقد): الأحدث أولاً. */
function buildEvents(count: StockCount): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  if (count.created_at) {
    events.push({
      id: "created",
      icon: PlusCircle,
      sentence: `أنشأ ${count.created_by?.name ?? "—"} الجرد${count.assigned_to ? ` وأسنده إلى ${count.assigned_to.name}` : ""}`,
      at: count.created_at,
    });
  }
  if (count.submitted_at) events.push({ id: "submitted", icon: ClipboardText, sentence: "أُرسل الجرد للاعتماد", at: count.submitted_at });
  (count.return_history ?? []).forEach((entry, index) => {
    if (entry.at) events.push({ id: `return-${index}`, icon: ArrowUUpLeft, sentence: `أرجع ${entry.by?.name ?? "—"} الجرد لإعادة العدّ`, reason: entry.reason, at: entry.at });
  });
  if (count.approved_at) {
    events.push({
      id: "approved",
      icon: CheckCircle,
      sentence: `اعتمد ${count.approved_by?.name ?? "—"} الجرد${count.on_behalf_of ? ` بالتفويض عن ${count.on_behalf_of.name}` : ""}`,
      at: count.approved_at,
      onBehalf: Boolean(count.on_behalf_of),
    });
  }
  return events.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}

/**
 * العدّ (W15) واعتماد الجرد (W16): جرد موقع واحد سطراً بسطر. كل سطر يُحفظ فور إدخاله بمتوقعه (رصيد النظام لحظة العدّ) وفرقه، فالعمل لا يتوقف أثناء الجرد
 * (القرار 3). بعد الإرسال تُقفل الأسطر. وللمدير التنفيذي لوحة القرار: «اعتماد» (تتولّد التسويات وتُحال الفروق للمراقبة) أو «إرجاع لإعادة العدّ» بسبب،
 * فتبقى الأسطر القديمة في السجل ويُعدّ من جديد. الإلغاء قبل الإرسال بسبب (للوجستي).
 */
export function StockCountDetailsView({
  count,
  canCount,
  canCancel,
  canDecide,
  decisionState = "awaiting-me",
  items,
  batches,
  entry,
  onEntryChange,
  onSaveLine,
  savingLine = false,
  lineError,
  lineErrors = {},
  savedLineId = null,
  submit = null,
  submitError,
  onStartSubmit,
  onConfirmSubmit,
  onDismissSubmit,
  cancellation = null,
  onStartCancel,
  onCancelReasonChange,
  onConfirmCancel,
  onDismissCancel,
  returning = null,
  onStartReturn,
  onReturnReasonChange,
  onConfirmReturn,
  onDismissReturn,
  approving = false,
  approveError,
  onApprove,
  onBack,
  onRetry,
}: StockCountDetailsViewProps) {
  if (count.status === "loading") {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <div className="flex flex-col gap-2 pb-4">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (count.status === "error") {
    return count.code === "not_found" ? <NotFoundState onBack={onBack} /> : <ErrorState code={count.code} onRetry={onRetry} />;
  }

  const data = count.data;
  const location = data.location?.name ?? "—";
  const lines = currentLines(data);
  const oldLines = (data.lines ?? []).filter((line) => line.superseded);
  const withDifference = lines.filter((line) => (line.difference ?? 0) !== 0);
  const shortage = lines.reduce((sum, line) => sum + ((line.difference ?? 0) < 0 ? -(line.difference ?? 0) : 0), 0);
  const surplus = lines.reduce((sum, line) => sum + ((line.difference ?? 0) > 0 ? (line.difference ?? 0) : 0), 0);

  const inProgress = data.status === "IN_PROGRESS";
  const submitted = data.status === "SUBMITTED";
  const returnedBy = (data.return_history ?? []).at(-1);
  const counting = inProgress && canCount;

  const actions: PageAction[] = [
    ...(inProgress && canCancel ? [{ id: "cancel", label: "إلغاء الجرد", danger: true, onSelect: () => onStartCancel?.() }] : []),
    ...(counting ? [{ id: "submit", label: "إرسال للاعتماد", primary: true, disabled: lines.length === 0, reason: "أضف سطراً واحداً على الأقل", onSelect: () => onStartSubmit?.() }] : []),
  ];

  // ---- اختيار السطر
  const batchLoadable = entry.itemId === null ? undefined : batches[String(entry.itemId)];
  const batchOptions: Option[] =
    batchLoadable?.status === "ready"
      ? [...batchLoadable.data]
          .sort((a, b) => (a.expiry_date < b.expiry_date ? -1 : a.expiry_date > b.expiry_date ? 1 : 0))
          .map((batch) => ({ value: String(batch.id), label: `${isolate(batch.batch_no)} · ${dayLabel(batch.expiry_date)}${batch.status === "SUSPENDED" ? " · موقوفة" : ""}` }))
      : [];
  const batchState: OptionsState | undefined =
    entry.itemId === null ? undefined : !batchLoadable || batchLoadable.status === "loading" ? { status: "loading" } : batchLoadable.status === "error" ? { status: "error", code: batchLoadable.code } : undefined;
  const itemOptions: Option[] = items.map((item) => ({ value: String(item.id), label: item.name }));

  const entryComplete = entry.itemId !== null && entry.batchId !== null && entry.quantity !== null;
  const entryReason = entry.itemId === null ? "اختر الصنف." : entry.batchId === null ? "اختر الدفعة." : entry.quantity === null ? "أدخل الكمية الفعلية (صفر إن لم تجد شيئاً)." : null;
  const existing = entryComplete ? lines.find((line) => line.item?.id === entry.itemId && line.batch?.id === entry.batchId) : undefined;
  const savedLine = savedLineId === null ? undefined : lines.find((line) => line.id === savedLineId);

  const columns = (muted: boolean): DataTableColumn<StockCountLine>[] => [
    {
      key: "item",
      header: "الصنف",
      cell: (row) => (
        <span className="flex min-w-0 flex-col">
          <span className={muted ? "truncate text-body text-fg-muted" : "truncate text-body text-fg"}>{row.item?.name}</span>
          <span className="truncate text-caption text-fg-muted">{row.item?.type ? itemTypeLabels[row.item.type] : ""}</span>
        </span>
      ),
      priority: "high",
      role: "primary",
    },
    { key: "batch", header: "الدفعة", cell: (row) => <BatchCell batch={row.batch} />, width: "w-64", priority: "high" },
    { key: "actual", header: "الفعلي", cell: (row) => <QuantityCell value={row.actual_qty} />, align: "end", width: "w-24", priority: "high" },
    { key: "expected", header: "المتوقع", cell: (row) => <QuantityCell value={row.expected_qty} />, align: "end", width: "w-24", priority: "high" },
    { key: "difference", header: "الفرق", cell: (row) => <DifferenceCell difference={row.difference} />, width: "w-28", priority: "high", role: "status" },
    {
      key: "counted",
      header: "عدّه",
      cell: (row) => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-body text-fg">{row.counted_by?.name ?? "—"}</span>
          <span className="truncate text-caption text-fg-muted">{row.counted_at ? formatDateTime(row.counted_at) : ""}</span>
        </span>
      ),
      width: "w-44",
    },
  ];

  const summary =
    lines.length === 0
      ? null
      : withDifference.length === 0
        ? `${isolate(lines.length)} أسطر، كلها مطابقة للمتوقع.`
        : `${isolate(lines.length)} أسطر، ${isolate(withDifference.length)} منها فيها فرق: نقص ${isolate(formatQuantity(shortage))} وزيادة ${isolate(formatQuantity(surplus))}.`;

  const decisionSummary = `جرد ${isolate(`#${data.id}`)} (${location}): ${summary ?? "لا أسطر."} الاعتماد يولّد التسويات ويُحيل الفروق للمراقبة.`;

  return (
    <>
      <PageHeader
        title={`جرد ${isolate(`#${data.id}`)}`}
        badge={data.status ? <StatusBadge entity="stockCount" status={data.status} /> : undefined}
        description={`${location}${data.assigned_to ? ` · المكلَّف ${data.assigned_to.name}` : ""} · أنشأه ${data.created_by?.name ?? "—"}${data.created_at ? ` · ${formatDateTime(data.created_at)}` : ""}`}
        actions={actions}
      />

      <div className="flex flex-col gap-4">
        {inProgress && returnedBy ? (
          <Banner kind="warning" title="أُرجع لإعادة العدّ">
            {`${returnedBy.by?.name ?? "المدير التنفيذي"}: ${returnedBy.reason ?? "—"} الأسطر السابقة محفوظة في السجل أدناه، وأعد عدّ ما يلزم.`}
          </Banner>
        ) : null}

        {submitted && !canDecide ? (
          <Banner kind="info" title="مرسل للاعتماد">
            الأسطر مقفلة ولا تُعدَّل. بانتظار قرار المدير التنفيذي.
          </Banner>
        ) : null}

        {data.status === "APPROVED" ? (
          <Banner kind="success" title="اعتُمد الجرد">
            تولّدت التسويات للفروق وأُحيلت إلى المراقبة.
          </Banner>
        ) : null}

        {data.status === "CANCELLED" ? (
          <Banner kind="neutral" title="أُلغي الجرد">
            {data.cancel_reason ?? "—"}
          </Banner>
        ) : null}

        {submitError ? (
          <Banner kind="danger" title="تعذّر إرسال الجرد">
            {errorMessage(submitError)}
          </Banner>
        ) : null}

        {approveError ? (
          <Banner kind="danger" title="تعذّر الاعتماد">
            {errorMessage(approveError)}
          </Banner>
        ) : null}

        {submitted && canDecide ? (
          <DecisionPanel
            state={decisionState}
            summary={decisionSummary}
            forbiddenNote="ينتظر قرار المدير التنفيذي."
            rejectLabel="إرجاع لإعادة العدّ"
            approving={approving}
            onApprove={() => onApprove?.()}
            onReject={() => onStartReturn?.()}
          />
        ) : null}

        {data.status === "APPROVED" && data.approved_by && data.approved_at ? (
          <DecisionRecord badge={<StatusBadge entity="stockCount" status="APPROVED" />} decidedBy={data.approved_by.name ?? "—"} decidedAt={data.approved_at} onBehalf={Boolean(data.on_behalf_of)} />
        ) : null}

        {counting ? (
          <Card title="عدّ صنف">
            <p className="text-body text-fg-muted">يُحفظ السطر فور إدخاله بمتوقعه وفرقه. عدّ الصنف والدفعة نفسيهما مرة أخرى يستبدل السطر.</p>
            {lineError ? (
              <Banner kind="danger" title="تعذّر حفظ السطر">
                {errorMessage(lineError)}
              </Banner>
            ) : null}
            {savedLine ? (
              <Banner kind="success" title="حُفظ السطر">
                {`${savedLine.item?.name} · ${savedLine.batch?.batch_no}: عُدَّ ${isolate(formatQuantity(savedLine.actual_qty ?? 0))} والمتوقع ${isolate(formatQuantity(savedLine.expected_qty ?? 0))}، ${(savedLine.difference ?? 0) === 0 ? "مطابق." : `الفرق ${isolate(signed(savedLine.difference ?? 0))}.`}`}
              </Banner>
            ) : null}
            <Grid cols={{ base: 1, tablet: 3 }} gap={4}>
              <Field label="الصنف" required error={lineErrors.item_id}>
                <Combobox aria-label="الصنف" placeholder="ابحث عن صنف" options={itemOptions} value={entry.itemId === null ? null : String(entry.itemId)} onValueChange={(value) => onEntryChange?.({ itemId: value === null ? null : Number(value), batchId: null, quantity: null })} />
              </Field>
              <Field label="الدفعة" required error={lineErrors.batch_id}>
                <Combobox
                  aria-label="الدفعة"
                  placeholder={entry.itemId === null ? "اختر الصنف أولاً" : "اختر الدفعة"}
                  options={batchOptions}
                  optionsState={batchState}
                  value={entry.batchId === null ? null : String(entry.batchId)}
                  onValueChange={(value) => onEntryChange?.({ ...entry, batchId: value === null ? null : Number(value), quantity: null })}
                  disabled={entry.itemId === null}
                />
              </Field>
              <Field label="الكمية الفعلية" required error={lineErrors.actual_qty}>
                <NumberInput aria-label="الكمية الفعلية" min={0} unit="علبة" value={entry.quantity} onValueChange={(quantity) => onEntryChange?.({ ...entry, quantity })} disabled={entry.batchId === null} />
              </Field>
            </Grid>
            <div className="flex flex-col gap-2">
              <Button variant="primary" loading={savingLine} disabled={!entryComplete} onClick={onSaveLine} className="self-start">
                {existing ? "استبدال السطر" : "حفظ السطر"}
              </Button>
              {entryReason ? <p className="text-label text-fg-muted">{entryReason}</p> : null}
              {existing ? <p className="text-label text-fg-muted">{`هذا الصنف والدفعة معدودان (${isolate(formatQuantity(existing.actual_qty ?? 0))}): الحفظ يستبدل السطر.`}</p> : null}
            </div>
          </Card>
        ) : null}

        <Card title="الأسطر">
          {counting && lines.length > 0 ? <p className="text-label text-fg-muted">اضغط سطراً لإعادة عدّه.</p> : null}
          {summary ? <p className="text-body text-fg-muted">{summary}</p> : null}
          <DataTable
            label="أسطر الجرد"
            columns={columns(false)}
            rows={lines}
            getRowKey={(row) => row.id ?? ""}
            empty={<p className="px-4 py-6 text-center text-body text-fg-muted">{counting ? "لا أسطر بعد. أضف أول سطر لتستطيع الإرسال للاعتماد." : "لا أسطر في هذا الجرد."}</p>}
            onRowOpen={counting ? (row) => onEntryChange?.({ itemId: row.item?.id ?? null, batchId: row.batch?.id ?? null, quantity: row.actual_qty ?? null }) : undefined}
          />
        </Card>

        {oldLines.length > 0 ? (
          <Card title="أسطر سابقة">
            <p className="text-body text-fg-muted">عُدّت قبل الإرجاع وبقيت في السجل. لا تدخل في الفروق الحالية.</p>
            <DataTable label="الأسطر السابقة" columns={columns(true)} rows={oldLines} getRowKey={(row) => row.id ?? ""} />
          </Card>
        ) : null}

        <Card title="السجل">
          <ActivityLog events={buildEvents(data)} />
        </Card>
      </div>

      <ConfirmDialog
        open={submit !== null}
        onOpenChange={(open) => (open ? undefined : onDismissSubmit?.())}
        title={`إرسال الجرد ${isolate(`#${data.id}`)} للاعتماد؟`}
        description={`تُقفل ${isolate(lines.length)} أسطر ولا تُعدَّل بعد الإرسال.${withDifference.length > 0 ? ` ${isolate(withDifference.length)} منها فيها فرق عن المتوقع.` : ""}`}
        confirmLabel="إرسال للاعتماد"
        cancelLabel="تراجع"
        loading={submit?.loading}
        onConfirm={() => onConfirmSubmit?.()}
      />

      <ReasonDialog
        open={cancellation !== null}
        onOpenChange={(open) => (open ? undefined : onDismissCancel?.())}
        title={`إلغاء الجرد ${isolate(`#${data.id}`)}؟`}
        description="يُلغى الجرد قبل إرساله ولا تتولّد تسويات. تبقى الأسطر المعدودة في السجل."
        confirmLabel="إلغاء الجرد"
        cancelLabel="تراجع"
        reason={cancellation?.reason ?? ""}
        onReasonChange={(reason) => onCancelReasonChange?.(reason)}
        error={cancellation?.errorCode ? errorMessage(cancellation.errorCode) : undefined}
        danger
        loading={cancellation?.loading}
        onConfirm={() => onConfirmCancel?.()}
      />

      <ReasonDialog
        open={returning !== null}
        onOpenChange={(open) => (open ? undefined : onDismissReturn?.())}
        title={`إرجاع الجرد ${isolate(`#${data.id}`)} لإعادة العدّ؟`}
        description="يعود الجرد قيد العدّ. تبقى الأسطر الحالية في السجل ويُعدّ من جديد، ويصل السبب إلى من يعدّ."
        confirmLabel="إرجاع للعدّ"
        cancelLabel="تراجع"
        reason={returning?.reason ?? ""}
        onReasonChange={(reason) => onReturnReasonChange?.(reason)}
        error={returning?.errorCode ? errorMessage(returning.errorCode) : undefined}
        loading={returning?.loading}
        onConfirm={() => onConfirmReturn?.()}
      />
    </>
  );
}

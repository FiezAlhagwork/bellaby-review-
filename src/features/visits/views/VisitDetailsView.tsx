"use client";

import { BatchCell, StatusCell, TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { DecisionPanel, DecisionRecord } from "@/components/data/DecisionPanel";
import { DescriptionList } from "@/components/data/DescriptionList";
import { flagTypeLabels } from "@/components/data/flag-types";
import { itemTypeLabels } from "@/components/data/item-types";
import { MapPlaceholder, type MapPoint } from "@/components/data/MapPlaceholder";
import { StatusBadge } from "@/components/data/StatusBadge";
import { PageHeader } from "@/components/layout/PageHeader";
import { AttachmentList } from "@/components/ui/AttachmentList";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorState } from "@/components/ui/ErrorState";
import { NotFoundState } from "@/components/ui/NotFoundState";
import { ReasonDialog } from "@/components/ui/ReasonDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { errorMessage } from "@/lib/api/error-messages";
import type { Flag, GeoPoint, PhotoStatus, Visit, VisitItem } from "@/lib/api/types";
import { dayLabel } from "@/lib/calendar";
import { formatDateTime, isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

/** نافذة القرار المفتوحة: تأكيد بلا سبب (`ConfirmDialog`) أو رفض بسبب (`ReasonDialog`). */
export type VisitDecisionDialog = { kind: "confirm" | "reject"; reason: string; loading?: boolean; /** رمز خطأ العقد (validation_failed…). */ errorCode?: string };

type VisitDetailsViewProps = {
  /** `GET /visits/{id}`. خطأ `not_found` يعرض «غير موجود أو خارج نطاقك». */
  visit: Loadable<Visit>;
  /** `visits.decide` (المراقبة): تأكيد الزيارة المشكوك فيها أو رفضها. السوبرفايزر ومدير المكتب العلمي للقراءة فقط. */
  canDecide: boolean;
  /** نافذة القرار المفتوحة. null مغلقة. */
  decision?: VisitDecisionDialog | null;
  /** «تأكيد الزيارة» و«رفض الزيارة» في لوحة القرار: يفتحان نافذتهما. */
  onStartDecision?: (kind: "confirm" | "reject") => void;
  onReasonChange?: (reason: string) => void;
  /** تأكيد القرار من النافذة (التأكيد بلا سبب، والرفض بسبب غير فارغ). */
  onSubmitDecision?: () => void;
  onDismissDecision?: () => void;
  /** رمز خطأ `POST /decision` خارج النافذة (already_decided وغيره): شريط فوق اللوحة. */
  decisionError?: string;
  /** تنزيل صورة الزيارة. */
  onDownloadPhoto?: (id: string) => void;
  onBack?: () => void;
  onRetry?: () => void;
};

/** مستوى الاهتمام: العقد يعرّف القيم بلا نص عربي (§29.4). */
const interestLabels = { HIGH: "مرتفع", MEDIUM: "متوسط", LOW: "منخفض", NONE: "لا اهتمام" } as const satisfies Record<NonNullable<Visit["interest_level"]>, string>;

const photoStatusBadge: Record<PhotoStatus, { label: string; color: "success" | "warning" | "neutral" }> = {
  UPLOADED: { label: "مرفوعة", color: "success" },
  PENDING: { label: "معلّقة", color: "warning" },
  NONE: { label: "بلا صورة", color: "neutral" },
};

/** وقت القرار: آخر علامة أُغلقت (الزيارة لا تحمل `decided_at`: §29.6). */
function decidedAtOf(flags: readonly Flag[]): string | null {
  const closed = flags.flatMap((flag) => (flag.closed_at ? [flag.closed_at] : []));
  return closed.length > 0 ? closed.reduce((latest, at) => (Date.parse(at) > Date.parse(latest) ? at : latest)) : null;
}

type ItemRow = { key: string; kind: "SAMPLE" | "PROMO"; entry: VisitItem };

const itemColumns: DataTableColumn<ItemRow>[] = [
  { key: "item", header: "الصنف", cell: ({ entry }) => <TextCell value={entry.item?.name} />, priority: "high", role: "primary" },
  { key: "kind", header: "النوع", cell: ({ kind }) => <span>{itemTypeLabels[kind]}</span>, width: "w-32" },
  { key: "batch", header: "الدفعة", cell: ({ entry }) => <BatchCell batch={entry.batch} />, width: "w-72" },
  { key: "quantity", header: "الكمية", cell: ({ entry }) => <span dir="ltr">{entry.quantity ?? "—"}</span>, width: "w-24", align: "end", priority: "high" },
  { key: "after", header: "ملاحظة", cell: ({ entry }) => (entry.after_suspension ? <Badge color="warning">بعد إيقاف الدفعة</Badge> : <span className="text-fg-muted">—</span>), width: "w-44" },
];

function mapPoints(visit: Visit): MapPoint[] {
  const name = visit.visit_point?.name ?? "الجهة";
  const tone = (point: GeoPoint) => (point.is_mock ? ("danger" as const) : visit.verification_status === "FLAGGED" ? ("warning" as const) : ("default" as const));
  return [
    ...(visit.start_location ? [{ id: "start", lat: visit.start_location.lat, lng: visit.start_location.lng, kind: "start" as const, tone: tone(visit.start_location), label: `موقع بدء الزيارة · ${name}` }] : []),
    ...(visit.end_location ? [{ id: "end", lat: visit.end_location.lat, lng: visit.end_location.lng, kind: "end" as const, tone: tone(visit.end_location), label: `موقع إنهاء الزيارة · ${name}` }] : []),
  ];
}

/** دقة القراءة بالمتر. */
const accuracy = (point: GeoPoint | null | undefined) => (point ? `${isolate(Math.round(point.accuracy_m))} م` : null);

/**
 * تفاصيل الزيارة (S06): حقولها، وما وُزِّع فيها، وصورتها وحالة رفعها، وموقعا البدء والإنهاء على خريطة صغيرة مع المسافة ونطاق التحقق المستعمل،
 * وحالة التحقق وعلاماتها. للمراقبة قرار على المشكوك فيها: «تأكيد الزيارة» (تُغلق علاماتها بلا مشكلة) أو «رفض الزيارة» (علاماتها مؤكَّدة وتُستبعد من المؤشرات) (القرار 4).
 * السوبرفايزر ومدير المكتب العلمي للقراءة.
 */
export function VisitDetailsView({
  visit,
  canDecide,
  decision = null,
  onStartDecision,
  onReasonChange,
  onSubmitDecision,
  onDismissDecision,
  decisionError,
  onDownloadPhoto,
  onBack,
  onRetry,
}: VisitDetailsViewProps) {
  if (visit.status === "loading") {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <div className="flex flex-col gap-2 pb-4">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-44 w-full" />
      </div>
    );
  }

  if (visit.status === "error") {
    return visit.code === "not_found" ? <NotFoundState onBack={onBack} /> : <ErrorState code={visit.code} onRetry={onRetry} />;
  }

  const data = visit.data;
  const flags = data.flags ?? [];
  const items: ItemRow[] = [
    ...(data.samples ?? []).map((entry, index): ItemRow => ({ key: `s${index}`, kind: "SAMPLE", entry })),
    ...(data.promo_materials ?? []).map((entry, index): ItemRow => ({ key: `p${index}`, kind: "PROMO", entry })),
  ];
  const flagged = data.verification_status === "FLAGGED";
  const decidedAt = decidedAtOf(flags);
  const decided = (data.verification_status === "CONFIRMED" || data.verification_status === "REJECTED") && data.decided_by;
  const outOfRange = data.distance_m !== null && data.distance_m !== undefined && data.range_m_used !== undefined && data.distance_m > data.range_m_used;
  const mocked = Boolean(data.start_location?.is_mock || data.end_location?.is_mock);
  const photoStatus = data.photo_status ?? "NONE";

  const decisionSummary = (
    <>
      <p className="text-body text-fg">{`زيارة ${data.rep?.name ?? "—"} إلى ${data.visit_point?.name ?? "—"} مشكوك فيها.`}</p>
      <p className="text-label text-fg-muted">{flags.map((flag) => (flag.type ? flagTypeLabels[flag.type] : "—")).join(" · ")}</p>
    </>
  );

  return (
    <>
      <PageHeader
        title={`زيارة ${data.visit_point?.name ?? "—"}`}
        badge={data.verification_status ? <StatusBadge entity="visitVerification" status={data.verification_status} /> : undefined}
        description={`${data.rep?.name ?? "—"}${data.started_at ? ` · ${formatDateTime(data.started_at)}` : ""}`}
      />

      <div className="flex flex-col gap-4">
        {decisionError ? (
          <Banner kind={decisionError === "already_decided" ? "warning" : "danger"} title={decisionError === "already_decided" ? "قرّر غيرك قبلك" : "تعذّر حفظ القرار"}>
            {errorMessage(decisionError)}
          </Banner>
        ) : null}

        {flagged && canDecide ? (
          <DecisionPanel
            summary={decisionSummary}
            approveLabel="تأكيد الزيارة"
            rejectLabel="رفض الزيارة"
            onApprove={() => onStartDecision?.("confirm")}
            onReject={() => onStartDecision?.("reject")}
          />
        ) : null}

        {flagged && !canDecide ? (
          <Banner kind="warning" title="مشكوك فيها وبانتظار المراقبة">
            تراجعها المراقبة وتقرر بتأكيدها أو رفضها. لا تحتاج منك إجراءً.
          </Banner>
        ) : null}

        {decided && data.decided_by && decidedAt ? (
          <DecisionRecord
            badge={data.verification_status ? <StatusBadge entity="visitVerification" status={data.verification_status} /> : null}
            decidedBy={data.decided_by.name ?? "—"}
            decidedAt={decidedAt}
            reason={data.decision_reason ?? undefined}
          />
        ) : null}

        {decided && data.verification_status === "REJECTED" ? (
          <Banner kind="neutral" title="مستبعدة من المؤشرات">
            رُفضت هذه الزيارة فلا تُحسب في مؤشرات المندوب ولا في تقريره اليومي.
          </Banner>
        ) : null}

        <Card title="بيانات الزيارة">
          <DescriptionList
            items={[
              { label: "الجهة", value: [data.visit_point?.name, data.visit_point?.type, data.visit_point?.specialty].filter(Boolean).join(" · ") },
              { label: "المندوب", value: data.rep?.name },
              { label: "الحالة", value: data.status ? <StatusBadge entity="visit" status={data.status} /> : null },
              { label: "بدأت", value: data.started_at ? formatDateTime(data.started_at) : null },
              { label: "انتهت", value: data.ended_at ? formatDateTime(data.ended_at) : data.status === "IN_PROGRESS" ? "جارية الآن" : null },
              { label: "المدة", value: data.duration_minutes === null || data.duration_minutes === undefined ? null : `${isolate(data.duration_minutes)} دقيقة` },
              { label: "الإنهاء", value: data.end_source ? (data.end_source === "AUTO" ? "آلي من الخادم" : "يدوي من الجهاز") : null },
              { label: "اللقاء", value: data.met ? <Badge color="success">التُقي</Badge> : <Badge color="neutral">لم يُلتقَ</Badge> },
              { label: "سبب عدم اللقاء", value: data.not_met_reason?.name },
              { label: "من قابله", value: data.met_person },
              { label: "الغرض", value: data.purpose?.name },
              { label: "مستوى الاهتمام", value: data.interest_level ? interestLabels[data.interest_level] : null },
              { label: "المنتجات المناقشة", value: (data.discussed_items ?? []).length > 0 ? (data.discussed_items ?? []).map((item) => item.name).join("، ") : null },
              { label: "النتيجة", value: data.outcome?.name ?? data.custom_outcome },
              { label: "الاعتراضات", value: data.objections },
              { label: "تاريخ المتابعة", value: data.follow_up_date ? dayLabel(data.follow_up_date) : null },
              { label: "الإجراء التالي", value: data.next_action },
              { label: "ملاحظات", value: data.notes },
              { label: "استُلمت في الخادم", value: data.received_at ? formatDateTime(data.received_at) : null },
            ]}
          />
        </Card>

        <Card title="ما وُزِّع">
          <DataTable label="العينات والمواد الدعائية الموزَّعة" columns={itemColumns} rows={items} getRowKey={(row) => row.key} empty={<p className="py-8 text-center text-body text-fg-muted">لم يُوزَّع شيء في هذه الزيارة.</p>} />
        </Card>

        <Card title="الصورة" action={<Badge color={photoStatusBadge[photoStatus].color}>{photoStatusBadge[photoStatus].label}</Badge>}>
          {photoStatus === "PENDING" ? (
            <Banner kind="info" title="الصورة لم تُرفع بعد">
              تُرفع من جهاز المندوب عند توفّر الاتصال، وتظهر هنا حين تصل.
            </Banner>
          ) : null}
          {(data.photos ?? []).length > 0 ? (
            <AttachmentList
              attachments={(data.photos ?? []).map((photo, index) => ({ id: photo.upload_id ?? String(index), name: photo.name ?? "صورة الزيارة" }))}
              onDownload={(id) => onDownloadPhoto?.(id)}
            />
          ) : photoStatus === "NONE" ? (
            <p className="text-body text-fg-muted">لا صورة لهذه الزيارة.</p>
          ) : null}
        </Card>

        <Card title="الموقع والتحقق">
          {mocked ? (
            <Banner kind="danger" title="قراءة موقع مزوَّرة">
              كشف الجهاز أن قراءة الموقع صدرت من تطبيق تزوير موقع.
            </Banner>
          ) : null}
          <MapPlaceholder points={mapPoints(data)} aria-label="موقعا بدء الزيارة وإنهائها" compact />
          <DescriptionList
            items={[
              { label: "المسافة عن الجهة", value: data.distance_m === null || data.distance_m === undefined ? null : `${isolate(Math.round(data.distance_m))} م` },
              { label: "نطاق التحقق المستعمل", value: data.range_m_used === undefined ? null : `${isolate(data.range_m_used)} م` },
              { label: "النتيجة", value: data.distance_m === null || data.distance_m === undefined ? null : outOfRange ? <Badge color="warning">خارج النطاق</Badge> : <Badge color="success">داخل النطاق</Badge> },
              { label: "حالة التحقق", value: data.verification_status ? <StatusCell entity="visitVerification" status={data.verification_status} /> : null },
              { label: "دقة قراءة البدء", value: accuracy(data.start_location) },
              { label: "دقة قراءة الإنهاء", value: accuracy(data.end_location) },
            ]}
          />
        </Card>

        <Card title="العلامات">
          {flags.length === 0 ? (
            <p className="text-body text-fg-muted">لا علامات على هذه الزيارة.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {flags.map((flag) => (
                <li key={flag.id} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-body font-medium text-fg">{flag.type ? flagTypeLabels[flag.type] : "—"}</span>
                    {flag.status ? <StatusCell entity="flag" status={flag.status} /> : null}
                  </div>
                  <p className="text-label text-fg-muted">
                    {`أُنشئت ${flag.created_at ? formatDateTime(flag.created_at) : "—"}`}
                    {flag.closed_at ? ` · أُغلقت ${formatDateTime(flag.closed_at)}${flag.closed_by?.name ? ` بواسطة ${flag.closed_by.name}` : ""}` : ""}
                  </p>
                  {flag.note ? <p className="text-body text-fg">{flag.note}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={decision?.kind === "confirm"}
        onOpenChange={(open) => (open ? undefined : onDismissDecision?.())}
        title="تأكيد الزيارة؟"
        description="تُغلق علاماتها بلا مشكلة وتبقى الزيارة محسوبة في مؤشرات المندوب."
        confirmLabel="تأكيد الزيارة"
        cancelLabel="تراجع"
        loading={decision?.loading}
        onConfirm={() => onSubmitDecision?.()}
      />

      <ReasonDialog
        open={decision?.kind === "reject"}
        onOpenChange={(open) => (open ? undefined : onDismissDecision?.())}
        title="رفض الزيارة؟"
        description="تُسجَّل علاماتها مشكلة مؤكَّدة وتُستبعد الزيارة من مؤشرات المندوب. لا يُلغى القرار."
        confirmLabel="رفض الزيارة"
        cancelLabel="تراجع"
        reason={decision?.kind === "reject" ? decision.reason : ""}
        onReasonChange={(reason) => onReasonChange?.(reason)}
        error={decision?.errorCode ? errorMessage(decision.errorCode) : undefined}
        danger
        loading={decision?.loading}
        onConfirm={() => onSubmitDecision?.()}
      />
    </>
  );
}

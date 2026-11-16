"use client";

import { DescriptionList } from "@/components/data/DescriptionList";
import { Grid } from "@/components/layout/Grid";
import { PageHeader } from "@/components/layout/PageHeader";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorState } from "@/components/ui/ErrorState";
import { Field } from "@/components/ui/Field";
import { NotFoundState } from "@/components/ui/NotFoundState";
import { RadioCard, RadioGroup } from "@/components/ui/Radio";
import { Skeleton } from "@/components/ui/Skeleton";
import { errorMessage } from "@/lib/api/error-messages";
import type { GeoPoint, VisitPoint } from "@/lib/api/types";
import { formatDateTime, formatPhone, isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

/**
 * جهة في المقارنة: الجهة نفسها، وعدد زياراتها، والعميل المربوط باسمه.
 * `visitsCount` وبيانات العميل ليست في `VisitPoint` (فيه `customer_id` فقط): تُجلب وتُركَّب في الحاوية (docs/backend-requests.md §34.2).
 */
export type PointCompare = { point: VisitPoint; visitsCount: number; customer: { id: number; name: string } | null };

/** نافذة التأكيد المفتوحة: دمج (`POST /visit-points/merge`) أو «ليستا مكررتين» (`CLEARED` على العلامة). */
export type MergeDialog = { kind: "merge" | "not-duplicate"; loading?: boolean };

type MergePointsViewProps = {
  /** الجهتان المكررتان (الأولى المضافة حديثاً، والثانية الأقدم في العادة). `not_found` يعرض «غير موجود أو خارج نطاقك». */
  pair: Loadable<{ first: PointCompare; second: PointCompare }>;
  /** `visit_points.merge`: يدمج أو يقرّر أنهما غير مكررتين. */
  canMerge: boolean;
  /** معرّف الجهة الباقية المختارة (`keep_id`). null: لم تُختر. */
  keepId: number | null;
  onKeepChange?: (id: number) => void;
  dialog?: MergeDialog | null;
  /** «دمج» و«ليستا مكررتين»: يفتحان نافذة التأكيد. */
  onStartDialog?: (kind: "merge" | "not-duplicate") => void;
  onConfirm?: () => void;
  onDismissDialog?: () => void;
  /** رمز خطأ العقد (not_found وvalidation_failed…): شريط فوق الاختيار. */
  error?: string;
  /** بعد النجاح: دُمجتا أو أُغلقت العلامة بـ«ليستا مكررتين». تختفي الأزرار ويظهر شريط النتيجة. */
  done?: "merged" | "not-duplicate" | null;
  onBack?: () => void;
  onRetry?: () => void;
};

const EARTH_RADIUS_M = 6_371_000;

/** المسافة بين نقطتين بالمتر (هافرساين): للعرض وحده لتقدير التكرار. */
function distanceMeters(a: GeoPoint, b: GeoPoint): number {
  const rad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

function PointCard({ side, kept }: { side: PointCompare; kept: boolean | null }) {
  const { point } = side;
  return (
    <Card title={point.name ?? "—"} action={kept === null ? undefined : kept ? <span className="text-label font-medium text-success">الباقية</span> : <span className="text-label text-danger">تُعطَّل</span>}>
      <DescriptionList
        items={[
          { label: "النوع", value: [point.type?.name, point.specialty?.name].filter(Boolean).join(" · ") },
          { label: "الحالة", value: point.review_state === "ACCEPTED" ? "مقبولة" : point.review_state === "REJECTED" ? "مرفوضة" : "بانتظار المراجعة" },
          { label: "المحافظة", value: point.governorate?.name },
          { label: "العنوان", value: point.address },
          { label: "الهاتف", value: point.phone ? <span dir="ltr">{formatPhone(point.phone)}</span> : null },
          { label: "الموقع", value: point.location ? <span dir="ltr">{`${point.location.lat.toFixed(5)}, ${point.location.lng.toFixed(5)}`}</span> : null },
          { label: "أضافها", value: point.created_by?.name },
          { label: "تاريخ الإضافة", value: point.created_at ? formatDateTime(point.created_at) : null },
          { label: "الزيارات", value: isolate(side.visitsCount) },
          { label: "آخر زيارة", value: point.last_visit_at ? formatDateTime(point.last_visit_at) : null },
          { label: "العميل المربوط", value: side.customer ? side.customer.name : null },
        ]}
      />
    </Card>
  );
}

/**
 * دمج جهتين (S11): الجهتان جنباً إلى جنب (الاسم والموقع والزيارات والعميل المربوط)، واختيار الجهة الباقية، وزر «دمج».
 * الدمج ينقل زيارات الأخرى وربط العميل إلى الباقية ويعطّل الأخرى في معاملة واحدة. «ليستا مكررتين» يغلق العلامة بلا مشكلة (القرار 4).
 */
export function MergePointsView({ pair, canMerge, keepId, onKeepChange, dialog = null, onStartDialog, onConfirm, onDismissDialog, error, done = null, onBack, onRetry }: MergePointsViewProps) {
  if (pair.status === "loading") {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <div className="flex flex-col gap-2 pb-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>
        <Skeleton className="h-24 w-full" />
        <Grid cols={{ base: 1, desktop: 2 }} gap={4}>
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </Grid>
      </div>
    );
  }

  if (pair.status === "error") {
    return pair.code === "not_found" ? <NotFoundState onBack={onBack} /> : <ErrorState code={pair.code} onRetry={onRetry} />;
  }

  const { first, second } = pair.data;
  const distance = first.point.location && second.point.location ? Math.round(distanceMeters(first.point.location, second.point.location)) : null;
  const keep = keepId === first.point.id ? first : keepId === second.point.id ? second : null;
  const drop = keep === first ? second : keep === second ? first : null;

  return (
    <>
      <PageHeader title="دمج جهتين" description="اختر الجهة الباقية: تنتقل إليها زيارات الأخرى وربط عميلها وتُعطَّل الأخرى." />

      <div className="flex flex-col gap-4">
        {error ? (
          <Banner kind="danger" title="تعذّر الحفظ">
            {errorMessage(error)}
          </Banner>
        ) : null}

        {done === "merged" ? (
          <Banner kind="success" title="تم الدمج">
            {keep && drop ? `انتقلت زيارات «${drop.point.name}» وربط عميلها إلى «${keep.point.name}» وعُطّلت «${drop.point.name}». أُغلقت علامة التكرار.` : "دُمجت الجهتان وأُغلقت علامة التكرار."}
          </Banner>
        ) : null}

        {done === "not-duplicate" ? (
          <Banner kind="success" title="أُغلقت العلامة">
            قُرّر أن الجهتين ليستا مكررتين وأُغلقت العلامة بلا مشكلة. تبقى الجهتان فعّالتين.
          </Banner>
        ) : null}

        <Banner kind="warning" title="جهتان يُشتبه بتكرارهما">
          {distance === null ? "اسمان متقاربان." : `اسمان متقاربان وموقعاهما على بعد ${isolate(distance)} م.`}
        </Banner>

        <Grid cols={{ base: 1, desktop: 2 }} gap={4}>
          <PointCard side={first} kept={keep ? keep === first : null} />
          <PointCard side={second} kept={keep ? keep === second : null} />
        </Grid>

        <Card title="الجهة الباقية">
          <Field label="أيّ الجهتين تبقى؟" required>
            <RadioGroup aria-label="الجهة الباقية" value={keepId === null ? null : String(keepId)} onValueChange={(value) => onKeepChange?.(Number(value))} disabled={!canMerge || done !== null}>
              {[first, second].map((side) => (
                <RadioCard key={side.point.id} value={String(side.point.id)} title={side.point.name ?? "—"} description={`${isolate(side.visitsCount)} زيارة${side.customer ? ` · عميل: ${side.customer.name}` : " · بلا عميل مربوط"}`} />
              ))}
            </RadioGroup>
          </Field>

          {keep && drop && !done ? <Banner kind="info">{`تنتقل زيارات «${drop.point.name}» (${isolate(drop.visitsCount)}) وربط عميلها إلى «${keep.point.name}»، وتُعطَّل «${drop.point.name}».`}</Banner> : null}

          {done ? null : (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="primary" size="lg" disabled={!canMerge || keepId === null} onClick={() => onStartDialog?.("merge")}>
                دمج
              </Button>
              <Button variant="secondary" size="lg" disabled={!canMerge} onClick={() => onStartDialog?.("not-duplicate")}>
                ليستا مكررتين
              </Button>
            </div>
            {canMerge ? (
              keepId === null ? (
                <p className="text-label text-fg-muted">اختر الجهة الباقية لتفعيل «دمج».</p>
              ) : null
            ) : (
              <p className="text-label text-fg-muted">الدمج للمراقبة.</p>
            )}
          </div>
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={dialog?.kind === "merge"}
        onOpenChange={(open) => (open ? undefined : onDismissDialog?.())}
        title="دمج الجهتين؟"
        description={keep && drop ? `تنتقل الزيارات وربط العميل إلى «${keep.point.name}»، وتُعطَّل «${drop.point.name}». لا رجوع عن الدمج.` : "تنتقل الزيارات وربط العميل، وتُعطَّل الأخرى. لا رجوع عن الدمج."}
        confirmLabel="دمج"
        cancelLabel="تراجع"
        danger
        loading={dialog?.loading}
        onConfirm={() => onConfirm?.()}
      />

      <ConfirmDialog
        open={dialog?.kind === "not-duplicate"}
        onOpenChange={(open) => (open ? undefined : onDismissDialog?.())}
        title="ليستا مكررتين؟"
        description="تُغلق العلامة بلا مشكلة وتبقى الجهتان فعّالتين كما هما."
        confirmLabel="ليستا مكررتين"
        cancelLabel="تراجع"
        loading={dialog?.loading}
        onConfirm={() => onConfirm?.()}
      />
    </>
  );
}

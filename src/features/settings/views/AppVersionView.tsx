"use client";

import { DescriptionList } from "@/components/data/DescriptionList";
import { Grid } from "@/components/layout/Grid";
import { PageHeader } from "@/components/layout/PageHeader";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import type { AppVersionSettings } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";

/** مسودة `PUT /settings/app-version`. */
export type AppVersionDraft = { min: string; latest: string; apkUrl: string };

type AppVersionViewProps = {
  version: Loadable<AppVersionSettings>;
  /** `app_versions.manage`. */
  canManage: boolean;
  draft: AppVersionDraft | null;
  onDraftChange: (draft: AppVersionDraft | null) => void;
  onSave?: () => void;
  saving?: boolean;
  /** `errors` من `validation_failed` (`min_app_version`، `latest_app_version`، `apk_url`). */
  errors?: Readonly<Record<string, string>>;
  onRetry?: () => void;
};

const SEMVER = /^\d+\.\d+\.\d+$/;
const URL_PATTERN = /^https:\/\/\S+$/;

/**
 * إصدارات التطبيق (I09): أدنى إصدار مقبول لتطبيق المندوب، وآخر إصدار، ورابط تنزيل APK.
 * من إصداره دون الأدنى يُطلب منه التحديث من الرابط قبل الدخول.
 */
export function AppVersionView({ version, canManage, draft, onDraftChange, onSave, saving = false, errors = {}, onRetry }: AppVersionViewProps) {
  const editing = draft !== null;
  const reason = !draft
    ? null
    : !SEMVER.test(draft.min.trim())
      ? "اكتب أدنى إصدار بصيغة 1.4.0."
      : draft.latest.trim() !== "" && !SEMVER.test(draft.latest.trim())
        ? "اكتب آخر إصدار بصيغة 1.4.2."
        : !URL_PATTERN.test(draft.apkUrl.trim())
          ? "اكتب رابط تنزيل يبدأ بـ https://."
          : null;

  return (
    <>
      <PageHeader
        title="إصدارات التطبيق"
        description="تطبيق المندوب يُنزَّل من رابط APK. من إصداره دون الأدنى يُطلب منه التحديث قبل الدخول."
        actions={canManage && !editing && version.status === "ready" ? [{ id: "edit", label: "تعديل", primary: true, onSelect: () => onDraftChange({ min: version.data.min_app_version ?? "", latest: version.data.latest_app_version ?? "", apkUrl: version.data.apk_url ?? "" }) }] : []}
      />

      {version.status === "loading" ? (
        <Skeleton className="h-48 w-full" />
      ) : version.status === "error" ? (
        <ErrorState code={version.code} onRetry={onRetry} />
      ) : (
        <div className="flex flex-col gap-4">
          {editing ? (
            <Banner kind="warning" title="رفع الأدنى يوقف الإصدارات الأقدم">
              كل مندوب إصداره دون الأدنى الجديد يُطلب منه التحديث قبل الدخول. تأكد أن الرابط يعمل أولاً.
            </Banner>
          ) : null}
          <Card title="تطبيق المندوب">
            {editing ? (
              <div className="flex flex-col gap-4">
                <Grid cols={{ base: 1, tablet: 2 }} gap={4}>
                  <Field label="أدنى إصدار مقبول" required error={errors.min_app_version}>
                    <Input dir="ltr" value={draft.min} onChange={(event) => onDraftChange({ ...draft, min: event.target.value })} placeholder="1.4.0" />
                  </Field>
                  <Field label="آخر إصدار" optional error={errors.latest_app_version}>
                    <Input dir="ltr" value={draft.latest} onChange={(event) => onDraftChange({ ...draft, latest: event.target.value })} placeholder="1.4.2" />
                  </Field>
                </Grid>
                <Field label="رابط التنزيل (APK)" required error={errors.apk_url}>
                  <Input dir="ltr" value={draft.apkUrl} onChange={(event) => onDraftChange({ ...draft, apkUrl: event.target.value })} placeholder="https://" />
                </Field>
                <div className="flex flex-wrap items-center justify-end gap-3">
                  {reason ? <p className="text-label text-fg-muted">{reason}</p> : null}
                  <Button variant="secondary" disabled={saving} onClick={() => onDraftChange(null)}>
                    إلغاء
                  </Button>
                  <Button variant="primary" loading={saving} disabled={reason !== null} onClick={onSave}>
                    حفظ
                  </Button>
                </div>
              </div>
            ) : (
              <DescriptionList
                items={[
                  { label: "أدنى إصدار مقبول", value: version.data.min_app_version ? <span dir="ltr">{version.data.min_app_version}</span> : null },
                  { label: "آخر إصدار", value: version.data.latest_app_version ? <span dir="ltr">{version.data.latest_app_version}</span> : null },
                  { label: "رابط التنزيل", value: version.data.apk_url ? <span dir="ltr" className="break-all">{version.data.apk_url}</span> : null },
                ]}
              />
            )}
          </Card>
        </div>
      )}
    </>
  );
}

"use client";

import { DescriptionList } from "@/components/data/DescriptionList";
import { Grid } from "@/components/layout/Grid";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { Field } from "@/components/ui/Field";
import { NumberInput } from "@/components/ui/NumberInput";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Settings } from "@/lib/api/types";
import { isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";
import { SettingsTabs, type SettingsSection } from "../components/SettingsTabs";

type Deadlines = NonNullable<Settings["report_deadline_work_days"]>;
type NumericKey = Exclude<{ [K in keyof Settings]-?: Settings[K] extends number | undefined ? K : never }[keyof Settings], undefined>;

/** حقل رقمي من `Settings`: مفتاح أعلى (`visit_range_m`) أو مهلة تقرير (`report_deadline_work_days.MONTHLY`). */
export type SettingKey = NumericKey | `report_deadline_work_days.${keyof Deadlines & string}`;

type SettingDef = { key: SettingKey; label: string; unit: string; min?: number };
type GroupDef = { id: "deadlines" | "verification" | "workday"; title: string; applies: string; note: string; fields: readonly SettingDef[] };

const groups: readonly GroupDef[] = [
  {
    id: "deadlines",
    title: "المهل والتنبيهات",
    applies: "تسري فوراً",
    note: "تُحسب بها التنبيهات والمهل من لحظة الحفظ.",
    fields: [
      { key: "transfer_unconfirmed_alert_hours", label: "تنبيه الصرف غير المؤكد بعد", unit: "ساعة", min: 1 },
      { key: "expiry_alert_days", label: "تنبيه قرب انتهاء الصلاحية قبل", unit: "يوماً", min: 1 },
      { key: "max_payment_term_days", label: "أقصى مهلة سداد للوكيل", unit: "يوماً", min: 1 },
      { key: "payment_alert_days_before", label: "تنبيه السداد قبل الاستحقاق", unit: "أيام", min: 0 },
      { key: "contract_alert_days", label: "تنبيه انتهاء العقود قبل", unit: "يوماً", min: 1 },
      { key: "flag_handling_work_hours", label: "مهلة معالجة البلاغ", unit: "ساعة عمل", min: 1 },
      { key: "report_deadline_work_days.MONTHLY", label: "مهلة التقرير الشهري", unit: "أيام عمل", min: 1 },
      { key: "report_deadline_work_days.QUARTERLY", label: "مهلة التقرير الفصلي", unit: "أيام عمل", min: 1 },
      { key: "report_deadline_work_days.ANNUAL", label: "مهلة التقرير السنوي", unit: "يوم عمل", min: 1 },
    ],
  },
  {
    id: "verification",
    title: "التحقق",
    applies: "على السجلات الجديدة وحدها",
    note: "الزيارات والجلسات المسجّلة قبل الحفظ تبقى على القيم السابقة.",
    fields: [
      { key: "visit_range_m", label: "نطاق الزيارة", unit: "متر", min: 1 },
      { key: "duplicate_visit_window_days", label: "فترة تكرار الزيارة", unit: "أيام", min: 0 },
      { key: "visit_auto_close_hours", label: "الإغلاق الآلي للزيارة بعد", unit: "ساعة", min: 1 },
      { key: "clock_skew_minutes", label: "فرق الساعة المسموح", unit: "دقائق", min: 0 },
    ],
  },
  {
    id: "workday",
    title: "الدوام",
    applies: "تسري فوراً",
    note: "يُحسب بها اليوم الكامل في تقرير الدوام.",
    fields: [{ key: "workday_hours", label: "ساعات اليوم", unit: "ساعات", min: 1 }],
  },
];

export const verificationKeys: readonly SettingKey[] = groups.find((group) => group.id === "verification")?.fields.map((field) => field.key) ?? [];

export function settingValue(settings: Settings, key: SettingKey): number | null {
  if (key.startsWith("report_deadline_work_days.")) {
    const period = key.slice("report_deadline_work_days.".length) as keyof Deadlines;
    return settings.report_deadline_work_days?.[period] ?? null;
  }
  return settings[key as NumericKey] ?? null;
}

/** المسودة: قيم الحقول أثناء التعديل (null = فارغ). */
export type SettingsDraft = Partial<Record<SettingKey, number | null>>;

/** مسودة التعديل من القيم الحالية. */
export const draftOf = (settings: Settings): SettingsDraft => Object.fromEntries(groups.flatMap((group) => group.fields.map((field) => [field.key, settingValue(settings, field.key)])));

type SettingsViewProps = {
  settings: Loadable<Settings>;
  /** `settings.manage`. */
  canManage: boolean;
  /** المسودة أثناء التعديل، وnull خارجه. */
  draft: SettingsDraft | null;
  onDraftChange: (draft: SettingsDraft | null) => void;
  onSave?: () => void;
  saving?: boolean;
  /** `errors` من `validation_failed` بمفتاح الحقل (`visit_range_m`، `report_deadline_work_days.MONTHLY`). */
  errors?: Readonly<Record<string, string>>;
  /** بعد حفظ غيّر قيمة تحقق: شريط «تسري على السجلات الجديدة وحدها». */
  verificationSaved?: boolean;
  onDismissNote?: () => void;
  onSectionChange?: (section: SettingsSection) => void;
  onRetry?: () => void;
};

/**
 * الإعدادات العامة (E13): المهل والتنبيهات، والتحقق، والدوام، وبجانب كل مجموعة متى يسري تعديلها (وصف `Settings` في العقد).
 * «تعديل الإعدادات» يحوّل القيم إلى حقول، و`PATCH /settings` يحفظها. المنطقة الزمنية للعرض فقط.
 */
export function SettingsView({ settings, canManage, draft, onDraftChange, onSave, saving = false, errors = {}, verificationSaved = false, onDismissNote, onSectionChange, onRetry }: SettingsViewProps) {
  const editing = draft !== null;
  const missing = editing && groups.some((group) => group.fields.some((field) => draft[field.key] === null));

  const startEdit = (data: Settings) => onDraftChange(draftOf(data));

  const header = (
    <PageHeader
      title="الإعدادات"
      description="القيم التي تحكم المهل والتنبيهات والتحقق والدوام في النظام كله."
      actions={canManage && !editing && settings.status === "ready" ? [{ id: "edit", label: "تعديل الإعدادات", primary: true, onSelect: () => startEdit(settings.data) }] : []}
    />
  );

  if (settings.status !== "ready") {
    return (
      <>
        {header}
        <div className="flex flex-col gap-4">
          <SettingsTabs active="general" onSelect={onSectionChange} />
          {settings.status === "loading" ? (
            <div className="flex flex-col gap-4" aria-busy="true">
              <Skeleton className="h-56 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : (
            <ErrorState code={settings.code} onRetry={onRetry} />
          )}
        </div>
      </>
    );
  }

  const data = settings.data;

  return (
    <>
      {header}
      <div className="flex flex-col gap-4">
        <SettingsTabs active="general" onSelect={onSectionChange} />

        {verificationSaved ? (
          <Banner kind="info" title="تسري على السجلات الجديدة وحدها" onClose={onDismissNote}>
            حُفظت إعدادات التحقق. الزيارات والجلسات المسجّلة قبل الحفظ تبقى على القيم السابقة، وما يُسجَّل من الآن يُحسب بالجديدة.
          </Banner>
        ) : null}

        {groups.map((group) => (
          <Card key={group.id} title={group.title} action={<Badge color={group.id === "verification" ? "warning" : "neutral"}>{group.applies}</Badge>}>
            <div className="flex flex-col gap-4">
              <p className="text-label text-fg-muted">{group.note}</p>
              {editing ? (
                <Grid cols={{ base: 1, tablet: 2, desktop: 3 }} gap={4}>
                  {group.fields.map((field) => (
                    <Field key={field.key} label={field.label} error={errors[field.key] ?? (draft[field.key] === null ? "اكتب قيمة." : undefined)}>
                      <NumberInput
                        aria-label={field.label}
                        value={draft[field.key] ?? null}
                        onValueChange={(value) => onDraftChange({ ...draft, [field.key]: value })}
                        min={field.min}
                        unit={field.unit}
                        invalid={errors[field.key] !== undefined || draft[field.key] === null}
                        disabled={saving}
                      />
                    </Field>
                  ))}
                </Grid>
              ) : (
                <DescriptionList
                  items={[
                    ...group.fields.map((field) => {
                      const value = settingValue(data, field.key);
                      return { label: field.label, value: value === null ? null : `${isolate(value)} ${field.unit}` };
                    }),
                    ...(group.id === "workday" ? [{ label: "المنطقة الزمنية", value: data.timezone ? <span dir="ltr">{data.timezone}</span> : null }] : []),
                  ]}
                />
              )}
            </div>
          </Card>
        ))}

        {editing ? (
          <div className="flex flex-wrap items-center justify-end gap-3">
            {missing ? <p className="text-label text-fg-muted">أكمل الحقول الفارغة.</p> : null}
            <Button variant="secondary" disabled={saving} onClick={() => onDraftChange(null)}>
              إلغاء
            </Button>
            <Button variant="primary" loading={saving} disabled={missing} onClick={onSave}>
              حفظ الإعدادات
            </Button>
          </div>
        ) : null}
      </div>
    </>
  );
}

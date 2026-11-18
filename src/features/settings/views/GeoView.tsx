"use client";

import { regionClassLabels, regionClassOrder } from "@/components/data/list-keys";
import { Grid } from "@/components/layout/Grid";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { ErrorState } from "@/components/ui/ErrorState";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Radio, RadioGroup } from "@/components/ui/Radio";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import type { GeoTree, RegionClass } from "@/lib/api/types";
import { countPhrase } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";
import { SettingsTabs, type SettingsSection } from "../components/SettingsTabs";

/**
 * نافذة الهيكل: منطقة (`POST /geo/regions` أو `PATCH /geo/regions/{id}`: الاسم والتصنيف)،
 * أو محافظة (`POST /geo/governorates` أو `PATCH /geo/governorates/{id}`: الاسم والمنطقة، وتغيير المنطقة نقلٌ).
 */
export type GeoForm =
  | { kind: "region"; id: number | null; countryId: number; name: string; regionClass: RegionClass | null }
  | { kind: "governorate"; id: number | null; name: string; regionId: number | null; fromRegionId: number | null };

type GeoViewProps = {
  geo: Loadable<GeoTree>;
  /** `geo.manage`. */
  canManage: boolean;
  form: GeoForm | null;
  onFormChange: (form: GeoForm | null) => void;
  onSubmit?: () => void;
  submitting?: boolean;
  /** `errors` من `validation_failed` (`name`، `class`، `region_id`). */
  formErrors?: Readonly<Record<string, string>>;
  onSectionChange?: (section: SettingsSection) => void;
  onRetry?: () => void;
};

const classColor = { A: "success", B: "info", C: "warning", D: "neutral" } as const satisfies Record<RegionClass, "success" | "info" | "warning" | "neutral">;

/**
 * الهيكل الجغرافي (E17): الدول ← المناطق التشغيلية بتصنيفها (A–D) ← المحافظات.
 * إضافة منطقة وتعديلها، وإضافة محافظة وتعديلها أو نقلها لمنطقة أخرى. لا حذف في العقد.
 */
export function GeoView({ geo, canManage, form, onFormChange, onSubmit, submitting = false, formErrors = {}, onSectionChange, onRetry }: GeoViewProps) {
  const countries = geo.status === "ready" ? (geo.data.countries ?? []) : [];
  const regions = countries.flatMap((country) => (country.regions ?? []).map((region) => ({ ...region, countryName: country.name })));
  const firstCountry = countries[0]?.id;

  const formReason =
    form === null ? null : form.name.trim() === "" ? "اكتب الاسم." : form.kind === "region" && form.regionClass === null ? "اختر التصنيف." : form.kind === "governorate" && form.regionId === null ? "اختر المنطقة." : null;
  const moving = form?.kind === "governorate" && form.id !== null && form.fromRegionId !== form.regionId;

  const title = form === null ? "" : form.kind === "region" ? (form.id === null ? "إضافة منطقة" : "تعديل المنطقة") : form.id === null ? "إضافة محافظة" : "تعديل المحافظة أو نقلها";

  return (
    <>
      <PageHeader
        title="الإعدادات"
        description="الدول، والمناطق التشغيلية بتصنيفها، والمحافظات التابعة لكل منطقة."
        actions={
          canManage && geo.status === "ready"
            ? [
                { id: "governorate", label: "إضافة محافظة", onSelect: () => onFormChange({ kind: "governorate", id: null, name: "", regionId: null, fromRegionId: null }) },
                ...(firstCountry !== undefined ? [{ id: "region", label: "إضافة منطقة", primary: true, onSelect: () => onFormChange({ kind: "region", id: null, countryId: firstCountry, name: "", regionClass: null }) }] : []),
              ]
            : []
        }
      />

      <div className="flex flex-col gap-4">
        <SettingsTabs active="geo" onSelect={onSectionChange} />

        {geo.status === "loading" ? (
          <div className="flex flex-col gap-4" aria-busy="true">
            <Skeleton className="h-8 w-40" />
            <Grid cols={{ base: 1, tablet: 2, desktop: 3 }} gap={4}>
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </Grid>
          </div>
        ) : geo.status === "error" ? (
          <ErrorState code={geo.code} onRetry={onRetry} />
        ) : (
          countries.map((country) => (
            <Section key={country.id} title={country.name ?? ""} description={countPhrase(country.regions?.length ?? 0, ["منطقة تشغيلية", "منطقتان تشغيليتان", "مناطق تشغيلية"])}>
              <Grid cols={{ base: 1, tablet: 2, desktop: 3 }} gap={4}>
                {(country.regions ?? []).map((region) => (
                  <Card
                    key={region.id}
                    title={region.name ?? ""}
                    action={
                      <span className="flex items-center gap-2">
                        {region.class ? <Badge color={classColor[region.class]}>{`${region.class} · ${regionClassLabels[region.class]}`}</Badge> : null}
                        {canManage ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onFormChange({ kind: "region", id: region.id ?? null, countryId: country.id ?? 0, name: region.name ?? "", regionClass: region.class ?? null })}
                          >
                            تعديل
                          </Button>
                        ) : null}
                      </span>
                    }
                  >
                    <ul className="flex flex-col" aria-label={`محافظات ${region.name ?? ""}`}>
                      {(region.governorates ?? []).map((governorate) => (
                        <li key={governorate.id} className="flex min-h-10 items-center justify-between gap-2 border-b border-border last:border-b-0">
                          <span className="text-body text-fg">{governorate.name}</span>
                          {canManage ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onFormChange({ kind: "governorate", id: governorate.id ?? null, name: governorate.name ?? "", regionId: region.id ?? null, fromRegionId: region.id ?? null })}
                            >
                              تعديل
                            </Button>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </Card>
                ))}
              </Grid>
            </Section>
          ))
        )}
      </div>

      <Dialog
        open={form !== null}
        onOpenChange={(open) => {
          if (!open) onFormChange(null);
        }}
        dismissible={!submitting}
        size="sm"
        title={title}
        description={form?.kind === "region" ? "الاسم والتصنيف: استراتيجية أو نمو أو اختبار أو غير اقتصادية حالياً." : "المحافظة تتبع منطقة واحدة. تغيير المنطقة ينقلها."}
        actions={[
          <Button key="cancel" variant="secondary" disabled={submitting} onClick={() => onFormChange(null)}>
            إلغاء
          </Button>,
          <Button key="save" variant="primary" loading={submitting} disabled={formReason !== null} onClick={onSubmit}>
            {moving ? "نقل المحافظة" : "حفظ"}
          </Button>,
        ]}
      >
        {form ? (
          <div className="flex flex-col gap-4">
            <Field label={form.kind === "region" ? "اسم المنطقة" : "اسم المحافظة"} required error={formErrors.name}>
              <Input value={form.name} onChange={(event) => onFormChange({ ...form, name: event.target.value })} placeholder={form.kind === "region" ? "مثل: الشمالية" : "مثل: حلب"} />
            </Field>
            {form.kind === "region" ? (
              <Field label="التصنيف" required error={formErrors.class}>
                <RadioGroup aria-label="التصنيف" value={form.regionClass} onValueChange={(regionClass) => onFormChange({ ...form, regionClass })} disabled={submitting}>
                  {regionClassOrder.map((value) => (
                    <Radio key={value} value={value} label={`${value} · ${regionClassLabels[value]}`} />
                  ))}
                </RadioGroup>
              </Field>
            ) : (
              <Field label="المنطقة" required error={formErrors.region_id} hint={moving ? "ستُنقل المحافظة إلى هذه المنطقة." : undefined}>
                <Select
                  aria-label="المنطقة"
                  placeholder="اختر المنطقة"
                  options={regions.map((region) => ({ value: String(region.id), label: countries.length > 1 ? `${region.name} (${region.countryName})` : (region.name ?? "") }))}
                  value={form.regionId === null ? null : String(form.regionId)}
                  onValueChange={(value) => onFormChange({ ...form, regionId: Number(value) })}
                />
              </Field>
            )}
            {formReason ? <p className="text-label text-fg-muted">{formReason}</p> : null}
          </div>
        ) : null}
      </Dialog>
    </>
  );
}

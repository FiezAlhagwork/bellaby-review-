"use client";

import { UsersThree } from "@phosphor-icons/react";
import { TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { DescriptionList } from "@/components/data/DescriptionList";
import { Grid } from "@/components/layout/Grid";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { NumberInput } from "@/components/ui/NumberInput";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { errorMessage } from "@/lib/api/error-messages";
import type { ComparisonGroup, KpiWeightSet } from "@/lib/api/types";
import { monthLabel, type IsoMonth } from "@/lib/calendar";
import { countPhrase, isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";
import { SettingsTabs, type SettingsSection } from "../components/SettingsTabs";

/** وزن في المسودة: null = فارغ. */
export type WeightDraft = { kpi_key: string; label: string; weight: number | null };

/** نافذة معامل الوكيل لمجموعة: نص عشري (`agent_coefficient` رقم في العقد). */
export type CoefficientForm = { group: ComparisonGroup; value: string };

type KpiWeightsViewProps = {
  roles: readonly { key: string; name: string }[];
  roleKey: string;
  onRoleChange: (roleKey: string) => void;
  /** `GET /kpi-weights?role_key`: الأوزان السارية للدور. */
  weights: Loadable<KpiWeightSet>;
  /** أول شهر يسري فيه التعديل (الشهر التالي على الأقل). */
  nextMonth: IsoMonth;
  /** أوزان محفوظة تسري من شهر قادم: شريط «تسري من الشهر التالي». */
  scheduledMonth?: IsoMonth;
  /** `kpi.manage`. */
  canManage: boolean;
  draft: readonly WeightDraft[] | null;
  onDraftChange: (draft: readonly WeightDraft[] | null) => void;
  onSave?: () => void;
  saving?: boolean;
  /** رمز خطأ الحفظ، مثل `weights_must_total_100`. */
  weightsError?: string;
  /** `GET /comparison-groups`. */
  groups: Loadable<readonly ComparisonGroup[]>;
  /** أسماء الأدوار لـ `role_keys`. */
  roleNames: Readonly<Record<string, string>>;
  coefficientForm: CoefficientForm | null;
  onCoefficientFormChange: (form: CoefficientForm | null) => void;
  onSaveCoefficient?: () => void;
  coefficientError?: string;
  onSectionChange?: (section: SettingsSection) => void;
  onRetry?: () => void;
};

const COEFFICIENT_PATTERN = /^\d+(\.\d{1,2})?$/;

/**
 * الأوزان ومجموعات المقارنة (E16): أوزان المؤشرات لكل دور (المجموع 100%)، ومجموعات المقارنة ومعامل الوكيل.
 * كل تعديل يسري من الشهر التالي (`effective_month`)، والشهر الجاري يُحسب بالقيم السابقة.
 */
export function KpiWeightsView({
  roles,
  roleKey,
  onRoleChange,
  weights,
  nextMonth,
  scheduledMonth,
  canManage,
  draft,
  onDraftChange,
  onSave,
  saving = false,
  weightsError,
  groups,
  roleNames,
  coefficientForm,
  onCoefficientFormChange,
  onSaveCoefficient,
  coefficientError,
  onSectionChange,
  onRetry,
}: KpiWeightsViewProps) {
  const editing = draft !== null;
  // جمع أعداد صحيحة (نسب مئوية)، لا مبالغ.
  const total = draft?.reduce((sum, row) => sum + (row.weight ?? 0), 0) ?? 0;
  const hasEmpty = draft?.some((row) => row.weight === null) ?? false;
  const saveReason = !editing ? null : hasEmpty ? "أكمل الأوزان الفارغة." : total !== 100 ? `المجموع ${isolate(`${total}%`)}، ويجب أن يكون 100%.` : null;
  const roleName = roles.find((role) => role.key === roleKey)?.name ?? roleKey;

  const groupColumns: DataTableColumn<ComparisonGroup>[] = [
    { key: "name", header: "المجموعة", cell: (row) => <TextCell value={row.name} />, priority: "high", role: "primary" },
    { key: "roles", header: "الأدوار", cell: (row) => <TextCell value={(row.role_keys ?? []).map((key) => roleNames[key] ?? key).join("، ")} />, priority: "high" },
    { key: "members", header: "الأفراد", cell: (row) => <TextCell value={countPhrase(row.user_ids?.length ?? 0, ["موظف", "موظفان", "موظفين"])} />, width: "w-32" },
    { key: "coefficient", header: "معامل الوكيل", cell: (row) => <TextCell value={row.agent_coefficient !== undefined ? isolate(row.agent_coefficient) : null} />, width: "w-32", align: "end", priority: "high" },
    { key: "since", header: "يسري من", cell: (row) => <TextCell value={row.effective_month ? monthLabel(row.effective_month) : null} />, width: "w-40" },
  ];

  const coefficientReason = coefficientForm === null ? null : COEFFICIENT_PATTERN.test(coefficientForm.value.trim()) ? null : "اكتب رقماً مثل 1 أو 1.2.";

  return (
    <>
      <PageHeader
        title="الإعدادات"
        description="أوزان المؤشرات التي تُحسب بها النقاط، ومجموعات المقارنة التي يُختار منها موظف الشهر."
        actions={canManage && !editing && weights.status === "ready" ? [{ id: "edit", label: "تعديل الأوزان", primary: true, onSelect: () => onDraftChange(weights.data.weights?.map((row) => ({ kpi_key: row.kpi_key ?? "", label: row.label ?? "", weight: row.weight ?? null })) ?? []) }] : []}
      />

      <div className="flex flex-col gap-4">
        <SettingsTabs active="weights" onSelect={onSectionChange} />

        {scheduledMonth ? (
          <Banner kind="info" title={`تسري من ${monthLabel(scheduledMonth)}`}>
            حُفظت أوزان {roleName} الجديدة، وتسري من الشهر التالي. الشهر الجاري يُحسب بالأوزان السابقة.
          </Banner>
        ) : null}

        <div className="w-full max-w-64">
          <Field label="الدور">
            <Select aria-label="الدور" options={roles.map((role) => ({ value: role.key, label: role.name }))} value={roleKey} onValueChange={onRoleChange} disabled={editing} />
          </Field>
        </div>

        {weights.status === "loading" ? (
          <Skeleton className="h-64 w-full" />
        ) : weights.status === "error" ? (
          <ErrorState code={weights.code} onRetry={onRetry} />
        ) : (
          <Card
            title={`أوزان ${roleName}`}
            action={<Badge color="neutral">{weights.data.effective_month ? `سارية منذ ${monthLabel(weights.data.effective_month)}` : "سارية"}</Badge>}
          >
            {editing ? (
              <div className="flex flex-col gap-4">
                {weightsError ? (
                  <Banner kind="danger" title="تعذّر حفظ الأوزان">
                    {errorMessage(weightsError)}
                  </Banner>
                ) : null}
                <Grid cols={{ base: 1, tablet: 2, desktop: 3 }} gap={4}>
                  {draft.map((row) => (
                    <Field key={row.kpi_key} label={row.label}>
                      <NumberInput
                        aria-label={row.label}
                        value={row.weight}
                        onValueChange={(weight) => onDraftChange(draft.map((item) => (item.kpi_key === row.kpi_key ? { ...item, weight } : item)))}
                        min={0}
                        max={100}
                        unit="%"
                        invalid={row.weight === null}
                        disabled={saving}
                      />
                    </Field>
                  ))}
                </Grid>
                <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
                  <span className="text-body text-fg">المجموع</span>
                  <Badge color={total === 100 ? "success" : "danger"}>{`${isolate(total)}%`}</Badge>
                  <span className="text-label text-fg-muted">{`يسري التعديل من ${monthLabel(nextMonth)}.`}</span>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-3">
                  {saveReason ? <p className="text-label text-fg-muted">{saveReason}</p> : null}
                  <Button variant="secondary" disabled={saving} onClick={() => onDraftChange(null)}>
                    إلغاء
                  </Button>
                  <Button variant="primary" loading={saving} disabled={saveReason !== null} onClick={onSave}>
                    حفظ الأوزان
                  </Button>
                </div>
              </div>
            ) : (
              <DescriptionList items={(weights.data.weights ?? []).map((row) => ({ label: row.label ?? row.kpi_key ?? "", value: row.weight !== undefined ? `${isolate(row.weight)}%` : null }))} />
            )}
          </Card>
        )}

        <Section title="مجموعات المقارنة" description="يُقارن كل موظف بمن في مجموعته، ومعامل الوكيل لتقييس نقاطه. التعديل يسري من الشهر التالي.">
          <DataTable
            label="مجموعات المقارنة"
            columns={groupColumns}
            rows={groups.status === "ready" ? groups.data : []}
            getRowKey={(row) => row.id ?? ""}
            loading={groups.status === "loading"}
            error={groups.status === "error" ? { code: groups.code, onRetry } : undefined}
            empty={<EmptyState icon={UsersThree} title="لا مجموعات بعد" description="لم تُعرَّف مجموعات مقارنة." />}
            rowActions={canManage ? (row) => [{ id: "coefficient", label: "تعديل معامل الوكيل", onSelect: () => onCoefficientFormChange({ group: row, value: String(row.agent_coefficient ?? "") }) }] : undefined}
          />
        </Section>
      </div>

      <Dialog
        open={coefficientForm !== null}
        onOpenChange={(open) => {
          if (!open) onCoefficientFormChange(null);
        }}
        dismissible={!saving}
        size="sm"
        title="معامل الوكيل"
        description={`لمجموعة «${coefficientForm?.group.name ?? ""}». يسري من ${monthLabel(nextMonth)}.`}
        actions={[
          <Button key="cancel" variant="secondary" disabled={saving} onClick={() => onCoefficientFormChange(null)}>
            إلغاء
          </Button>,
          <Button key="save" variant="primary" loading={saving} disabled={coefficientReason !== null} onClick={onSaveCoefficient}>
            حفظ
          </Button>,
        ]}
      >
        {coefficientForm ? (
          <Field label="المعامل" required error={coefficientError} hint={coefficientReason ?? "معامل تقييس الوكيل، مثل 1 أو 1.2."}>
            <Input dir="ltr" inputMode="decimal" value={coefficientForm.value} onChange={(event) => onCoefficientFormChange({ ...coefficientForm, value: event.target.value })} />
          </Field>
        ) : null}
      </Dialog>
    </>
  );
}

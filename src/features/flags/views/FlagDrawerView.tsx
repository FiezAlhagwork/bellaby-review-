"use client";

import { StatusCell } from "@/components/data/cells";
import { DescriptionList, type DescriptionItem } from "@/components/data/DescriptionList";
import { flagRefLabels, flagTypeLabels } from "@/components/data/flag-types";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { ErrorState } from "@/components/ui/ErrorState";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { RadioCard, RadioGroup } from "@/components/ui/Radio";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { errorMessage } from "@/lib/api/error-messages";
import { flagDeadline } from "@/lib/deadline";
import { formatDateTime, isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";
import type { FlagRow } from "../deadline";

/** السجل المرتبط بالعلامة وصاحبه: تجلبه الحاوية من endpoint نوع السجل (`ref_type`) وتحوّله إلى حقول للعرض (docs/backend-requests.md §32.2). */
export type FlagLinkedRecord = { title: string; owner: string | null; items: readonly DescriptionItem[] };

/** نهايات المعالجة الثلاث في `POST /qa-flags/{id}/decision`. */
export type FlagOutcome = "CLEARED" | "CONFIRMED" | "ESCALATED";

/** مسودة القرار: النهاية (إلزامية)، والملاحظة، وعنوان ملف التحقيق عند التحويل (اختياري في العقد). */
export type FlagDecisionDraft = { outcome: FlagOutcome | null; note: string; investigationTitle: string };

export const emptyFlagDecisionDraft: FlagDecisionDraft = { outcome: null, note: "", investigationTitle: "" };

type FlagDrawerViewProps = {
  /** العلامة المفتوحة. null يغلق الدرج. */
  flag: FlagRow | null;
  /** السجل المرتبط (يُجلب بعد فتح الدرج). null: لا سجل يعرض. */
  linked: Loadable<FlagLinkedRecord | null>;
  /** `flags.decide`: يقرر. من دونه للقراءة. */
  canDecide: boolean;
  draft: FlagDecisionDraft;
  onDraftChange?: (draft: FlagDecisionDraft) => void;
  /** «حفظ القرار». */
  onSubmit?: () => void;
  deciding?: boolean;
  /** رمز خطأ `POST /qa-flags/{id}/decision` (already_decided وinvalid_status وvalidation_failed…). */
  decisionError?: string;
  /** الآن (ISO UTC): للمدة المتبقية. */
  now: string;
  /** يفتح السجل الذي تُعالَج منه العلامة (الزيارة S06، الجهات الجديدة S10، دمج الجهتين S11). */
  onOpenRoute?: () => void;
  /** يفتح ملف التحقيق (S15) للعلامة المحوّلة. */
  onOpenInvestigation?: (id: number) => void;
  onClose: () => void;
};

const NOTE_MAX = 2000;

const outcomes: { value: FlagOutcome; title: string; description: string }[] = [
  { value: "CLEARED", title: "لا مشكلة", description: "تُغلق العلامة: لا شيء يستدعي إجراءً." },
  { value: "CONFIRMED", title: "مشكلة مسجّلة", description: "تُسجَّل المشكلة وتبقى في سجل الشخص. لا عقوبة من المراقبة." },
  { value: "ESCALATED", title: "تحويل لتحقيق", description: "يُفتح ملف تحقيق سري بهذه العلامة مصدراً." },
];

/** من أين تُعالَج العلامة: علامات الزيارة من S06، والجهات الجديدة من S10، والمكررة من S11، وغيرها هنا. */
export function flagRoute(flag: FlagRow): { kind: "here" } | { kind: "elsewhere"; to: string; button: string; text: string } {
  if (flag.ref_type === "visit") return { kind: "elsewhere", to: "S06", button: "فتح الزيارة", text: "تُعالَج علامات الزيارة من تفاصيل الزيارة: بتأكيد الزيارة أو رفضها (يُغلق القرار العلامة)." };
  if (flag.type === "NEW_VISIT_POINT") return { kind: "elsewhere", to: "S10", button: "فتح «الجهات الجديدة»", text: "تُعالَج هذه العلامة بقبول الجهة أو رفضها من «الجهات الجديدة»." };
  if (flag.type === "DUPLICATE_POINT") return { kind: "elsewhere", to: "S11", button: "دمج الجهتين", text: "تُعالَج هذه العلامة بدمج الجهتين، أو بـ«ليستا مكررتين»." };
  return { kind: "here" };
}

/**
 * معالجة العلامة (S09): درج بنوعها وتفاصيلها والسجل المرتبط وصاحبه، ثم نهايات المعالجة الثلاث: «لا مشكلة» · «مشكلة مسجّلة» · «تحويل لتحقيق» وملاحظة.
 * المراقبة لا تملك عقوبة (القرار 4). العلامة المغلقة تُعرض بنهايتها ومن أغلقها ومتى، والمحوّلة برابط ملف التحقيق.
 */
export function FlagDrawerView({ flag, linked, canDecide, draft, onDraftChange, onSubmit, deciding = false, decisionError, now, onOpenRoute, onOpenInvestigation, onClose }: FlagDrawerViewProps) {
  const route = flag ? flagRoute(flag) : null;
  const open = flag?.status === "OPEN";
  const decidable = open && canDecide && route?.kind === "here";
  const deadline = flag && open ? flagDeadline(flag.due_at, now) : null;
  const subjectName = flag?.subject_user?.name ?? "—";

  return (
    <Drawer
      open={flag !== null}
      onOpenChange={(next) => (next ? undefined : onClose())}
      size="md"
      title={flag?.type ? flagTypeLabels[flag.type] : "علامة"}
      description={flag ? `${subjectName} · ${flag.ref_type ? `${flagRefLabels[flag.ref_type]} ${isolate(`#${flag.ref_id}`)}` : "—"}` : undefined}
      actions={
        decidable
          ? [
              <Button key="submit" variant="primary" loading={deciding} disabled={draft.outcome === null} onClick={onSubmit}>
                حفظ القرار
              </Button>,
            ]
          : undefined
      }
    >
      {flag ? (
        <div className="flex flex-col gap-6">
          <span className="flex flex-wrap items-center gap-2">{flag.status ? <StatusCell entity="flag" status={flag.status} /> : null}</span>

          {decisionError ? (
            <Banner kind={decisionError === "already_decided" ? "warning" : "danger"} title={decisionError === "already_decided" ? "قرّر غيرك قبلك" : "تعذّر حفظ القرار"}>
              {errorMessage(decisionError)}
            </Banner>
          ) : null}

          {deadline ? (
            deadline.late ? (
              <Banner kind="warning" title="تجاوزت المهلة">
                تجاوزت العلامة مهلة المعالجة (72 ساعة عمل).
              </Banner>
            ) : (
              <Banner kind={deadline.urgent ? "warning" : "info"}>{`${deadline.label} من مهلة المعالجة (72 ساعة عمل).`}</Banner>
            )
          ) : null}

          <DescriptionList
            items={[
              { label: "النوع", value: flag.type ? flagTypeLabels[flag.type] : null },
              { label: "الشخص", value: flag.subject_user?.name },
              { label: "السجل المرتبط", value: flag.ref_type ? `${flagRefLabels[flag.ref_type]} ${isolate(`#${flag.ref_id}`)}` : null },
              { label: "أُنشئت", value: flag.created_at ? formatDateTime(flag.created_at) : null },
            ]}
          />

          <section aria-label="السجل المرتبط" className="flex flex-col gap-3">
            <h3 className="text-h3 font-semibold text-fg">السجل المرتبط</h3>
            {linked.status === "loading" ? (
              <div aria-busy="true" className="flex flex-col gap-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-5 w-3/4" />
              </div>
            ) : linked.status === "error" ? (
              <ErrorState code={linked.code} />
            ) : linked.data ? (
              <>
                <p className="text-body text-fg">{linked.data.owner ? `${linked.data.title} · صاحبه ${linked.data.owner}` : linked.data.title}</p>
                <DescriptionList items={linked.data.items} />
              </>
            ) : (
              <p className="text-body text-fg-muted">يُفتح هذا السجل من شاشته.</p>
            )}
          </section>

          {route?.kind === "elsewhere" && open ? (
            <Banner kind="info" title="تُعالَج من شاشة أخرى">
              {route.text}
              <div className="pt-2">
                <Button variant="secondary" size="sm" onClick={onOpenRoute}>
                  {route.button}
                </Button>
              </div>
            </Banner>
          ) : null}

          {!open && flag.status === "AUTO_CLEARED" ? (
            <Banner kind="neutral" title="زال سببها">
              {`أُغلقت العلامة تلقائياً${flag.closed_at ? ` في ${formatDateTime(flag.closed_at)}` : ""} لأن سببها زال. لا قرار بشري عليها.`}
            </Banner>
          ) : null}

          {!open && flag.status !== "AUTO_CLEARED" ? (
            <section aria-label="القرار" className="flex flex-col gap-3 rounded-lg border border-border bg-surface-sunken p-4">
              <h3 className="text-h3 font-semibold text-fg">القرار</h3>
              <div className="flex flex-wrap items-center gap-2">{flag.status ? <StatusCell entity="flag" status={flag.status} /> : null}</div>
              <p className="text-body text-fg">{flag.closed_by?.name ?? "—"}</p>
              <p className="text-caption text-fg-muted">{flag.closed_at ? formatDateTime(flag.closed_at) : "—"}</p>
              {flag.handling_work_hours === null || flag.handling_work_hours === undefined ? null : <p className="text-label text-fg-muted">{`عولجت خلال ${isolate(flag.handling_work_hours)} ساعة عمل.`}</p>}
              {flag.note ? <blockquote className="rounded-md bg-surface px-3 py-2 text-body text-fg">{flag.note}</blockquote> : null}
              {flag.status === "ESCALATED" && flag.investigation_id ? (
                <div>
                  <Button variant="secondary" size="sm" onClick={() => onOpenInvestigation?.(flag.investigation_id ?? 0)}>
                    {`فتح ملف التحقيق ${isolate(`#${flag.investigation_id}`)}`}
                  </Button>
                </div>
              ) : null}
            </section>
          ) : null}

          {decidable ? (
            <section aria-label="معالجة العلامة" className="flex flex-col gap-4">
              <h3 className="text-h3 font-semibold text-fg">معالجة العلامة</h3>
              <Field label="النهاية" required>
                <RadioGroup aria-label="نهاية المعالجة" value={draft.outcome} onValueChange={(outcome) => onDraftChange?.({ ...draft, outcome })} disabled={deciding}>
                  {outcomes.map((outcome) => (
                    <RadioCard key={outcome.value} value={outcome.value} title={outcome.title} description={outcome.description} />
                  ))}
                </RadioGroup>
              </Field>
              {draft.outcome === "ESCALATED" ? (
                <Field label="عنوان ملف التحقيق" optional hint="يظهر عنواناً للملف. إن تُرك فارغاً يضعه الخادم.">
                  <Input aria-label="عنوان ملف التحقيق" value={draft.investigationTitle} onChange={(event) => onDraftChange?.({ ...draft, investigationTitle: event.target.value })} disabled={deciding} />
                </Field>
              ) : null}
              <Field label="ملاحظة" optional hint={`حتى ${isolate(NOTE_MAX)} حرفاً.`}>
                <Textarea aria-label="ملاحظة القرار" maxLength={NOTE_MAX} value={draft.note} onChange={(event) => onDraftChange?.({ ...draft, note: event.target.value })} disabled={deciding} />
              </Field>
              {draft.outcome === null ? <p className="text-label text-fg-muted">اختر نهاية المعالجة لتفعيل «حفظ القرار».</p> : null}
            </section>
          ) : null}

          {open && !canDecide && route?.kind === "here" ? <Banner kind="info">المعالجة للمراقبة. هذه العلامة للاطلاع.</Banner> : null}
        </div>
      ) : null}
    </Drawer>
  );
}

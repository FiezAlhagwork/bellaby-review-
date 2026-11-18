"use client";

import { DecisionPanel, DecisionRecord } from "@/components/data/DecisionPanel";
import { DescriptionList } from "@/components/data/DescriptionList";
import { StatusBadge } from "@/components/data/StatusBadge";
import { StockLine } from "@/components/data/StockLine";
import { customerReturnDecisionLabels, returnKindLabels, type CustomerReturnDecision, type ReturnKind } from "@/components/data/return-kinds";
import { responsibilityLabels } from "@/components/data/responsibility";
import { Banner } from "@/components/ui/Banner";
import { Drawer } from "@/components/ui/Drawer";
import { Field } from "@/components/ui/Field";
import type { Option } from "@/components/ui/OptionList";
import { Radio, RadioCard, RadioGroup } from "@/components/ui/Radio";
import { ReasonDialog } from "@/components/ui/ReasonDialog";
import { Select } from "@/components/ui/Select";
import { AttachmentList } from "@/components/ui/AttachmentList";
import { errorMessage } from "@/lib/api/error-messages";
import type { AgentReturn, ConflictDecided, CustomerReturn, DamageReport, Location, Responsibility, UserRef } from "@/lib/api/types";
import type { IsoDate } from "@/lib/calendar";
import { formatDateTime, formatQuantity, isolate } from "@/lib/format";

/** الطلب المفتوح للقرار: نوعه وكائن العقد كما جاء في قائمته (لا `GET` لعنصر واحد في العقد: docs/backend-requests.md §47.6). */
export type ReturnSelection =
  | { kind: "customer-return"; item: CustomerReturn }
  | { kind: "agent-damage" | "warehouse-damage"; item: DamageReport }
  | { kind: "agent-return"; item: AgentReturn };

/** نموذج القرار كما يُرسل إلى `…/{id}/decision`: القرار والمسؤولية (للمرتجع والتالف) والمستودع المستلِم (للإرجاع). السبب في نافذة الرفض. */
export type ReturnDecisionForm = {
  decision: CustomerReturnDecision | null;
  responsibility: Responsibility | null;
  toLocationId: string | null;
};

export const emptyReturnDecisionForm: ReturnDecisionForm = { decision: null, responsibility: null, toLocationId: null };

type ReturnDecisionDrawerProps = {
  selection: ReturnSelection | null;
  /** علم `returns.decide`. بدونه يرى الطلب بلا لوحة قرار. */
  canDecide: boolean;
  form: ReturnDecisionForm;
  onFormChange: (form: ReturnDecisionForm) => void;
  /** مستودعات الاستلام للإرجاع: `GET /locations?type=WAREHOUSE`. */
  warehouses: readonly Location[];
  /** نافذة سبب الرفض مفتوحة. */
  rejecting: boolean;
  rejectReason: string;
  onRejectReasonChange: (reason: string) => void;
  onStartReject: () => void;
  onRejectClose: () => void;
  onRejectConfirm: () => void;
  onApprove: () => void;
  /** القرار قيد الإرسال. */
  submitting?: boolean;
  /** رمز خطأ القرار (invalid_status، validation_failed…): شريط في الدرج. */
  decisionError?: string;
  /** 409 `already_decided`: قرّر غيرك أولاً (القرار 12). يحل سجله محل لوحة القرار. */
  conflict?: ConflictDecided | null;
  today: IsoDate;
  onClose: () => void;
};

/** الحقول المشتركة بين الأنواع، تُستخرج لاستعمال واحد في الرأس والسجل. */
function commonOf(selection: ReturnSelection) {
  const { item } = selection;
  const status = item.status ?? "PENDING";
  const decidedBy: UserRef | null | undefined = item.decided_by;
  return { status, decidedBy, decidedAt: item.decided_at, reason: item.decision_reason, onBehalf: Boolean(item.on_behalf_of) };
}

const statusBadgeOf = (selection: ReturnSelection, status: string) => {
  if (selection.kind === "customer-return") return <StatusBadge entity="customerReturn" status={status as NonNullable<CustomerReturn["status"]>} />;
  if (selection.kind === "agent-return") return <StatusBadge entity="agentReturn" status={status as NonNullable<AgentReturn["status"]>} />;
  return <StatusBadge entity="damageReport" status={status as NonNullable<DamageReport["status"]>} />;
};

const damageResponsibilities = ["WAREHOUSE", "MANUFACTURER", "OTHER"] as const satisfies readonly Responsibility[];
const returnResponsibilities = ["AGENT", "WAREHOUSE", "MANUFACTURER", "OTHER"] as const satisfies readonly Responsibility[];

const rejectCopy = {
  "customer-return": { title: "رفض المرتجع؟", description: "يُعاد الطلب للوكيل بسببك. لا تتغير الكميات.", label: "رفض المرتجع" },
  "agent-damage": { title: "رفض تقرير التالف؟", description: "يُعاد التقرير بسببك، ولا يُخصم شيء من الرصيد.", label: "رفض التقرير" },
  "warehouse-damage": { title: "رفض تقرير التالف؟", description: "يُعاد التقرير للوجستي بسببك، ولا يُخصم شيء من الرصيد.", label: "رفض التقرير" },
  "agent-return": { title: "رفض طلب الإرجاع؟", description: "يبقى الرصيد عند الوكيل ويُخبَر بسببك.", label: "رفض الإرجاع" },
} as const satisfies Record<ReturnKind, { title: string; description: string; label: string }>;

/**
 * درج قرار المرتجع والتالف (M08): الطلب بأسطره ومرفقاته وسببه، ولوحة القرار بحسب نوعه:
 * مرتجع الصيدلية (أُعيد للمخزون · تالف بمسؤوليته) · تالف الوكيل والمستودع (مقبول بمسؤوليته) · إرجاع الوكيل (اعتماد بمستودع الاستلام). والرفض بسبب إلزامي.
 * يقرر مدير المبيعات أو المدير التنفيذي والأسبق يسري (القرار 12)، فإن سبقك أحد يحل سجل قراره محل اللوحة. التفويض يشمل القرار.
 */
export function ReturnDecisionDrawer({
  selection,
  canDecide,
  form,
  onFormChange,
  warehouses,
  rejecting,
  rejectReason,
  onRejectReasonChange,
  onStartReject,
  onRejectClose,
  onRejectConfirm,
  onApprove,
  submitting = false,
  decisionError,
  conflict = null,
  today,
  onClose,
}: ReturnDecisionDrawerProps) {
  const common = selection ? commonOf(selection) : null;
  const pending = common?.status === "PENDING";
  const set = (patch: Partial<ReturnDecisionForm>) => onFormChange({ ...form, ...patch });

  const warehouseOptions: Option[] = warehouses.flatMap((location) => (location.id !== undefined && location.name ? [{ value: String(location.id), label: location.name }] : []));

  const lines =
    selection === null
      ? []
      : selection.kind === "customer-return"
        ? selection.item.delivery_line?.item
          ? [{ item: selection.item.delivery_line.item, batch: selection.item.delivery_line.batch, quantity: selection.item.quantity ?? 0 }]
          : []
        : (selection.item.lines ?? []).map((line) => ({ item: line.item ?? {}, batch: line.batch, quantity: line.quantity ?? 0 }));
  const total = lines.reduce((sum, line) => sum + line.quantity, 0);

  const heading = selection ? `${returnKindLabels[selection.kind]} ${isolate(`#${selection.item.id}`)}` : "طلب";
  const subheading =
    selection === null
      ? undefined
      : selection.kind === "customer-return"
        ? `${selection.item.customer?.name ?? "—"} · وكيله ${selection.item.agent?.name ?? "—"}`
        : selection.kind === "agent-return"
          ? `من ${selection.item.agent?.name ?? "—"}`
          : `${selection.item.location?.name ?? "—"} · رفعه ${selection.item.created_by?.name ?? "—"}`;

  // لوحة القرار: ما يُختار وما يعطّل «اعتماد» وسببه الظاهر.
  const panel = (() => {
    if (!selection) return null;
    const kind = selection.kind;
    if (kind === "customer-return") {
      const missingResponsibility = form.decision === "DAMAGED" && form.responsibility === null;
      return {
        approveLabel: "اعتماد القرار",
        disabled: form.decision === null || missingResponsibility,
        hint: form.decision === null ? "اختر القرار." : "اختر المسؤولية عن التلف.",
        body: (
          <div className="flex flex-col gap-4">
            <Field label="القرار" required>
              <RadioGroup aria-label="قرار المرتجع" value={form.decision} onValueChange={(decision) => set({ decision, responsibility: decision === "DAMAGED" ? form.responsibility : null })} disabled={submitting}>
                {(["RESTOCKED", "DAMAGED"] as const).map((value) => (
                  <RadioCard key={value} value={value} title={customerReturnDecisionLabels[value].title} description={customerReturnDecisionLabels[value].hint} />
                ))}
              </RadioGroup>
            </Field>
            {form.decision === "DAMAGED" ? (
              <Field label="المسؤولية" required hint="للعلم لا ذمة مالية.">
                <RadioGroup aria-label="المسؤولية عن التلف" value={form.responsibility} onValueChange={(responsibility) => set({ responsibility })} disabled={submitting}>
                  {returnResponsibilities.map((value) => (
                    <Radio key={value} value={value} label={responsibilityLabels[value]} />
                  ))}
                </RadioGroup>
              </Field>
            ) : null}
          </div>
        ),
      };
    }
    if (kind === "agent-damage" || kind === "warehouse-damage") {
      return {
        approveLabel: "قبول التالف",
        disabled: form.responsibility === null,
        hint: "اختر المسؤولية ليُقبل التالف.",
        body: (
          <Field label="مقبول بمسؤولية" required hint="للعلم لا ذمة مالية.">
            <RadioGroup aria-label="المسؤولية عن التالف" value={form.responsibility} onValueChange={(responsibility) => set({ responsibility })} disabled={submitting}>
              {damageResponsibilities.map((value) => (
                <Radio key={value} value={value} label={responsibilityLabels[value]} />
              ))}
            </RadioGroup>
          </Field>
        ),
      };
    }
    return {
      approveLabel: "اعتماد الإرجاع",
      disabled: false,
      hint: "",
      body: (
        <Field label="المستودع المستلِم" optional hint="يصير الإرجاع «بالطريق» إليه حتى يؤكد اللوجستي استلامه.">
          <Select aria-label="المستودع المستلِم" placeholder="المستودع الافتراضي" options={warehouseOptions} value={form.toLocationId} onValueChange={(toLocationId) => set({ toLocationId })} disabled={submitting} />
        </Field>
      ),
    };
  })();

  const record = (() => {
    if (!selection || !common) return null;
    if (conflict?.decided_by && conflict.decided_at) {
      return (
        <DecisionRecord
          badge={conflict.current_status ? statusBadgeOf(selection, conflict.current_status) : <span />}
          decidedBy={conflict.decided_by.name ?? "—"}
          decidedAt={conflict.decided_at}
        />
      );
    }
    if (!pending && common.decidedBy && common.decidedAt) {
      const responsibility = selection.kind === "agent-return" ? null : selection.item.responsibility;
      return (
        <DecisionRecord
          badge={statusBadgeOf(selection, common.status)}
          decidedBy={common.decidedBy.name ?? "—"}
          decidedAt={common.decidedAt}
          reason={common.reason ?? (responsibility ? `المسؤولية: ${responsibilityLabels[responsibility]}` : undefined)}
          onBehalf={common.onBehalf}
        />
      );
    }
    return null;
  })();

  return (
    <>
      <Drawer open={selection !== null} onOpenChange={(open) => (open ? undefined : onClose())} size="md" title={heading} description={subheading}>
        {selection && common ? (
          <div className="flex flex-col gap-4">
            <span className="flex flex-wrap items-center gap-2">{statusBadgeOf(selection, conflict?.current_status ?? common.status)}</span>

            {conflict ? (
              <Banner kind="warning" title="قرّر غيرك قبلك">
                {`${errorMessage("already_decided")} القرار الساري هو الأسبق (القرار 12).`}
              </Banner>
            ) : null}

            {decisionError ? (
              <Banner kind="danger" title="تعذّر تنفيذ القرار">
                {errorMessage(decisionError)}
              </Banner>
            ) : null}

            <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
              {lines.map((line, index) => (
                <StockLine key={`${line.batch?.id}-${index}`} item={line.item} batch={line.batch} quantity={line.quantity} today={today} />
              ))}
            </div>
            <p className="text-body text-fg-muted">{`المجموع: ${formatQuantity(total, "علبة")}`}</p>

            <DescriptionList
              items={
                selection.kind === "customer-return"
                  ? [
                      { label: "العميل", value: selection.item.customer?.name },
                      { label: "الوكيل", value: selection.item.agent?.name },
                      { label: "التسليم", value: selection.item.delivery_id ? isolate(`#${selection.item.delivery_id}`) : null },
                      { label: "السبب", value: selection.item.reason?.name },
                      { label: "ملاحظة", value: selection.item.note },
                      { label: "رفعه", value: selection.item.created_by?.name },
                      { label: "وقت الطلب", value: selection.item.created_at ? formatDateTime(selection.item.created_at) : null },
                    ]
                  : selection.kind === "agent-return"
                    ? [
                        { label: "الوكيل", value: selection.item.agent?.name },
                        { label: "السبب", value: selection.item.reason?.name },
                        { label: "ملاحظة", value: selection.item.note },
                        { label: "رفعه", value: selection.item.created_by ? `${selection.item.created_by.name}${selection.item.created_on_behalf_of_agent ? " (عن وكيل معطَّل)" : ""}` : null },
                        { label: "وقت الطلب", value: selection.item.created_at ? formatDateTime(selection.item.created_at) : null },
                      ]
                    : [
                        { label: "الموقع", value: selection.item.location?.name },
                        { label: "السبب", value: selection.item.reason?.name },
                        { label: "ملاحظة", value: selection.item.note },
                        { label: "رفعه", value: selection.item.created_by?.name },
                        { label: "وقت التقرير", value: selection.item.created_at ? formatDateTime(selection.item.created_at) : null },
                      ]
              }
            />

            {selection.kind === "agent-damage" || selection.kind === "warehouse-damage" ? (
              (selection.item.attachments ?? []).length > 0 ? (
                <AttachmentList
                  attachments={(selection.item.attachments ?? []).flatMap((file) => (file.upload_id && file.name ? [{ id: file.upload_id, name: file.name }] : []))}
                  onDownload={() => {}}
                />
              ) : null
            ) : null}

            {record ?? (pending && canDecide && panel ? (
              <DecisionPanel
                summary={selection.kind === "customer-return" ? "قرّر مصير المرتجع." : selection.kind === "agent-return" ? "اعتمد الإرجاع إلى المستودع أو ارفضه بسبب." : "اقبل التالف بمسؤوليته أو ارفضه بسبب."}
                approveLabel={panel.approveLabel}
                approveDisabled={panel.disabled}
                approveHint={panel.hint}
                approving={submitting}
                onApprove={onApprove}
                onReject={onStartReject}
              >
                {panel.body}
              </DecisionPanel>
            ) : pending ? (
              <DecisionPanel state="awaiting-other" summary="بانتظار القرار." waitingFor="القرار لمدير المبيعات أو المدير التنفيذي (الأسبق يسري)." onApprove={() => {}} onReject={() => {}} />
            ) : null)}
          </div>
        ) : null}
      </Drawer>

      <ReasonDialog
        open={rejecting && selection !== null}
        onOpenChange={(open) => (open ? undefined : onRejectClose())}
        title={selection ? rejectCopy[selection.kind].title : "رفض؟"}
        description={selection ? rejectCopy[selection.kind].description : ""}
        confirmLabel={selection ? rejectCopy[selection.kind].label : "رفض"}
        cancelLabel="تراجع"
        reason={rejectReason}
        onReasonChange={onRejectReasonChange}
        danger
        loading={submitting}
        onConfirm={onRejectConfirm}
      />
    </>
  );
}

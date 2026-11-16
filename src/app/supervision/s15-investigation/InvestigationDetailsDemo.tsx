"use client";

import { useState } from "react";
import { classificationLabels } from "@/components/data/classification";
import {
  emptyDecisionForm,
  emptyStageForm,
  emptySubmitForm,
  InvestigationDetailsView,
  type CloseDialog,
  type DecisionForm,
  type StageForm,
  type SubmitForm,
} from "@/features/investigations/views/InvestigationDetailsView";
import type { Investigation, Money } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { executive, findInvestigation, investigationDeductions, investigationsNow } from "@/mocks/investigations";
import { monitoringUser } from "@/mocks/supervision";

// غلاف تفاعلي لصفحة الرسم: يملك الملف ونماذج المراحل والرفع والقرار ونوافذها. «إكمال المرحلة» يضيف المرحلة (بملخصها ومرفقاتها) ويقدّم الملف مرحلة واحدة؛ «إغلاق: لا مخالفة» يغلقه بسببه؛
// «رفع للقرار» (المرحلة 7) ينقله إلى «بانتظار القرار»؛ وقرار المدير التنفيذي يقفله بسجل القرار. رفع الملفات يُحاكى بملفات «مرفوعة» فوراً.
// في الإنتاج تحلّ محلّه حاوية تجلب GET /investigations/{id} وترسل complete-stage وclose-no-violation وsubmit-for-decision وdecision. لا يُنقل للإنتاج.

type InvestigationDetailsDemoProps = {
  investigationId: number;
  /** المراقبة (investigations.manage). */
  canManage?: boolean;
  /** المدير التنفيذي (investigations.decide). */
  canDecide?: boolean;
  initialStageForm?: StageForm;
  initialSubmitForm?: SubmitForm;
  initialDecisionForm?: DecisionForm;
  /** نافذة «إغلاق: لا مخالفة» مفتوحة عند العرض. */
  initialCloseOpen?: boolean;
  /** تأكيد الرفع للقرار مفتوح عند العرض. */
  initialSubmitConfirming?: boolean;
  /** تأكيد إصدار القرار مفتوح عند العرض. */
  initialDecisionConfirming?: boolean;
  /** رمز خطأ الإجراء الظاهر عند العرض (invalid_status). */
  initialActionError?: string;
  /** حالة البيانات: جاهزة، أو تحميل، أو خطأ، أو غير موجود. */
  mode?: "ready" | "loading" | "error" | "not-found";
};

export function InvestigationDetailsDemo({
  investigationId,
  canManage = true,
  canDecide = false,
  initialStageForm = emptyStageForm,
  initialSubmitForm = emptySubmitForm,
  initialDecisionForm = emptyDecisionForm,
  initialCloseOpen = false,
  initialSubmitConfirming = false,
  initialDecisionConfirming = false,
  initialActionError,
  mode = "ready",
}: InvestigationDetailsDemoProps) {
  const [data, setData] = useState<Investigation>(() => findInvestigation(investigationId));
  const [stageForm, setStageForm] = useState(initialStageForm);
  const [submitForm, setSubmitForm] = useState(initialSubmitForm);
  const [decisionForm, setDecisionForm] = useState(initialDecisionForm);
  const [closeDialog, setCloseDialog] = useState<CloseDialog | null>(initialCloseOpen ? { reason: "" } : null);
  const [submitConfirming, setSubmitConfirming] = useState(initialSubmitConfirming);
  const [decisionConfirming, setDecisionConfirming] = useState(initialDecisionConfirming);
  const [actionError, setActionError] = useState(initialActionError);
  const [deduction, setDeduction] = useState<{ amount: Money; reason: string } | null>(investigationDeductions[investigationId] ?? null);

  const loadable: Loadable<Investigation> =
    mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : mode === "not-found" ? { status: "error", code: "not_found" } : { status: "ready", data };

  const stageNumber = (data.stages ?? []).length + 1;

  const completeStage = () => {
    const attachments = stageForm.attachments.filter((file) => file.status === "done").map((file) => ({ upload_id: file.id, url: "#", name: file.name, mime: "application/octet-stream" }));
    const next = stageNumber + 1;
    setData({
      ...data,
      status: `STAGE_${next}` as NonNullable<Investigation["status"]>,
      stages: [...(data.stages ?? []), { stage: stageNumber, summary: stageForm.summary.trim(), done_by: monitoringUser, done_at: investigationsNow, attachments }],
    });
    setStageForm(emptyStageForm);
    setActionError(undefined);
  };

  const submitForDecision = () => {
    if (submitForm.classification === null) return;
    setData({
      ...data,
      status: "AWAITING_DECISION",
      classification: submitForm.classification,
      proposed_action: submitForm.proposedAction.trim(),
      stages: [...(data.stages ?? []), { stage: 7, summary: `${classificationLabels[submitForm.classification]}: ${submitForm.proposedAction.trim()}`, done_by: monitoringUser, done_at: investigationsNow, attachments: [] }],
    });
    setSubmitConfirming(false);
    setActionError(undefined);
  };

  const decide = () => {
    setData({
      ...data,
      status: "DECIDED",
      decision: { text: decisionForm.text.trim(), deduction_id: decisionForm.withDeduction ? 15 : null, decided_by: executive, decided_at: investigationsNow },
    });
    setDeduction(decisionForm.withDeduction ? { amount: decisionForm.amount, reason: decisionForm.reason.trim() } : null);
    setDecisionConfirming(false);
    setActionError(undefined);
  };

  return (
    <InvestigationDetailsView
      investigation={loadable}
      canManage={canManage}
      canDecide={canDecide}
      deduction={deduction}
      stageForm={stageForm}
      onStageFormChange={(next) => {
        setStageForm(next);
        setActionError(undefined);
      }}
      onFilesSelect={(files) =>
        setStageForm({ ...stageForm, attachments: [...stageForm.attachments, ...files.map((file, index) => ({ id: `upload-${stageForm.attachments.length + index + 1}`, name: file.name, size: file.size, status: "done" as const }))] })
      }
      onFileRemove={(id) => setStageForm({ ...stageForm, attachments: stageForm.attachments.filter((file) => file.id !== id) })}
      onCompleteStage={completeStage}
      closeDialog={closeDialog}
      onStartClose={() => {
        setActionError(undefined);
        setCloseDialog({ reason: "" });
      }}
      onCloseReasonChange={(reason) => setCloseDialog((dialog) => (dialog ? { ...dialog, reason } : dialog))}
      onConfirmClose={() => {
        setData({ ...data, status: "CLOSED_NO_VIOLATION", close_reason: closeDialog?.reason.trim() ?? null });
        setCloseDialog(null);
      }}
      onDismissClose={() => setCloseDialog(null)}
      submitForm={submitForm}
      onSubmitFormChange={setSubmitForm}
      submitConfirming={submitConfirming}
      onStartSubmit={() => setSubmitConfirming(true)}
      onConfirmSubmit={submitForDecision}
      onDismissSubmit={() => setSubmitConfirming(false)}
      decisionForm={decisionForm}
      onDecisionFormChange={setDecisionForm}
      decisionConfirming={decisionConfirming}
      onStartDecision={() => setDecisionConfirming(true)}
      onConfirmDecision={decide}
      onDismissDecision={() => setDecisionConfirming(false)}
      actionError={actionError}
      onOpenFlag={() => {}}
      onBack={() => {}}
    />
  );
}

"use client";

import { useState } from "react";
import { DisputeDetailsView, emptyDisputeStageForm, type DisputeStageForm, type OtherSolutionForm, type ResolvedDialog } from "@/features/disputes/views/DisputeDetailsView";
import type { Dispute, DisputeStatus } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { afiaAt, disputesNow, executiveUser, legalUser } from "@/mocks/disputes";

// غلاف تفاعلي لصفحتي الرسم (I20 · I21): يملك الملف ونماذجه ونوافذه. complete-stage يضيف المرحلة ويقدّم الملف، وrecommendation ينقله إلى «بانتظار القرار»،
// وdecision إلى المرحلة 7، وexecute يغلقه، وclose-resolved يغلقه بسببه، كلها محلياً. لا يُنقل للإنتاج.

type DisputeDemoProps = {
  status: DisputeStatus;
  canManage?: boolean;
  canDecide?: boolean;
  initialResolved?: boolean;
  initialApproving?: boolean;
  initialOtherSolution?: boolean;
  initialActionError?: string;
  mode?: "ready" | "loading" | "error" | "not-found";
};

export function DisputeDemo({ status, canManage = true, canDecide = false, initialResolved = false, initialApproving = false, initialOtherSolution = false, initialActionError, mode = "ready" }: DisputeDemoProps) {
  const [data, setData] = useState<Dispute>(() => afiaAt(status));
  const [stageForm, setStageForm] = useState<DisputeStageForm>(emptyDisputeStageForm);
  const [recommendation, setRecommendation] = useState("");
  const [executeSummary, setExecuteSummary] = useState("");
  const [approving, setApproving] = useState(initialApproving);
  const [other, setOther] = useState<OtherSolutionForm | null>(initialOtherSolution ? { text: "", reason: "" } : null);
  const [resolved, setResolved] = useState<ResolvedDialog | null>(initialResolved ? { reason: "" } : null);
  const [actionError, setActionError] = useState(initialActionError);

  const loadable: Loadable<Dispute> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : mode === "not-found" ? { status: "error", code: "not_found" } : { status: "ready", data };
  const stages = data.stages ?? [];
  const entry = (stage: number, summary: string) => ({ stage, summary, done_by: legalUser, done_at: disputesNow, attachments: [] });
  // خطأ الإجراء الظاهر (invalid_status) يمنع الإرسال في الرسم كما يرفضه الخادم.
  const guard = () => actionError !== undefined;

  return (
    <DisputeDetailsView
      dispute={loadable}
      canManage={canManage}
      canDecide={canDecide}
      stageForm={stageForm}
      onStageFormChange={setStageForm}
      onFilesSelect={(files) => setStageForm({ ...stageForm, attachments: [...stageForm.attachments, ...files.map((file, index) => ({ id: `up-${stageForm.attachments.length + index}`, name: file.name, size: file.size, status: "done" as const }))] })}
      onFileRemove={(id) => setStageForm({ ...stageForm, attachments: stageForm.attachments.filter((file) => file.id !== id) })}
      onCompleteStage={() => {
        if (guard()) return;
        const number = stages.length + 1;
        const attachments = stageForm.attachments.map((file) => ({ upload_id: file.id, url: "#", name: file.name, mime: "application/pdf" }));
        setData({
          ...data,
          status: `STAGE_${number + 1}` as DisputeStatus,
          stages: [...stages, { ...entry(number, stageForm.summary.trim()), attachments }],
          risk: number === 4 && stageForm.riskLevel ? { level: stageForm.riskLevel, value: stageForm.riskValue.trim() || null } : data.risk,
        });
        setStageForm(emptyDisputeStageForm);
      }}
      recommendation={recommendation}
      onRecommendationChange={setRecommendation}
      onSubmitRecommendation={() => {
        if (guard()) return;
        setData({ ...data, status: "AWAITING_DECISION", recommendation: recommendation.trim(), stages: [...stages, entry(6, recommendation.trim())] });
        setRecommendation("");
      }}
      executeSummary={executeSummary}
      onExecuteSummaryChange={setExecuteSummary}
      onExecute={() => {
        if (guard()) return;
        setData({ ...data, status: "CLOSED", stages: [...stages, entry(7, executeSummary.trim())] });
        setExecuteSummary("");
      }}
      approving={approving}
      onStartApprove={() => setApproving(true)}
      onDismissApprove={() => setApproving(false)}
      onConfirmApprove={() => {
        setApproving(false);
        if (guard()) return;
        setData({ ...data, status: "STAGE_7", decision: { type: "APPROVED_RECOMMENDATION", text: data.recommendation ?? "", reason: null, decided_by: executiveUser, decided_at: disputesNow } });
      }}
      otherSolution={other}
      onOtherSolutionChange={setOther}
      onConfirmOtherSolution={() => {
        if (!other || guard()) return;
        setData({ ...data, status: "STAGE_7", decision: { type: "OTHER_SOLUTION", text: other.text.trim(), reason: other.reason.trim(), decided_by: executiveUser, decided_at: disputesNow } });
        setOther(null);
      }}
      resolvedDialog={resolved}
      onResolvedDialogChange={(next) => {
        setResolved(next);
        setActionError(undefined);
      }}
      onConfirmResolved={() => {
        if (!resolved || resolved.reason.trim() === "") return;
        setData({ ...data, status: "CLOSED_RESOLVED", close_reason: resolved.reason.trim() });
        setResolved(null);
      }}
      actionError={actionError}
      onDownloadAttachment={() => {}}
      onBack={() => {}}
    />
  );
}

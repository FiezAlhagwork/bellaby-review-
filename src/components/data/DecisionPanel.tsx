"use client";

import { LockSimple } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { CaptureRow, useCaptureClass } from "@/lib/design/CaptureMode";
import { formatDateTime } from "@/lib/format";

// القرار (DESIGN.md 10.15). DecisionPanel لطلب معلّق، وبعد القرار يحل DecisionRecord محله في مكانه.
// الحالات الخاصة: already_decided (409) تُركَّب في الشاشة: Banner warning «قرّر غيرك قبلك» ثم DecisionRecord. والسجل المقفل Banner neutral.

type DecisionPanelProps = {
  /**
   * awaiting-me: أنا أملك القرار (الأزرار) · awaiting-other: ينتظر قرار غيري (بلا أزرار) ·
   * self-decision-forbidden: الطلب يخصّني (الأزرار معطّلة وتحتها السبب).
   */
  state?: "awaiting-me" | "awaiting-other" | "self-decision-forbidden";
  /** ملخص ما يُقرَّر عليه. */
  summary: ReactNode;
  /** خيارات يحددها العقد (قرار التالف: المسؤولية مستودع · مصنّع · جهة أخرى) بـ RadioGroup وRadioCard. */
  children?: ReactNode;
  /** awaiting-other: «بانتظار قرار مدير المبيعات أو المدير التنفيذي». */
  waitingFor?: string;
  /** self-decision-forbidden: «ينتظر قرار المدير التنفيذي». */
  forbiddenNote?: string;
  /** تعطيل «اعتماد» (مثل خيار إلزامي لم يُختر). يجب أن يرافقه `approveHint` يشرح السبب. */
  approveDisabled?: boolean;
  approveHint?: string;
  /** الاعتماد يُنفَّذ الآن. */
  approving?: boolean;
  /** «رفض» يفتح ReasonDialog (الأب يفتحها). */
  onApprove: () => void;
  onReject: () => void;
  className?: string;
};

/**
 * لوحة القرار: بطاقة في العمود الجانبي أعلاه بحد بداية warning. «بانتظار قرارك»، وملخص ما يُقرَّر، والزرّان «اعتماد» (primary)
 * و«رفض» (danger). الرفض يحتاج سبباً فيفتح ReasonDialog.
 */
export function DecisionPanel({
  state = "awaiting-me",
  summary,
  children,
  waitingFor,
  forbiddenNote,
  approveDisabled = false,
  approveHint,
  approving = false,
  onApprove,
  onReject,
  className,
}: DecisionPanelProps) {
  const edge = useCaptureClass("border-s-3 border-s-warning", "border-e-3 border-e-warning");
  const forbidden = state === "self-decision-forbidden";

  return (
    <section aria-label="القرار" className={cn("flex flex-col gap-4 rounded-lg border border-border bg-surface p-4 @tablet:p-6", edge, className)}>
      <CaptureRow className="items-center gap-2">
        <h3 className="min-w-0 flex-1 text-h3 font-semibold text-fg">{state === "awaiting-other" ? "بانتظار قرار غيرك" : "بانتظار قرارك"}</h3>
        {forbidden ? <LockSimple size={20} aria-hidden="true" className="text-fg-subtle" /> : null}
      </CaptureRow>

      <div className="text-start text-body text-fg">{summary}</div>
      {state !== "awaiting-other" ? children : null}

      {state === "awaiting-other" ? (
        <p className="text-start text-body text-fg-muted">{waitingFor}</p>
      ) : (
        <div className="flex flex-col gap-2">
          <CaptureRow className="items-center gap-2">
            <Button key="approve" className="flex-1" loading={approving} disabled={forbidden || approveDisabled} onClick={onApprove}>
              اعتماد
            </Button>
            <Button key="reject" className="flex-1" variant="danger" disabled={forbidden || approving} onClick={onReject}>
              رفض
            </Button>
          </CaptureRow>
          {forbidden && forbiddenNote ? <p className="text-start text-label text-fg-muted">{`لا تقرر فيما يخصّك. ${forbiddenNote}`}</p> : null}
          {!forbidden && approveDisabled && approveHint ? <p className="text-start text-label text-fg-muted">{approveHint}</p> : null}
        </div>
      )}
    </section>
  );
}

type DecisionRecordProps = {
  /** شارة القرار (StatusBadge بقيمة العقد). */
  badge: ReactNode;
  decidedBy: string;
  /** UTC من العقد. */
  decidedAt: string;
  reason?: string;
  /** القرار بالتفويض عن المدير التنفيذي. */
  onBehalf?: boolean;
  className?: string;
};

/** سجل القرار بعد صدوره (DESIGN.md 10.15): القرار بشارته، ومن قرّر ومتى والسبب و«بالتفويض» إن كان. يحل محل DecisionPanel في مكانه. */
export function DecisionRecord({ badge, decidedBy, decidedAt, reason, onBehalf = false, className }: DecisionRecordProps) {
  return (
    <section aria-label="القرار" className={cn("flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 @tablet:p-6", className)}>
      <CaptureRow className="items-center gap-2">
        <h3 className="min-w-0 flex-1 text-h3 font-semibold text-fg">القرار</h3>
        {badge}
      </CaptureRow>
      <p className="text-start text-body text-fg">{decidedBy}</p>
      <CaptureRow className="items-center gap-2">
        <time dateTime={decidedAt} className="text-start text-caption text-fg-muted">
          {formatDateTime(decidedAt)}
        </time>
        {onBehalf ? <Badge color="info">بالتفويض عن المدير التنفيذي</Badge> : null}
      </CaptureRow>
      {reason ? <blockquote className="rounded-md bg-surface-muted px-3 py-2 text-start text-body text-fg">{reason}</blockquote> : null}
    </section>
  );
}

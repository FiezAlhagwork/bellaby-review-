"use client";

import { Check, Scales, Flag } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { CaptureRow } from "@/lib/design/CaptureMode";
import { formatDateTime } from "@/lib/format";

// المراحل (DESIGN.md 10.12): لملف التحقيق (8 مراحل، القرار 9) والنزاع (7 مراحل مع القرار بين 6 و7، القرار 14).
// مكتب (من 1280): أفقي من اليمين، دوائر مرقّمة وخط بينها. تابلت وموبايل: عمودي، وتحت كل مرحلة مكتملة ما جرى ومن نفّذه ومتى.
// الشكلان يُرسمان معاً ويُحسم الظاهر بـ @desktop (CaptureRow لا يبدّل بين صف وعمود).

export type StageStatus = "done" | "current" | "upcoming";

export type Stage = {
  key: string;
  /** اسم المرحلة. */
  label: string;
  status: StageStatus;
  /** decision: القرار (معيّن). الباقي مراحل مرقّمة بالترتيب دون عدّ القرار. */
  kind?: "stage" | "decision";
  /** للمكتملة: ما جرى ومن نفّذه ومتى (UTC من العقد). */
  detail?: { what: string; by: string; at: string };
};

/** الإغلاق المبكر («لا مخالفة» أو «زال السبب»): نهاية عند المرحلة `atKey` بسببه، وما بعدها لا يُعرض. */
export type EarlyClose = { atKey: string; label: string; reason: string };

type StageTimelineProps = {
  stages: readonly Stage[];
  earlyClose?: EarlyClose;
  className?: string;
};

// الصنف الدلالي للعلامة حسب الحالة. المكتملة success، والحالية info بحلقة، والقادمة neutral.
const markerTone: Record<StageStatus, string> = {
  done: "border-success bg-success text-fg-inverse",
  current: "border-info bg-info-soft text-info",
  upcoming: "border-border-strong bg-surface-sunken text-fg-muted",
};

type Numbered = Stage & { number: number | null };

function Marker({ stage }: { stage: Numbered }) {
  const decision = stage.kind === "decision";
  const content = stage.status === "done" ? (
    <Check size={16} weight="bold" aria-hidden="true" />
  ) : decision ? (
    <Scales size={16} aria-hidden="true" />
  ) : (
    <span className="text-label font-semibold tabular-nums">{stage.number}</span>
  );

  return decision ? (
    // معيّن: مربع مدوَّر 45°، ومحتواه يُعاد إلى استقامته.
    <span className={cn("flex size-7 shrink-0 rotate-45 items-center justify-center rounded-sm border-2", markerTone[stage.status])}>
      <span className="-rotate-45">{content}</span>
    </span>
  ) : (
    <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full border-2", markerTone[stage.status], stage.status === "current" && "ring-4 ring-info-soft")}>
      {content}
    </span>
  );
}

const statusWord: Record<StageStatus, string> = { done: "مكتملة", current: "الحالية", upcoming: "قادمة" };

export function StageTimeline({ stages, earlyClose, className }: StageTimelineProps) {
  // المراحل حتى الإغلاق المبكر، والترقيم لا يعدّ القرار.
  const endIndex = earlyClose ? stages.findIndex((stage) => stage.key === earlyClose.atKey) : -1;
  const visible = endIndex >= 0 ? stages.slice(0, endIndex + 1) : stages;
  let counter = 0;
  const numbered: Numbered[] = visible.map((stage) => ({ ...stage, number: stage.kind === "decision" ? null : ++counter }));
  const last = numbered.length - 1;

  const end = earlyClose ? (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-border-strong bg-surface text-fg-muted">
      <Flag size={16} aria-hidden="true" />
    </span>
  ) : null;

  return (
    <div className={className}>
      {/* مكتب: أفقي */}
      <CaptureRow as="ol" aria-label="المراحل" className="hidden items-start @desktop:flex">
          {[
            ...numbered.map((stage, index) => (
              <li key={stage.key} aria-current={stage.status === "current" ? "step" : undefined} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <CaptureRow className="w-full items-center">
                  <span className={cn("h-0.5 flex-1", index === 0 ? "bg-transparent" : numbered[index - 1].status === "done" ? "bg-success" : "bg-border-strong")} />
                  <Marker stage={stage} />
                  <span className={cn("h-0.5 flex-1", index === last && !earlyClose ? "bg-transparent" : stage.status === "done" ? "bg-success" : "bg-border-strong")} />
                </CaptureRow>
                <span className={cn("px-1 text-center text-label", stage.status === "current" ? "font-semibold text-fg" : "text-fg-muted")}>
                  {stage.label}
                  <span className="sr-only">{`، ${statusWord[stage.status]}`}</span>
                </span>
              </li>
            )),
            ...(earlyClose
              ? [
                  <li key="early-close" className="flex min-w-0 flex-1 flex-col items-center gap-2">
                    <CaptureRow className="w-full items-center">
                      <span className="h-0.5 flex-1 bg-success" />
                      {end}
                      <span className="h-0.5 flex-1 bg-transparent" />
                    </CaptureRow>
                    <span className="px-1 text-center text-label font-semibold text-fg">{earlyClose.label}</span>
                    <span className="px-1 text-center text-caption text-fg-muted">{earlyClose.reason}</span>
                  </li>,
                ]
              : []),
          ]}
      </CaptureRow>

      {/* تابلت وموبايل: عمودي */}
      <ol aria-label="المراحل" className="flex flex-col @desktop:hidden">
        {numbered.map((stage, index) => {
          const isLast = index === last && !earlyClose;
          return (
            <li key={stage.key} aria-current={stage.status === "current" ? "step" : undefined}>
              <CaptureRow className="items-stretch gap-3">
                <div className="flex w-8 shrink-0 flex-col items-center">
                  <Marker stage={stage} />
                  {isLast ? null : <span className={cn("min-h-4 w-0.5 flex-1", stage.status === "done" ? "bg-success" : "bg-border-strong")} />}
                </div>
                <div className={cn("flex min-w-0 flex-1 flex-col gap-1", isLast ? "pb-0" : "pb-6")}>
                  <span className={cn("min-h-8 text-start text-body leading-8", stage.status === "current" ? "font-semibold text-fg" : stage.status === "done" ? "text-fg" : "text-fg-muted")}>
                    {stage.label}
                    <span className="sr-only">{`، ${statusWord[stage.status]}`}</span>
                  </span>
                  {stage.status === "done" && stage.detail ? (
                    <div className="flex flex-col gap-0.5">
                      <p className="text-start text-body text-fg">{stage.detail.what}</p>
                      <p className="text-start text-caption text-fg-muted">{`${stage.detail.by} · ${formatDateTime(stage.detail.at)}`}</p>
                    </div>
                  ) : null}
                </div>
              </CaptureRow>
            </li>
          );
        })}
        {earlyClose ? (
          <li>
            <CaptureRow className="items-start gap-3">
              <div className="flex w-8 shrink-0 flex-col items-center">{end}</div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="min-h-8 text-start text-body font-semibold leading-8 text-fg">{earlyClose.label}</span>
                <p className="text-start text-caption text-fg-muted">{earlyClose.reason}</p>
              </div>
            </CaptureRow>
          </li>
        ) : null}
      </ol>
    </div>
  );
}

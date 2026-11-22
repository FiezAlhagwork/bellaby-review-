"use client";

import { ShieldCheck } from "@phosphor-icons/react";
import { TextCell } from "@/components/data/cells";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { Pagination, type PaginationMeta } from "@/components/data/Pagination";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ReasonDialog } from "@/components/ui/ReasonDialog";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { errorMessage } from "@/lib/api/error-messages";
import type { SecurityEvent } from "@/lib/api/types";
import { formatDateTime, formatPhone } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

type EventKind = NonNullable<SecurityEvent["kind"]>;
export type SecurityEventsPage = { data: readonly SecurityEvent[]; meta: PaginationMeta };
/** `handled=false` (المفتوحة، الافتراضي) أو `handled=true`. */
export type EventsTab = "open" | "handled";

/** المعالجة قيد الكتابة: `POST /security-events/{id}/handle { action, note }`. */
export type EventHandling = { event: SecurityEvent; action: "BLOCKED" | "IGNORED" };

type SecurityEventsViewProps = {
  events: Loadable<SecurityEventsPage>;
  tab: EventsTab;
  onTabChange: (tab: EventsTab) => void;
  /** `security.manage`. */
  canHandle: boolean;
  handling: EventHandling | null;
  onHandlingChange: (handling: EventHandling | null) => void;
  note: string;
  onNoteChange: (note: string) => void;
  noteError?: string;
  onHandle?: () => void;
  submitting?: boolean;
  /** رمز خطأ المعالجة (409 عولجت مسبقاً؛ اسم الرمز غير محدّد في العقد §79). */
  actionError?: string;
  onDismissError?: () => void;
  onPageChange: (page: number) => void;
  onRetry?: () => void;
};

export const eventKindLabels = {
  UNBOUND_DEVICE: "جهاز غير مربوط",
  UNKNOWN_EMAIL: "بريد غير مضاف",
  BLOCKED_ATTEMPT: "محاولة من محظور",
} as const satisfies Record<EventKind, string>;

/** ما حاول الدخول به: الجهاز (مع الهاتف) أو البريد. */
function Subject({ event }: { event: SecurityEvent }) {
  const main = event.device_id ?? event.email ?? "—";
  const sub = [event.phone ? formatPhone(event.phone) : null, event.ip ? `IP ${event.ip}` : null].filter(Boolean).join(" · ");
  return (
    <span className="flex min-w-0 flex-col">
      <span dir="ltr" className="block truncate text-end text-body text-fg">
        {main}
      </span>
      {sub ? (
        <span dir="ltr" className="block truncate text-end text-caption text-fg-muted">
          {sub}
        </span>
      ) : null}
    </span>
  );
}

/**
 * المحاولات غير المصرّح بها (I07): دخول من جهاز غير مربوط أو ببريد غير مضاف أو من محظور. لكل محاولة «حظر» أو «تجاهل» بملاحظة،
 * والمهلة 24 ساعة عمل. المعالَجة تُعرض بمن عالجها ومتى وملاحظته.
 */
export function SecurityEventsView({
  events,
  tab,
  onTabChange,
  canHandle,
  handling,
  onHandlingChange,
  note,
  onNoteChange,
  noteError,
  onHandle,
  submitting = false,
  actionError,
  onDismissError,
  onPageChange,
  onRetry,
}: SecurityEventsViewProps) {
  const columns: DataTableColumn<SecurityEvent>[] = [
    { key: "kind", header: "النوع", cell: (row) => <TextCell value={row.kind ? eventKindLabels[row.kind] : null} />, width: "w-40", priority: "high", role: "primary" },
    { key: "subject", header: "الجهاز أو البريد", cell: (row) => <Subject event={row} />, priority: "high" },
    { key: "time", header: "الوقت", cell: (row) => <TextCell value={row.occurred_at ? formatDateTime(row.occurred_at) : null} />, width: "w-44", priority: "high" },
    tab === "open"
      ? { key: "deadline", header: "المهلة", cell: () => <Badge color="warning">24 ساعة عمل</Badge>, width: "w-32", role: "status" as const }
      : {
          key: "handled",
          header: "المعالجة",
          cell: (row: SecurityEvent) => (
            <span className="flex min-w-0 flex-col items-start gap-1">
              <Badge color={row.action === "BLOCKED" ? "danger" : "neutral"}>{row.action === "BLOCKED" ? "حُظر" : "تُجوهل"}</Badge>
              <span className="truncate text-caption text-fg-muted">{`${row.handled_by?.name ?? ""} · ${row.handled_at ? formatDateTime(row.handled_at) : ""}`}</span>
            </span>
          ),
          width: "w-56",
          role: "status" as const,
        },
  ];

  const subject = handling ? (handling.event.device_id ?? handling.event.email ?? "") : "";

  return (
    <>
      <PageHeader title="المحاولات غير المصرّح بها" description="دخول من جهاز غير مربوط أو ببريد غير مضاف. عالج كل محاولة بالحظر أو التجاهل خلال 24 ساعة عمل." />

      <div className="flex flex-col gap-4">
        <SegmentedControl
          aria-label="الحالة"
          options={[
            { value: "open", label: "بانتظار المعالجة" },
            { value: "handled", label: "معالجة" },
          ]}
          value={tab}
          onValueChange={onTabChange}
        />

        {actionError ? (
          <Banner kind="danger" title="تعذّرت المعالجة" onClose={onDismissError}>
            {errorMessage(actionError)}
          </Banner>
        ) : null}

        <DataTable
          label="المحاولات"
          columns={columns}
          rows={events.status === "ready" ? events.data.data : []}
          getRowKey={(row) => row.id ?? ""}
          loading={events.status === "loading"}
          error={events.status === "error" ? { code: events.code, onRetry } : undefined}
          empty={<EmptyState icon={ShieldCheck} title={tab === "open" ? "لا محاولات بانتظار المعالجة" : "لا محاولات معالجة"} description="تظهر هنا محاولات الدخول من جهاز أو بريد غير معروف." />}
          rowActions={
            canHandle
              ? (row) =>
                  row.action
                    ? [{ id: "note", label: "الملاحظة", disabled: true, reason: row.note ?? "", onSelect: () => {} }]
                    : [
                        { id: "ignore", label: "تجاهل", onSelect: () => onHandlingChange({ event: row, action: "IGNORED" }) },
                        { id: "block", label: "حظر", danger: true, onSelect: () => onHandlingChange({ event: row, action: "BLOCKED" }) },
                      ]
              : undefined
          }
        />

        {events.status === "ready" ? <Pagination meta={events.data.meta} onPageChange={onPageChange} /> : null}
      </div>

      <ReasonDialog
        open={handling !== null}
        onOpenChange={(open) => {
          if (!open) onHandlingChange(null);
        }}
        title={handling?.action === "BLOCKED" ? "حظر المحاولة؟" : "تجاهل المحاولة؟"}
        description={handling?.action === "BLOCKED" ? `يُحظر «${subject}» فلا يدخل به أحد. يُرفع الحظر من «الحظر».` : `تُغلق المحاولة دون حظر «${subject}».`}
        confirmLabel={handling?.action === "BLOCKED" ? "حظر" : "تجاهل"}
        reasonLabel="الملاحظة"
        reason={note}
        onReasonChange={onNoteChange}
        error={noteError}
        danger={handling?.action === "BLOCKED"}
        loading={submitting}
        onConfirm={() => onHandle?.()}
      />
    </>
  );
}

"use client";

import { useState } from "react";
import { SecurityEventsView, type EventHandling, type EventsTab, type SecurityEventsPage } from "@/features/security/views/SecurityEventsView";
import type { SecurityEvent } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { securityActor, securityEvents, securityNow } from "@/mocks/security";

// غلاف تفاعلي لصفحة الرسم (I07): يملك المحاولات والتبويب ونافذة المعالجة. المعالجة كما تفعل POST /security-events/{id}/handle. لا يُنقل للإنتاج.

type AttemptsDemoProps = { initialTab?: EventsTab; initialHandling?: { id: number; action: "BLOCKED" | "IGNORED" }; initialError?: string; mode?: "ready" | "loading" | "error" | "empty" };

export function AttemptsDemo({ initialTab = "open", initialHandling, initialError, mode = "ready" }: AttemptsDemoProps) {
  const [rows, setRows] = useState<readonly SecurityEvent[]>(securityEvents);
  const [tab, setTab] = useState<EventsTab>(initialTab);
  const [handling, setHandling] = useState<EventHandling | null>(() => {
    const event = securityEvents.find((row) => row.id === initialHandling?.id);
    return event && initialHandling ? { event, action: initialHandling.action } : null;
  });
  const [note, setNote] = useState("");
  const [error, setError] = useState(initialError);

  const filtered = mode === "empty" ? [] : rows.filter((row) => (tab === "open" ? row.action === null : row.action !== null));
  const page: SecurityEventsPage = { data: filtered, meta: { current_page: 1, last_page: 1, per_page: 20, total: filtered.length } };
  const events: Loadable<SecurityEventsPage> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: page };

  return (
    <SecurityEventsView
      events={events}
      tab={tab}
      onTabChange={setTab}
      canHandle
      handling={handling}
      onHandlingChange={(next) => {
        setHandling(next);
        setNote("");
      }}
      note={note}
      onNoteChange={setNote}
      onHandle={() => {
        if (!handling) return;
        setRows(rows.map((row) => (row.id === handling.event.id ? { ...row, action: handling.action, note: note.trim(), handled_by: securityActor, handled_at: securityNow } : row)));
        setHandling(null);
      }}
      actionError={error}
      onDismissError={() => setError(undefined)}
      onPageChange={() => {}}
    />
  );
}

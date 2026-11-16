"use client";

import { useState } from "react";
import type { FlagRow } from "@/features/flags/deadline";
import { emptyFlagDecisionDraft, FlagDrawerView, type FlagDecisionDraft, type FlagLinkedRecord } from "@/features/flags/views/FlagDrawerView";
import { FlagsListView, type FlagFilters, type FlagsPage } from "@/features/flags/views/FlagsListView";
import { flagDeadline } from "@/lib/deadline";
import type { Loadable } from "@/lib/loadable";
import { escalatedInvestigationId, flagPeople, flagsList, linkedRecordOf } from "@/mocks/flags";
import { monitoringUser, supervisionNow } from "@/mocks/supervision";

// غلاف تفاعلي لصفحتي S08 وS09: يملك الفلاتر والصفحة والعلامة المفتوحة في الدرج ومسودة القرار. الحفظ يغلق العلامة بنهايتها (لا مشكلة · مشكلة مسجّلة · تحويل لتحقيق)
// فتظهر مغلقة في الدرج وفي القائمة. يرشّح ويرقّم محلياً (ما يفعله الخادم بـ type وsubject_user_id وstatus وpage). في الإنتاج تحلّ محلّه حاوية تطلب GET /qa-flags
// وPOST /qa-flags/{id}/decision. «قاربت المهلة» و«مغلقة» مشتقان في الواجهة (docs/backend-requests.md §31.5). لا يُنقل للإنتاج.

type FlagsDemoProps = {
  /** حالة البيانات: جاهزة، أو تحميل، أو خطأ، أو لا علامات إطلاقاً. */
  mode?: "ready" | "loading" | "error" | "empty";
  initialFilters?: FlagFilters;
  /** العلامة المفتوحة في الدرج عند العرض (S09). */
  initialOpenId?: number;
  /** حالة السجل المرتبط: جاهز أو يُحمَّل أو فشل. */
  linkedMode?: "ready" | "loading" | "error";
  /** `flags.decide`. افتراضياً ممنوحة للمراقبة. */
  canDecide?: boolean;
  /** رمز خطأ القرار الظاهر عند العرض (already_decided). */
  initialDecisionError?: string;
  /** يحاكي أن مراقباً آخر أغلقها قبلك: تُعرض مغلقة. */
  closedByOther?: boolean;
};

const defaultFilters: FlagFilters = { type: null, status: "OPEN", personId: null };

function applyFilters(rows: readonly FlagRow[], { type, status, personId }: FlagFilters): FlagRow[] {
  return rows.filter((row) => {
    if (type && row.type !== type) return false;
    if (personId && String(row.subject_user?.id) !== personId) return false;
    if (status === "OPEN") return row.status === "OPEN";
    if (status === "CLOSED") return row.status !== "OPEN";
    if (status === "NEAR") {
      if (row.status !== "OPEN") return false;
      const deadline = flagDeadline(row.due_at, supervisionNow);
      return Boolean(deadline && (deadline.late || deadline.urgent));
    }
    return true;
  });
}

export function FlagsDemo({ mode = "ready", initialFilters = defaultFilters, initialOpenId, linkedMode = "ready", canDecide = true, initialDecisionError, closedByOther = false }: FlagsDemoProps) {
  const [rows, setRows] = useState<readonly FlagRow[]>(() =>
    closedByOther
      ? flagsList.map((row) => (row.id === initialOpenId ? { ...row, status: "CLEARED", closed_by: { id: 51, name: "ليلى درويش" }, closed_at: supervisionNow, note: "لا مشكلة: الأمر معروف.", due_at: null } : row))
      : flagsList,
  );
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [openId, setOpenId] = useState<number | null>(initialOpenId ?? null);
  const [draft, setDraft] = useState<FlagDecisionDraft>(emptyFlagDecisionDraft);
  const [decisionError, setDecisionError] = useState(initialDecisionError);

  const matching = mode === "empty" ? [] : applyFilters(rows, filters);
  const lastPage = Math.max(1, Math.ceil(matching.length / perPage));
  const current = Math.min(page, lastPage);
  const result: FlagsPage = {
    data: matching.slice((current - 1) * perPage, current * perPage),
    meta: { current_page: current, last_page: lastPage, per_page: perPage, total: matching.length },
  };
  const flags: Loadable<FlagsPage> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: result };

  const opened = rows.find((row) => row.id === openId) ?? null;
  const linked: Loadable<FlagLinkedRecord | null> = linkedMode === "loading" ? { status: "loading" } : linkedMode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: opened ? linkedRecordOf(opened) : null };

  const submit = () => {
    if (!opened || draft.outcome === null) return;
    const status = draft.outcome === "CLEARED" ? "CLEARED" : draft.outcome === "CONFIRMED" ? "CONFIRMED" : "ESCALATED";
    setRows(
      rows.map((row) =>
        row.id === opened.id
          ? { ...row, status, closed_by: monitoringUser, closed_at: supervisionNow, note: draft.note.trim() || null, investigation_id: draft.outcome === "ESCALATED" ? escalatedInvestigationId + 1 : null, handling_work_hours: 6, due_at: null }
          : row,
      ),
    );
    setDraft(emptyFlagDecisionDraft);
    setDecisionError(undefined);
  };

  return (
    <>
      <FlagsListView
        flags={flags}
        people={flagPeople}
        filters={filters}
        onFiltersChange={(next) => {
          setFilters(next);
          setPage(1);
        }}
        onPageChange={setPage}
        onPerPageChange={(next) => {
          setPerPage(next);
          setPage(1);
        }}
        now={supervisionNow}
        onOpenFlag={(row) => {
          setOpenId(row.id ?? null);
          setDraft(emptyFlagDecisionDraft);
          setDecisionError(undefined);
        }}
      />
      <FlagDrawerView
        flag={opened}
        linked={linked}
        canDecide={canDecide}
        draft={draft}
        onDraftChange={(next) => {
          setDraft(next);
          setDecisionError(undefined);
        }}
        onSubmit={submit}
        decisionError={decisionError}
        now={supervisionNow}
        onOpenRoute={() => {}}
        onOpenInvestigation={() => {}}
        onClose={() => {
          setOpenId(null);
          setDraft(emptyFlagDecisionDraft);
          setDecisionError(undefined);
        }}
      />
    </>
  );
}

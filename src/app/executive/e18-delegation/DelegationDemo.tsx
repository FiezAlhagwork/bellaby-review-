"use client";

import { useState } from "react";
import { DelegationView, type DelegationForm, type DelegationPage } from "@/features/delegations/views/DelegationView";
import type { Delegation } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { currentDelegation, delegationCandidates, delegationsToday, pastDelegations } from "@/mocks/delegations";

// غلاف تفاعلي لصفحة الرسم (E18): يملك السجل والنافذتين. الإنشاء كما تفعل POST /delegations (فترة تتقاطع مع تفويض ساري أو قادم ترجع 409 delegation_overlap)،
// والإنهاء كما تفعل POST /delegations/{id}/end. لا يُنقل للإنتاج.

type DelegationDemoProps = { active?: boolean; initialForm?: DelegationForm | null; initialError?: string; mode?: "ready" | "loading" | "error" };

const ziad = { id: 1, name: "زياد المصري" };

export function DelegationDemo({ active = false, initialForm = null, initialError, mode = "ready" }: DelegationDemoProps) {
  const [rows, setRows] = useState<readonly Delegation[]>(active ? [currentDelegation, ...pastDelegations] : pastDelegations);
  const [form, setForm] = useState<DelegationForm | null>(initialForm);
  const [error, setError] = useState(initialError);
  const [confirming, setConfirming] = useState(false);

  const delegations: Loadable<DelegationPage> =
    mode === "loading"
      ? { status: "loading" }
      : mode === "error"
        ? { status: "error", code: "too_many_requests" }
        : { status: "ready", data: { data: rows, meta: { current_page: 1, last_page: 1, per_page: 15, total: rows.length } } };

  return (
    <DelegationView
      delegations={delegations}
      canManage
      candidates={delegationCandidates}
      today={delegationsToday}
      onPageChange={() => {}}
      form={form}
      onFormChange={(next) => {
        setForm(next);
        setError(undefined);
      }}
      onSubmit={() => {
        const { from, to } = form?.range ?? {};
        if (!form?.delegateId || !from || !to) return;
        const open = rows.filter((row) => !row.ended_at && (row.to ?? "") >= delegationsToday);
        if (open.some((row) => (row.from ?? "") <= to && (row.to ?? "") >= from)) {
          setError("delegation_overlap");
          return;
        }
        const delegate = delegationCandidates.find((user) => String(user.id) === form.delegateId);
        setRows([{ id: Math.max(0, ...rows.map((row) => row.id ?? 0)) + 1, delegate, from, to, ended_at: null, created_by: ziad, is_current: from <= delegationsToday }, ...rows]);
        setForm(null);
      }}
      formError={error}
      confirmingEnd={confirming}
      onConfirmingEndChange={setConfirming}
      onEnd={() => {
        setRows(rows.map((row) => (row.is_current ? { ...row, is_current: false, ended_at: "2026-11-18T09:30:00Z" } : row)));
        setConfirming(false);
      }}
    />
  );
}

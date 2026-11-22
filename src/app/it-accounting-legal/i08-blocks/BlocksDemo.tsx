"use client";

import { useState } from "react";
import { SecurityBlocksView, type BlockForm, type BlocksPage, type BlocksTab } from "@/features/security/views/SecurityBlocksView";
import type { Block } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { blocks as initialBlocks, securityActor, securityNow } from "@/mocks/security";

// غلاف تفاعلي لصفحة الرسم (I08): يملك الحظر والتبويب والنافذتين. كما تفعل POST /blocks وPOST /blocks/{id}/lift. لا يُنقل للإنتاج.

type BlocksDemoProps = { initialTab?: BlocksTab; initialLifting?: number; initialForm?: BlockForm | null; mode?: "ready" | "loading" | "error" | "empty" };

export function BlocksDemo({ initialTab = "active", initialLifting, initialForm = null, mode = "ready" }: BlocksDemoProps) {
  const [rows, setRows] = useState<readonly Block[]>(initialBlocks);
  const [tab, setTab] = useState<BlocksTab>(initialTab);
  const [lifting, setLifting] = useState<Block | null>(() => initialBlocks.find((row) => row.id === initialLifting) ?? null);
  const [reason, setReason] = useState("");
  const [form, setForm] = useState<BlockForm | null>(initialForm);

  const filtered = mode === "empty" ? [] : rows.filter((row) => (tab === "active" ? row.lifted_at === null : row.lifted_at !== null));
  const page: BlocksPage = { data: filtered, meta: { current_page: 1, last_page: 1, per_page: 20, total: filtered.length } };
  const blocks: Loadable<BlocksPage> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: page };

  return (
    <SecurityBlocksView
      blocks={blocks}
      tab={tab}
      onTabChange={setTab}
      canManage
      form={form}
      onFormChange={setForm}
      onCreate={() => {
        if (!form?.type) return;
        setRows([{ id: Math.max(0, ...rows.map((row) => row.id ?? 0)) + 1, type: form.type, value: form.value.trim(), reason: form.reason.trim(), created_by: securityActor, created_at: securityNow, lifted_at: null, lift_reason: null, lifted_by: null }, ...rows]);
        setTab("active");
        setForm(null);
      }}
      lifting={lifting}
      onLiftingChange={(next) => {
        setLifting(next);
        setReason("");
      }}
      reason={reason}
      onReasonChange={setReason}
      onLift={() => {
        setRows(rows.map((row) => (row.id === lifting?.id ? { ...row, lifted_at: securityNow, lift_reason: reason.trim(), lifted_by: securityActor } : row)));
        setLifting(null);
      }}
      onPageChange={() => {}}
    />
  );
}

"use client";

import { useState } from "react";
import { AgentDetailsView, type AgentTab } from "@/features/agents/views/AgentDetailsView";
import type { Agent } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { agentTabs, findAgent, salesToday } from "@/mocks/sales";

// غلاف تفاعلي لصفحة الرسم: يملك التبويب المختار ويحوّل الحالة المطلوبة إلى Loadable. في الإنتاج تحلّ محلّه حاوية تجلب كل تبويب من نقطته عند فتحه (§41).
// لا يُنقل للإنتاج.

type AgentDetailsDemoProps = {
  agentId: number;
  initialTab?: AgentTab;
  /** حالة البيانات: جاهزة، أو تحميل، أو خطأ، أو غير موجود. */
  mode?: "ready" | "loading" | "error" | "not-found";
  /** علم `agent_returns.create`. */
  canCreateReturn?: boolean;
};

export function AgentDetailsDemo({ agentId, initialTab = "receipts", mode = "ready", canCreateReturn = true }: AgentDetailsDemoProps) {
  const [tab, setTab] = useState<AgentTab>(initialTab);

  const agent: Loadable<Agent> =
    mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : mode === "not-found" ? { status: "error", code: "not_found" } : { status: "ready", data: findAgent(agentId) };

  return <AgentDetailsView agent={agent} tabs={agentTabs(agentId)} tab={tab} onTabChange={setTab} today={salesToday} canCreateReturn={canCreateReturn} onCreateReturn={() => {}} onBack={() => {}} onRetry={() => {}} />;
}

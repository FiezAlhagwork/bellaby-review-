"use client";

import { useState } from "react";
import { AccountingHomeView } from "@/features/accounting/views/AccountingHomeView";
import { closingComplete, closingWithMissing } from "@/mocks/accounting";
import { agentFilterOptions, salesDeliveries } from "@/mocks/sales";

// غلاف تفاعلي لصفحة الرسم (I11): يملك فلتر الوكيل والصفحة. في الإنتاج حاوية تطلب GET /month-closings/{month} وGET /deliveries. لا يُنقل للإنتاج.

type AccountingHomeDemoProps = { reminder?: boolean; mode?: "ready" | "loading" | "error" };

const PER_PAGE = 8;

export function AccountingHomeDemo({ reminder = false, mode = "ready" }: AccountingHomeDemoProps) {
  const [agentId, setAgentId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const rows = salesDeliveries.filter((delivery) => agentId === null || String(delivery.agent?.id) === agentId);
  const lastPage = Math.max(1, Math.ceil(rows.length / PER_PAGE));

  return (
    <AccountingHomeView
      closing={mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: reminder ? closingWithMissing : closingComplete }}
      deliveries={
        mode === "loading"
          ? { status: "loading" }
          : mode === "error"
            ? { status: "error", code: "too_many_requests" }
            : { status: "ready", data: { data: rows.slice((page - 1) * PER_PAGE, page * PER_PAGE), meta: { current_page: page, last_page: lastPage, per_page: PER_PAGE, total: rows.length } } }
      }
      agents={agentFilterOptions}
      agentId={agentId}
      onAgentChange={(next) => {
        setAgentId(next);
        setPage(1);
      }}
      onPageChange={setPage}
      onPerPageChange={() => {}}
      onOpenExpenses={() => {}}
    />
  );
}

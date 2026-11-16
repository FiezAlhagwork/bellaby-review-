"use client";

import { useState } from "react";
import { noComplaintFilters, SiteComplaintsView, type ComplaintFilters, type ComplaintsPage } from "@/features/site-messages/views/SiteComplaintsView";
import type { SiteMessage } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { siteComplaints } from "@/mocks/site-messages";

// غلاف تفاعلي لصفحة الرسم: يملك الفلتر والصفحة والشكوى المفتوحة في الدرج، ويرشّح ويرقّم محلياً (ما يفعله الخادم بـ status وpage مع type=COMPLAINT).
// في الإنتاج تحلّ محلّه حاوية تطلب GET /site/messages?type=COMPLAINT. لا يُنقل للإنتاج.

type ComplaintsDemoProps = {
  /** حالة البيانات: جاهزة، أو تحميل، أو خطأ، أو لا شكاوى. */
  mode?: "ready" | "loading" | "error" | "empty";
  initialFilters?: ComplaintFilters;
  /** الشكوى المفتوحة في الدرج عند العرض. */
  initialOpenId?: number;
};

export function ComplaintsDemo({ mode = "ready", initialFilters = noComplaintFilters, initialOpenId }: ComplaintsDemoProps) {
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [openId, setOpenId] = useState<number | null>(initialOpenId ?? null);

  const matching = mode === "empty" ? [] : siteComplaints.filter((message) => !filters.status || message.status === filters.status);
  const lastPage = Math.max(1, Math.ceil(matching.length / perPage));
  const current = Math.min(page, lastPage);
  const result: ComplaintsPage = {
    data: matching.slice((current - 1) * perPage, current * perPage),
    meta: { current_page: current, last_page: lastPage, per_page: perPage, total: matching.length },
  };
  const complaints: Loadable<ComplaintsPage> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: result };
  const selected: SiteMessage | null = siteComplaints.find((message) => message.id === openId) ?? null;

  return (
    <SiteComplaintsView
      complaints={complaints}
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
      selected={selected}
      onOpen={(message) => setOpenId(message.id ?? null)}
      onClose={() => setOpenId(null)}
    />
  );
}

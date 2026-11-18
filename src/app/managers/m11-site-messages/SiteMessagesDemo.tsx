"use client";

import { useState } from "react";
import { noSiteMessageFilters, SiteMessagesView, type SiteMessageFilters, type SiteMessagesPage } from "@/features/site-messages/views/SiteMessagesView";
import type { SiteMessage } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { handledMessage, siteMessagesList } from "@/mocks/site-messages";

// غلاف تفاعلي لصفحة الرسم: يملك الفلاتر والصفحة والدرج ونافذة المعالجة، ويرشّح ويرقّم محلياً (ما يفعله الخادم بـ type وstatus وpage).
// «تعليم: عولجت» تحوّل الرسالة إلى «عولجت» بملاحظتها كما يفعل POST /site/messages/{id}/handle. في الإنتاج تحلّ محلّه حاوية. لا يُنقل للإنتاج.

type SiteMessagesDemoProps = {
  /** حالة البيانات: جاهزة، أو تحميل، أو خطأ، أو لا رسائل. */
  mode?: "ready" | "loading" | "error" | "empty";
  initialFilters?: SiteMessageFilters;
  /** الرسالة المفتوحة في الدرج عند العرض. */
  initialOpenId?: number;
  /** الرسالة المفتوحة في نافذة المعالجة عند العرض. */
  initialHandlingId?: number;
  /** رسائل عولجت عند العرض: معرّفها ← ملاحظتها. */
  initialHandled?: Readonly<Record<number, string>>;
  /** رمز خطأ يظهر شريطاً عند العرض (فشل معالجة سابقة). */
  initialError?: string;
  /** رمز خطأ يرجع عند تأكيد المعالجة (409 عولجت مسبقاً). */
  conflict?: string;
};

export function SiteMessagesDemo({ mode = "ready", initialFilters = noSiteMessageFilters, initialOpenId, initialHandlingId, initialHandled = {}, initialError, conflict }: SiteMessagesDemoProps) {
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [openId, setOpenId] = useState<number | null>(initialOpenId ?? null);
  const [handlingId, setHandlingId] = useState<number | null>(initialHandlingId ?? null);
  const [note, setNote] = useState("");
  const [handled, setHandled] = useState<Record<number, string>>({ ...initialHandled });
  const [error, setError] = useState<string | undefined>(initialError);

  const current = (message: SiteMessage): SiteMessage => (message.id !== undefined && handled[message.id] !== undefined ? handledMessage(message, handled[message.id]) : message);
  const all = siteMessagesList.map(current);

  const matching = mode === "empty" ? [] : all.filter((message) => (!filters.type || message.type === filters.type) && (!filters.status || message.status === filters.status));
  const lastPage = Math.max(1, Math.ceil(matching.length / perPage));
  const pageNumber = Math.min(page, lastPage);
  const result: SiteMessagesPage = {
    data: matching.slice((pageNumber - 1) * perPage, pageNumber * perPage),
    meta: { current_page: pageNumber, last_page: lastPage, per_page: perPage, total: matching.length },
  };
  const messages: Loadable<SiteMessagesPage> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: result };

  const selected = all.find((message) => message.id === openId) ?? null;
  const handling = all.find((message) => message.id === handlingId) ?? null;

  return (
    <SiteMessagesView
      messages={messages}
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
      canHandle
      selected={selected}
      onOpen={(message) => setOpenId(message.id ?? null)}
      onClose={() => setOpenId(null)}
      handling={handling}
      note={note}
      onNoteChange={setNote}
      onHandle={(message) => {
        setHandlingId(message.id ?? null);
        setNote("");
        setError(undefined);
      }}
      onHandleClose={() => setHandlingId(null)}
      onHandleConfirm={() => {
        if (conflict) {
          // 409: عولجت من جهة أخرى. تُغلق النافذة ويظهر الشريط.
          setHandlingId(null);
          setError(conflict);
          return;
        }
        const id = handling?.id;
        if (id !== undefined) setHandled((previous) => ({ ...previous, [id]: note }));
        setHandlingId(null);
      }}
      handleError={error}
      onRetry={() => {}}
    />
  );
}

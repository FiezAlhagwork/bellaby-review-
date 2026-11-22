"use client";

import { useState } from "react";
import { LegalDocumentsView, noLegalDocumentFilters } from "@/features/legal/views/LegalDocumentsView";
import { legalDocuments } from "@/mocks/legal";

// غلاف تفاعلي لصفحة الرسم (I15): يملك الفلاتر والصفحة، ويصفّي كما يفعل GET /legal-documents. «قريبة الانتهاء» بمدة «تنبيه انتهاء العقود» (30 يوماً). لا يُنقل للإنتاج.

type LegalDocumentsDemoProps = { expiringOnly?: boolean; mode?: "ready" | "loading" | "error" | "empty" };

const EXPIRING_DAYS = 30;
const PER_PAGE = 10;

export function LegalDocumentsDemo({ expiringOnly = false, mode = "ready" }: LegalDocumentsDemoProps) {
  const [filters, setFilters] = useState({ ...noLegalDocumentFilters, expiringOnly });
  const [page, setPage] = useState(1);

  const rows = (mode === "empty" ? [] : legalDocuments).filter(
    (doc) => (filters.category === null || doc.category === filters.category) && (filters.status === null || doc.status === filters.status) && (!filters.expiringOnly || doc.status === "EXPIRING"),
  );

  return (
    <LegalDocumentsView
      documents={
        mode === "loading"
          ? { status: "loading" }
          : mode === "error"
            ? { status: "error", code: "too_many_requests" }
            : { status: "ready", data: { data: rows.slice((page - 1) * PER_PAGE, page * PER_PAGE), meta: { current_page: page, last_page: Math.max(1, Math.ceil(rows.length / PER_PAGE)), per_page: PER_PAGE, total: rows.length } } }
      }
      filters={filters}
      onFiltersChange={(next) => {
        setFilters(next);
        setPage(1);
      }}
      expiringWithinDays={EXPIRING_DAYS}
      onPageChange={setPage}
      onPerPageChange={() => {}}
      canCreate
      onNewDocument={() => {}}
      onOpenDocument={() => {}}
    />
  );
}

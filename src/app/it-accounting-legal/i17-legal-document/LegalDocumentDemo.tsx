"use client";

import { useState } from "react";
import { LegalDocumentDetailsView, type RenewForm } from "@/features/legal/views/LegalDocumentDetailsView";
import type { LegalDocument } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { legalAuthor, legalToday } from "@/mocks/legal";

// غلاف تفاعلي لصفحة الرسم (I17): يملك الوثيقة والنافذتين. التجديد POST /versions، والإنهاء POST /intentional-expiry، محلياً. لا يُنقل للإنتاج.

type LegalDocumentDemoProps = {
  document: LegalDocument;
  initialRenew?: boolean;
  initialExpiring?: boolean;
  /** خطأ الإجراء: 409. */
  actionError?: string;
  mode?: "ready" | "loading" | "error" | "not-found";
};

export function LegalDocumentDemo({ document: initial, initialRenew = false, initialExpiring = false, actionError, mode = "ready" }: LegalDocumentDemoProps) {
  const [doc, setDoc] = useState(initial);
  const [renew, setRenew] = useState<RenewForm | null>(initialRenew ? { reason: "", file: [], startsOn: initial.expires_on ?? null, expiresOn: null } : null);
  const [expiring, setExpiring] = useState(initialExpiring);
  const [reason, setReason] = useState("");

  const loadable: Loadable<LegalDocument> = mode === "loading" ? { status: "loading" } : mode === "not-found" ? { status: "error", code: "not_found" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: doc };

  return (
    <LegalDocumentDetailsView
      document={loadable}
      today={legalToday}
      canManage
      renew={renew}
      onRenewChange={setRenew}
      onRenewFileSelect={(files) => renew && setRenew({ ...renew, file: files.slice(0, 1).map((file) => ({ id: "renew-file", name: file.name, size: file.size, status: "done" as const })) })}
      onRenewFileRemove={() => renew && setRenew({ ...renew, file: [] })}
      onRenewSubmit={() => {
        if (!renew || actionError) return;
        const version = (doc.version ?? 1) + 1;
        const name = renew.file[0]?.name ?? "";
        setDoc({
          ...doc,
          version,
          versions: [...(doc.versions ?? []), { version, reason: renew.reason, file: { upload_id: `renew-${version}`, url: "https://files.trust.example/legal/renew", name, mime: "application/pdf" }, created_at: "2026-11-18T10:00:00Z", by: legalAuthor }],
          starts_on: renew.startsOn,
          expires_on: renew.expiresOn,
          status: "ACTIVE",
        });
        setRenew(null);
      }}
      expiring={expiring}
      onExpiringChange={setExpiring}
      expiryReason={reason}
      onExpiryReasonChange={setReason}
      onExpirySubmit={() => {
        if (actionError || reason.trim() === "") return;
        setDoc({ ...doc, status: "INTENTIONALLY_EXPIRED", intentional_expiry_reason: reason });
        setExpiring(false);
        setReason("");
      }}
      actionError={actionError}
      onDownloadFile={() => {}}
      onBack={() => {}}
    />
  );
}

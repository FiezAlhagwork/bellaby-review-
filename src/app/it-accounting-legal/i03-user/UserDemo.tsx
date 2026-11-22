"use client";

import { useState } from "react";
import { UserDetailsView } from "@/features/users/views/UserDetailsView";
import type { DeactivationPreview, User } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { findUser, profileOf, repPreview, webPreview } from "@/mocks/users";

// غلاف تفاعلي لصفحة الرسم (I03): يملك المستخدم والنافذتين. المعاينة GET /deactivation-preview، والتعطيل POST /deactivate { reason }،
// والتفعيل POST /activate، كلها محلياً. لا يُنقل للإنتاج.

type UserDemoProps = {
  userId?: number;
  /** العقد والراتب ظاهران (بعين المدير التنفيذي أو مدير المحاسبة). */
  withContract?: boolean;
  initialPreview?: boolean;
  mode?: "ready" | "loading" | "error" | "not-found";
};

export function UserDemo({ userId = 21, withContract = false, initialPreview = false, mode = "ready" }: UserDemoProps) {
  const [data, setData] = useState<User>(() => findUser(userId));
  const [previewOpen, setPreviewOpen] = useState(initialPreview);
  const [reason, setReason] = useState("");
  const [activating, setActivating] = useState(false);

  const user: Loadable<User> = mode === "loading" ? { status: "loading" } : mode === "not-found" ? { status: "error", code: "not_found" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data };
  const preview: Loadable<DeactivationPreview> | null = previewOpen ? { status: "ready", data: data.type === "REP" ? repPreview : webPreview } : null;

  return (
    <UserDetailsView
      user={user}
      contract={profileOf(data, withContract).contract}
      canManage
      preview={preview}
      onOpenPreview={() => setPreviewOpen(true)}
      onClosePreview={() => setPreviewOpen(false)}
      reason={reason}
      onReasonChange={setReason}
      onDeactivate={() => {
        setData({ ...data, is_active: false });
        setPreviewOpen(false);
        setReason("");
      }}
      confirmingActivate={activating}
      onConfirmingActivateChange={setActivating}
      onActivate={() => {
        setData({ ...data, is_active: true });
        setActivating(false);
      }}
      onBack={() => {}}
    />
  );
}

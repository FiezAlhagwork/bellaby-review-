"use client";

import { useState } from "react";
import { AppVersionView, type AppVersionDraft } from "@/features/settings/views/AppVersionView";
import type { AppVersionSettings } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { appVersion } from "@/mocks/site-content";

// غلاف تفاعلي لصفحة الرسم (I09): يملك الإعداد والمسودة. الحفظ كما تفعل PUT /settings/app-version. لا يُنقل للإنتاج.

type AppVersionDemoProps = { editing?: boolean; initialErrors?: Readonly<Record<string, string>>; mode?: "ready" | "loading" | "error" };

export function AppVersionDemo({ editing = false, initialErrors = {}, mode = "ready" }: AppVersionDemoProps) {
  const [data, setData] = useState<AppVersionSettings>(appVersion);
  const [draft, setDraft] = useState<AppVersionDraft | null>(editing ? { min: "1.4.0", latest: data.latest_app_version ?? "", apkUrl: data.apk_url ?? "" } : null);
  const [errors, setErrors] = useState(initialErrors);

  const version: Loadable<AppVersionSettings> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data };

  return (
    <AppVersionView
      version={version}
      canManage
      draft={draft}
      onDraftChange={(next) => {
        setDraft(next);
        setErrors({});
      }}
      onSave={() => {
        if (!draft) return;
        setData({ min_app_version: draft.min.trim(), latest_app_version: draft.latest.trim(), apk_url: draft.apkUrl.trim() });
        setDraft(null);
      }}
      errors={errors}
    />
  );
}

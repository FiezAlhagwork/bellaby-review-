"use client";

import { useState } from "react";
import { SettingsView, draftOf, settingValue, verificationKeys, type SettingKey, type SettingsDraft } from "@/features/settings/views/SettingsView";
import type { Settings } from "@/lib/api/types";
import type { Loadable } from "@/lib/loadable";
import { settings as initialSettings } from "@/mocks/settings";

// غلاف تفاعلي لصفحة الرسم (E13): يملك الإعدادات والمسودة. الحفظ محلياً كما تفعل PATCH /settings، وإن تغيّرت قيمة تحقق ظهر شريط «تسري على السجلات الجديدة وحدها». لا يُنقل للإنتاج.

type SettingsDemoProps = { editing?: boolean; noteShown?: boolean; mode?: "ready" | "loading" | "error" };

const PREFIX = "report_deadline_work_days.";

function apply(settings: Settings, draft: SettingsDraft): Settings {
  let next: Settings = { ...settings };
  for (const [key, value] of Object.entries(draft) as [SettingKey, number | null][]) {
    if (value === null) continue;
    next = key.startsWith(PREFIX) ? { ...next, report_deadline_work_days: { ...next.report_deadline_work_days, [key.slice(PREFIX.length)]: value } } : { ...next, [key]: value };
  }
  return next;
}

export function SettingsDemo({ editing = false, noteShown = false, mode = "ready" }: SettingsDemoProps) {
  const [data, setData] = useState<Settings>(initialSettings);
  const [draft, setDraft] = useState<SettingsDraft | null>(() => (editing ? draftOf(initialSettings) : null));
  const [note, setNote] = useState(noteShown);

  const settings: Loadable<Settings> = mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data };

  return (
    <SettingsView
      settings={settings}
      canManage
      draft={draft}
      onDraftChange={setDraft}
      onSave={() => {
        if (!draft) return;
        setNote(verificationKeys.some((key) => draft[key] !== undefined && draft[key] !== settingValue(data, key)));
        setData(apply(data, draft));
        setDraft(null);
      }}
      verificationSaved={note}
      onDismissNote={() => setNote(false)}
    />
  );
}

"use client";

import { MyProfileView } from "@/features/profile/views/MyProfileView";
import { myProfile, myProfileFinal } from "@/mocks/me";

// غلاف صفحة الرسم (G05): GET /me/profile لعامل المستودع سليم القاسم. لا يُنقل للإنتاج.

type ProfileDemoProps = { provisional?: boolean; mode?: "ready" | "loading" | "error" };

export function ProfileDemo({ provisional = false, mode = "ready" }: ProfileDemoProps) {
  return (
    <MyProfileView
      profile={mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : { status: "ready", data: provisional ? myProfile : myProfileFinal }}
      onOpenTasks={() => {}}
    />
  );
}

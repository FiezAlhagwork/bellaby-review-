"use client";

import { RepProfileView } from "@/features/reps/views/RepProfileView";
import type { Loadable } from "@/lib/loadable";
import { repBalances, repBalancesNegative, repDistributed, repReports, repScores, repTodaySession, repTodayVisits, repUser } from "@/mocks/rep-profile";

// غلاف لصفحة الرسم: يمرّر أقسام الصفحة الستة بحالاتها المستقلة. `balance` يختار الرصيد العادي أو السالب بعد تعارض. `mode` يحاكي التحميل أو الخطأ أو غير موجود،
// و`partial` يُفشل قسم الرصيد وحده فيبقى غيره. في الإنتاج تحلّ محلّه حاوية تطلب GET /users/{id} و/attendance-sessions و/visits و/stock/balances و/daily-reports و/scores. لا يُنقل للإنتاج.

type RepProfileDemoProps = {
  balance?: "default" | "negative";
  mode?: "ready" | "loading" | "error" | "not-found" | "partial";
};

const ready = <T,>(data: T): Loadable<T> => ({ status: "ready", data });

export function RepProfileDemo({ balance = "default", mode = "ready" }: RepProfileDemoProps) {
  const rep: Loadable<typeof repUser> =
    mode === "loading" ? { status: "loading" } : mode === "error" ? { status: "error", code: "too_many_requests" } : mode === "not-found" ? { status: "error", code: "not_found" } : ready(repUser);

  return (
    <RepProfileView
      rep={rep}
      session={ready(repTodaySession)}
      todayVisits={ready(repTodayVisits)}
      balances={mode === "partial" ? { status: "error", code: "too_many_requests" } : ready(balance === "negative" ? repBalancesNegative : repBalances)}
      distributed={ready(repDistributed)}
      reports={ready(repReports)}
      scores={ready(repScores)}
      onOpenVisit={() => {}}
      onOpenAllVisits={() => {}}
      onOpenReport={() => {}}
      onBack={() => {}}
    />
  );
}

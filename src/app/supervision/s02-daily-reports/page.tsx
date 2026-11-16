import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import type { ShellUserKey } from "@/mocks/shell-users";
import { DailyReportsDemo } from "./DailyReportsDemo";

// S02 · التقارير اليومية. الحالات في SCREENS.md (supervisor وread-only)، ومعها الحالات العامة للقوائم. الفلاتر والترقيم تفاعلية.
// السوبرفايزر: بانتظار تقييمه أولاً ومعها الوقت المتبقي من 24 ساعة عمل. مدير المكتب العلمي: كل المندوبين، بلا تقييم (daily_reports.rate غير ممنوحة له).

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "التقارير اليومية" }];

const shell = (user: ShellUserKey, node: ReactNode) => (
  <ShellScreen user={user} activeKey="daily-reports" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "S02",
  name: "التقارير اليومية",
  states: [
    {
      key: "supervisor",
      label: "السوبرفايزر",
      when: "14 تقريراً: بانتظار تقييمه أولاً (5) بالوقت المتبقي من مهلة 24 ساعة عمل («متبقٍّ…» أو «متأخر»)، ثم المقيَّمة بدرجاتها. فلاتر المندوب والفترة والحالة. الصف يفتح التقييم (S03).",
      node: shell("supervisor", <DailyReportsDemo canRate />),
    },
    {
      key: "read-only",
      label: "للقراءة فقط",
      when: "مدير المكتب العلمي يرى تقارير كل المندوبين من الأحدث، بلا وقت متبقٍّ ولا تقييم (التقييم للسوبرفايزر وحده).",
      node: shell("scientific_manager", <DailyReportsDemo canRate={false} />),
    },
    ...systemStates({
      loading: shell("supervisor", <DailyReportsDemo canRate mode="loading" />),
      empty: shell("supervisor", <DailyReportsDemo canRate mode="empty" />),
      error: shell("supervisor", <DailyReportsDemo canRate mode="error" />),
      // الوكيل لا يقرأ التقارير اليومية: عنصرها غير ظاهر له، وفتح رابطها يُظهر «لا صلاحية».
      forbidden: (
        <ShellScreen user="agent" activeKey="home-agent" breadcrumbs={breadcrumbs}>
          <ForbiddenState />
        </ShellScreen>
      ),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function DailyReportsPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

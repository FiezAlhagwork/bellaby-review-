import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { ManagerVisitsDemo } from "./ManagerVisitsDemo";

// M10 · زياراتي (موبايل). الحالة في SCREENS.md (default)، ومعها الحالات العامة للقوائم وشهر بلا هدف. عدد زياراتي هذا الشهر مقابل الهدف، وقائمتها من الأحدث بفلتر الفترة وترقيم.
// لمدير المبيعات (manager_visits.create): السوبرفايزر «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "زياراتي" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="sales_manager" activeKey="my-visits" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "M10",
  name: "زياراتي",
  states: [
    {
      key: "default",
      label: "الافتراضي",
      when: "13 زيارة من 20 هدف الشهر (شريط تقدم)، وقائمتها من الأحدث: الجهة (عميل أو جهة زيارة) والهدف والنتيجة والملاحظات والوقت. فلتر الفترة (الشهر الجاري افتراضياً) وترقيم. «زيارة جديدة» في الرأس.",
      node: shell(<ManagerVisitsDemo />),
    },
    {
      key: "no-goal",
      label: "بلا هدف",
      when: "لا هدف لزيارات المدير في خطة الشهر: بطاقة الهدف «لا بيانات لهذا الشهر»، والقائمة كما هي.",
      node: shell(<ManagerVisitsDemo noGoal />),
    },
    ...systemStates({
      loading: shell(<ManagerVisitsDemo mode="loading" />),
      empty: shell(<ManagerVisitsDemo mode="empty" />),
      error: shell(<ManagerVisitsDemo mode="error" />),
      // السوبرفايزر لا يملك manager_visits.create: عنصر «زياراتي» غير ظاهر له، وفتح رابطه يُظهر «لا صلاحية».
      forbidden: (
        <ShellScreen user="supervisor" activeKey="home-supervisor" breadcrumbs={breadcrumbs}>
          <ForbiddenState />
        </ShellScreen>
      ),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function MyVisitsPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

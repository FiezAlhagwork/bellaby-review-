import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import type { ShellUserKey } from "@/mocks/shell-users";
import { VisitsDemo } from "./VisitsDemo";

// S05 · الزيارات. الحالات في SCREENS.md (list وmap وflagged-filter)، ومعها الحالات العامة للقوائم. الفلاتر والترقيم والتبديل بين القائمة والخريطة تفاعلية.
// الخريطة مستطيل وهمي بنقاط (بدء ● وإنهاء ■، بلا مسار). السوبرفايزر يراجع زيارات مندوبيه، والمراقبة تدخل منها إلى المشكوك فيها (S06).

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "الزيارات" }];

const shell = (user: ShellUserKey, node: ReactNode) => (
  <ShellScreen user={user} activeKey="visits" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "S05",
  name: "الزيارات",
  states: [
    {
      key: "list",
      label: "قائمة",
      when: "زيارات المندوبين من الأحدث: الجهة والوقت والمدة والمسافة وحالة التحقق وعلاماتها. فلاتر المندوب والفترة وحالة التحقق وترقيم. الصف يفتح تفاصيل الزيارة (S06).",
      node: shell("supervisor", <VisitsDemo />),
    },
    {
      key: "map",
      label: "خريطة",
      when: "«خريطة» في المفتاح: نقطتا بدء الزيارة (●) وإنهائها (■) لزيارات الصفحة، بلا مسار بينهما. النقطة تحدّد زيارتها فتظهر بطاقتها وزر «فتح الزيارة». الملوّن: مشكوك فيها وحدها.",
      node: shell("supervisor", <VisitsDemo initialMode="map" initialSelectedVisitId={33093} />),
    },
    {
      key: "flagged-filter",
      label: "المشكوك فيها",
      when: "فلتر «التحقق: مشكوك فيها» (للمراقبة): ثلاث زيارات بعلاماتها (خارج النطاق، موقع مزوَّر، زيارة مكررة). كل صف يقود إلى قرارها في S06.",
      node: shell("monitoring", <VisitsDemo initialFilters={{ repId: null, range: { from: null, to: null }, verification: "FLAGGED" }} />),
    },
    ...systemStates({
      loading: shell("supervisor", <VisitsDemo mode="loading" />),
      empty: shell("supervisor", <VisitsDemo mode="empty" />),
      error: shell("supervisor", <VisitsDemo mode="error" />),
      // الوكيل لا يقرأ زيارات المندوبين: عنصرها غير ظاهر له، وفتح رابطها يُظهر «لا صلاحية».
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

export default function VisitsPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

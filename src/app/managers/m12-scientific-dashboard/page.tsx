import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { ScientificDashboardDemo } from "./ScientificDashboardDemo";

// M12 · لوحة المكتب العلمي. الحالة في SCREENS.md (default)، ومعها «بلا خطة» والحالات العامة للوحة.
// لمدير المكتب العلمي (dashboard.scientific_manager): السوبرفايزر «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="scientific_manager" activeKey="home-scientific-manager" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "M12",
  name: "لوحة المكتب العلمي",
  states: [
    {
      key: "default",
      label: "الافتراضي",
      when: "ثلاث بطاقات مقابل خطة الشهر (الزيارات، والفئات المستهدفة، والمنتجات)، والتغطية لكل محافظة (الجهات المزورة وتوفر المنتجات)، وزيارات اليوم على الخريطة.",
      node: shell(<ScientificDashboardDemo />),
    },
    {
      key: "no-plan",
      label: "بلا خطة",
      when: "لا خطة معتمدة للشهر (404 من الخطة): شريط تحذير وبطاقات «لا بيانات»، والتغطية والخريطة كما هي.",
      node: shell(<ScientificDashboardDemo noPlan />),
    },
    ...systemStates({
      loading: shell(<ScientificDashboardDemo mode="loading" />),
      error: shell(<ScientificDashboardDemo mode="error" />),
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

export default function ScientificDashboardPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

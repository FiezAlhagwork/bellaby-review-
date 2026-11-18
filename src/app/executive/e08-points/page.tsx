import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { ScoresDemo } from "./ScoresDemo";

// E08 · النقاط الشهرية. الحالتان في SCREENS.md (provisional وfinal)، ومعهما الحالات العامة.
// points.view: مدير المبيعات «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "النقاط" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="executive" activeKey="points" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "E08",
  name: "النقاط الشهرية",
  states: [
    {
      key: "provisional",
      label: "مبدئية",
      when: "تشرين الثاني: جدول لكل مجموعة مقارنة (المندوبون، والإشراف، والمستودع) بالموظف ونقاطه وتفصيلها حسب الأوزان، من الأعلى. شارة «عليه خصم» لمن يُتخطّى في موظف الشهر.",
      node: shell(<ScoresDemo />),
    },
    {
      key: "final",
      label: "نهائية",
      when: "تشرين الأول المغلق: النقاط مثبّتة وشريط «نقاط نهائية».",
      node: shell(<ScoresDemo initialMonth="2026-10" />),
    },
    ...systemStates({
      loading: shell(<ScoresDemo mode="loading" />),
      empty: shell(<ScoresDemo mode="empty" />),
      error: shell(<ScoresDemo mode="error" />),
      forbidden: (
        <ShellScreen user="sales_manager" activeKey="home-sales-manager" breadcrumbs={breadcrumbs}>
          <ForbiddenState />
        </ShellScreen>
      ),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function PointsPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

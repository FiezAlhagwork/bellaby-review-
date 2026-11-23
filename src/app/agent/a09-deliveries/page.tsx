import type { ReactNode } from "react";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { AgentDeliveriesDemo } from "./AgentDeliveriesDemo";

// A09 · التسليمات. الحالات في SCREENS.md (default وfilter-unpaid)، ومعها الحالات العامة. الـ view نفسه في M06 بلا فلتر الوكيل.

const shell = (node: ReactNode) => (
  <ShellScreen user="agent" activeKey="agent-deliveries" breadcrumbs={[{ label: "الرئيسية", href: "#" }, { label: "التسليمات" }]}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "A09",
  name: "التسليمات",
  states: [
    { key: "default", label: "مختلطة", when: "تسليمات وكالة الياسمين: غير مسدد ومتأخر ومسدد وبانتظار الاعتماد ومشطوب.", node: shell(<AgentDeliveriesDemo />) },
    { key: "filter-unpaid", label: "غير المسدد", when: "فلتر الحالة «غير مسدد».", node: shell(<AgentDeliveriesDemo unpaidOnly />) },
    ...systemStates({
      loading: shell(<AgentDeliveriesDemo mode="loading" />),
      empty: shell(<AgentDeliveriesDemo mode="empty" />),
      error: shell(<AgentDeliveriesDemo mode="error" />),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function AgentDeliveriesPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

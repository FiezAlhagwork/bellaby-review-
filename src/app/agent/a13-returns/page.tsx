import type { ReactNode } from "react";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { AgentReturnsDamageDemo } from "./AgentReturnsDamageDemo";

// A13 · المرتجعات والتالف. الحالات في SCREENS.md (returns وdamage)، ومعها الحالات العامة.

const shell = (node: ReactNode) => (
  <ShellScreen user="agent" activeKey="agent-returns" breadcrumbs={[{ label: "الرئيسية", href: "#" }, { label: "المرتجعات والتالف" }]}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "A13",
  name: "المرتجعات والتالف",
  states: [
    { key: "returns", label: "مرتجعات الصيدليات", when: "معلّق، وأعيد للمخزون، وتالف مقبول بمسؤوليته، ومرفوض بسببه.", node: shell(<AgentReturnsDamageDemo />) },
    { key: "damage", label: "تقارير التالف", when: "تقارير تالف رصيدي: معلّق، ومقبول بمسؤوليته، ومرفوض بسببه.", node: shell(<AgentReturnsDamageDemo initialTab="damage" />) },
    ...systemStates({
      loading: shell(<AgentReturnsDamageDemo mode="loading" />),
      empty: shell(<AgentReturnsDamageDemo mode="empty" />),
      error: shell(<AgentReturnsDamageDemo mode="error" />),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function AgentReturnsPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

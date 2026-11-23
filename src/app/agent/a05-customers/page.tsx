import type { ReactNode } from "react";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { AgentCustomersDemo } from "./AgentCustomersDemo";

// A05 · عملائي. الحالات في SCREENS.md (default وsearch)، ومعها الحالات العامة.

const shell = (node: ReactNode) => (
  <ShellScreen user="agent" activeKey="agent-customers" breadcrumbs={[{ label: "الرئيسية", href: "#" }, { label: "العملاء" }]}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "A05",
  name: "عملائي",
  states: [
    { key: "default", label: "الافتراضي", when: "صيدليات وكالة الياسمين في دمشق وريفها: الاسم و«مربوط»، والمحافظة، والهاتف، وأول تسليم، والمستحق. و«عميل جديد».", node: shell(<AgentCustomersDemo />) },
    { key: "search", label: "بحث", when: "البحث بالاسم «الشفاء».", node: shell(<AgentCustomersDemo initialQuery="الشفاء" />) },
    ...systemStates({
      loading: shell(<AgentCustomersDemo mode="loading" />),
      empty: shell(<AgentCustomersDemo mode="empty" />),
      error: shell(<AgentCustomersDemo mode="error" />),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function AgentCustomersPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

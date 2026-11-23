import type { ReactNode } from "react";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { AgentDamageDemo } from "./AgentDamageDemo";

// A14 · تقرير تالف. الحالات في SCREENS.md (empty وsubmitted). الـ view نفسه في W20 بموقع الوكيل.

const shell = (node: ReactNode) => (
  <ShellScreen user="agent" activeKey="agent-returns" breadcrumbs={[{ label: "الرئيسية", href: "#" }, { label: "المرتجعات والتالف", href: "#" }, { label: "تقرير تالف" }]}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "A14",
  name: "تقرير تالف",
  states: [
    { key: "empty", label: "فارغ", when: "الموقع مقفل على وكالة الياسمين، والسبب، والأسطر من رصيدي، والملاحظة، والمرفقات.", node: shell(<AgentDamageDemo />) },
    { key: "submitted", label: "معلّق", when: "رُفع التقرير بانتظار قرار مدير المبيعات.", node: shell(<AgentDamageDemo saved />) },
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function AgentDamagePage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

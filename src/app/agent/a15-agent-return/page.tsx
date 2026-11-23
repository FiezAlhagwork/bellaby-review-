import type { ReactNode } from "react";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { AgentReturnDemo } from "./AgentReturnDemo";

// A15 · طلب إرجاع للمستودع. الحالات في SCREENS.md (empty وrecall-reason وsubmitted). الإرجاع مسموح للدفعة الموقوفة (القرار 2). النموذج نفسه في M03.

const shell = (node: ReactNode) => (
  <ShellScreen user="agent" activeKey="agent-return-to-warehouse" breadcrumbs={[{ label: "الرئيسية", href: "#" }, { label: "الإرجاع للمستودع", href: "#" }, { label: "طلب إرجاع" }]}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "A15",
  name: "طلب إرجاع للمستودع",
  states: [
    { key: "empty", label: "فارغ", when: "السبب (إلزامي)، والملاحظة، وأسطر من رصيدي.", node: shell(<AgentReturnDemo />) },
    { key: "recall-reason", label: "دفعة موقوفة", when: "سطر من LOT-2609-C الموقوفة: السبب «سحب دفعة» يُختار تلقائياً ويُقفل.", node: shell(<AgentReturnDemo preset="recall" />) },
    { key: "submitted", label: "بانتظار القرار", when: "أُنشئ الطلب بانتظار قرار مدير المبيعات أو المدير التنفيذي.", node: shell(<AgentReturnDemo saved />) },
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function AgentReturnPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

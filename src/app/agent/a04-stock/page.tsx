import type { ReactNode } from "react";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { AgentStockDemo } from "./AgentStockDemo";

// A04 · رصيدي. الحالات في SCREENS.md (default وsuspended-batch وnear-expiry)، ومعها الحالات العامة.

const shell = (node: ReactNode) => (
  <ShellScreen user="agent" activeKey="agent-stock" breadcrumbs={[{ label: "الرئيسية", href: "#" }, { label: "رصيدي" }]}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "A04",
  name: "رصيدي",
  states: [
    { key: "default", label: "الافتراضي", when: "ثلاثة أصناف بدفعاتها وإجمالي كل صنف.", node: shell(<AgentStockDemo />) },
    { key: "suspended-batch", label: "دفعة موقوفة", when: "LOT-2609-C موقوفة: «لا تُسلَّم لصيدلية، تُرجَع بطلب إرجاع»، ودفعة قريبة الانتهاء.", node: shell(<AgentStockDemo state="suspended-batch" />) },
    { key: "near-expiry", label: "قريبة الانتهاء", when: "LOT-2611-A تنتهي 14 كانون الأول (ضمن 60 يوماً): شريط وشارة على الدفعة.", node: shell(<AgentStockDemo state="near-expiry" />) },
    ...systemStates({
      loading: shell(<AgentStockDemo mode="loading" />),
      empty: shell(<AgentStockDemo mode="empty" />),
      error: shell(<AgentStockDemo mode="error" />),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function AgentStockPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

import type { ReactNode } from "react";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { AgentReceivablesDemo } from "./AgentReceivablesDemo";

// A11 · المستحقات. الحالات في SCREENS.md (default وdue-soon وoverdue)، ومعها الحالات العامة.

const shell = (node: ReactNode) => (
  <ShellScreen user="agent" activeKey="agent-receivables" breadcrumbs={[{ label: "الرئيسية", href: "#" }, { label: "المستحقات" }]}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "A11",
  name: "المستحقات",
  states: [
    { key: "default", label: "الافتراضي", when: "غير المسدد بالموعد والأيام الباقية، ونسبة التحصيل والمستحق، ولا متأخر.", node: shell(<AgentReceivablesDemo />) },
    { key: "due-soon", label: "مستحق قريباً", when: "تسليم يستحق خلال 3 أيام بشارة.", node: shell(<AgentReceivablesDemo state="due-soon" />) },
    { key: "overdue", label: "متأخر", when: "تسليمان متأخران أول القائمة بأيام تأخرهما.", node: shell(<AgentReceivablesDemo state="overdue" />) },
    ...systemStates({
      loading: shell(<AgentReceivablesDemo mode="loading" />),
      empty: shell(<AgentReceivablesDemo mode="empty" />),
      error: shell(<AgentReceivablesDemo mode="error" />),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function AgentReceivablesPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

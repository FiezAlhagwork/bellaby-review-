import type { ReactNode } from "react";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { AgentReturnRequestsDemo } from "./AgentReturnRequestsDemo";

// A16 · طلبات الإرجاع للمستودع. الحالة في SCREENS.md (default: معلّق، بالطريق، مستلم، مرفوض بسبب)، ومعها الحالات العامة.

const shell = (node: ReactNode) => (
  <ShellScreen user="agent" activeKey="agent-return-to-warehouse" breadcrumbs={[{ label: "الرئيسية", href: "#" }, { label: "الإرجاع للمستودع" }]}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "A16",
  name: "طلبات الإرجاع للمستودع",
  states: [
    { key: "default", label: "الافتراضي", when: "معلّق، وبالطريق، ومستلم، ومرفوض بسببه.", node: shell(<AgentReturnRequestsDemo />) },
    ...systemStates({
      loading: shell(<AgentReturnRequestsDemo mode="loading" />),
      empty: shell(<AgentReturnRequestsDemo mode="empty" />),
      error: shell(<AgentReturnRequestsDemo mode="error" />),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function AgentReturnRequestsPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

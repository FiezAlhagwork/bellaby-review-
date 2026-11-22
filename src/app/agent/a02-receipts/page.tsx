import type { ReactNode } from "react";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { AgentReceiptsDemo } from "./AgentReceiptsDemo";

// A02 · الاستلامات. الحالة في SCREENS.md (default: بالطريق ومستلم)، ومعها الحالات العامة.

const shell = (node: ReactNode) => (
  <ShellScreen user="agent" activeKey="agent-receipts" breadcrumbs={[{ label: "الرئيسية", href: "#" }, { label: "الاستلامات" }]}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "A02",
  name: "الاستلامات",
  states: [
    { key: "default", label: "الافتراضي", when: "الصرف إلى وكالة الياسمين: بالطريق ومستلم وملغى، بالرقم والتاريخ والأصناف والكمية.", node: shell(<AgentReceiptsDemo />) },
    ...systemStates({
      loading: shell(<AgentReceiptsDemo mode="loading" />),
      empty: shell(<AgentReceiptsDemo mode="empty" />),
      error: shell(<AgentReceiptsDemo mode="error" />),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function AgentReceiptsPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

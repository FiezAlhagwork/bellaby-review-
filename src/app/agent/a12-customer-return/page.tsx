import type { ReactNode } from "react";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { CustomerReturnDemo } from "./CustomerReturnDemo";

// A12 · مرتجع من صيدلية. الحالات في SCREENS.md (empty وover-returnable وsubmitted). القرار 7.

const shell = (node: ReactNode) => (
  <ShellScreen user="agent" activeKey="agent-returns" breadcrumbs={[{ label: "الرئيسية", href: "#" }, { label: "المرتجعات والتالف", href: "#" }, { label: "مرتجع جديد" }]}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "A12",
  name: "مرتجع من صيدلية",
  states: [
    { key: "empty", label: "فارغ", when: "التسليم الأصلي وسطره، والكمية حتى القابل للإرجاع، والسبب، والملاحظة.", node: shell(<CustomerReturnDemo />) },
    { key: "over-returnable", label: "أكثر من المسموح", when: "12 علبة من سطر المسموح فيه 8: «المسموح 8 (المسلَّم 20، المقبول 10، المعلّق 2)».", node: shell(<CustomerReturnDemo preset="over" />) },
    { key: "submitted", label: "معلّق", when: "سُجّل المرتجع بانتظار قرار الإدارة.", node: shell(<CustomerReturnDemo saved />) },
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function CustomerReturnPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

import type { ReactNode } from "react";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { linkedCustomerId, unlinkedCustomerId } from "@/mocks/customer-page";
import { AgentCustomerDemo } from "./AgentCustomerDemo";

// A07 · صفحة العميل. الحالات في SCREENS.md (default وlinked-point)، ومعها الأقسام وغير الموجود والحالات العامة. الـ view نفسه في M05 بلا الزيارات.

const shell = (node: ReactNode) => (
  <ShellScreen user="agent" activeKey="agent-customers" breadcrumbs={[{ label: "الرئيسية", href: "#" }, { label: "العملاء", href: "#" }, { label: "العميل" }]}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "A07",
  name: "صفحة العميل",
  states: [
    { key: "default", label: "الافتراضي", when: "صيدلية الحياة (غير مربوطة): بياناتها، وتسليماتها، والسداد والمرتجعات أقساماً.", node: shell(<AgentCustomerDemo customerId={unlinkedCustomerId} />) },
    { key: "linked-point", label: "مربوط بجهة زيارة", when: "صيدلية ابن سينا مربوطة بجهة زيارة: بطاقة الجهة باسمها ونوعها.", node: shell(<AgentCustomerDemo customerId={linkedCustomerId} />) },
    { key: "payment", label: "السداد", when: "قسم «السداد»: المستحق والمتأخر والمسدَّد.", node: shell(<AgentCustomerDemo customerId={linkedCustomerId} initialTab="payment" />) },
    { key: "returns", label: "المرتجعات", when: "قسم «المرتجعات» بحالاتها.", node: shell(<AgentCustomerDemo customerId={linkedCustomerId} initialTab="returns" />) },
    { key: "not-found", label: "غير موجود", when: "عميل ليس لك أو غير موجود (404).", node: shell(<AgentCustomerDemo customerId={linkedCustomerId} mode="not-found" />) },
    ...systemStates({
      loading: shell(<AgentCustomerDemo customerId={linkedCustomerId} mode="loading" />),
      error: shell(<AgentCustomerDemo customerId={linkedCustomerId} mode="error" />),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function AgentCustomerPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

import type { ReactNode } from "react";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { AgentDashboardDemo } from "./AgentDashboardDemo";

// A01 · لوحة الوكيل. الحالات في SCREENS.md (default وpending-receipt وoverdue-payments)، ومعها الحالات العامة. ياسر الحمصي، وكالة الياسمين.

const shell = (node: ReactNode) => (
  <ShellScreen user="agent" activeKey="home-agent" breadcrumbs={[{ label: "الرئيسية" }]}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "A01",
  name: "لوحة الوكيل",
  states: [
    { key: "default", label: "الافتراضي", when: "المستحق والمدفوع، ولا متأخر ولا صرف بانتظار التأكيد، وسداد مستحق قريباً. المبيعات والعملاء الجدد «لا بيانات» حتى يُعرَّف DashboardSummary.", node: shell(<AgentDashboardDemo />) },
    { key: "pending-receipt", label: "صرف بانتظار التأكيد", when: "صرفان بالطريق: شريط في الأعلى وقائمتهما بزر «تأكيد».", node: shell(<AgentDashboardDemo state="pending-receipt" />) },
    { key: "overdue-payments", label: "سداد متأخر", when: "تسليمان تأخر سدادهما: المتأخر بالأحمر أول القائمة، وخلية «المتأخر».", node: shell(<AgentDashboardDemo state="overdue-payments" />) },
    ...systemStates({
      loading: shell(<AgentDashboardDemo mode="loading" />),
      error: shell(<AgentDashboardDemo mode="error" />),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function AgentDashboardPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

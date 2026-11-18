import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { ExecutiveDashboardDemo } from "./ExecutiveDashboardDemo";

// E01 · لوحة المدير التنفيذي. الحالتان في SCREENS.md (default وprovisional)، ومعهما الحالات العامة للوحة. للعرض لا للتقييم (القرار 15).
// للمدير التنفيذي (dashboard.executive): مدير المبيعات «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="executive" activeKey="home-executive" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "E01",
  name: "لوحة المدير التنفيذي",
  states: [
    {
      key: "default",
      label: "الافتراضي",
      when: "شهر مغلق بأرقام نهائية (تشرين الأول): 7 قرارات تنتظره، والمصاريف من الميزانية، وأدنى موظف بالمهام وبالنقاط، وإنجاز كل موظف، والتارغيت لكل منتج ولكل وكيل، والمصاريف لكل بند، والنقاط لكل مجموعة.",
      node: shell(<ExecutiveDashboardDemo />),
    },
    {
      key: "provisional",
      label: "مبدئي",
      when: "قبل إغلاق الشهر (تشرين الثاني): شريط «أرقام مبدئية» وشارة «مبدئي» على البطاقات.",
      node: shell(<ExecutiveDashboardDemo provisional />),
    },
    ...systemStates({
      loading: shell(<ExecutiveDashboardDemo mode="loading" />),
      error: shell(<ExecutiveDashboardDemo mode="error" />),
      forbidden: (
        <ShellScreen user="sales_manager" activeKey="home-sales-manager" breadcrumbs={breadcrumbs}>
          <ForbiddenState />
        </ShellScreen>
      ),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function ExecutiveDashboardPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

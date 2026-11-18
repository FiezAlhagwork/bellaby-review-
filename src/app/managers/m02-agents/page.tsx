import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { AgentsDemo } from "./AgentsDemo";

// M02 · الوكلاء. الحالة في SCREENS.md (default)، ومعها الحالات العامة للقوائم. جدول مرقّم: الوكيل والمحافظات والرصيد والمبيعات والمستحق.
// لمدير المبيعات (agents.manage): المراقبة «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "الوكلاء" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="sales_manager" activeKey="agents" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "M02",
  name: "الوكلاء",
  states: [
    {
      key: "default",
      label: "الافتراضي",
      when: "ستة وكلاء: الاسم وجهة الاتصال، والمحافظات، والرصيد بالعلب، والمبيعات، والمستحق. الوكيل المعطّل (الفرات) بشارة «معطّل». بحث بالاسم وفلتر المحافظة وترقيم. الصف يفتح صفحة الوكيل.",
      node: shell(<AgentsDemo />),
    },
    ...systemStates({
      loading: shell(<AgentsDemo mode="loading" />),
      empty: shell(<AgentsDemo mode="empty" />),
      error: shell(<AgentsDemo mode="error" />),
      // المراقبة لا تملك agents.manage: عنصر الوكلاء غير ظاهر لها، وفتح رابطه يُظهر «لا صلاحية».
      forbidden: (
        <ShellScreen user="monitoring" activeKey="flags" breadcrumbs={breadcrumbs}>
          <ForbiddenState />
        </ShellScreen>
      ),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function AgentsPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

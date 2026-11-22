import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { AccountingHomeDemo } from "./AccountingHomeDemo";

// I11 · لوحة المحاسبة. الحالات في SCREENS.md (default وexpense-reminder)، ومعها الحالات العامة.
// dashboard.accounting: IT «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="accountant" activeKey="home-accountant" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "I11",
  name: "لوحة المحاسبة",
  states: [
    {
      key: "default",
      label: "الافتراضي",
      when: "تشرين الثاني مفتوح وكل المصروف مُدخل: بطاقة إغلاق الشهر، والتسليمات والتحصيل لكل الوكلاء للاطلاع مع فلتر الوكيل وترقيم.",
      node: shell(<AccountingHomeDemo />),
    },
    {
      key: "expense-reminder",
      label: "تذكير المصروف",
      when: "بند «اتصالات» بلا فعلي (missing_expenses): شريط تحذير بأسمائه و«إدخال المصروف» إلى I12.",
      node: shell(<AccountingHomeDemo reminder />),
    },
    ...systemStates({
      loading: shell(<AccountingHomeDemo mode="loading" />),
      error: shell(<AccountingHomeDemo mode="error" />),
      forbidden: (
        <ShellScreen user="it" activeKey="users" breadcrumbs={breadcrumbs}>
          <ForbiddenState />
        </ShellScreen>
      ),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function AccountingHomePage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

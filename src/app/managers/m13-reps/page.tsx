import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { RepsDemo } from "./RepsDemo";

// M13 · المندوبون. الحالة في SCREENS.md (default)، ومعها الحالات العامة للقوائم. الصف يفتح صفحة المندوب (S07).
// لمدير المكتب العلمي (reps.view): عامل المستودع «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "المندوبون" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="scientific_manager" activeKey="reps" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "M13",
  name: "المندوبون",
  states: [
    {
      key: "default",
      label: "الافتراضي",
      when: "سبعة مندوبين: المنطقة والسوبرفايزر، ودوام اليوم (يعمل الآن بوقت البدء، أو انتهى بوقت الإنهاء، أو لم يبدأ)، وزياراتهم اليوم، وآخر مزامنة. فلتر المنطقة والسوبرفايزر. الصف يفتح صفحة المندوب (S07).",
      node: shell(<RepsDemo />),
    },
    ...systemStates({
      loading: shell(<RepsDemo mode="loading" />),
      empty: shell(<RepsDemo mode="empty" />),
      error: shell(<RepsDemo mode="error" />),
      // المندوبون لا يظهرون إلا لمن يملك reps.view: السوبرفايزر مثلاً يرى «الإشراف» لا هذه القائمة، وفتح رابطها يُظهر «لا صلاحية».
      forbidden: (
        <ShellScreen user="warehouse_worker" activeKey="balances" breadcrumbs={breadcrumbs}>
          <ForbiddenState />
        </ShellScreen>
      ),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function RepsPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

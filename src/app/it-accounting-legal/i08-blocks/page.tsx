import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { BlocksDemo } from "./BlocksDemo";

// I08 · الحظر. الحالات في SCREENS.md (default وlift)، ومعها «حظر جديد» والمرفوعة والحالات العامة.
// security.manage: مدير المبيعات «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "الحظر" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="it" activeKey="blocks" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "I08",
  name: "الحظر",
  states: [
    {
      key: "default",
      label: "الافتراضي",
      when: "المحظور الآن: النوع، والقيمة، والسبب، ومن حظر ومتى. «رفع الحظر» في قائمة الصف، و«حظر جديد» في الرأس.",
      node: shell(<BlocksDemo />),
    },
    {
      key: "lift",
      label: "رفع الحظر",
      when: "رفع حظر البريد: السبب إلزامي، والزر معطّل حتى يُكتب.",
      node: shell(<BlocksDemo initialLifting={6} />),
    },
    {
      key: "new",
      label: "حظر جديد",
      when: "النافذة: النوع (جهاز أو بريد)، والقيمة، والسبب.",
      node: shell(<BlocksDemo initialForm={{ type: null, value: "", reason: "" }} />),
    },
    {
      key: "lifted",
      label: "المرفوعة",
      when: "تبويب «رُفع حظره»: سبب الرفع ومتى، ولا إجراء.",
      node: shell(<BlocksDemo initialTab="lifted" />),
    },
    ...systemStates({
      loading: shell(<BlocksDemo mode="loading" />),
      empty: shell(<BlocksDemo mode="empty" />),
      error: shell(<BlocksDemo mode="error" />),
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

export default function BlocksPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

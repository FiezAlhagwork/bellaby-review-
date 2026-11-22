import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { DevicesDemo } from "./DevicesDemo";

// I05 · الأجهزة. الحالة في SCREENS.md (default)، ومعها الحالات العامة. devices.manage: مدير المبيعات «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "الأجهزة" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="it" activeKey="devices" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "I05",
  name: "الأجهزة",
  states: [
    {
      key: "default",
      label: "الافتراضي",
      when: "أجهزة المندوبين: الجهاز ومعرّفه، ومتى رُبط (أول دخول أو بموافقة)، وآخر مزامنة، والإصدار، و«مربوط» أو «مفكوك».",
      node: shell(<DevicesDemo />),
    },
    ...systemStates({
      loading: shell(<DevicesDemo mode="loading" />),
      empty: shell(<DevicesDemo mode="empty" />),
      error: shell(<DevicesDemo mode="error" />),
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

export default function DevicesPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

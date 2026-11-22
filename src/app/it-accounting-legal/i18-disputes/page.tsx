import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { DisputesDemo } from "./DisputesDemo";

// I18 · النزاعات. الحالة في SCREENS.md (default)، ومعها الحالات العامة. سري، ولا يشمله التفويض: المفوَّض «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "النزاعات" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="legal" activeKey="disputes" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "I18",
  name: "النزاعات",
  states: [
    {
      key: "default",
      label: "الافتراضي",
      when: "شريط السرية، وكل نزاع بعنوانه وعميله وتسليمه ومرحلته وتاريخه، وفلتر الحالة. «فتح نزاع» في الرأس، والصف يفتح الملف.",
      node: shell(<DisputesDemo />),
    },
    ...systemStates({
      loading: shell(<DisputesDemo mode="loading" />),
      empty: shell(<DisputesDemo mode="empty" />),
      error: shell(<DisputesDemo mode="error" />),
      forbidden: (
        <ShellScreen user="delegate" activeKey="pending" breadcrumbs={breadcrumbs}>
          <ForbiddenState />
        </ShellScreen>
      ),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function DisputesPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

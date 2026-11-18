import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { RepSampleBalancesDemo } from "./RepSampleBalancesDemo";

// M17 · أرصدة عينات المندوبين. الحالات في SCREENS.md (default وlow)، ومعها الحالات العامة للقوائم. قراءة فقط.
// لمدير المكتب العلمي (sample_stock.view): السوبرفايزر «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "أرصدة العينات" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="scientific_manager" activeKey="scientific-sample-balances" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "M17",
  name: "أرصدة عينات المندوبين",
  states: [
    {
      key: "default",
      label: "الافتراضي",
      when: "لكل مندوب: الصنف والدفعة والكمية وما وزّعه هذا الشهر. فلتر المندوب والصنف.",
      node: shell(<RepSampleBalancesDemo />),
    },
    {
      key: "low",
      label: "رصيد منخفض",
      when: "أرصدة منخفضة (تحت حدّ تجريبي 10) وواحد سالب بعد تعارض في المزامنة: شارة في الصف وشريط يلخّصها. الحدّ غير محدّد في العقد (docs/backend-requests.md §55).",
      node: shell(<RepSampleBalancesDemo dataset="low" />),
    },
    ...systemStates({
      loading: shell(<RepSampleBalancesDemo mode="loading" />),
      empty: shell(<RepSampleBalancesDemo mode="empty" />),
      error: shell(<RepSampleBalancesDemo mode="error" />),
      // السوبرفايزر لا يملك sample_stock.view: عنصر «أرصدة العينات» غير ظاهر له، وفتح رابطه يُظهر «لا صلاحية».
      forbidden: (
        <ShellScreen user="supervisor" activeKey="home-supervisor" breadcrumbs={breadcrumbs}>
          <ForbiddenState />
        </ShellScreen>
      ),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function RepSampleBalancesPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

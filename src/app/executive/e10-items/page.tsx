import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { ItemsDemo } from "./ItemsDemo";

// E10 · الأصناف. الحالتان في SCREENS.md (default وdisabled-filter)، ومعهما الحالات العامة للقوائم.
// items.manage: مدير المبيعات «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "الأصناف" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="executive" activeKey="items" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "E10",
  name: "الأصناف",
  states: [
    {
      key: "default",
      label: "الافتراضي",
      when: "تسعة أصناف: الاسم والرمز، والنوع، والمحفظة، والسعر الساري (للمنتج) أو تكلفة الوحدة (للعينة والمادة)، والحد الأدنى، وظهوره في الموقع، والحالة. بحث وفلتر النوع والحالة. «صنف جديد» في الرأس، والصف يفتح صفحة الصنف.",
      node: shell(<ItemsDemo />),
    },
    {
      key: "disabled-filter",
      label: "فلتر المعطّل",
      when: "فلتر الحالة «معطّل»: الصنف القديم الموقوف وحده.",
      node: shell(<ItemsDemo initialFilters={{ q: "", type: null, status: "inactive" }} />),
    },
    ...systemStates({
      loading: shell(<ItemsDemo mode="loading" />),
      empty: shell(<ItemsDemo mode="empty" />),
      error: shell(<ItemsDemo mode="error" />),
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

export default function ItemsPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

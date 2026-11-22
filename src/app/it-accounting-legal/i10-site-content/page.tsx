import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { SiteContentDemo } from "./SiteContentDemo";

// I10 · محتوى الموقع. الحالات في SCREENS.md (pages وproducts وagents وnotice)، ومعها الحالات العامة. القرار 14.
// site.manage: مدير المبيعات «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "محتوى الموقع" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="it" activeKey="site-content" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "I10",
  name: "محتوى الموقع",
  states: [
    {
      key: "pages",
      label: "الصفحات",
      when: "الرئيسية: العنوان، ونص كل قسم، والصور، وSEO، و«حفظ الصفحة». «من نحن» من المبدّل.",
      node: shell(<SiteContentDemo />),
    },
    {
      key: "products",
      label: "المنتجات",
      when: "أصناف المنتج برابطها وسعرها ومفتاح «يظهر في الموقع» (معطّل للصنف المعطّل). حقول العرض من صفحة الصنف.",
      node: shell(<SiteContentDemo initialTab="products" />),
    },
    {
      key: "agents",
      label: "الوكلاء",
      when: "الوكلاء بمحافظاتهم وهاتف الموقع ومفتاح «يظهر في الموقع».",
      node: shell(<SiteContentDemo initialTab="agents" />),
    },
    {
      key: "notice",
      label: "عبارة الرضاعة",
      when: "نص عبارة الرضاعة الطبيعية (من الشركة بمراجعة القانوني) واسم الشركة، و«حفظ العبارة».",
      node: shell(<SiteContentDemo initialTab="notice" />),
    },
    ...systemStates({
      loading: shell(<SiteContentDemo mode="loading" />),
      error: shell(<SiteContentDemo mode="error" />),
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

export default function SiteContentPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

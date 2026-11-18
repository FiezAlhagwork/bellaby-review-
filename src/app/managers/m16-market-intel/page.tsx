import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { MarketIntelDemo } from "./MarketIntelDemo";

// M16 · تقرير معلومات السوق. الحالتان في SCREENS.md (competitor-price وrequested-product)، ومعهما الحالات العامة للقوائم. قراءة فقط.
// لمدير المكتب العلمي (market_intel.view): السوبرفايزر «لا صلاحية». التبويبات تعرض الأنواع الثلاثة الباقية بتجربة تفاعلية.

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "معلومات السوق" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="scientific_manager" activeKey="market-intel" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "M16",
  name: "تقرير معلومات السوق",
  states: [
    {
      key: "competitor-price",
      label: "سعر منافس",
      when: "تبويب «سعر منافس»: الماركة والمنتج والسعر (ل.س) والمكان، ثم المنطقة والمندوب والتاريخ. فلتر المنطقة والفترة، وترقيم. بقية الأنواع في التبويبات.",
      node: shell(<MarketIntelDemo type="COMPETITOR_PRICE" />),
    },
    {
      key: "requested-product",
      label: "منتج مطلوب",
      when: "تبويب «منتج مطلوب»: المنتج ومن طلبه وتكرار الطلب، ثم المنطقة والمندوب والتاريخ. الأعمدة تتبدّل بتبدّل النوع.",
      node: shell(<MarketIntelDemo type="REQUESTED_PRODUCT" />),
    },
    ...systemStates({
      loading: shell(<MarketIntelDemo mode="loading" />),
      empty: shell(<MarketIntelDemo mode="empty" />),
      error: shell(<MarketIntelDemo mode="error" />),
      // السوبرفايزر لا يملك market_intel.view: عنصر «معلومات السوق» غير ظاهر له، وفتح رابطه يُظهر «لا صلاحية».
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

export default function MarketIntelPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

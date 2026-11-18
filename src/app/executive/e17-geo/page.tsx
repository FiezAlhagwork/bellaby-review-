import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { GeoDemo } from "./GeoDemo";

// E17 · الهيكل الجغرافي. الحالات في SCREENS.md (default وform)، ومعها نقل محافظة والحالات العامة.
// geo.manage: مدير المبيعات «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "الإعدادات", href: "#" }, { label: "الهيكل الجغرافي" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="executive" activeKey="settings" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "E17",
  name: "الهيكل الجغرافي",
  states: [
    {
      key: "default",
      label: "الافتراضي",
      when: "سوريا ← ست مناطق تشغيلية بتصنيفها (A–D) ← محافظاتها. «تعديل» على كل منطقة ومحافظة، و«إضافة منطقة» و«إضافة محافظة» في الرأس.",
      node: shell(<GeoDemo />),
    },
    {
      key: "form",
      label: "نافذة المنطقة",
      when: "«إضافة منطقة»: الاسم والتصنيف (أربعة خيارات). الزر معطّل حتى يكتملا.",
      node: shell(<GeoDemo initialForm={{ kind: "region", id: null, countryId: 1, name: "", regionClass: null }} />),
    },
    {
      key: "move",
      label: "نقل محافظة",
      when: "«تعديل» محافظة واختيار منطقة أخرى: «ستُنقل المحافظة إلى هذه المنطقة»، والزر «نقل المحافظة» (PATCH region_id).",
      node: shell(<GeoDemo initialForm={{ kind: "governorate", id: 14, name: "الحسكة", regionId: 5, fromRegionId: 6 }} />),
    },
    ...systemStates({
      loading: shell(<GeoDemo mode="loading" />),
      error: shell(<GeoDemo mode="error" />),
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

export default function GeoPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

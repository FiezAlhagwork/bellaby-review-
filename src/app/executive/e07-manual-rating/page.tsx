import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { ManualRatingsDemo } from "./ManualRatingsDemo";

// E07 · التقييم اليدوي. الحالات في SCREENS.md (default وincomplete وlocked)، ومعها الحالات العامة.
// ratings.manual: مدير المبيعات «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "التقييم اليدوي" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="executive" activeKey="manual-rating" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "E07",
  name: "التقييم اليدوي",
  states: [
    {
      key: "default",
      label: "الافتراضي",
      when: "كل الموظفين مُقيَّمون لتشرين الثاني: التقييم بالسلّم الموحّد في كل صف، ويُعدَّل باختيار آخر حتى الإغلاق.",
      node: shell(<ManualRatingsDemo complete />),
    },
    {
      key: "incomplete",
      label: "تقييمات ناقصة",
      when: "ثلاثة بلا تقييم: الحقل معلَّم والشارة «ناقص» وشريط «لا يُغلق الشهر». اختر تقييماً فيُحفظ ويختفي من الناقص.",
      node: shell(<ManualRatingsDemo />),
    },
    {
      key: "locked",
      label: "مقفل",
      when: "تشرين الأول مغلق: التقييمات نص للقراءة وشريط «مثبّتة».",
      node: shell(<ManualRatingsDemo initialMonth="2026-10" />),
    },
    ...systemStates({
      loading: shell(<ManualRatingsDemo mode="loading" />),
      empty: shell(<ManualRatingsDemo mode="empty" />),
      error: shell(<ManualRatingsDemo mode="error" />),
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

export default function ManualRatingPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

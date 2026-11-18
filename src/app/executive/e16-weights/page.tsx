import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { WeightsDemo } from "./WeightsDemo";

// E16 · الأوزان ومجموعات المقارنة. الحالات في SCREENS.md (default وedit وsum-error وnext-month-note)، ومعها الحالات العامة.
// kpi.manage: مدير المبيعات «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "الإعدادات", href: "#" }, { label: "الأوزان والمجموعات" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="executive" activeKey="settings" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "E16",
  name: "الأوزان ومجموعات المقارنة",
  states: [
    {
      key: "default",
      label: "الافتراضي",
      when: "أوزان المندوب السارية (المجموع 100%) واختيار الدور، وتحتها مجموعات المقارنة بأدوارها وأفرادها ومعامل الوكيل.",
      node: shell(<WeightsDemo />),
    },
    {
      key: "edit",
      label: "تعديل",
      when: "«تعديل الأوزان»: حقل لكل مؤشر وسطر المجموع، و«يسري التعديل من كانون الأول 2026».",
      node: shell(<WeightsDemo initialDraft="current" />),
    },
    {
      key: "sum-error",
      label: "المجموع ليس 100%",
      when: "المجموع 95%: شارة حمراء، و«حفظ الأوزان» معطّل وسببه ظاهر. الخادم يرفضه أيضاً بـ weights_must_total_100.",
      node: shell(<WeightsDemo initialDraft="sum-error" />),
    },
    {
      key: "next-month-note",
      label: "تسري من الشهر التالي",
      when: "بعد الحفظ: شريط «تسري من كانون الأول 2026». الأوزان المعروضة تبقى السارية هذا الشهر.",
      node: shell(<WeightsDemo scheduled />),
    },
    ...systemStates({
      loading: shell(<WeightsDemo mode="loading" />),
      error: shell(<WeightsDemo mode="error" />),
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

export default function WeightsPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { MonthClosingDemo } from "./MonthClosingDemo";

// E06 · إغلاق الشهر. الحالات في SCREENS.md (open وwaiting وclosed)، ومعها الحالات العامة. الإغلاق آلي (القرار 13): لا زر.
// month_closings.manage: مدير المبيعات «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "إغلاق الشهر" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="executive" activeKey="month-close" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "E06",
  name: "إغلاق الشهر",
  states: [
    {
      key: "open",
      label: "مفتوح",
      when: "تشرين الثاني مفتوح: ثلاثة تقييمات يدوية ناقصة، وفعلي «اتصالات» ناقص، ويوم العمل الخامس (7 كانون الأول) لم يأتِ. كل شرط ناقص بزر يقود لشاشته.",
      node: shell(<MonthClosingDemo />),
    },
    {
      key: "waiting",
      label: "بانتظار الإغلاق",
      when: "تشرين الأول بعد يوم العمل الخامس، وما زال ينتظر تقييم خالد النجار وفعلي «اتصالات»: شريط تحذير، ويُغلق آلياً حين تكتمل.",
      node: shell(<MonthClosingDemo october="waiting" initialMonth="2026-10" />),
    },
    {
      key: "closed",
      label: "مغلق",
      when: "تشرين الأول مغلق: الشروط مكتملة والنقاط مثبّتة، ووقت الإغلاق، وزر «النقاط النهائية».",
      node: shell(<MonthClosingDemo initialMonth="2026-10" />),
    },
    ...systemStates({
      loading: shell(<MonthClosingDemo mode="loading" />),
      error: shell(<MonthClosingDemo mode="error" />),
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

export default function MonthClosePage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

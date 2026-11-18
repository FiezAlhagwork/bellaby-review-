import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { HolidaysDemo } from "./HolidaysDemo";

// E15 · العطل الرسمية. الحالات في SCREENS.md (default وform وpast)، ومعها الحالات العامة.
// holidays.manage: مدير المبيعات «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "الإعدادات", href: "#" }, { label: "العطل الرسمية" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="executive" activeKey="settings" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "E15",
  name: "العطل الرسمية",
  states: [
    {
      key: "default",
      label: "الافتراضي",
      when: "عطل 2026 بيومها واسمها وحالتها (مضت، قادمة) ومن أضافها. «حذف» في قائمة العطلة القادمة. «إضافة عطلة» في الرأس.",
      node: shell(<HolidaysDemo />),
    },
    {
      key: "form",
      label: "إضافة عطلة",
      when: "النافذة: اليوم (ما قبل اليوم معطّل في المنتقي) والاسم. الزر معطّل حتى يكتملا.",
      node: shell(<HolidaysDemo initialForm={{ date: null, name: "" }} />),
    },
    {
      key: "past",
      label: "عطلة مضت",
      when: "العطلة التي مضت بشارة «مضت»: «حذف» معطّل في قائمتها وسببه ظاهر (409 من الخادم إن أُرسل).",
      node: shell(<HolidaysDemo />),
    },
    ...systemStates({
      loading: shell(<HolidaysDemo mode="loading" />),
      empty: shell(<HolidaysDemo mode="empty" />),
      error: shell(<HolidaysDemo mode="error" />),
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

export default function HolidaysPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

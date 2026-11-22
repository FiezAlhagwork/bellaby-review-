import type { ReactNode } from "react";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { PendingDemo } from "./PendingDemo";

// G04 · بانتظار قراري. الحالات في SCREENS.md (default وsales-manager وdelegate وempty)، ومعها التحميل والخطأ.

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "بانتظار قراري" }];

const shell = (user: "executive" | "sales_manager" | "delegate", node: ReactNode) => (
  <ShellScreen user={user} activeKey="pending" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "G04",
  name: "بانتظار قراري",
  states: [
    { key: "default", label: "المدير التنفيذي", when: "كل الأنواع مجمّعة حسب النوع، والأقدم أولاً. لكل عنصر عنوانه وصاحبه وعمره، و«يشمله التفويض» حين يكون. فلتر النوع.", node: shell("executive", <PendingDemo />) },
    { key: "sales-manager", label: "مدير المبيعات", when: "المرتجع والتالف وإرجاع الوكيل فقط.", node: shell("sales_manager", <PendingDemo role="sales-manager" />) },
    { key: "delegate", label: "المفوَّض", when: "مدير المبيعات مفوَّضاً: ما يشمله التفويض بين تاريخيه، دون ما يخصّه، مع شريط التفويض.", node: shell("delegate", <PendingDemo role="delegate" />) },
    ...systemStates({
      loading: shell("executive", <PendingDemo mode="loading" />),
      empty: shell("executive", <PendingDemo mode="empty" />),
      error: shell("executive", <PendingDemo mode="error" />),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function PendingPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

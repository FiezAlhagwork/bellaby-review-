import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { ListsDemo } from "./ListsDemo";

// E14 · القوائم. الحالات في SCREENS.md (default وsystem-entry)، ومعها نافذة القيمة والحالات العامة.
// lists.manage: مدير المبيعات «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "الإعدادات", href: "#" }, { label: "القوائم" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="executive" activeKey="settings" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "E14",
  name: "القوائم",
  states: [
    {
      key: "default",
      label: "الافتراضي",
      when: "«أسباب المرتجع»: القيم بترتيبها وحالتها. اختر قائمة أخرى من «القائمة». قائمة كل صف: تعديل، وتعطيل أو تفعيل. «إضافة قيمة» في الرأس.",
      node: shell(<ListsDemo />),
    },
    {
      key: "form",
      label: "نافذة القيمة",
      when: "«إضافة قيمة»: الاسم والترتيب (اختياري). الزر معطّل حتى يُكتب الاسم.",
      node: shell(<ListsDemo initialForm={{ mode: "create", name: "", order: null }} />),
    },
    {
      key: "system-entry",
      label: "قيمة نظامية",
      when: "«سحب دفعة» بشارة «نظامية»: تعطيلها معطّل في قائمة الصف وسببه ظاهر. إن أُرسل يرجع 409 system_entry_locked: شريط فوق الجدول.",
      node: shell(<ListsDemo initialError="system_entry_locked" />),
    },
    ...systemStates({
      loading: shell(<ListsDemo mode="loading" />),
      empty: shell(<ListsDemo mode="empty" />),
      error: shell(<ListsDemo mode="error" />),
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

export default function ListsPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

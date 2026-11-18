import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { SettingsDemo } from "./SettingsDemo";

// E13 · الإعدادات العامة. الحالات في SCREENS.md (default وedit وverification-note)، ومعها الحالات العامة.
// settings.manage: مدير المبيعات «لا صلاحية». أقسام الإعدادات (E13–E17) تبويبات تحت عنصر «الإعدادات».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "الإعدادات" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="executive" activeKey="settings" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "E13",
  name: "الإعدادات العامة",
  states: [
    {
      key: "default",
      label: "الافتراضي",
      when: "ثلاث مجموعات: المهل والتنبيهات (تسري فوراً)، والتحقق (على السجلات الجديدة وحدها)، والدوام. «تعديل الإعدادات» في الرأس.",
      node: shell(<SettingsDemo />),
    },
    {
      key: "edit",
      label: "تعديل",
      when: "القيم حقولاً بوحدتها. الحقل الفارغ خطأ فوري، و«حفظ الإعدادات» معطّل حتى يكتمل.",
      node: shell(<SettingsDemo editing />),
    },
    {
      key: "verification-note",
      label: "ملاحظة التحقق",
      when: "بعد حفظ غيّر قيمة تحقق (نطاق الزيارة مثلاً): شريط «تسري على السجلات الجديدة وحدها».",
      node: shell(<SettingsDemo noteShown />),
    },
    ...systemStates({
      loading: shell(<SettingsDemo mode="loading" />),
      error: shell(<SettingsDemo mode="error" />),
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

export default function SettingsPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

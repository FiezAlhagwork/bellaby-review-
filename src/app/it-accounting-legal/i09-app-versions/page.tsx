import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { AppVersionDemo } from "./AppVersionDemo";

// I09 · إصدارات التطبيق. الحالات في SCREENS.md (default وedit)، ومعها خطأ الخادم والحالات العامة.
// app_versions.manage: مدير المبيعات «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "إصدارات التطبيق" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="it" activeKey="app-versions" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "I09",
  name: "إصدارات التطبيق",
  states: [
    {
      key: "default",
      label: "الافتراضي",
      when: "أدنى إصدار مقبول، وآخر إصدار، ورابط APK. «تعديل» في الرأس.",
      node: shell(<AppVersionDemo />),
    },
    {
      key: "edit",
      label: "تعديل",
      when: "رفع الأدنى إلى 1.4.0: شريط «رفع الأدنى يوقف الإصدارات الأقدم»، والحفظ معطّل حتى تصحّ الصيغ.",
      node: shell(<AppVersionDemo editing />),
    },
    {
      key: "validation",
      label: "خطأ من الخادم",
      when: "الخادم يرفض بـ validation_failed: نصّه تحت الرابط كما هو.",
      node: shell(<AppVersionDemo editing initialErrors={{ apk_url: "الرابط لا يشير إلى ملف APK." }} />),
    },
    ...systemStates({
      loading: shell(<AppVersionDemo mode="loading" />),
      error: shell(<AppVersionDemo mode="error" />),
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

export default function AppVersionsPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

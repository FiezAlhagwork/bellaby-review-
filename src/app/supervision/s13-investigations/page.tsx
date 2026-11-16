import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import type { ShellUserKey } from "@/mocks/shell-users";
import { InvestigationsDemo } from "./InvestigationsDemo";

// S13 · ملفات التحقيق. الحالة في SCREENS.md (default)، ومعها قراءة المدير التنفيذي والحالات العامة للقوائم. الفلتر والترقيم تفاعليان.
// ملفات سرية: المراقبة والمدير التنفيذي فقط (investigations.view) وكل اطلاع يُسجَّل. «فتح ملف» للمراقبة وحدها (investigations.manage).

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "التحقيقات" }];

const shell = (user: ShellUserKey, node: ReactNode) => (
  <ShellScreen user={user} activeKey="investigations" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "S13",
  name: "ملفات التحقيق",
  states: [
    {
      key: "default",
      label: "الافتراضي",
      when: "المراقبة: اثنا عشر ملفاً سرياً من الأحدث بعنوانها وموظفها ومرحلتها وتاريخ فتحها. شريط «ملف سري. اطّلاعك مسجّل.»، وفلتر الحالة (قيد التحقيق · بانتظار القرار · تم القرار · أُغلق بلا مخالفة)، وترقيم. الصف يفتح S15 و«فتح ملف» يفتح S14.",
      node: shell("monitoring", <InvestigationsDemo />),
    },
    {
      key: "executive",
      label: "المدير التنفيذي",
      when: "المدير التنفيذي يرى القائمة نفسها للقراءة والقرار، بلا «فتح ملف» (investigations.manage للمراقبة).",
      node: shell("executive", <InvestigationsDemo canOpen={false} />),
    },
    {
      key: "awaiting",
      label: "بانتظار القرار",
      when: "فلتر «الحالة: بانتظار القرار» (قيمة AWAITING_DECISION): الملفات المرفوعة للمدير التنفيذي وحدها.",
      node: shell("executive", <InvestigationsDemo canOpen={false} initialFilters={{ status: "AWAITING_DECISION" }} />),
    },
    ...systemStates({
      loading: shell("monitoring", <InvestigationsDemo mode="loading" />),
      empty: shell("monitoring", <InvestigationsDemo mode="empty" />),
      error: shell("monitoring", <InvestigationsDemo mode="error" />),
      // السوبرفايزر لا يملك investigations.view: عنصرها غير ظاهر له، وفتح رابطها يُظهر «لا صلاحية».
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

export default function InvestigationsPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

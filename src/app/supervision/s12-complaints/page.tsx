import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { ComplaintsDemo } from "./ComplaintsDemo";

// S12 · شكاوى الموقع. الحالة في SCREENS.md (default)، ومعها الحالات العامة للقوائم وفتح شكوى في الدرج. للاطلاع: المراقبة ترى الشكاوى ولا تعالجها (المعالجة لمدير المبيعات).

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "الشكاوى" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="monitoring" activeKey="complaints" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "S12",
  name: "شكاوى الموقع",
  states: [
    {
      key: "default",
      label: "الافتراضي",
      when: "تسع شكاوى من زوار الموقع من الأحدث: الاسم والهاتف ونص الشكوى والتاريخ وحالتها (جديدة · عولجت). فلتر الحالة وترقيم. الصف يفتح الشكوى كاملة للقراءة.",
      node: shell(<ComplaintsDemo />),
    },
    {
      key: "details",
      label: "شكوى مفتوحة",
      when: "شكوى «عولجت» في الدرج: النص كاملاً، ومن عالجها ومتى وملاحظة المعالجة. لا زر معالجة: هي لمدير المبيعات.",
      node: shell(<ComplaintsDemo initialOpenId={909} />),
    },
    ...systemStates({
      loading: shell(<ComplaintsDemo mode="loading" />),
      empty: shell(<ComplaintsDemo mode="empty" />),
      error: shell(<ComplaintsDemo mode="error" />),
      // السوبرفايزر لا يقرأ شكاوى الموقع: عنصرها غير ظاهر له، وفتح رابطها يُظهر «لا صلاحية».
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

export default function ComplaintsPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

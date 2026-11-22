import type { ReactNode } from "react";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { DepartmentRequestsDemo } from "./DepartmentRequestsDemo";

// G09 · الطلبات بين الأقسام. الحالات في SCREENS.md (incoming وoutgoing)، ومعها الحالات العامة. المستخدم رامي السيد، رئيس قسم اللوجستيات.

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "الطلبات بين الأقسام" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="logistics" activeKey="department-requests" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "G09",
  name: "الطلبات بين الأقسام",
  states: [
    { key: "incoming", label: "الواردة", when: "طلبات الأقسام الأخرى إلى اللوجستيات: الوصف، والقسم الطالب، والموعد (بالأحمر إن تأخر)، والحالة وعلامة «متأخر».", node: shell(<DepartmentRequestsDemo />) },
    { key: "outgoing", label: "الصادرة", when: "طلبات اللوجستيات إلى الأقسام الأخرى: عمود القسم المطلوب منه.", node: shell(<DepartmentRequestsDemo initialDirection="outgoing" />) },
    ...systemStates({
      loading: shell(<DepartmentRequestsDemo mode="loading" />),
      empty: shell(<DepartmentRequestsDemo mode="empty" />),
      error: shell(<DepartmentRequestsDemo mode="error" />),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function DepartmentRequestsPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

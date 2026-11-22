import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { UsersDemo } from "./UsersDemo";

// I01 · المستخدمون. الحالات في SCREENS.md (default وdisabled-filter)، ومعها الحالات العامة.
// users.view (IT والمدير التنفيذي)، و«حساب جديد» بـ users.manage. مدير المبيعات «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "المستخدمون" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="it" activeKey="users" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "I01",
  name: "المستخدمون",
  states: [
    {
      key: "default",
      label: "الافتراضي",
      when: "كل الحسابات: الاسم وبريده أو هاتفه، والدور، والقسم، والمحافظات، والنوع، والحالة، وآخر دخول. «حساب جديد» في الرأس، والصف يفتح صفحة المستخدم.",
      node: shell(<UsersDemo />),
    },
    {
      key: "disabled-filter",
      label: "فلتر المعطّلين",
      when: "فلتر الحالة «معطّل»: الحسابات المعطّلة وحدها، وشارة الفلتر النشط.",
      node: shell(<UsersDemo initialFilters={{ q: "", roleId: null, department: null, status: "inactive" }} />),
    },
    ...systemStates({
      loading: shell(<UsersDemo mode="loading" />),
      empty: shell(<UsersDemo mode="empty" />),
      error: shell(<UsersDemo mode="error" />),
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

export default function UsersPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { UserDemo } from "./UserDemo";

// I03 · صفحة المستخدم. الحالات في SCREENS.md (active وdeactivate-preview وrep-active-warning وdisabled)، ومعها العقد بعين المدير التنفيذي
// وموظف ويب وغير موجود والحالات العامة. القرار 14: التعطيل فوري ولا يحذف شيئاً.

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "المستخدمون", href: "#" }, { label: "المستخدم" }];

const shell = (node: ReactNode, user: "it" | "executive" = "it") => (
  <ShellScreen user={user} activeKey="users" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "I03",
  name: "صفحة المستخدم",
  states: [
    {
      key: "active",
      label: "حساب مفعّل",
      when: "مندوب مفعّل بعين IT: بياناته وآخر مزامنة، و«تعطيل الحساب» في الرأس. لا عقد ولا راتب (لا يظهران لـ IT).",
      node: shell(<UserDemo />),
    },
    {
      key: "deactivate-preview",
      label: "معاينة التعطيل",
      when: "موظف ويب: «ما المعلّق عليه» (المهام والطلبات) وما يحدث لكل منه، وسبب إلزامي. «تعطيل الحساب» معطّل حتى يُكتب السبب.",
      node: shell(<UserDemo userId={8} initialPreview />),
    },
    {
      key: "rep-active-warning",
      label: "مندوب عليه رصيد",
      when: "مندوب عليه رصيد عينات: شريط تحذير «المندوب عليه رصيد» وأسطر الرصيد، وآخر مزامنة، ومستند صرف معلّق.",
      node: shell(<UserDemo initialPreview />),
    },
    {
      key: "disabled",
      label: "حساب معطّل",
      when: "مندوب معطّل: شريط «الحساب معطّل»، و«تفعيل الحساب» بدل التعطيل.",
      node: shell(<UserDemo userId={24} />),
    },
    {
      key: "contract",
      label: "العقد والراتب",
      when: "بعين المدير التنفيذي (أو مدير المحاسبة): بطاقة «العقد والراتب» السرية بالمدة والراتب وملف العقد.",
      node: shell(<UserDemo withContract />, "executive"),
    },
    {
      key: "not-found",
      label: "غير موجود",
      when: "رابط مستخدم غير موجود (404).",
      node: shell(<UserDemo mode="not-found" />),
    },
    ...systemStates({
      loading: shell(<UserDemo mode="loading" />),
      error: shell(<UserDemo mode="error" />),
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

export default function UserPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

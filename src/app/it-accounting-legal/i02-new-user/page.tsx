import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { NewUserDemo } from "./NewUserDemo";

// I02 · حساب جديد. الحالات في SCREENS.md (web وrep وvalidation)، ومعها النموذج الفارغ و«لا صلاحية». لا تسجيل ذاتي.
// users.manage: مدير المبيعات «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "المستخدمون", href: "#" }, { label: "حساب جديد" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="it" activeKey="users" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const webForm = {
  type: "WEB" as const,
  name: "لمى الحسن",
  roleId: "10",
  department: "ACCOUNTING" as const,
  isDepartmentHead: false,
  managerId: "7",
  agentId: null,
  governorateIds: ["5"],
  email: "lama@trust.example",
  phone: "",
};

const repForm = {
  type: "REP" as const,
  name: "بشر الحلبي",
  roleId: "12",
  department: "SCIENTIFIC_OFFICE" as const,
  isDepartmentHead: false,
  managerId: "14",
  agentId: null,
  governorateIds: ["1", "2"],
  email: "",
  phone: "944 556 677",
};

const screen: ScreenDefinition = {
  id: "I02",
  name: "حساب جديد",
  states: [
    {
      key: "empty",
      label: "فارغ",
      when: "النموذج قبل اختيار النوع: بطاقتا «موظف ويب» و«مندوب»، و«إنشاء الحساب» معطّل وسببه ظاهر.",
      node: shell(<NewUserDemo />),
    },
    {
      key: "web",
      label: "موظف ويب",
      when: "موظف ويب: بريد Google، والدور من أدوار الويب، والقسم، ورئيس القسم، والمدير المباشر، والمحافظات.",
      node: shell(<NewUserDemo initialForm={webForm} />),
    },
    {
      key: "rep",
      label: "مندوب",
      when: "مندوب: هاتفه (+963) بدل البريد، والدور «المندوب»، ولا «رئيس القسم».",
      node: shell(<NewUserDemo initialForm={repForm} />),
    },
    {
      key: "validation",
      label: "خطأ من الخادم",
      when: "الخادم يرفض بـ validation_failed: نصّه تحت البريد كما هو (يختفي بعد أول تعديل).",
      node: shell(<NewUserDemo initialForm={webForm} initialErrors={{ email: "البريد مستعمل لحساب آخر." }} />),
    },
    {
      key: "forbidden",
      label: "لا صلاحية",
      when: "من لا يملك users.manage: فتح الرابط يُظهر «لا صلاحية». النموذج لا يجلب بيانات فلا تحميل ولا خطأ تحميل.",
      node: (
        <ShellScreen user="sales_manager" activeKey="home-sales-manager" breadcrumbs={breadcrumbs}>
          <ForbiddenState />
        </ShellScreen>
      ),
    },
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function NewUserPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

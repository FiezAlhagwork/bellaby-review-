import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { RolesDemo } from "./RolesDemo";

// I04 · الأدوار والصلاحيات. الحالات في SCREENS.md (list وedit وsystem-role وdelete)، ومعها الحالات العامة.
// roles.manage: مدير المبيعات «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "الأدوار" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="it" activeKey="roles" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "I04",
  name: "الأدوار والصلاحيات",
  states: [
    {
      key: "list",
      label: "القائمة",
      when: "الأدوار بمنصتها وعدد مستخدميها وصلاحياتها، و«نظامي» للمقفل. الصف يفتح الدور في درج، و«دور جديد» في الرأس.",
      node: shell(<RolesDemo />),
    },
    {
      key: "edit",
      label: "تعديل الدور",
      when: "درج «مسؤول الجودة»: الاسم والمنصة ووصف المهام، والصلاحيات مجمّعة بالوحدة مع «يشمله التفويض».",
      node: shell(<RolesDemo initialRoleId={31} />),
    },
    {
      key: "system-role",
      label: "دور نظامي",
      when: "درج «اللوجستي»: شريط «دور نظامي» (system_role_locked) والحقول للقراءة وحدها. «حذف» معطّل في قائمة الصف وسببه ظاهر.",
      node: shell(<RolesDemo initialRoleId={2} />),
    },
    {
      key: "delete",
      label: "حذف دور",
      when: "«منسّق إقليمي» بلا مستخدمين: تأكيد الحذف. الدور المستعمل حذفه معطّل (role_in_use إن أُرسل).",
      node: shell(<RolesDemo initialDeleting={30} />),
    },
    {
      key: "role-in-use",
      label: "دور مستعمل",
      when: "الخادم يرفض حذف دور بحسابات قائمة بـ 409 role_in_use: شريط فوق الجدول.",
      node: shell(<RolesDemo initialError="role_in_use" />),
    },
    ...systemStates({
      loading: shell(<RolesDemo mode="loading" />),
      empty: shell(<RolesDemo mode="empty" />),
      error: shell(<RolesDemo mode="error" />),
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

export default function RolesPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

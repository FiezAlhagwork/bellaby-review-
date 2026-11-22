import type { ReactNode } from "react";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { NewTaskDemo } from "./NewTaskDemo";

// G08 · إسناد مهمة. الحالات في SCREENS.md (empty وfilled وvalidation وno-assignees).

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "المهام", href: "#" }, { label: "إسناد مهمة" }];

type ShellUser = "logistics" | "warehouse_worker" | "executive" | "delegate" | "sales_manager";

const shell = (user: ShellUser, node: ReactNode) => (
  <ShellScreen user={user} activeKey="tasks" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const filled = {
  assigneeId: "5",
  title: "جرد رف العينات وترتيبه حسب تاريخ الانتهاء",
  description: "عدّ العينات وانقل ما ينتهي خلال 60 يوماً إلى الأمام، وأرفق صورة الرف.",
  dueOn: "2026-11-22",
  priority: "HIGH" as const,
  attachments: [{ id: "f1", name: "shelf-layout.pdf", size: 240000, status: "done" as const }],
};

const screen: ScreenDefinition = {
  id: "G08",
  name: "إسناد مهمة",
  states: [
    { key: "empty", label: "فارغ", when: "النموذج فارغ والأولوية «عادية». «إسناد المهمة» معطّل وسببه ظاهر.", node: shell("logistics", <NewTaskDemo />) },
    { key: "filled", label: "معبّأ", when: "كل الحقول معبّأة ومرفق واحد: «إسناد المهمة» مفعّل.", node: shell("logistics", <NewTaskDemo initialForm={filled} />) },
    { key: "validation", label: "خطأ التحقق", when: "رفض الخادم (422): assignee_not_allowed تحت المكلَّف.", node: shell("logistics", <NewTaskDemo initialForm={filled} errors={{ assignee_id: "لا يمكنك إسناد مهمة لهذا الشخص. اختر من قائمة المكلَّفين المتاحين." }} />) },
    { key: "no-assignees", label: "لا مكلَّفين", when: "مدير المبيعات لا يتبعه أحد مباشرة (القرار 12): /me/assignees فارغة.", node: shell("sales_manager", <NewTaskDemo noAssignees />) },
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function NewTaskPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

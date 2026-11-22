import type { ReactNode } from "react";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { TaskDemo } from "./TaskDemo";

// G07 · تفاصيل المهمة. الحالات في SCREENS.md للمكلَّف والمُسند والمدير التنفيذي، ومعها نافذة التسليم، وقرار المفوَّض، وinvalid_status، وغير الموجودة، والحالات العامة.
// القراران 1 و14: الخصم والإغلاق للمدير التنفيذي وحده، والإغلاق دون خصم يشمله التفويض.

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "المهام", href: "#" }, { label: "المهمة" }];

type ShellUser = "logistics" | "warehouse_worker" | "executive" | "delegate" | "sales_manager";

const shell = (user: ShellUser, node: ReactNode) => (
  <ShellScreen user={user} activeKey="tasks" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "G07",
  name: "تفاصيل المهمة",
  states: [
    { key: "assignee-new", label: "المكلَّف · جديدة", when: "مهمة جديدة عند سليم: الوصف والمرفقات والمصدر، و«بدء».", node: shell("warehouse_worker", <TaskDemo state="new" role="assignee" />) },
    { key: "assignee-in-progress", label: "المكلَّف · قيد التنفيذ", when: "بعد البدء: «تسليم».", node: shell("warehouse_worker", <TaskDemo state="in-progress" role="assignee" />) },
    { key: "submit-dialog", label: "نافذة التسليم", when: "ملاحظة ومرفقات. يكفي أحدهما.", node: shell("warehouse_worker", <TaskDemo state="in-progress" role="assignee" initialSubmit />) },
    { key: "assignee-submitted", label: "المكلَّف · بانتظار المراجعة", when: "سُلّمت: شريط «بانتظار المراجعة» والتسليم في السجل.", node: shell("warehouse_worker", <TaskDemo state="submitted" role="assignee" />) },
    { key: "assignee-rejected", label: "المكلَّف · مرفوض", when: "رُفض التسليم: شريط بالسبب، والمهمة «قيد التنفيذ» و«تسليم» من جديد.", node: shell("warehouse_worker", <TaskDemo state="rejected" role="assignee" />) },
    { key: "assigner-submitted", label: "المُسند · قرار التسليم", when: "رامي يرى التسليم: «قبول التسليم» و«رفض» بسبب.", node: shell("logistics", <TaskDemo state="submitted" role="assigner" />) },
    { key: "assigner-approved", label: "المُسند · معتمدة", when: "قُبل التسليم الثاني بعد رفض الأول: شريط «معتمدة» وسجل التسليمين.", node: shell("logistics", <TaskDemo state="approved" role="assigner" />) },
    { key: "reassign", label: "إعادة الإسناد", when: "نافذة إعادة الإسناد: المكلَّف الجديد من الفريق والسبب. وسجل إعادة إسناد سابقة.", node: shell("logistics", <TaskDemo state="reassigned" role="assigner" initialReassign />) },
    { key: "overdue-resolve", label: "قرار المتأخرة", when: "المدير التنفيذي على مهمة متأخرة: خصم وتبقى مفتوحة · خصم وإغلاق · إغلاق دون خصم · لا إجراء، بمبلغ وسبب.", node: shell("executive", <TaskDemo state="overdue" role="executive" />) },
    { key: "overdue-resolve-delegate", label: "قرار المتأخرة · المفوَّض", when: "المفوَّض: خيارا الخصم معطّلان بسببهما، و«إغلاق دون خصم» متاح.", node: shell("delegate", <TaskDemo state="overdue" role="delegate" />) },
    { key: "resolved", label: "مغلقة بقرار", when: "خصم وإغلاق: سجل القرار بسببه ومن قرّر.", node: shell("executive", <TaskDemo state="resolved" role="executive" />) },
    { key: "invalid-status", label: "تغيّرت الحالة", when: "إجراء على مهمة تغيّرت حالتها (409 invalid_status).", node: shell("logistics", <TaskDemo state="submitted" role="assigner" initialActionError="invalid_status" />) },
    { key: "not-found", label: "غير موجودة", when: "رقم مهمة غير موجود أو ليست لك (404).", node: shell("warehouse_worker", <TaskDemo state="new" role="assignee" mode="not-found" />) },
    ...systemStates({
      loading: shell("warehouse_worker", <TaskDemo state="new" role="assignee" mode="loading" />),
      error: shell("warehouse_worker", <TaskDemo state="new" role="assignee" mode="error" />),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function TaskPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

import type { ReactNode } from "react";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { TasksDemo } from "./TasksDemo";

// G06 · المهام. الحالات في SCREENS.md (assigned-to-me وassigned-by-me وoverdue-filter)، ومعها الحالات العامة. المستخدم اللوجستي رامي السيد.

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "المهام" }];

type ShellUser = "logistics" | "warehouse_worker" | "executive" | "delegate" | "sales_manager";

const shell = (user: ShellUser, node: ReactNode) => (
  <ShellScreen user={user} activeKey="tasks" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "G06",
  name: "المهام",
  states: [
    { key: "assigned-to-me", label: "المسندة إليّ", when: "ما أسنده المدير التنفيذي لرامي: العنوان والمصدر، والمُسند، والموعد، والأولوية، والحالة وعلامة «متأخرة».", node: shell("logistics", <TasksDemo />) },
    { key: "assigned-by-me", label: "التي أسندتها", when: "ما أسنده رامي لفريقه: عمود المكلَّف بدل المُسند.", node: shell("logistics", <TasksDemo initialScope="assigned_by_me" />) },
    { key: "overdue-filter", label: "المتأخرة", when: "«المتأخرة فقط» (overdue=true) على «التي أسندتها».", node: shell("logistics", <TasksDemo initialScope="assigned_by_me" overdueOnly />) },
    ...systemStates({
      loading: shell("logistics", <TasksDemo mode="loading" />),
      empty: shell("logistics", <TasksDemo mode="empty" />),
      error: shell("logistics", <TasksDemo mode="error" />),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function TasksPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

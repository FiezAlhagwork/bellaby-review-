import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { CategoriesDemo } from "./CategoriesDemo";

// E04 · بنود المصاريف. الحالات في SCREENS.md (default وform وsystem)، ومعها الحالات العامة. تُفتح من «بنود المصاريف» في E03 (لا عنصر قائمة لها).
// budgets.manage: المفوَّض «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "الميزانية", href: "#" }, { label: "بنود المصاريف" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="executive" activeKey="budget" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "E04",
  name: "بنود المصاريف",
  states: [
    {
      key: "default",
      label: "الافتراضي",
      when: "البنود الخمسة: الاسم والنوع (محسوب أو يدخله المحاسب) ومفعّل أو معطّل. قائمة كل صف: تعديل الاسم، وتعطيل أو تفعيل. «إضافة بند» في الرأس.",
      node: shell(<CategoriesDemo />),
    },
    {
      key: "form",
      label: "نافذة البند",
      when: "«إضافة بند»: الاسم وحده (النوع «يدخله المحاسب» دائماً). الزر معطّل حتى يُكتب الاسم.",
      node: shell(<CategoriesDemo initialForm={{ mode: "create" }} />),
    },
    {
      key: "system",
      label: "البندان الأساسيان",
      when: "«عينات ومواد دعائية» و«مواصلات» بشارة «نظامي»: خيارا التعديل والتعطيل في قائمة الصف معطّلان وسببهما ظاهر (409 من الخادم إن أُرسلا).",
      node: shell(<CategoriesDemo />),
    },
    ...systemStates({
      loading: shell(<CategoriesDemo mode="loading" />),
      empty: shell(<CategoriesDemo mode="empty" />),
      error: shell(<CategoriesDemo mode="error" />),
      forbidden: (
        <ShellScreen user="delegate" activeKey="pending" breadcrumbs={breadcrumbs}>
          <ForbiddenState />
        </ShellScreen>
      ),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function ExpenseCategoriesPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

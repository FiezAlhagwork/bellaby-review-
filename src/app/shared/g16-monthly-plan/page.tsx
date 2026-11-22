import type { ReactNode } from "react";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { MonthlyPlanDemo } from "./MonthlyPlanDemo";

// G16 · الخطة الشهرية. الحالات في SCREENS.md (approved وrevision-pending وrevision-form وrevision-decision وno-plan)، ومعها already_decided والحالات العامة.

const head = (node: ReactNode) => (
  <ShellScreen user="sales_manager" activeKey="plan" breadcrumbs={[{ label: "الرئيسية", href: "#" }, { label: "الخطة" }]}>
    {node}
  </ShellScreen>
);
const executive = (node: ReactNode) => (
  <ShellScreen user="executive" activeKey="pending" breadcrumbs={[{ label: "الرئيسية", href: "#" }, { label: "بانتظار قراري", href: "#" }, { label: "تعديل الخطة" }]}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "G16",
  name: "الخطة الشهرية",
  states: [
    { key: "approved", label: "سارية", when: "خطة المبيعات لتشرين الثاني: المخطط والفعلي والنسبة لكل هدف، و«طلب تعديل».", node: head(<MonthlyPlanDemo state="approved" viewer="head" />) },
    { key: "revision-pending", label: "تعديل معلّق", when: "طلبت رنا تعديلاً: الخطة السارية كما هي، والتعديل المقترح مقابلها، و«طلب تعديل» معطّل.", node: head(<MonthlyPlanDemo state="revision-pending" viewer="head" />) },
    { key: "revision-form", label: "نافذة التعديل", when: "قيمة جديدة لكل هدف، والسبب إلزامي.", node: head(<MonthlyPlanDemo state="approved" viewer="head" openRevision />) },
    { key: "revision-decision", label: "قرار التعديل", when: "المدير التنفيذي: لوحة القرار على التعديل، والرفض بسبب.", node: executive(<MonthlyPlanDemo state="revision-pending" viewer="executive" />) },
    { key: "already-decided", label: "قرّر غيرك أولاً", when: "قرار على تعديل حُسم (409 already_decided) مع من قرّر ومتى.", node: executive(<MonthlyPlanDemo state="revision-pending" viewer="executive" initialActionError="already_decided" />) },
    { key: "no-plan", label: "لا خطة", when: "شهر بلا خطة معتمدة (404).", node: head(<MonthlyPlanDemo state="approved" viewer="head" initialMonth="2026-12" />) },
    ...systemStates({
      loading: head(<MonthlyPlanDemo state="approved" viewer="head" mode="loading" />),
      error: head(<MonthlyPlanDemo state="approved" viewer="head" mode="error" />),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function MonthlyPlanPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

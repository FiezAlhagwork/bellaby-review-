import type { ReactNode } from "react";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { MyLeavesDemo } from "./MyLeavesDemo";

// G17 · إجازاتي. الحالات في SCREENS.md (default وrequest-form وpast-days وcancel-confirm)، ومعها leave_before_current_month وleave_already_decided والحالات العامة. المستخدم سليم القاسم، عامل مستودع، وموافقه رامي السيد.

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "إجازاتي" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="warehouse_worker" activeKey="my-leaves" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "G17",
  name: "إجازاتي",
  states: [
    { key: "default", label: "الافتراضي", when: "سجل الطلبات: معلّقة بزر «إلغاء الطلب»، ومعتمدة، ومرفوضة بسببها، وملغاة. و«طلب إجازة».", node: shell(<MyLeavesDemo />) },
    { key: "request-form", label: "نافذة الطلب", when: "من، وإلى، والسبب (اختياري).", node: shell(<MyLeavesDemo initialRequest={{ from: "2026-12-14", to: "2026-12-15", reason: "" }} />) },
    { key: "past-days", label: "يبدأ بيوم مضى", when: "طلب يبدأ بيوم مضى من الشهر الحالي: شريط «تُغلق علامات الغياب إن اعتُمدت».", node: shell(<MyLeavesDemo initialRequest={{ from: "2026-11-19", to: "2026-11-20", reason: "مرض." }} />) },
    { key: "cancel-confirm", label: "تأكيد الإلغاء", when: "إلغاء الطلب المعلّق قبل البت.", node: shell(<MyLeavesDemo cancelOpen />) },
    { key: "before-month", label: "قبل الشهر الحالي", when: "طلب يبدأ قبل أول الشهر الحالي (422 leave_before_current_month).", node: shell(<MyLeavesDemo initialRequest={{ from: "2026-10-30", to: "2026-11-02", reason: "" }} initialRequestError="leave_before_current_month" />) },
    { key: "already-decided", label: "بُتّ فيها", when: "إلغاء طلب بتّ فيه المدير قبلك (409 leave_already_decided).", node: shell(<MyLeavesDemo initialActionError="leave_already_decided" />) },
    ...systemStates({
      loading: shell(<MyLeavesDemo mode="loading" />),
      empty: shell(<MyLeavesDemo mode="empty" />),
      error: shell(<MyLeavesDemo mode="error" />),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function MyLeavesPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { MonthWinnersDemo } from "./MonthWinnersDemo";

// E09 · موظف الشهر. الحالات في SCREENS.md (default وtie وskipped وchoose-other وapproved)، ومعها «الشهر غير مغلق» والحالات العامة.
// month_winners.approve، ولا يشمله التفويض: المفوَّض «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "موظف الشهر" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="executive" activeKey="month-winner" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "E09",
  name: "موظف الشهر",
  states: [
    {
      key: "default",
      label: "الافتراضي",
      when: "تشرين الأول: مرشّح لكل مجموعة (المندوبون، والإشراف، والمستودع) وعميل الشهر، ولكل منها «اعتماد» و«اختيار غيره».",
      node: shell(<MonthWinnersDemo />),
    },
    {
      key: "tie",
      label: "متعادلون",
      when: "الإشراف: منى الصباغ وخالد النجار بالنقاط نفسها، بشارة «متعادلون» وزر اعتماد لكل منهما.",
      node: shell(<MonthWinnersDemo dataset="tie" />),
    },
    {
      key: "skipped",
      label: "تُخطّي لخصم",
      when: "سامر الحلبي أعلى نقاطاً في المندوبين وسليم القاسم في المستودع، وتُخطّيا لخصم عليهما: يظهران تحت «تُخطّي لخصم عليه»، والمرشّح الذي يليهما.",
      node: shell(<MonthWinnersDemo />),
    },
    {
      key: "choose-other",
      label: "اختيار غيره",
      when: "نافذة اختيار غير المرشّح في المستودع: الاختيار من المرشّحين ومن تُخطّي، والسبب إلزامي.",
      node: shell(<MonthWinnersDemo initialChoosing={{ key: "EMPLOYEE-3", subjectId: null, reason: "" }} />),
    },
    {
      key: "approved",
      label: "معتمد",
      when: "كلها معتمدة: من اعتُمد ومن اعتمده ومتى، والمستودع باختيار غير المرشّح بسببه.",
      node: shell(<MonthWinnersDemo dataset="approved" />),
    },
    {
      key: "month-not-closed",
      label: "الشهر غير مغلق",
      when: "تشرين الثاني لم يُغلق: الخادم يرجع 409 month_not_closed فتظهر رسالة «لم يُغلق الشهر بعد».",
      node: shell(<MonthWinnersDemo initialMonth="2026-11" />),
    },
    ...systemStates({
      loading: shell(<MonthWinnersDemo mode="loading" />),
      error: shell(<MonthWinnersDemo mode="error" />),
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

export default function MonthWinnerPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

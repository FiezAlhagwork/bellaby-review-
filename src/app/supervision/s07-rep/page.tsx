import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import type { ShellUserKey } from "@/mocks/shell-users";
import { RepProfileDemo } from "./RepProfileDemo";

// S07 · صفحة المندوب. الحالات في SCREENS.md (default وnegative-balance)، ومعها فشل قسم واحد وغير موجود والحالات العامة.
// تُفتح من الزيارات (S05) والتقارير (S02). المندوب تابع للشركة (المكتب العلمي) لا لوكيل. لكل قسم حالته المستقلة.

const breadcrumbsFor = (label: string) => [{ label: "الرئيسية", href: "#" }, { label: "الزيارات", href: "#" }, { label }];

const shell = (user: ShellUserKey, label: string, node: ReactNode) => (
  <ShellScreen user={user} activeKey="visits" breadcrumbs={breadcrumbsFor(label)}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "S07",
  name: "صفحة المندوب",
  states: [
    {
      key: "default",
      label: "الافتراضي",
      when: "سامر الحلبي: بياناته ودوام اليوم (جارية) وزيارات اليوم وما وزّعه هذا الشهر ورصيده من العينات والمواد وآخر تقاريره اليومية ونقاطه الشهرية (مبدئية لهذا الشهر، ونهائية للشهر السابق).",
      node: shell("supervisor", "سامر الحلبي", <RepProfileDemo />),
    },
    {
      key: "negative-balance",
      label: "رصيد سالب",
      when: "بعد تعارض في المزامنة صار رصيد العينات -3 (سالب جائز للمندوب وحده): شريط تحذير في أعلى الصفحة وشارة «سالب» على السطر.",
      node: shell("supervisor", "سامر الحلبي", <RepProfileDemo balance="negative" />),
    },
    {
      key: "partial-error",
      label: "فشل قسم",
      when: "طلب الرصيد فشل وحده: بطاقته تعرض «تعذّر تحميل البيانات» مع «إعادة المحاولة» وبقية الأقسام سليمة.",
      node: shell("supervisor", "سامر الحلبي", <RepProfileDemo mode="partial" />),
    },
    {
      key: "not-found",
      label: "غير موجود",
      when: "رابط مندوب غير موجود أو خارج نطاق المستخدم (not_found): «العنصر غير موجود أو خارج نطاقك» وزر رجوع.",
      node: shell("supervisor", "مندوب", <RepProfileDemo mode="not-found" />),
    },
    ...systemStates({
      loading: shell("supervisor", "سامر الحلبي", <RepProfileDemo mode="loading" />),
      error: shell("supervisor", "سامر الحلبي", <RepProfileDemo mode="error" />),
      // الوكيل لا يقرأ صفحات المندوبين: وفتح رابطها يُظهر «لا صلاحية».
      forbidden: (
        <ShellScreen user="agent" activeKey="home-agent" breadcrumbs={breadcrumbsFor("مندوب")}>
          <ForbiddenState />
        </ShellScreen>
      ),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function RepPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

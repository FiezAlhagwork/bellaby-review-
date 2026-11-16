import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import type { ShellUserKey } from "@/mocks/shell-users";
import { VisitDetailsDemo } from "./VisitDetailsDemo";

// S06 · تفاصيل الزيارة. الحالات في SCREENS.md (read-only وqa-flagged وconfirmed وrejected وphoto-pending)، ومعها نافذتا القرار وقرّر غيرك (القرار 12) وغير موجودة والحالات العامة.
// القرار للمراقبة وحدها (visits.decide) على الزيارة المشكوك فيها. السوبرفايزر ومدير المكتب العلمي للقراءة. تفاعلية: تأكيد أو رفض (بسبب) ثم سجل القرار (القرار 4).

const breadcrumbsFor = (label: string) => [{ label: "الرئيسية", href: "#" }, { label: "الزيارات", href: "#" }, { label }];

const shell = (user: ShellUserKey, label: string, node: ReactNode) => (
  <ShellScreen user={user} activeKey="visits" breadcrumbs={breadcrumbsFor(label)}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "S06",
  name: "تفاصيل الزيارة",
  states: [
    {
      key: "read-only",
      label: "للقراءة فقط",
      when: "السوبرفايزر يرى زيارة مشكوك فيها (خارج النطاق: 640 م والنطاق 200 م) بكل حقولها وخريطتها وعلاماتها، بلا قرار: شريط «بانتظار المراقبة». كذلك مدير المكتب العلمي.",
      node: shell("supervisor", "زيارة عيادة د. ريم حداد", <VisitDetailsDemo visitId={31092} />),
    },
    {
      key: "qa-flagged",
      label: "مشكوك فيها (المراقبة)",
      when: "المراقبة تفتح الزيارة المشكوك فيها: لوحة «بانتظار قرارك» بـ«تأكيد الزيارة» (تُغلق علاماتها بلا مشكلة) و«رفض الزيارة» (علاماتها مؤكَّدة وتُستبعد من المؤشرات). القرار يحل سجله محل اللوحة.",
      node: shell("monitoring", "زيارة عيادة د. ريم حداد", <VisitDetailsDemo visitId={31092} canDecide />),
    },
    {
      key: "confirm",
      label: "تأكيد الزيارة",
      when: "«تأكيد الزيارة» يفتح تأكيداً بلا سبب: تُغلق علاماتها بلا مشكلة وتبقى محسوبة في المؤشرات.",
      node: shell("monitoring", "زيارة عيادة د. ريم حداد", <VisitDetailsDemo visitId={31092} canDecide initialDecision={{ kind: "confirm", reason: "" }} />),
    },
    {
      key: "reject",
      label: "رفض الزيارة",
      when: "«رفض الزيارة» يفتح نافذة السبب: الزر معطّل حتى يُكتب السبب. الرفض يغلق علاماتها مؤكَّدة ويستبعدها من المؤشرات ولا يُلغى. (السبب اختياري في العقد، وإلزامه هنا سؤال للباك.)",
      node: shell("monitoring", "زيارة عيادة د. ريم حداد", <VisitDetailsDemo visitId={31092} canDecide initialDecision={{ kind: "reject", reason: "" }} />),
    },
    {
      key: "confirmed",
      label: "مؤكَّدة",
      when: "زيارة أكّدتها المراقبة: سجل القرار بمن قرّر ومتى وسببه، وعلامتها «لا مشكلة». تبقى محسوبة في المؤشرات.",
      node: shell("supervisor", "زيارة", <VisitDetailsDemo visitId={32100} />),
    },
    {
      key: "rejected",
      label: "مرفوضة",
      when: "زيارة رفضتها المراقبة (موقع مزوَّر): سجل القرار بسببه، وعلامتها مؤكَّدة، وشريط «مستبعدة من المؤشرات».",
      node: shell("supervisor", "زيارة", <VisitDetailsDemo visitId={32101} />),
    },
    {
      key: "photo-pending",
      label: "الصورة معلّقة",
      when: "صورة الزيارة لم تُرفع بعد من جهاز المندوب: شارة «معلّقة» وشريط «الصورة لم تُرفع بعد» وعلامة «صورة معلّقة». الزيارة نفسها سليمة.",
      node: shell("supervisor", "زيارة", <VisitDetailsDemo visitId={31100} />),
    },
    {
      key: "already-decided",
      label: "قرّر غيرك (409)",
      when: "قرّر مراقب آخر قبلك: شريط «قرّر غيرك قبلك» ثم سجل القرار بدل اللوحة (القرار 12). رمز الخطأ `already_decided` غير موثّق لهذه النقطة في العقد (سؤال للباك).",
      node: shell("monitoring", "زيارة عيادة د. ريم حداد", <VisitDetailsDemo visitId={31092} canDecide decidedByOther initialDecisionError="already_decided" />),
    },
    {
      key: "not-found",
      label: "غير موجودة",
      when: "رابط زيارة غير موجودة أو خارج نطاق المستخدم (not_found): «العنصر غير موجود أو خارج نطاقك» وزر رجوع.",
      node: shell("supervisor", "زيارة", <VisitDetailsDemo visitId={31092} mode="not-found" />),
    },
    ...systemStates({
      loading: shell("supervisor", "زيارة", <VisitDetailsDemo visitId={31092} mode="loading" />),
      error: shell("supervisor", "زيارة", <VisitDetailsDemo visitId={31092} mode="error" />),
      // الوكيل لا يقرأ زيارات المندوبين: عنصرها غير ظاهر له، وفتح رابطها يُظهر «لا صلاحية».
      forbidden: (
        <ShellScreen user="agent" activeKey="home-agent" breadcrumbs={breadcrumbsFor("زيارة")}>
          <ForbiddenState />
        </ShellScreen>
      ),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function VisitPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

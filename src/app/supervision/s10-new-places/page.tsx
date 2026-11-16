import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { NewPointsDemo } from "./NewPointsDemo";

// S10 · الجهات الجديدة. الحالات في SCREENS.md (default وreject وbulk-reject)، ومعها الحالات العامة. تفاعلية: «مقبولة» و«مرفوضة» (بسبب) والتحديد والرفض الجماعي.
// «مرفوضة» تعطّل الجهة وتعيد زياراتها «مشكوكاً فيها». الرفض الجماعي يرفض زيارات الجهات المحدّدة وتُستبعد من المؤشرات (القرار 4).

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "الجهات الجديدة" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="monitoring" activeKey="new-places" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "S10",
  name: "الجهات الجديدة",
  states: [
    {
      key: "default",
      label: "الافتراضي",
      when: "ثلاث جهات أضافها مندوبون وتنتظر المراجعة: الاسم والنوع والتخصص والمحافظة ومن أضافها وتاريخه وعدد زياراتها. لكل جهة «مقبولة» (تُغلق علامتها بلا مشكلة) و«مرفوضة».",
      node: shell(<NewPointsDemo />),
    },
    {
      key: "reject",
      label: "رفض جهة",
      when: "«مرفوضة» تفتح نافذة السبب: الزر معطّل حتى يُكتب. الرفض يعطّل الجهة وتعود زياراتها «مشكوكاً فيها». (السبب اختياري في العقد، وإلزامه هنا سؤال للباك.)",
      node: shell(<NewPointsDemo initialRejectId={203} />),
    },
    {
      key: "bulk-reject",
      label: "رفض جماعي",
      when: "جهتان محدّدتان فيظهر شريط التحديد («رفض زياراتها»). النافذة بسبب إلزامي تذكر عدد الجهات والزيارات، وبعد الرفض شريط «رُفضت N زيارة».",
      node: shell(<NewPointsDemo initialSelected={[201, 203]} initialBulkOpen />),
    },
    {
      key: "already-decided",
      label: "قرّر غيرك (409)",
      when: "قرّر مراقب آخر على الجهة قبلك: شريط «قرّر غيرك قبلك» فوق الجدول (القرار 12).",
      node: shell(<NewPointsDemo initialActionError="already_decided" />),
    },
    ...systemStates({
      loading: shell(<NewPointsDemo mode="loading" />),
      empty: shell(<NewPointsDemo mode="empty" />),
      error: shell(<NewPointsDemo mode="error" />),
      // السوبرفايزر لا يراجع الجهات الجديدة: عنصرها غير ظاهر له، وفتح رابطها يُظهر «لا صلاحية».
      forbidden: (
        <ShellScreen user="supervisor" activeKey="home-supervisor" breadcrumbs={breadcrumbs}>
          <ForbiddenState />
        </ShellScreen>
      ),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function NewPlacesPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

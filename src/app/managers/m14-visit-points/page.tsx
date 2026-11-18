import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { VisitPointsDemo } from "./VisitPointsDemo";

// M14 · جهات الزيارة. الحالات في SCREENS.md (list وmap وdisabled-filter)، ومعها الحالات العامة للقوائم.
// لمدير المكتب العلمي (visit_points.manage): السوبرفايزر «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "جهات الزيارة" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="scientific_manager" activeKey="visit-places" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "M14",
  name: "جهات الزيارة",
  states: [
    {
      key: "list",
      label: "قائمة",
      when: "جهات الزيارة في جدول: الاسم والعنوان والنوع والاختصاص والمحافظة وآخر زيارة والحالة. فلاتر النوع والاختصاص والمحافظة وفعّالة/معطّلة، وترقيم. الصف يفتح صفحة الجهة (M15).",
      node: shell(<VisitPointsDemo />),
    },
    {
      key: "map",
      label: "خريطة",
      when: "الجهات نفسها على الخريطة بالفلاتر نفسها. الضغط على نقطة يعرض بطاقتها وزر «فتح الجهة». تعرض الخريطة جهات الصفحة الحالية.",
      node: shell(<VisitPointsDemo initialMode="map" />),
    },
    {
      key: "disabled-filter",
      label: "فلتر المعطّلة",
      when: "فلتر الحالة «معطّلة»: جهتان، مرفوضة (رفضتها المراقبة) ومدمجة (في جهة أخرى)، كلٌّ بشارة سببها.",
      node: shell(<VisitPointsDemo initialFilters={{ typeId: null, specialtyId: null, governorateId: null, status: "DISABLED" }} />),
    },
    ...systemStates({
      loading: shell(<VisitPointsDemo mode="loading" />),
      empty: shell(<VisitPointsDemo mode="empty" />),
      error: shell(<VisitPointsDemo mode="error" />),
      // السوبرفايزر لا يملك visit_points.manage: عنصر «جهات الزيارة» غير ظاهر له، وفتح رابطه يُظهر «لا صلاحية».
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

export default function VisitPointsPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

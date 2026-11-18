import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { mergedPointId, rejectedPointId } from "@/mocks/visit-points-list";
import { VisitPointDemo } from "./VisitPointDemo";

// M15 · صفحة الجهة. الحالتان في SCREENS.md (default وdisabled: مرفوضة أو مدمجة)، ومعهما نافذة التعديل وجهة غير موجودة والحالات العامة.
// لمدير المكتب العلمي (visit_points.manage): السوبرفايزر «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "جهات الزيارة", href: "#" }, { label: "الجهة" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="scientific_manager" activeKey="visit-places" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "M15",
  name: "صفحة الجهة",
  states: [
    {
      key: "default",
      label: "الافتراضي",
      when: "جهة فعّالة مربوطة بعميل: بياناتها وموقعها، وآخر زيارة والإجراء القادم، والعميل المربوط، ومندوبوها وزياراتها. «تعديل البيانات» يفتح درجاً (الاسم والنوع والاختصاص والهاتف والعنوان، لا الموقع).",
      node: shell(<VisitPointDemo />),
    },
    {
      key: "edit",
      label: "نافذة التعديل",
      when: "درج التعديل مفتوح: «حفظ التعديل» معطّل وسببه ظاهر حتى يكتمل الاسم والنوع والهاتف. الحفظ يحدّث الصفحة.",
      node: shell(<VisitPointDemo initialEditing />),
    },
    {
      key: "disabled",
      label: "معطّلة (مرفوضة)",
      when: "جهة رفضتها المراقبة: شريط تحذير، وشارة «مرفوضة»، ولا زر تعديل. زياراتها السابقة للقراءة.",
      node: shell(<VisitPointDemo pointId={rejectedPointId} />),
    },
    {
      key: "disabled-merged",
      label: "معطّلة (مدمجة)",
      when: "جهة دُمجت في أخرى: شريط يذكر رقم الجهة الباقية، ولا زر تعديل.",
      node: shell(<VisitPointDemo pointId={mergedPointId} />),
    },
    {
      key: "not-found",
      label: "غير موجودة",
      when: "رابط جهة محذوفة أو خاطئة (404): «غير موجودة» مع رجوع.",
      node: shell(<VisitPointDemo mode="not-found" />),
    },
    ...systemStates({
      loading: shell(<VisitPointDemo mode="loading" />),
      error: shell(<VisitPointDemo mode="error" />),
      // السوبرفايزر لا يملك visit_points.manage: فتح الرابط يُظهر «لا صلاحية».
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

export default function VisitPointPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

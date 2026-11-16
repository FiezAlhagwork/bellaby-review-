import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { AttendanceDemo } from "./AttendanceDemo";

// S04 · الدوام. الحالات في SCREENS.md (default وshort-day وabsent وauto-closed)، ومعها الحالات العامة للقوائم. الفلاتر والترقيم تفاعلية.
// للقراءة: الخصم قرار يدوي للمدير التنفيذي لا آلي. للسوبرفايزر (attendance.view): الوكيل «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "الدوام" }];

const supervisor = (node: ReactNode) => (
  <ShellScreen user="supervisor" activeKey="attendance" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const noRange = { from: null, to: null };

const screen: ScreenDefinition = {
  id: "S04",
  name: "الدوام",
  states: [
    {
      key: "default",
      label: "الافتراضي",
      when: "22 صفاً لثلاثة مندوبين من الأحدث: جلسات بالبدء والانتهاء والمدة و«يوم كامل؟»، والعلامات (إغلاق آلي، عطلة، دوام ناقص، غياب). جلسات اليوم «جارية». فلاتر المندوب والفترة والعرض.",
      node: supervisor(<AttendanceDemo />),
    },
    {
      key: "short-day",
      label: "دوام ناقص",
      when: "فلتر العرض «دوام ناقص»: الجلسات المنتهية بأقل من 8 ساعات (يوم كامل؟ «لا»)، وجلسة العطلة لا تُحسب.",
      node: supervisor(<AttendanceDemo initialFilters={{ repId: null, range: noRange, view: "short-day" }} />),
    },
    {
      key: "absent",
      label: "غياب",
      when: "فلتر العرض «غياب»: يوم عمل بلا جلسة، فصفه بلا بدء ولا انتهاء ومعه علامة «غياب». مصدر هذه الصفوف مطلوب من الباك.",
      node: supervisor(<AttendanceDemo initialFilters={{ repId: null, range: noRange, view: "absent" }} />),
    },
    {
      key: "auto-closed",
      label: "إغلاق آلي",
      when: "فلتر العرض «إغلاق آلي» (close_source=AUTO): جلسة أغلقها الخادم لأن المندوب لم ينهِ دوامه، بعلامتها «إغلاق آلي».",
      node: supervisor(<AttendanceDemo initialFilters={{ repId: null, range: noRange, view: "auto-closed" }} />),
    },
    ...systemStates({
      loading: supervisor(<AttendanceDemo mode="loading" />),
      empty: supervisor(<AttendanceDemo mode="empty" />),
      error: supervisor(<AttendanceDemo mode="error" />),
      // الوكيل لا يملك attendance.view: عنصر الدوام غير ظاهر له، وفتح رابطه يُظهر «لا صلاحية».
      forbidden: (
        <ShellScreen user="agent" activeKey="home-agent" breadcrumbs={breadcrumbs}>
          <ForbiddenState />
        </ShellScreen>
      ),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function AttendancePage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

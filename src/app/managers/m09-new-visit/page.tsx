import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { blankVisitForm, filledVisitForm, invalidVisitErrors, invalidVisitForm, readyLocation } from "@/mocks/manager-visits";
import { NewManagerVisitDemo } from "./NewManagerVisitDemo";

// M09 · زيارة جديدة (موبايل). الحالات في SCREENS.md (default وlocating وlocation-denied وsaved)، ومعها نموذج جاهز للحفظ وأخطاء الخادم ولا صلاحية.
// زيارة مدير المبيعات لعميل أو لصيدلية من جهات الزيارة لم تصر عميلاً، بموقع المتصفح الإلزامي (لا زيارة بلا موقع). الوقت وقت الخادم، والزيارة لا تضيف عميلاً (القرار 12).
// لمدير المبيعات (manager_visits.create): السوبرفايزر «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "زياراتي", href: "#" }, { label: "زيارة جديدة" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="sales_manager" activeKey="my-visits" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "M09",
  name: "زيارة جديدة",
  states: [
    {
      key: "default",
      label: "الافتراضي",
      when: "نموذج فارغ: الجهة (عميل أو صيدلية من جهات الزيارة)، والهدف، والنتيجة (اختيارية)، والملاحظات، وبطاقة الموقع بزر «تحديد موقعي». «حفظ الزيارة» معطّل وسببه ظاهر. ملاحظة: الزيارة لا تضيف عميلاً.",
      node: shell(<NewManagerVisitDemo initialForm={blankVisitForm} />),
    },
    {
      key: "locating",
      label: "يطلب الموقع",
      when: "ضغط «تحديد موقعي»: المتصفح يطلب إذن الموقع. مؤشر «جارٍ تحديد موقعك»، و«حفظ الزيارة» معطّل حتى يصل الموقع.",
      node: shell(<NewManagerVisitDemo initialForm={filledVisitForm} initialLocation={{ status: "locating" }} />),
    },
    {
      key: "location-denied",
      label: "الموقع مرفوض",
      when: "رُفض إذن الموقع: شريط «فعّل الموقع» وزر «إعادة المحاولة». لا تُحفظ زيارة بلا موقع، و«حفظ الزيارة» معطّل وسببه ظاهر.",
      node: shell(<NewManagerVisitDemo initialForm={filledVisitForm} initialLocation={{ status: "denied" }} locationOutcome="denied" />),
    },
    {
      key: "ready",
      label: "جاهز للحفظ",
      when: "التُقط الموقع (دقة 14 متراً) واكتملت الجهة والهدف: «حفظ الزيارة» مفعّل. يُرسل `POST /manager-visits` بالإحداثيات، والوقت وقت الخادم.",
      node: shell(<NewManagerVisitDemo initialForm={filledVisitForm} initialLocation={readyLocation} />),
    },
    {
      key: "validation",
      label: "أخطاء الخادم",
      when: "رفض الخادم (validation_failed): الهدف غير فعّال، والملاحظات أطول من الحد. نص الخادم تحت حقله.",
      node: shell(<NewManagerVisitDemo initialForm={invalidVisitForm} initialLocation={readyLocation} errors={invalidVisitErrors} />),
    },
    {
      key: "saved",
      label: "حُفظت",
      when: "بعد الحفظ (201): ملخص الزيارة (الجهة والهدف والنتيجة والملاحظات والدقة) بوقت الخادم، وزرا «زيارة أخرى» و«زياراتي».",
      node: shell(<NewManagerVisitDemo initialForm={filledVisitForm} initialLocation={readyLocation} initiallySaved />),
    },
    {
      key: "forbidden",
      label: "لا صلاحية",
      when: "السوبرفايزر لا يملك manager_visits.create: عنصر «زياراتي» غير ظاهر له، وفتح رابطه يُظهر «لا صلاحية».",
      system: true,
      node: (
        <ShellScreen user="supervisor" activeKey="home-supervisor" breadcrumbs={breadcrumbs}>
          <ForbiddenState />
        </ShellScreen>
      ),
    },
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function NewVisitPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

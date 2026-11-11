import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { ShellFrame } from "./frames";

// G02 · إطار اللوحة. الحالات في SCREENS.md. الدور يأتي من مستخدم وهمي بصلاحياته، والقائمة من config/navigation.ts بالصلاحيات.

const screen: ScreenDefinition = {
  id: "G02",
  name: "إطار اللوحة",
  states: [
    {
      key: "default",
      label: "الوكيل",
      when: "الإطار بقائمة دور الوكيل: الرئيسية والاستلامات ورصيدي والعملاء والتسليمات والمستحقات.",
      node: <ShellFrame user="agent" activeKey="home-agent" pageTitle="الرئيسية" />,
    },
    {
      key: "executive",
      label: "المدير التنفيذي",
      when: "قائمة المدير التنفيذي: الميزانية والخصومات وإغلاق الشهر والإعدادات، وبانتظار قراري بعدده في الشريط العلوي.",
      node: <ShellFrame user="executive" activeKey="home-executive" pageTitle="الرئيسية" />,
    },
    {
      key: "delegate-active",
      label: "مفوَّض",
      when: "مدير مفوَّض عن المدير التنفيذي: يظهر شريط «أنت مفوَّض عن المدير التنفيذي حتى …» وتُسجَّل قراراته بالتفويض.",
      node: <ShellFrame user="delegate" activeKey="pending" pageTitle="بانتظار قراري" />,
    },
    {
      key: "delegation-given",
      label: "فوّضتُ غيري",
      when: "المدير التنفيذي فوّض غيره: شريط «فوّضت … حتى …» مع زر «إنهاء التفويض».",
      node: <ShellFrame user="executive" activeKey="delegation" pageTitle="التفويض" delegator />,
    },
    {
      key: "tablet",
      label: "تابلت",
      when: "على عرض التابلت تصغر القائمة إلى أيقونات مع تلميح لكل عنصر، وتتوسع بزر القائمة.",
      reviewHidden: true,
      node: <ShellFrame user="agent" activeKey="home-agent" pageTitle="الرئيسية" widthClass="w-256" />,
    },
    {
      key: "mobile-drawer",
      label: "موبايل · القائمة مفتوحة",
      when: "على الموبايل تختفي القائمة وتفتح درجاً من الجانب بزر القائمة.",
      reviewHidden: true,
      node: <ShellFrame user="agent" activeKey="home-agent" pageTitle="الرئيسية" menuOpen />,
    },
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function DashboardFramePage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

import type { ReactNode } from "react";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { ProfileDemo } from "./ProfileDemo";

// G05 · ملفي الشخصي. الحالات في SCREENS.md (default وprovisional)، ومعها التحميل والخطأ. العقد والراتب لا يظهران هنا (§96).

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "ملفي الشخصي" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="warehouse_worker" activeKey="" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "G05",
  name: "ملفي الشخصي",
  states: [
    { key: "default", label: "الافتراضي", when: "بياناتي ودوري ووصف مهامه، والمهام المفتوحة، والتقييمات الشهرية النهائية، والخصومات (ومعها القيد المعاكس إن وُجد).", node: shell(<ProfileDemo />) },
    { key: "provisional", label: "مبدئي", when: "تقييم الشهر الجاري مبدئي: شارة «مبدئي» وشريط بأنه يتغيّر حتى الإغلاق.", node: shell(<ProfileDemo provisional />) },
    ...systemStates({
      loading: shell(<ProfileDemo mode="loading" />),
      error: shell(<ProfileDemo mode="error" />),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function ProfilePage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

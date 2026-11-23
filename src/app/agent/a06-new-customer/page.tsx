import type { ReactNode } from "react";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { CustomerFormDemo } from "./CustomerFormDemo";

// A06 · عميل جديد. الحالات في SCREENS.md (empty وlink-suggestion وlinked وvalidation). القرار 7. محافظة دمشق رقمها 1 في mocks المبيعات.

const shell = (node: ReactNode) => (
  <ShellScreen user="agent" activeKey="agent-customers" breadcrumbs={[{ label: "الرئيسية", href: "#" }, { label: "العملاء", href: "#" }, { label: "عميل جديد" }]}>
    {node}
  </ShellScreen>
);

const zahraa = { name: "صيدلية الزهراء", phone: "944 521 307", address: "دمشق، ركن الدين، قرب ساحة شمدين", governorateId: "1" };

const screen: ScreenDefinition = {
  id: "A06",
  name: "عميل جديد",
  states: [
    { key: "empty", label: "فارغ", when: "النموذج فارغاً: الاسم والهاتف والمحافظة (ضمن محافظاتي) والعنوان.", node: shell(<CustomerFormDemo />) },
    { key: "link-suggestion", label: "اقتراح ربط", when: "«صيدلية الزهراء» في دمشق تشابه جهة زيارة: «هي نفسها» أو «لا، عميل جديد»، والحفظ ينتظر الإجابة.", node: shell(<CustomerFormDemo initialForm={{ ...zahraa, link: null }} />) },
    { key: "linked", label: "مربوط", when: "اختار «هي نفسها»: سجل واحد بعد الحفظ (link_visit_point_id).", node: shell(<CustomerFormDemo initialForm={{ ...zahraa, link: "same" }} />) },
    { key: "validation", label: "أخطاء التحقق", when: "حفظ بحقول ناقصة: نص الخادم تحت كل حقل (422).", node: shell(<CustomerFormDemo initialForm={{ name: "صيدلية الربيع", phone: "94452", address: "", governorateId: null, link: null }} initialErrors={{ phone: "رقم الهاتف غير صحيح.", governorate_id: "اختر المحافظة.", address: "العنوان مطلوب." }} />) },
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function NewCustomerPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

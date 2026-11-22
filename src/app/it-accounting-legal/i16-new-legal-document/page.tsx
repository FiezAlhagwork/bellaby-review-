import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { NewLegalDocumentDemo } from "./NewLegalDocumentDemo";

// I16 · وثيقة جديدة. الحالات في SCREENS.md (empty وvalidation)، ومعها «لا صلاحية».
// legal.manage: المحاسب «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "الوثائق", href: "#" }, { label: "وثيقة جديدة" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="legal" activeKey="legal-documents" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "I16",
  name: "وثيقة جديدة",
  states: [
    {
      key: "empty",
      label: "فارغ",
      when: "النموذج فارغ، و«شركة Trust» طرف أول. «إضافة الوثيقة» معطّل وسببه ظاهر حتى العنوان والفئة والملف.",
      node: shell(<NewLegalDocumentDemo />),
    },
    {
      key: "validation",
      label: "خطأ التحقق",
      when: "رفض الخادم (422): نصه تحت الحقول.",
      node: shell(
        <NewLegalDocumentDemo
          initialForm={{ title: "عقد وكالة توزيع — حمص", category: "AGENT_CONTRACT", parties: ["شركة Trust", "مؤسسة العاصي للتوزيع"], startsOn: "2026-12-01", expiresOn: "2027-11-30", alertDays: null, file: [{ id: "f1", name: "agent-asi.pdf", size: 1840000, status: "done" }] }}
          errors={{ starts_on: "تاريخ البدء غير صالح.", expires_on: "تاريخ الانتهاء غير صالح." }}
        />,
      ),
    },
    {
      key: "forbidden",
      label: "لا صلاحية",
      when: "من لا يملك legal.manage: فتح الرابط يُظهر «لا صلاحية». النموذج لا يجلب بيانات فلا تحميل ولا خطأ تحميل.",
      node: (
        <ShellScreen user="accountant" activeKey="home-accountant" breadcrumbs={breadcrumbs}>
          <ForbiddenState />
        </ShellScreen>
      ),
    },
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function NewLegalDocumentPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

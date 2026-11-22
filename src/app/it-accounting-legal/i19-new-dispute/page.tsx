import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { NewDisputeDemo } from "./NewDisputeDemo";

// I19 · فتح نزاع. الحالات في SCREENS.md (direct وfrom-referral)، ومعها خطأ التحقق و«لا صلاحية».
// disputes.manage: مدير المبيعات يحيل فقط (disputes.refer) فيرى «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "النزاعات", href: "#" }, { label: "فتح نزاع" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="legal" activeKey="disputes" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "I19",
  name: "فتح نزاع",
  states: [
    {
      key: "direct",
      label: "مباشر",
      when: "النموذج فارغ: العنوان (إلزامي)، والتسليم (اختياري، ومنه العميل)، والوصف. «فتح النزاع» معطّل حتى العنوان.",
      node: shell(<NewDisputeDemo />),
    },
    {
      key: "from-referral",
      label: "محال",
      when: "دين متعثر أحاله مدير المبيعات: شريط الإحالة بملاحظتها، والتسليم مقفل، والعنوان والوصف معبّآن. (§91: الإحالة تنشئ النزاع في الخادم.)",
      node: shell(<NewDisputeDemo referral />),
    },
    {
      key: "validation",
      label: "خطأ التحقق",
      when: "رفض الخادم (422): نصه تحت حقله.",
      node: shell(<NewDisputeDemo initialForm={{ title: "مطالبة صيدلية الإسراء", deliveryId: "2105", description: "" }} errors={{ delivery_id: "التسليم المختار غير صالح." }} />),
    },
    {
      key: "forbidden",
      label: "لا صلاحية",
      when: "من لا يملك disputes.manage (مدير المبيعات يحيل ولا يفتح). النموذج لا يجلب بيانات فلا تحميل ولا خطأ تحميل.",
      node: (
        <ShellScreen user="sales_manager" activeKey="home-sales-manager" breadcrumbs={breadcrumbs}>
          <ForbiddenState />
        </ShellScreen>
      ),
    },
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function NewDisputePage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

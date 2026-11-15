import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { SampleRequestsListDemo } from "./SampleRequestsListDemo";

// W09 · طلبات العينات. الحالة في SCREENS.md `default` (جديد ومصروف ومرفوض وملغى معاً)، ومعها الحالات العامة. الفلاتر والترقيم في الصفحة تفاعلية.
// للوجستي وحده (صلاحية transfers.create لعنصر القائمة: الصرف والرفض بها في العقد): عامل المستودع «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "طلبات العينات" }];

const logistics = (node: ReactNode) => (
  <ShellScreen user="logistics" activeKey="warehouse-sample-requests" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "W09",
  name: "طلبات العينات",
  states: [
    {
      key: "default",
      label: "كل الطلبات",
      when: "طلبات العينات والمواد الدعائية للمندوبين من مدير المكتب العلمي: المندوب والطالب والأصناف والسبب والتاريخ والحالة (جديد، مصروف، مرفوض، ملغى). جرّب فلتر «جديد» والمندوب والفترة.",
      node: logistics(<SampleRequestsListDemo />),
    },
    ...systemStates({
      loading: logistics(<SampleRequestsListDemo mode="loading" />),
      empty: logistics(<SampleRequestsListDemo mode="empty" />),
      error: logistics(<SampleRequestsListDemo mode="error" />),
      // عامل المستودع لا يملك معالجة الطلبات: عنصرها غير ظاهر له، وفتح رابطها يُظهر «لا صلاحية».
      forbidden: (
        <ShellScreen user="warehouse_worker" activeKey="balances" breadcrumbs={breadcrumbs}>
          <ForbiddenState />
        </ShellScreen>
      ),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function SampleRequestsPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

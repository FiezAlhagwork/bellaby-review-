import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { DamageReportsDemo } from "./DamageReportsDemo";

// W21 · تقارير تالف المستودع. الحالة في SCREENS.md: default (معلّق، وتالف مقبول بمسؤوليته، ومرفوض)، ومعها فلتر المعلّقة والحالات العامة للقوائم.
// الفلاتر والترقيم تفاعلية. للوجستي (damage.create): عامل المستودع «لا صلاحية». الصف يفتح M08 للقراءة، وM08 لم تُرسم بعد.

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "التالف" }];

const logistics = (node: ReactNode) => (
  <ShellScreen user="logistics" activeKey="warehouse-damage" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "W21",
  name: "تقارير تالف المستودع",
  states: [
    {
      key: "default",
      label: "كل التقارير",
      when: "14 تقريراً بحالاتها: معلّق (4) بانتظار قرار مدير المبيعات، وتالف مقبول (7) بمسؤوليته (المستودع أو المصنّع أو الوكيل أو جهة أخرى)، ومرفوض (3). جرّب فلتر الحالة والموقع، و«تقرير تالف».",
      node: logistics(<DamageReportsDemo initialPerPage={10} />),
    },
    {
      key: "pending-filter",
      label: "فلتر المعلّقة",
      when: "فلتر الحالة «بانتظار القرار»: التقارير التي لم يُبتّ فيها بعد، ولا مسؤولية لها حتى القرار. الشارة تحت الشريط تزيل الفلتر.",
      node: logistics(<DamageReportsDemo initialFilters={{ status: "PENDING", locationId: null }} />),
    },
    ...systemStates({
      loading: logistics(<DamageReportsDemo mode="loading" />),
      empty: logistics(<DamageReportsDemo mode="empty" />),
      error: logistics(<DamageReportsDemo mode="error" />),
      // عامل المستودع لا يملك damage.create: عنصر التالف غير ظاهر له، وفتح رابطه يُظهر «لا صلاحية».
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

export default function DamageReportsPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

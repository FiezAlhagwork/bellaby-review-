import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { StockMovementsDemo } from "./StockMovementsDemo";

// W03 · حركات المخزون. الحالات في SCREENS.md، ومعها الحالات العامة. الفلاتر والترقيم في الصفحة تفاعلية (تعمل على بيانات المعرض).
// الشاشة للوجستي وحده (عنصر القائمة بصلاحية الحركات)، فيراها عامل المستودع «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "الحركات" }];

const logistics = (node: ReactNode) => (
  <ShellScreen user="logistics" activeKey="movements" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "W03",
  name: "حركات المخزون",
  states: [
    {
      key: "default",
      label: "كل الحركات",
      when: "سجل حركات المخزون من الأحدث إلى الأقدم: إدخال وصرف وتسليم وإرجاع وتسوية وتالف وعكس. جرّب فلاتر الموقع والصنف والفترة والترقيم.",
      node: logistics(<StockMovementsDemo />),
    },
    {
      key: "from-balance",
      label: "من صف في الأرصدة",
      when: "حين يفتح اللوجستي صفاً في الأرصدة (W02) تُعرض حركات ذلك الصنف والدفعة: فلتر الصنف والدفعة مفعّل مسبقاً.",
      node: logistics(<StockMovementsDemo initialFilters={{ locationId: null, itemId: "1", batchId: "32", range: { from: null, to: null } }} />),
    },
    ...systemStates({
      loading: logistics(<StockMovementsDemo mode="loading" />),
      empty: logistics(<StockMovementsDemo mode="empty" />),
      error: logistics(<StockMovementsDemo mode="error" />),
      // عامل المستودع لا يملك الحركات: عنصرها غير ظاهر له، وفتح رابطها يُظهر «لا صلاحية».
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

export default function StockMovementsPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

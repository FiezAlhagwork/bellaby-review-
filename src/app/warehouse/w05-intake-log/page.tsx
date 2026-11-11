import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { StockReceiptsDemo } from "./StockReceiptsDemo";

// W05 · سجل الإدخال. الحالة في SCREENS.md `default`، ومعها «التفاصيل» (الدرج مفتوح) والحالات العامة. الفلاتر والترقيم والدرج في الصفحة تفاعلية.
// للوجستي وحده (صلاحية stock.receive): عامل المستودع «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "الإدخال" }];

const logistics = (node: ReactNode) => (
  <ShellScreen user="logistics" activeKey="stock-intake" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "W05",
  name: "سجل الإدخال",
  states: [
    {
      key: "default",
      label: "كل الإدخالات",
      when: "سجل ما أُدخل إلى المستودع من الأحدث إلى الأقدم: الوقت والمرجع والموقع والأصناف ومجموع الكمية والمنفّذ. جرّب فلاتر الموقع والفترة والترقيم، وانقر صفاً.",
      node: logistics(<StockReceiptsDemo />),
    },
    {
      key: "details",
      label: "تفاصيل إدخال",
      when: "النقر على صف يفتح درجاً بأسطر الإدخال: الصنف والدفعة والكمية، وهل أُنشئت الدفعة أم أُضيفت لدفعة موجودة، مع الموقع والمنفّذ والملاحظة.",
      node: logistics(<StockReceiptsDemo initialSelectedId={75} />),
    },
    ...systemStates({
      loading: logistics(<StockReceiptsDemo mode="loading" />),
      empty: logistics(<StockReceiptsDemo mode="empty" />),
      error: logistics(<StockReceiptsDemo mode="error" />),
      // عامل المستودع لا يملك stock.receive: عنصر الإدخال غير ظاهر له، وفتح رابطه يُظهر «لا صلاحية».
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

export default function StockReceiptsPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

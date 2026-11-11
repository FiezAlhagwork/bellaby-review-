import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { StockBalancesDemo } from "./StockBalancesDemo";

// W02 · الأرصدة. الحالات في SCREENS.md، ومعها الحالات العامة. الفلاتر في الصفحة تفاعلية (تُرشّح بيانات المعرض).
// اللوجستي يفتح الصف إلى الحركات، وعامل المستودع للقراءة فقط.

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "الأرصدة" }];

const logistics = (node: ReactNode) => (
  <ShellScreen user="logistics" activeKey="balances" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "W02",
  name: "الأرصدة",
  states: [
    {
      key: "default",
      label: "مواقع المستودع",
      when: "أرصدة مواقع المستودع: الصنف والدفعة والموقع والكمية وما خرج بالطريق ولم يُؤكَّد. جرّب فلاتر الموقع والصنف والنوع.",
      node: logistics(<StockBalancesDemo scope="warehouse" canOpenMovements />),
    },
    {
      key: "all-locations",
      label: "كل المواقع",
      when: "كل المواقع: المستودع والوكلاء والمندوبون. رصيد المندوب قد يكون سالباً (بلون مميّز).",
      node: logistics(<StockBalancesDemo scope="all" canOpenMovements />),
    },
    {
      key: "at-time",
      label: "في لحظة سابقة",
      when: "الرصيد كما كان في نهاية يوم سابق (من «فلاتر أخرى»)، للقراءة فقط، مع شريط يوضح ذلك وزر «العودة للآن».",
      node: logistics(
        <StockBalancesDemo scope="warehouse" canOpenMovements initialFilters={{ locationId: null, itemId: null, itemType: null, at: "2026-11-05" }} />,
      ),
    },
    {
      key: "worker",
      label: "عامل المستودع",
      when: "عامل المستودع يرى الأرصدة للقراءة فقط: الصفوف لا تُفتح.",
      node: (
        <ShellScreen user="warehouse_worker" activeKey="balances" breadcrumbs={breadcrumbs}>
          <StockBalancesDemo scope="warehouse" canOpenMovements={false} />
        </ShellScreen>
      ),
    },
    ...systemStates({
      loading: logistics(<StockBalancesDemo scope="warehouse" canOpenMovements mode="loading" />),
      empty: logistics(<StockBalancesDemo scope="warehouse" canOpenMovements mode="empty" />),
      error: logistics(<StockBalancesDemo scope="warehouse" canOpenMovements mode="error" />),
      // مستخدم دوره لا يملك الأرصدة (وكيل) فتح رابطها.
      forbidden: (
        <ShellScreen user="agent" activeKey="home-agent" breadcrumbs={breadcrumbs}>
          <ForbiddenState />
        </ShellScreen>
      ),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function StockBalancesPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

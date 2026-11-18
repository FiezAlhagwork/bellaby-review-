import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { finalOverview, noPlanOverview, provisionalOverview } from "@/mocks/sales";
import { SalesDashboardDemo } from "./SalesDashboardDemo";

// M01 · لوحة مدير المبيعات. الحالات في SCREENS.md (default وprovisional)، ومعها الحالات العامة للوحة.
// خمس بطاقات (التحصيل، والعملاء الجدد، وإعادة الطلب، وزياراتي، وما ينتظر قراري) والمبيعات لكل منتج ولكل وكيل مقابل أهدافها.
// لمدير المبيعات (dashboard.sales_manager): السوبرفايزر «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="sales_manager" activeKey="home-sales-manager" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "M01",
  name: "لوحة مدير المبيعات",
  states: [
    {
      key: "default",
      label: "الافتراضي",
      when: "شهر مغلق بأرقام نهائية (تشرين الأول): التحصيل ونسبته، والعملاء الجدد 17 من 16، وإعادة الطلب، وزياراتي 19 من 20، وخمسة قرارات تنتظره. تحتها المبيعات لكل منتج ولكل وكيل مقابل أهدافها (شرطة متقطعة فوق كل عمود).",
      node: shell(<SalesDashboardDemo overview={finalOverview} />),
    },
    {
      key: "provisional",
      label: "مبدئي",
      when: "الشهر الجاري قبل إغلاقه: شريط «أرقام الشهر مبدئية» وشارة «مبدئي» على كل بطاقة. الأرقام تصير نهائية عند الإغلاق.",
      node: shell(<SalesDashboardDemo overview={provisionalOverview} />),
    },
    ...systemStates({
      loading: shell(<SalesDashboardDemo overview={finalOverview} mode="loading" />),
      // «لا بيانات» هنا: لا خطة معتمدة للشهر (GET /plans/SALES/{month} ← 404). بطاقات الخطة تفرغ والرسمان يُخفيان.
      empty: shell(<SalesDashboardDemo overview={noPlanOverview} />),
      error: shell(<SalesDashboardDemo overview={finalOverview} mode="error" />),
      // السوبرفايزر لا يملك dashboard.sales_manager: لا لوحة له، وفتح رابطها يُظهر «لا صلاحية».
      forbidden: (
        <ShellScreen user="supervisor" activeKey="home-supervisor" breadcrumbs={breadcrumbs}>
          <ForbiddenState />
        </ShellScreen>
      ),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function SalesDashboardPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

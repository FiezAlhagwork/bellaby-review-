import { WarehouseDashboardView } from "@/features/stock/views/WarehouseDashboardView";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { dashboardNow, overviewAlerts, overviewClear, overviewDefault, workerWork } from "@/mocks/warehouse-dashboard";

// W01 · لوحة المستودع. الحالات في SCREENS.md، ومعها الحالات العامة (تحميل · فراغ · خطأ · لا صلاحية).
// اللوجستي يرى التنبيهات (default · alerts)، وعامل المستودع يرى مهامه والجرد المسند إليه (worker).

const breadcrumbs = [{ label: "الرئيسية" }];

const manager = (overview: Parameters<typeof WarehouseDashboardView>[0]["overview"]) => (
  <ShellScreen user="logistics" activeKey="home-warehouse" breadcrumbs={breadcrumbs}>
    <WarehouseDashboardView canManageStock overview={overview} now={dashboardNow} />
  </ShellScreen>
);

const worker = (myWork: Parameters<typeof WarehouseDashboardView>[0]["myWork"]) => (
  <ShellScreen user="warehouse_worker" activeKey="home-warehouse" breadcrumbs={breadcrumbs}>
    <WarehouseDashboardView canManageStock={false} myWork={myWork} now={dashboardNow} />
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "W01",
  name: "لوحة المستودع",
  states: [
    {
      key: "default",
      label: "يوم عادي",
      when: "بعض التنبيهات: أصناف تحت الحد الأدنى ودفعات قريبة الانتهاء وصرف واحد لم يُؤكَّد.",
      node: manager({ status: "ready", data: overviewDefault }),
    },
    {
      key: "alerts",
      label: "كل التنبيهات",
      when: "كل أنواع التنبيهات قائمة: أصناف ناقصة ودفعات قريبة الانتهاء وصرف متأخر وإرجاعات من الوكلاء وجرد جارٍ.",
      node: manager({ status: "ready", data: overviewAlerts }),
    },
    {
      key: "worker",
      label: "عامل المستودع",
      when: "يرى عامل المستودع مهامه والجرد المسند إليه بدل التنبيهات.",
      node: worker({ status: "ready", data: workerWork }),
    },
    ...systemStates({
      loading: manager({ status: "loading" }),
      empty: manager({ status: "ready", data: overviewClear }),
      error: manager({ status: "error", code: "too_many_requests" }),
      // مستخدم دوره لا يملك لوحة المستودع (وكيل) فتح رابطها.
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

export default function WarehouseDashboardPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

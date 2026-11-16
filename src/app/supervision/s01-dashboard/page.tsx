import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { supervisorOverview, supervisorOverviewWithAlerts } from "@/mocks/attendance";
import { SupervisorDashboardDemo } from "./SupervisorDashboardDemo";

// S01 · لوحة السوبرفايزر. الحالات في SCREENS.md (default وattendance-alerts)، ومعها الحالات العامة للوحة.
// خمس خلايا لمندوبي محافظاته (الزيارات مقابل الخطة، والدوام، والتقارير بانتظار تقييمه، وطلبات الإجازة، وتنبيهات الدوام). النطاق يُفحص على الخادم.
// للسوبرفايزر (dashboard.supervisor): الوكيل «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية" }];

const screen: ScreenDefinition = {
  id: "S01",
  name: "لوحة السوبرفايزر",
  states: [
    {
      key: "default",
      label: "الافتراضي",
      when: "5 زيارات من 15 اليوم، والدوام 3 من 3، و5 تقارير بانتظار التقييم (أقربها تجاوز المهلة)، وطلبا إجازة، وبلا تنبيهات دوام.",
      node: (
        <ShellScreen user="supervisor" activeKey="home-supervisor" breadcrumbs={breadcrumbs}>
          <SupervisorDashboardDemo overview={supervisorOverview} />
        </ShellScreen>
      ),
    },
    {
      key: "attendance-alerts",
      label: "تنبيهات دوام",
      when: "أربعة تنبيهات في أيام العمل الأخيرة: دوام ناقص (أقل من 8 ساعات) وغياب، بالمندوب واليوم. الخصم قرار يدوي للمدير التنفيذي لا آلي.",
      node: (
        <ShellScreen user="supervisor" activeKey="home-supervisor" breadcrumbs={breadcrumbs}>
          <SupervisorDashboardDemo overview={supervisorOverviewWithAlerts} />
        </ShellScreen>
      ),
    },
    ...systemStates({
      loading: (
        <ShellScreen user="supervisor" activeKey="home-supervisor" breadcrumbs={breadcrumbs}>
          <SupervisorDashboardDemo overview={supervisorOverview} mode="loading" />
        </ShellScreen>
      ),
      error: (
        <ShellScreen user="supervisor" activeKey="home-supervisor" breadcrumbs={breadcrumbs}>
          <SupervisorDashboardDemo overview={supervisorOverview} mode="error" />
        </ShellScreen>
      ),
      // الوكيل لا يملك dashboard.supervisor: لا لوحة له، وفتح رابطها يُظهر «لا صلاحية».
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

export default function SupervisorDashboardPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

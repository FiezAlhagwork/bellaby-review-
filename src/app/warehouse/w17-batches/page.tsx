import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { BatchesDemo } from "./BatchesDemo";

// W17 · الدفعات. الحالات في SCREENS.md: default وsuspended-filter، ومعها الحالات العامة للقوائم. الفلاتر والترقيم تفاعلية.
// للوجستي والمدير التنفيذي (عنصر «الدفعات» بـ batches.suspend، القرار 2). غيرهما «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "الدفعات" }];

const screen: ScreenDefinition = {
  id: "W17",
  name: "الدفعات",
  states: [
    {
      key: "default",
      label: "كل الدفعات",
      when: "دفعات الأصناف بترتيب الأحدث: رقم الدفعة وتاريخ الانتهاء (مع تنبيه المنتهية والقريبة منه) والكمية الكلية وما بقي في المستودع والحالة. جرّب فلاتر الصنف والحالة و«المتوفرة فقط».",
      node: (
        <ShellScreen user="logistics" activeKey="batches" breadcrumbs={breadcrumbs}>
          <BatchesDemo />
        </ShellScreen>
      ),
    },
    {
      key: "suspended-filter",
      label: "فلتر الموقوفة",
      when: "فلتر الحالة «موقوفة»: الدفعات الموقوفة وحدها (حركتها متوقفة في كل المواقع). الشارة تحت الشريط تزيل الفلتر.",
      node: (
        <ShellScreen user="executive" activeKey="batches" breadcrumbs={breadcrumbs}>
          <BatchesDemo initialFilters={{ itemId: null, status: "SUSPENDED", inStock: false }} />
        </ShellScreen>
      ),
    },
    ...systemStates({
      loading: (
        <ShellScreen user="logistics" activeKey="batches" breadcrumbs={breadcrumbs}>
          <BatchesDemo mode="loading" />
        </ShellScreen>
      ),
      empty: (
        <ShellScreen user="logistics" activeKey="batches" breadcrumbs={breadcrumbs}>
          <BatchesDemo mode="empty" />
        </ShellScreen>
      ),
      error: (
        <ShellScreen user="logistics" activeKey="batches" breadcrumbs={breadcrumbs}>
          <BatchesDemo mode="error" />
        </ShellScreen>
      ),
      // الوكيل لا يملك صلاحيات الدفعات: عنصرها غير ظاهر له، وفتح رابطها يُظهر «لا صلاحية».
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

export default function BatchesPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

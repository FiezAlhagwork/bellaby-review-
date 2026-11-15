import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import type { StockCountForm } from "@/features/stock-counts/views/StockCountFormView";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { StockCountsDemo } from "./StockCountsDemo";

// W14 · الجرد. الحالات في SCREENS.md: default وnew-form وworker، ومعها نافذة معبّأة وخطأ الخادم والحالات العامة. الفلاتر والترقيم والنافذة تفاعلية:
// «إنشاء الجرد» يضيفه قيد العدّ إلى القائمة. اللوجستي ينشئ ويرى كل الجرود، وعامل المستودع يرى المسنَد إليه فقط (stock_counts.count).

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "الجرد" }];

const logistics = (node: ReactNode) => (
  <ShellScreen user="logistics" activeKey="stock-counts" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const filledForm: StockCountForm = { locationId: "1", assignedToId: "5", note: "جرد نهاية الشهر قبل استلام شحنة التشرين." };
const invalidForm: StockCountForm = { locationId: "2", assignedToId: "52", note: "" };

const screen: ScreenDefinition = {
  id: "W14",
  name: "الجرد",
  states: [
    {
      key: "default",
      label: "كل الجرود",
      when: "جرود مواقع المستودع بحالاتها (قيد العدّ، مرسل، معتمد، ملغى): الموقع والمكلَّف والتاريخ وعدد الأسطر التي فيها فرق. جرّب فلتر الحالة والموقع والمكلَّف، و«جرد جديد».",
      node: logistics(<StockCountsDemo />),
    },
    {
      key: "new-form",
      label: "نافذة الجرد الجديد",
      when: "«جرد جديد» يفتح نافذة: موقع المستودع (مطلوب) وإسناد لعامل (اختياري) وملاحظة. الزر معطّل وسببه ظاهر حتى يُختار الموقع.",
      node: logistics(<StockCountsDemo initialFormOpen />),
    },
    {
      key: "new-form-filled",
      label: "نافذة معبّأة",
      when: "موقع وعامل مسنَد إليه. «إنشاء الجرد» يضيفه قيد العدّ إلى أعلى القائمة.",
      node: logistics(<StockCountsDemo initialFormOpen initialForm={filledForm} />),
    },
    {
      key: "new-form-validation",
      label: "خطأ من الخادم",
      when: "الخادم يرفض الطلب بـ validation_failed: نصه العربي تحت الحقل كما هو (تختفي الرسالة بعد أول تعديل).",
      node: logistics(<StockCountsDemo initialFormOpen initialForm={invalidForm} initialErrors={{ assigned_to: "العامل المختار لا يعمل في هذا المستودع." }} />),
    },
    {
      key: "worker",
      label: "عامل المستودع",
      when: "عامل المستودع يرى الجرود المسنَدة إليه وحدها، بلا «جرد جديد» وبلا فلتر المكلَّف. يفتح جرده ليدخل الأسطر.",
      node: (
        <ShellScreen user="warehouse_worker" activeKey="stock-counts" breadcrumbs={breadcrumbs}>
          <StockCountsDemo worker />
        </ShellScreen>
      ),
    },
    ...systemStates({
      loading: logistics(<StockCountsDemo mode="loading" />),
      empty: logistics(<StockCountsDemo mode="empty" />),
      error: logistics(<StockCountsDemo mode="error" />),
      // الوكيل لا يملك صلاحيات الجرد: عنصرها غير ظاهر له، وفتح رابطها يُظهر «لا صلاحية».
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

export default function StockCountsPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

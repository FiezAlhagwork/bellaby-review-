import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { CustomersDemo } from "./CustomersDemo";

// M04 · العملاء. الحالة في SCREENS.md (default)، ومعها الحالات العامة للقوائم. جدول مرقّم: العميل والوكيل والمحافظة ومربوط بجهة زيارة؟.
// لمدير المبيعات (customers.view): المراقبة «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "العملاء" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="sales_manager" activeKey="manager-customers" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "M04",
  name: "العملاء",
  states: [
    {
      key: "default",
      label: "الافتراضي",
      when: "24 صيدلية لستة وكلاء: العميل وعنوانه، والوكيل، والمحافظة، وهل هو مربوط بجهة زيارة (مربوط · غير مربوط). بحث بالاسم وفلاتر الوكيل والمحافظة وترقيم.",
      node: shell(<CustomersDemo />),
    },
    ...systemStates({
      loading: shell(<CustomersDemo mode="loading" />),
      empty: shell(<CustomersDemo mode="empty" />),
      error: shell(<CustomersDemo mode="error" />),
      // المراقبة لا تملك customers.view: عنصر العملاء غير ظاهر لها، وفتح رابطه يُظهر «لا صلاحية».
      forbidden: (
        <ShellScreen user="monitoring" activeKey="flags" breadcrumbs={breadcrumbs}>
          <ForbiddenState />
        </ShellScreen>
      ),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function CustomersPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

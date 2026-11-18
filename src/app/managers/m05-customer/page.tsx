import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { findCustomer, linkedCustomerId, unlinkedCustomerId } from "@/mocks/customer-page";
import { CustomerDetailsDemo } from "./CustomerDetailsDemo";

// M05 · صفحة العميل (A07 ومعها زيارات المندوبين وزياراتي له). الحالة في SCREENS.md (default)، ومعها العميل غير المربوط بجهة وأقسامها وغير موجود والحالات العامة.
// للقراءة. لمدير المبيعات (customers.view): المراقبة «لا صلاحية».

const linked = findCustomer(linkedCustomerId);
const unlinked = findCustomer(unlinkedCustomerId);

const breadcrumbsFor = (label: string) => [{ label: "الرئيسية", href: "#" }, { label: "العملاء", href: "#" }, { label }];

const shell = (node: ReactNode, label: string) => (
  <ShellScreen user="sales_manager" activeKey="manager-customers" breadcrumbs={breadcrumbsFor(label)}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "M05",
  name: "صفحة العميل",
  states: [
    {
      key: "default",
      label: "الافتراضي",
      when: "عميل مربوط بجهة زيارة: بياناته (الهاتف والمحافظة والعنوان والوكيل وأول تسليم والمستحق)، وبطاقة جهة الزيارة المربوطة (الاسم والنوع وآخر زيارة والإجراء القادم)، وقسم «التسليمات» أولاً. أقسام: التسليمات · السداد · المرتجعات · زيارات المندوبين · زياراتي.",
      node: shell(<CustomerDetailsDemo customerId={linkedCustomerId} />, linked.name ?? "عميل"),
    },
    {
      key: "payment",
      label: "السداد",
      when: "قسم «السداد»: المستحق عليه، والمتأخر، والمسدَّد، وكم سُدِّد في موعده.",
      node: shell(<CustomerDetailsDemo customerId={linkedCustomerId} initialTab="payment" />, linked.name ?? "عميل"),
    },
    {
      key: "returns",
      label: "المرتجعات",
      when: "قسم «المرتجعات»: مرتجعات الصيدلية بسببها وكميتها وحالتها (بانتظار القرار · تالف · مرفوض).",
      node: shell(<CustomerDetailsDemo customerId={linkedCustomerId} initialTab="returns" />, linked.name ?? "عميل"),
    },
    {
      key: "rep-visits",
      label: "زيارات المندوبين",
      when: "قسم «زيارات المندوبين»: زيارات مندوبي المكتب العلمي للجهة المربوطة، بالمندوب والهدف والنتيجة والوقت. من الجهة المربوطة وحدها.",
      node: shell(<CustomerDetailsDemo customerId={linkedCustomerId} initialTab="rep-visits" />, linked.name ?? "عميل"),
    },
    {
      key: "my-visits",
      label: "زياراتي",
      when: "قسم «زياراتي»: زياراتي لهذا العميل (الهدف والنتيجة والملاحظات والوقت) من «زيارة جديدة».",
      node: shell(<CustomerDetailsDemo customerId={linkedCustomerId} initialTab="my-visits" />, linked.name ?? "عميل"),
    },
    {
      key: "unlinked",
      label: "غير مربوط",
      when: "عميل غير مربوط بجهة زيارة: شارة «غير مربوط» وبطاقة «غير مربوط بجهة زيارة»، وقسم زيارات المندوبين يقول إن لا جهة مربوطة. تسليماته فيها طلب شطب بانتظار القرار.",
      node: shell(<CustomerDetailsDemo customerId={unlinkedCustomerId} />, unlinked.name ?? "عميل"),
    },
    {
      key: "not-found",
      label: "غير موجود",
      when: "رابط عميل غير موجود أو خارج نطاقك (not_found): «العنصر غير موجود أو خارج نطاقك» وزر رجوع.",
      node: shell(<CustomerDetailsDemo customerId={linkedCustomerId} mode="not-found" />, "عميل"),
    },
    ...systemStates({
      loading: shell(<CustomerDetailsDemo customerId={linkedCustomerId} mode="loading" />, "عميل"),
      error: shell(<CustomerDetailsDemo customerId={linkedCustomerId} mode="error" />, "عميل"),
      // المراقبة لا تملك customers.view: عنصر العملاء غير ظاهر لها، وفتح رابطه يُظهر «لا صلاحية».
      forbidden: (
        <ShellScreen user="monitoring" activeKey="flags" breadcrumbs={breadcrumbsFor("عميل")}>
          <ForbiddenState />
        </ShellScreen>
      ),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function CustomerPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

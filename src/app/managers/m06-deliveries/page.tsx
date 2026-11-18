import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { DeliveriesDemo } from "./DeliveriesDemo";
import { DeliveryDetailsDemo } from "./DeliveryDetailsDemo";

// M06 · التسليمات (A09 وA10 للقراءة). الحالتان في SCREENS.md (read-only وapproval-pending-view)، ومعهما فلتر غير المسدد وتفاصيل التسليم بحالاتها
// (متأخر · مسدد · مشطوب · ملغى · محال) وغير موجود والحالات العامة. لا تعديل ولا قرار: التحصيل وطلب الإلغاء أو الشطب للوكيل، وقرارهما للمدير التنفيذي (يشمله التفويض).
// لمدير المبيعات (deliveries.approve في القائمة): المراقبة «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "التسليمات" }];
const detailsCrumbs = (reference: string) => [{ label: "الرئيسية", href: "#" }, { label: "التسليمات", href: "#" }, { label: reference }];

const shell = (node: ReactNode, trail = breadcrumbs) => (
  <ShellScreen user="sales_manager" activeKey="manager-deliveries" breadcrumbs={trail}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "M06",
  name: "التسليمات",
  states: [
    {
      key: "read-only",
      label: "للقراءة",
      when: "تسليمات كل الوكلاء من الأحدث: الرقم والتاريخ والعميل والوكيل والقيمة التقديرية وموعد السداد (المتأخر بأيام تأخره) والحالة. فلاتر الحالة والوكيل والمتأخر والفترة وترقيم. لا زر تعديل ولا قرار.",
      node: shell(<DeliveriesDemo />),
    },
    {
      key: "filter-unpaid",
      label: "غير المسدد",
      when: "فلتر «الحالة: غير مسدد» مفعّل: التسليمات التي لم تُحصَّل، منها المتأخر ومنها المحال إلى القانوني.",
      node: shell(<DeliveriesDemo initialFilters={{ status: "UNPAID", agentId: null, overdueOnly: false, range: { from: null, to: null } }} />),
    },
    {
      key: "details",
      label: "تفاصيل: متأخر",
      when: "تسليم غير مسدد تجاوز موعده: شريط «تجاوز موعد السداد» بأيام التأخر، وأسطره بالسعر المنسوخ والقيمة والمرتجع المقبول والمعلّق والقابل للإرجاع، وسجله. بلا أزرار: التحصيل للوكيل.",
      node: shell(<DeliveryDetailsDemo deliveryId={2101} />, detailsCrumbs("DLV-001101")),
    },
    {
      key: "approval-pending-view",
      label: "بانتظار الاعتماد",
      when: "طلب إلغاء رفعه الوكيل: شريط «طلب إلغاء بانتظار القرار» بسببه، ويقول إن القرار للمدير التنفيذي أو من فوّضه. يراه مدير المبيعات بلا زر قرار، وفي السجل الطلب.",
      node: shell(<DeliveryDetailsDemo deliveryId={2114} />, detailsCrumbs("DLV-001114")),
    },
    {
      key: "paid",
      label: "تفاصيل: مسدد",
      when: "تسليم مسدد كاملاً بعد موعده: وقت التحصيل وشارة «بعد الموعد»، والسجل بالتسجيل والتحصيل.",
      node: shell(<DeliveryDetailsDemo deliveryId={2109} />, detailsCrumbs("DLV-001109")),
    },
    {
      key: "written-off",
      label: "مشطوب",
      when: "اعتمد المدير التنفيذي طلب الشطب: شارة «مشطوب»، وسجل القرار (من قرّر ومتى وسببه)، والحدث في السجل.",
      node: shell(<DeliveryDetailsDemo deliveryId={2120} />, detailsCrumbs("DLV-001120")),
    },
    {
      key: "cancelled",
      label: "ملغى",
      when: "اعتمد المدير التنفيذي طلب الإلغاء: «ملغى» وسجل القرار. عادت البضاعة إلى رصيد الوكيل.",
      node: shell(<DeliveryDetailsDemo deliveryId={2118} />, detailsCrumbs("DLV-001118")),
    },
    {
      key: "referred",
      label: "محال للقانوني",
      when: "تسليم أُحيل إلى القانوني من «المستحقات»: شريط «أُحيل إلى القانوني» برقم النزاع.",
      node: shell(<DeliveryDetailsDemo deliveryId={2106} />, detailsCrumbs("DLV-001106")),
    },
    {
      key: "not-found",
      label: "غير موجود",
      when: "رابط تسليم غير موجود أو خارج نطاقك (not_found): «العنصر غير موجود أو خارج نطاقك» وزر رجوع.",
      node: shell(<DeliveryDetailsDemo deliveryId={2101} mode="not-found" />, detailsCrumbs("تسليم")),
    },
    ...systemStates({
      loading: shell(<DeliveriesDemo mode="loading" />),
      empty: shell(<DeliveriesDemo mode="empty" />),
      error: shell(<DeliveriesDemo mode="error" />),
      // المراقبة لا تملك deliveries.approve: عنصر التسليمات غير ظاهر لها، وفتح رابطه يُظهر «لا صلاحية».
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

export default function DeliveriesPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

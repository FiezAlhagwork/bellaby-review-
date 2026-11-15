import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import type { WithdrawForm } from "@/features/transfers/views/WithdrawRequestFormView";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { WithdrawRequestsDemo } from "./WithdrawRequestsDemo";

// W11 · طلبات السحب. الحالات في SCREENS.md: default وnew-form، ومعهما نموذج معبّأ وأخطاء الخادم والحالات العامة. الفلاتر والترقيم والنافذة تفاعلية:
// إرسال النموذج يضيف الطلب إلى القائمة. للوجستي وحده (صلاحية withdraw.create لعنصر القائمة): عامل المستودع «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "طلبات السحب" }];

const logistics = (node: ReactNode) => (
  <ShellScreen user="logistics" activeKey="withdraw-requests" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

// سامر الحلبي (31): عينات بدفعة نشطة وأخرى موقوفة (السحب مسموح عليها)، وكتيّبات.
const filledForm: WithdrawForm = {
  repUserId: "31",
  toLocationId: "1",
  reason: "استلام ما تبقّى من عينات الحملة وسحب الدفعة الموقوفة",
  lines: [
    { id: "a", itemId: 4, batchId: 61, quantity: 20 },
    { id: "b", itemId: 4, batchId: 62, quantity: 8 },
    { id: "c", itemId: 5, batchId: 71, quantity: 15 },
  ],
};

const validationForm: WithdrawForm = {
  repUserId: "32",
  toLocationId: "1",
  reason: "تجميع المواد الدعائية",
  lines: [{ id: "a", itemId: 7, batchId: 91, quantity: 70 }],
};

const screen: ScreenDefinition = {
  id: "W11",
  name: "طلبات السحب",
  states: [
    {
      key: "default",
      label: "كل الطلبات",
      when: "طلبات استلام العينات والمواد من أرصدة المندوبين: المندوب والأصناف والسبب والتاريخ والحالة (مطلوب، مسلَّم، ملغى). جرّب فلتر الحالة والمندوب، و«طلب سحب».",
      node: logistics(<WithdrawRequestsDemo />),
    },
    {
      key: "new-form",
      label: "نافذة الطلب",
      when: "«طلب سحب» يفتح نافذة: المندوب، ومستودع الاستلام (واحد فيُقفل)، والسبب، والأصناف من رصيد المندوب نفسه. الزر معطّل وسببه ظاهر حتى يكتمل.",
      node: logistics(<WithdrawRequestsDemo initialFormOpen />),
    },
    {
      key: "new-form-filled",
      label: "نافذة معبّأة",
      when: "مندوب مختار وأسطر من رصيده، منها دفعة موقوفة (العقد يسمح بالسحب عليها فتظهر معلّمة ولا تُمنع). «إرسال الطلب» يضيفه إلى القائمة.",
      node: logistics(<WithdrawRequestsDemo initialFormOpen initialForm={filledForm} />),
    },
    {
      key: "new-form-validation",
      label: "خطأ من الخادم",
      when: "الخادم يرفض الطلب بـ validation_failed: نصه العربي تحت السطر المعني كما هو (تختفي الرسالة بعد أول تعديل).",
      node: logistics(<WithdrawRequestsDemo initialFormOpen initialForm={validationForm} initialErrors={{ "lines.0.quantity": "الكمية أكبر من رصيد المندوب المتاح." }} />),
    },
    ...systemStates({
      loading: logistics(<WithdrawRequestsDemo mode="loading" />),
      empty: logistics(<WithdrawRequestsDemo mode="empty" />),
      error: logistics(<WithdrawRequestsDemo mode="error" />),
      // عامل المستودع لا يملك withdraw.create: عنصر طلبات السحب غير ظاهر له، وفتح رابطه يُظهر «لا صلاحية».
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

export default function WithdrawRequestsPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

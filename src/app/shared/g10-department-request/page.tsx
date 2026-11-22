import type { ReactNode } from "react";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { DepartmentRequestDemo } from "./DepartmentRequestDemo";

// G10 · تفاصيل الطلب. الحالات في SCREENS.md (incoming-open وincoming-in-progress وoutgoing وdone وrejected وoverdue)، ومعها النوافذ وinvalid_status وغير الموجود والحالات العامة. القرار 11.

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "الطلبات بين الأقسام", href: "#" }, { label: "الطلب" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="logistics" activeKey="department-requests" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "G10",
  name: "تفاصيل الطلب",
  states: [
    { key: "incoming-open", label: "وارد · مفتوح", when: "طلب من المبيعات ينتظر رئيس قسم اللوجستيات: «قبول» و«رفض» بسبب.", node: shell(<DepartmentRequestDemo state="open" />) },
    { key: "reject-dialog", label: "نافذة الرفض", when: "الرفض بسبب إلزامي يصل إلى القسم الطالب.", node: shell(<DepartmentRequestDemo state="open" initialDialog="reject" />) },
    { key: "incoming-in-progress", label: "وارد · قيد التنفيذ", when: "بعد القبول: الرد، والمهام المربوطة (عددها) و«إنشاء مهمة مربوطة»، و«إغلاق منجزاً».", node: shell(<DepartmentRequestDemo state="in-progress" />) },
    { key: "complete-dialog", label: "نافذة الإنجاز", when: "«إغلاق منجزاً» برد اختياري.", node: shell(<DepartmentRequestDemo state="in-progress" initialDialog="complete" />) },
    { key: "outgoing", label: "صادر", when: "طلب اللوجستيات إلى المحاسبة: الحالة والرد فقط، بلا المهام ولا الأزرار.", node: shell(<DepartmentRequestDemo state="outgoing" />) },
    { key: "done", label: "منجز", when: "أُغلق منجزاً: سجل القرار بالرد ومن عالجه ومتى.", node: shell(<DepartmentRequestDemo state="done" />) },
    { key: "rejected", label: "مرفوض", when: "رُفض: سجل القرار بالسبب.", node: shell(<DepartmentRequestDemo state="rejected" />) },
    { key: "overdue", label: "متأخر", when: "قيد التنفيذ وتجاوز موعده: شارة «متأخر» وشريط تحذير، والموعد بالأحمر.", node: shell(<DepartmentRequestDemo state="overdue" />) },
    { key: "invalid-status", label: "تغيّرت الحالة", when: "قرار على طلب تغيّرت حالته (409 invalid_status).", node: shell(<DepartmentRequestDemo state="open" initialActionError="invalid_status" />) },
    { key: "not-found", label: "غير موجود", when: "رقم طلب غير موجود أو ليس لقسمك (404).", node: shell(<DepartmentRequestDemo state="open" mode="not-found" />) },
    ...systemStates({
      loading: shell(<DepartmentRequestDemo state="open" mode="loading" />),
      error: shell(<DepartmentRequestDemo state="open" mode="error" />),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function DepartmentRequestPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

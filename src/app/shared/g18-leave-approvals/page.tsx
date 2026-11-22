import type { ReactNode } from "react";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { LeaveApprovalsDemo } from "./LeaveApprovalsDemo";

// G18 · طلبات الإجازة للموافقة. الحالات في SCREENS.md (approver وaccountant وpast-days-approved)، ومعها نافذة الرفض وalready_decided والحالات العامة. القراران 9 و15.

const crumbs = [{ label: "الرئيسية", href: "#" }, { label: "الإجازات" }];

const approver = (node: ReactNode) => (
  <ShellScreen user="logistics" activeKey="leaves" breadcrumbs={crumbs}>
    {node}
  </ShellScreen>
);
const accountant = (node: ReactNode) => (
  <ShellScreen user="accountant" activeKey="leaves" breadcrumbs={crumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "G18",
  name: "طلبات الإجازة للموافقة",
  states: [
    { key: "approver", label: "المدير المباشر", when: "رامي السيد لعمّال المستودع: المعلّقة أولاً بالموظف والفترة والمدة والسبب، و«اعتماد» و«رفض» لكل معلّقة.", node: approver(<LeaveApprovalsDemo viewer="approver" />) },
    { key: "accountant", label: "المحاسب", when: "كل الطلبات وحالاتها ومن وافق عليها، بلا أزرار (scope=all).", node: accountant(<LeaveApprovalsDemo viewer="accountant" />) },
    { key: "past-days-approved", label: "اعتماد أيام مضت", when: "اعتماد إجازة بدأت قبل اليوم: «ستُغلق علامات الغياب لتلك الأيام».", node: approver(<LeaveApprovalsDemo viewer="approver" initialDialog="approve" />) },
    { key: "reject-dialog", label: "نافذة الرفض", when: "الرفض بسبب يصل إلى الموظف.", node: approver(<LeaveApprovalsDemo viewer="approver" initialDialog="reject" />) },
    { key: "already-decided", label: "قرّر غيرك أولاً", when: "قرار على طلب حُسم (409 already_decided) مع من قرّر ومتى.", node: approver(<LeaveApprovalsDemo viewer="approver" initialActionError="already_decided" />) },
    ...systemStates({
      loading: approver(<LeaveApprovalsDemo viewer="approver" mode="loading" />),
      empty: approver(<LeaveApprovalsDemo viewer="approver" mode="empty" />),
      error: approver(<LeaveApprovalsDemo viewer="approver" mode="error" />),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function LeaveApprovalsPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

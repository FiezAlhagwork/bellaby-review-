import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { DeviceRequestsDemo } from "./DeviceRequestsDemo";

// I06 · طلبات تغيير الجهاز. الحالات في SCREENS.md (pending وunsynced-warning وapproved وrejected)، ومعها invalid_status والحالات العامة.
// devices.manage: مدير المبيعات «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "طلبات تغيير الجهاز" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="it" activeKey="device-requests" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "I06",
  name: "طلبات تغيير الجهاز",
  states: [
    {
      key: "pending",
      label: "معلّقة",
      when: "المعلّقة أولاً ثم المقرَّرة: الجهاز الجديد، والقديم وآخر مزامنة له. «موافقة» و«رفض» في قائمة الطلب المعلّق.",
      node: shell(<DeviceRequestsDemo initialStatus="PENDING" />),
    },
    {
      key: "unsynced-warning",
      label: "لم يُزامن منذ مدة",
      when: "موافقة على طلب عمر: جهازه القديم لم يُزامن منذ يومين (شارة تحذير). النافذة تنبّه: «قد يضيع عمل لم يُرفع. تواصل مع السوبرفايزر.» والسبب إلزامي.",
      node: shell(<DeviceRequestsDemo initialDeciding={{ id: 11, decision: "APPROVED" }} />),
    },
    {
      key: "approved",
      label: "مقبولة",
      when: "فلتر «مقبول»: من وافق ومتى، والسبب في قائمة الصف.",
      node: shell(<DeviceRequestsDemo initialStatus="APPROVED" />),
    },
    {
      key: "rejected",
      label: "مرفوضة",
      when: "فلتر «مرفوض»: من رفض ومتى، والسبب في قائمة الصف.",
      node: shell(<DeviceRequestsDemo initialStatus="REJECTED" />),
    },
    {
      key: "invalid-status",
      label: "قُرّر قبلك",
      when: "الخادم يرفض القرار بـ 409 invalid_status (قرّره غيرك): شريط فوق الجدول.",
      node: shell(<DeviceRequestsDemo initialError="invalid_status" />),
    },
    ...systemStates({
      loading: shell(<DeviceRequestsDemo mode="loading" />),
      error: shell(<DeviceRequestsDemo mode="error" />),
      forbidden: (
        <ShellScreen user="sales_manager" activeKey="home-sales-manager" breadcrumbs={breadcrumbs}>
          <ForbiddenState />
        </ShellScreen>
      ),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function DeviceRequestsPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { DelegationDemo } from "./DelegationDemo";

// E18 · التفويض. الحالات في SCREENS.md (none وactive وform وoverlap)، ومعها الحالات العامة. القرار 13.
// delegations.manage: مدير المبيعات «لا صلاحية». العقد يعطي delegation_overlap بـ 409 (SCREENS.md تقول 422)، ونتبع العقد.

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "التفويض" }];

const shell = (node: ReactNode, delegated = false) => (
  <ShellScreen user="executive" activeKey="delegation" breadcrumbs={breadcrumbs} delegatedTo={delegated ? { name: "باسل الخطيب", to: "2026-11-24" } : undefined}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "E18",
  name: "التفويض",
  states: [
    {
      key: "none",
      label: "لا تفويض",
      when: "لا تفويض ساري: «لا تفويض حالي»، ونطاق التفويض (يشمل ولا يشمل)، والسجل. «تفويض جديد» في الرأس.",
      node: shell(<DelegationDemo />),
    },
    {
      key: "active",
      label: "تفويض ساري",
      when: "تفويض ساري لباسل الخطيب حتى 24 تشرين الثاني: بطاقته مع «إنهاء التفويض»، وشريط «فوّضت …» أعلى الإطار.",
      node: shell(<DelegationDemo active />, true),
    },
    {
      key: "form",
      label: "تفويض جديد",
      when: "النافذة: الشخص (بحث) والفترة من وإلى (ما قبل اليوم معطّل). الزر معطّل حتى يكتملا.",
      node: shell(<DelegationDemo initialForm={{ delegateId: null, range: { from: null, to: null } }} />),
    },
    {
      key: "overlap",
      label: "تفويض متداخل",
      when: "فترة تتقاطع مع التفويض الساري: 409 delegation_overlap، شريط في النافذة.",
      node: shell(<DelegationDemo active initialForm={{ delegateId: "6", range: { from: "2026-11-20", to: "2026-11-27" } }} initialError="delegation_overlap" />, true),
    },
    ...systemStates({
      loading: shell(<DelegationDemo mode="loading" />),
      error: shell(<DelegationDemo mode="error" />),
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

export default function DelegationPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

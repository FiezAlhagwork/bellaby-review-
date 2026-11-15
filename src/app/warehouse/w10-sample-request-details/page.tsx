import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { findSampleRequest } from "@/mocks/sample-requests";
import { SampleRequestDetailsDemo } from "./SampleRequestDetailsDemo";

// W10 · تفاصيل طلب العينات. الحالات في SCREENS.md (new وdispatched وrejected وcancelled)، ومعها نافذة الرفض والحالات العامة لتفاصيل الكيان.
// تفاعلية: «رفض» يفتح النافذة والتأكيد يحوّل الطلب إلى «مرفوض». للوجستي وحده (الصرف والرفض بـ transfers.create): عامل المستودع «لا صلاحية».

const breadcrumbsFor = (label: string) => [{ label: "الرئيسية", href: "#" }, { label: "طلبات العينات", href: "#" }, { label }];

const logistics = (label: string, node: ReactNode) => (
  <ShellScreen user="logistics" activeKey="warehouse-sample-requests" breadcrumbs={breadcrumbsFor(label)}>
    {node}
  </ShellScreen>
);

const newRequest = findSampleRequest(21);
const dispatchedRequest = findSampleRequest(17);
const rejectedRequest = findSampleRequest(13);
const cancelledRequest = findSampleRequest(12);

const screen: ScreenDefinition = {
  id: "W10",
  name: "تفاصيل طلب العينات",
  states: [
    {
      key: "new",
      label: "جديد",
      when: "طلب جديد من مدير المكتب العلمي: المطلوب لكل صنف والسبب. للوجستي «صرف» (يفتح صرفاً جديداً معبّأً من الطلب) أو «رفض» بسبب.",
      node: logistics("طلب #21", <SampleRequestDetailsDemo initialRequest={newRequest} />),
    },
    {
      key: "reject",
      label: "نافذة الرفض",
      when: "«رفض» يفتح نافذة تطلب السبب (إلزامي) والزر معطّل حتى يُكتب. يُسجَّل الرفض بسببه ويراه من رفع الطلب.",
      node: logistics("طلب #21", <SampleRequestDetailsDemo initialRequest={newRequest} initialRejectOpen />),
    },
    {
      key: "dispatched",
      label: "مصروف",
      when: "صُرف الطلب: المصروف بجانب المطلوب (هنا صُرف أقل من المطلوب في صنف) وشارة «أقل من المطلوب»، ورابط إلى الصرف.",
      node: logistics("طلب #17", <SampleRequestDetailsDemo initialRequest={dispatchedRequest} />),
    },
    {
      key: "rejected",
      label: "مرفوض",
      when: "رفضه اللوجستي بسبب: الشريط يعرض السبب، والسجل يذكر الرفض. لا أزرار قرار.",
      node: logistics("طلب #13", <SampleRequestDetailsDemo initialRequest={rejectedRequest} />),
    },
    {
      key: "cancelled",
      label: "ملغى",
      when: "ألغاه الطالب (مدير المكتب العلمي) قبل الصرف: الشريط والسجل. الإلغاء للطالب وحده فلا زر للوجستي.",
      node: logistics("طلب #12", <SampleRequestDetailsDemo initialRequest={cancelledRequest} />),
    },
    {
      key: "not-found",
      label: "غير موجود",
      when: "رابط طلب غير موجود أو خارج نطاق المستخدم (not_found): «العنصر غير موجود أو خارج نطاقك» وزر رجوع.",
      node: logistics("طلب", <SampleRequestDetailsDemo initialRequest={newRequest} mode="not-found" />),
    },
    ...systemStates({
      loading: logistics("طلب #21", <SampleRequestDetailsDemo initialRequest={newRequest} mode="loading" />),
      error: logistics("طلب #21", <SampleRequestDetailsDemo initialRequest={newRequest} mode="error" />),
      // عامل المستودع لا يملك transfers.create: عنصر طلبات العينات غير ظاهر له، وفتح رابطه يُظهر «لا صلاحية».
      forbidden: (
        <ShellScreen user="warehouse_worker" activeKey="balances" breadcrumbs={breadcrumbsFor("طلب")}>
          <ForbiddenState />
        </ShellScreen>
      ),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function SampleRequestDetailsPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

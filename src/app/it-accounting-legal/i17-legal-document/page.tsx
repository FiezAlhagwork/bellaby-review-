import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { activeDocument, agentContract, expiredDocument, intentionallyExpiredDocument } from "@/mocks/legal";
import { LegalDocumentDemo } from "./LegalDocumentDemo";

// I17 · صفحة الوثيقة. الحالات في SCREENS.md (active وexpiring وrenew وintentional-expiry وexpired)، ومعها المنتهية بقصد، ورفض الإنهاء (409)، وغير الموجودة، والحالات العامة.
// القرار 14: كل تعديل نسخة جديدة، ولا حذف. legal.view: المحاسب «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "الوثائق", href: "#" }, { label: "الوثيقة" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="legal" activeKey="legal-documents" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "I17",
  name: "صفحة الوثيقة",
  states: [
    {
      key: "active",
      label: "سارية",
      when: "عقد حلب ساري: البيانات والنسخة الأولى. «تجديد» و«منتهية بقصد» في الرأس.",
      node: shell(<LegalDocumentDemo document={activeDocument} />),
    },
    {
      key: "expiring",
      label: "قريبة الانتهاء",
      when: "عقد دمشق ينتهي خلال مدة تنبيهه: شريط تحذير بالأيام الباقية، وثلاث نسخ (الأحدث أولاً).",
      node: shell(<LegalDocumentDemo document={agentContract} />),
    },
    {
      key: "renew",
      label: "تجديد",
      when: "نافذة التجديد: السبب والملف إلزاميان، وتاريخ الانتهاء الجديد، والبدء من نهاية النسخة الحالية. الحفظ يضيف نسخة.",
      node: shell(<LegalDocumentDemo document={agentContract} initialRenew />),
    },
    {
      key: "intentional-expiry",
      label: "منتهية بقصد",
      when: "نافذة «منتهية بقصد» قبل الانتهاء: سبب إلزامي حتى 1000 حرف.",
      node: shell(<LegalDocumentDemo document={activeDocument} initialExpiring />),
    },
    {
      key: "expired",
      label: "منتهية",
      when: "عقد التوريد انتهى: شريط خطر، و«منتهية بقصد» معطّل. التجديد متاح.",
      node: shell(<LegalDocumentDemo document={expiredDocument} />),
    },
    {
      key: "intentionally-expired",
      label: "أُنهيت بقصد",
      when: "عقد الصيانة أُنهي بقصد: سبب الإنهاء في شريط.",
      node: shell(<LegalDocumentDemo document={intentionallyExpiredDocument} />),
    },
    {
      key: "already-expired",
      label: "انتهت فعلاً",
      when: "الإنهاء بقصد لوثيقة انتهت قبل الطلب: 409 (بلا اسم رمز، §89) يظهر تحت السبب.",
      node: shell(<LegalDocumentDemo document={activeDocument} initialExpiring actionError="invalid_status" />),
    },
    {
      key: "not-found",
      label: "غير موجودة",
      when: "رقم وثيقة غير موجود (404).",
      node: shell(<LegalDocumentDemo document={activeDocument} mode="not-found" />),
    },
    ...systemStates({
      loading: shell(<LegalDocumentDemo document={activeDocument} mode="loading" />),
      error: shell(<LegalDocumentDemo document={activeDocument} mode="error" />),
      forbidden: (
        <ShellScreen user="accountant" activeKey="home-accountant" breadcrumbs={breadcrumbs}>
          <ForbiddenState />
        </ShellScreen>
      ),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function LegalDocumentPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

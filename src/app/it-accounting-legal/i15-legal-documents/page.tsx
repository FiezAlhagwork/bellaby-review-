import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { LegalDocumentsDemo } from "./LegalDocumentsDemo";

// I15 · الوثائق القانونية. الحالات في SCREENS.md (default وexpiring-filter)، ومعها الحالات العامة.
// legal.view: المحاسب «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "الوثائق" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="legal" activeKey="legal-documents" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "I15",
  name: "الوثائق القانونية",
  states: [
    {
      key: "default",
      label: "الافتراضي",
      when: "كل الوثائق: العنوان والنسخة، والفئة، والأطراف، والانتهاء، والحالة (سارية، قريبة الانتهاء، منتهية، منتهية بقصد). «وثيقة جديدة» في الرأس، والصف يفتح صفحة الوثيقة.",
      node: shell(<LegalDocumentsDemo />),
    },
    {
      key: "expiring-filter",
      label: "قريبة الانتهاء",
      when: "فلتر «قريبة الانتهاء» (expiring_within_days = 30): الوثائق التي تنتهي خلال المدة فقط.",
      node: shell(<LegalDocumentsDemo expiringOnly />),
    },
    ...systemStates({
      loading: shell(<LegalDocumentsDemo mode="loading" />),
      empty: shell(<LegalDocumentsDemo mode="empty" />),
      error: shell(<LegalDocumentsDemo mode="error" />),
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

export default function LegalDocumentsPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

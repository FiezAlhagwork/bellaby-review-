import { SignInView } from "@/features/auth/views/SignInView";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";

// G01 · تسجيل الدخول. الحالات في SCREENS.md. الرمز في كل حالة رفض من العقد (error-messages.ts).

const screen: ScreenDefinition = {
  id: "G01",
  name: "تسجيل الدخول",
  states: [
    { key: "default", label: "الافتراضي", when: "أول ما يفتح الموظف النظام.", node: <SignInView status={{ status: "idle" }} /> },
    {
      key: "signing-in",
      label: "جارٍ الدخول",
      when: "بعد الضغط على زر Google، أثناء التحقق من الحساب.",
      node: <SignInView status={{ status: "signing-in" }} />,
    },
    {
      key: "not-allowed",
      label: "بريد غير مسجّل",
      when: "البريد غير مضاف في النظام. يضيفه قسم IT، ولا يوجد تسجيل ذاتي.",
      node: <SignInView status={{ status: "rejected", code: "account_not_provisioned" }} />,
    },
    {
      key: "account-disabled",
      label: "حساب معطّل",
      when: "الحساب موجود لكن قسم IT عطّله.",
      node: <SignInView status={{ status: "rejected", code: "account_disabled" }} />,
    },
    {
      key: "blocked",
      label: "بريد محظور",
      when: "البريد محظور من الدخول.",
      node: <SignInView status={{ status: "rejected", code: "email_blocked" }} />,
    },
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function SignInPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

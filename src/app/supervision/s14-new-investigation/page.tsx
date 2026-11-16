import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import type { ShellUserKey } from "@/mocks/shell-users";
import { InvestigationFormDemo } from "./InvestigationFormDemo";

// S14 · فتح ملف تحقيق. الحالتان في SCREENS.md (direct وfrom-flag)، ومعهما أخطاء التحقق والإرسال وعدم الصلاحية. تفاعلية: «فتح الملف» معطّل حتى يُختار الموظف ويُكتب العنوان.
// ملف سري. فتح الملف للمراقبة وحدها (investigations.manage): المدير التنفيذي «لا صلاحية».

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "التحقيقات", href: "#" }, { label: "فتح ملف" }];

const shell = (user: ShellUserKey, node: ReactNode) => (
  <ShellScreen user={user} activeKey="investigations" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "S14",
  name: "فتح ملف تحقيق",
  states: [
    {
      key: "direct",
      label: "مباشرة",
      when: "فتح ملف على موظف مباشرة: الموظف (إلزامي) والعنوان (إلزامي) والوصف. «فتح الملف» معطّل وسببه ظاهر حتى يُملأ الحقلان. الملف يبدأ في المرحلة الأولى.",
      node: shell("monitoring", <InvestigationFormDemo />),
    },
    {
      key: "from-flag",
      label: "من علامة",
      when: "فتح ملف من علامة «فرق مخزون» مفتوحة: تظهر العلامة المصدر (نوعها وصاحبها وسجلها)، ويُقفل الموظف على صاحبها ويُقترح عنوان يقبل التعديل.",
      node: shell("monitoring", <InvestigationFormDemo flagId={8001} />),
    },
    {
      key: "validation",
      label: "خطأ في الحقول",
      when: "رفض الخادم الحقول (validation_failed): نصه العربي تحت حقله كما هو، ويبقى ما كُتب.",
      node: shell(
        "monitoring",
        <InvestigationFormDemo initialForm={{ subjectId: "31", title: "عنوان", description: "" }} initialErrors={{ subject_user_id: "الموظف غير موجود أو خارج نطاقك.", title: "العنوان قصير جداً، اكتب ثلاثة أحرف على الأقل." }} />,
      ),
    },
    {
      key: "submitting",
      label: "جارٍ الفتح",
      when: "أثناء الإرسال: الزر يحمّل والحقول معطّلة.",
      node: shell("monitoring", <InvestigationFormDemo initialSubmitting initialForm={{ subjectId: "32", title: "زيارات مشكوك فيها لعمر الخطيب", description: "ثلاث زيارات بقراءات موقع مشبوهة." }} />),
    },
    {
      key: "forbidden",
      label: "لا صلاحية",
      when: "المدير التنفيذي يقرأ الملفات ويقرّر ولا يفتحها: investigations.manage غير ممنوحة له فيرى «لا صلاحية».",
      system: true,
      node: (
        <ShellScreen user="executive" activeKey="investigations" breadcrumbs={breadcrumbs}>
          <ForbiddenState />
        </ShellScreen>
      ),
    },
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function NewInvestigationPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

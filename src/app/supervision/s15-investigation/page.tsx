import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { investigationIds } from "@/mocks/investigations";
import type { ShellUserKey } from "@/mocks/shell-users";
import { InvestigationDetailsDemo } from "./InvestigationDetailsDemo";

// S15 · ملف التحقيق. الحالات في SCREENS.md (stage-1 وstage-4 وstage-7 وawaiting-decision وexecutive-decision وdecided وclosed-no-violation)، ومعها نوافذ الإغلاق والرفع والقرار
// وتغيّر الحالة (409) والمفوَّض (لا تفويض: القرار 13) وغير موجود والحالات العامة. تفاعلية: إكمال المرحلة يتقدّم بالملف مرحلة واحدة، ولا قفز بين المراحل (القرار 9).
// ملف سري: المراقبة تدير والمدير التنفيذي يقرّر، وكل اطلاع يُسجَّل.

const breadcrumbsFor = (label: string) => [{ label: "الرئيسية", href: "#" }, { label: "التحقيقات", href: "#" }, { label }];

const shell = (user: ShellUserKey, label: string, node: ReactNode) => (
  <ShellScreen user={user} activeKey="investigations" breadcrumbs={breadcrumbsFor(label)}>
    {node}
  </ShellScreen>
);

const filledStage = { summary: "سُمع المندوب بحضور مسؤول المكتب العلمي وأقرّ بنقل العينات دون تسجيل.", attachments: [] };
const filledSubmit = { classification: "NEGLIGENCE" as const, proposedAction: "تنبيه خطي وإعادة تدريب على تسجيل التوزيع." };
const filledDecision = { text: "إنذار خطي مع خصم ثلاثة أيام.", withDeduction: true, amount: "60.00", reason: "خصم ثلاثة أيام عن مخالفة متعمدة." };

const screen: ScreenDefinition = {
  id: "S15",
  name: "ملف التحقيق",
  states: [
    {
      key: "stage-1",
      label: "المرحلة 1",
      when: "ملف فُتح للتو: المرحلة الأولى «تسجيل الواقعة» حالية والباقي قادم. نموذجها: «ما جرى» إلزامي ومستندات اختيارية. «إكمال المرحلة» معطّل وسببه ظاهر، و«إغلاق: لا مخالفة» متاح.",
      node: shell("monitoring", "زيارات مشكوك فيها لعمر الخطيب", <InvestigationDetailsDemo investigationId={investigationIds.stage1} />),
    },
    {
      key: "stage-4",
      label: "المرحلة 4",
      when: "ملف فُتح من علامة (فرق عينات): ثلاث مراحل مكتملة بملخصها ومرفقاتها، والرابعة «سماع المعنيين» حالية. «إكمال المرحلة» يقدّم الملف مرحلة واحدة. شريط «فُتح من علامة» برابطها.",
      node: shell("monitoring", "فرق عينات بعد المزامنة", <InvestigationDetailsDemo investigationId={investigationIds.stage4} initialStageForm={filledStage} />),
    },
    {
      key: "stage-7",
      label: "المرحلة 7",
      when: "المرحلة السابعة «اقتراح الإجراء»: بدل ملخص المرحلة نموذج الرفع: التصنيف من الخمسة (إلزامي) والإجراء المقترح (إلزامي)، و«رفع للقرار» معطّل وسببه ظاهر حتى يكتملا.",
      node: shell("monitoring", "فرق مخزون بعد جرد المستودع الرئيسي", <InvestigationDetailsDemo investigationId={investigationIds.stage7} />),
    },
    {
      key: "awaiting-decision",
      label: "بانتظار القرار",
      when: "المراقبة بعد الرفع: كل المراحل السبع مكتملة والثامنة حالية. شريط «بانتظار قرار المدير التنفيذي» والتصنيف والإجراء المقترح، ولا إجراء للمراقبة.",
      node: shell("monitoring", "قراءة موقع مزوَّرة عند بدء الزيارات", <InvestigationDetailsDemo investigationId={investigationIds.awaiting} />),
    },
    {
      key: "executive-decision",
      label: "قرار المدير التنفيذي",
      when: "المدير التنفيذي: بطاقة «قرار المدير التنفيذي»: نص القرار إلزامي، و«خصم من الراتب» اختياري يُظهر المبلغ والسبب. «إصدار القرار» معطّل وسببه ظاهر حتى يكتمل. لا تفويض (القرار 13).",
      node: shell("executive", "قراءة موقع مزوَّرة عند بدء الزيارات", <InvestigationDetailsDemo investigationId={investigationIds.awaiting} canManage={false} canDecide />),
    },
    {
      key: "decision-confirm",
      label: "تأكيد القرار",
      when: "«إصدار القرار» يفتح تأكيداً: «يُقفل الملف بقرارك ومعه خصم … ولا يُعدَّل. القرار لك وحدك ولا يُفوَّض.»",
      node: shell("executive", "قراءة موقع مزوَّرة عند بدء الزيارات", <InvestigationDetailsDemo investigationId={investigationIds.awaiting} canManage={false} canDecide initialDecisionForm={filledDecision} initialDecisionConfirming />),
    },
    {
      key: "decided",
      label: "تم القرار",
      when: "ملف مقرَّر: كل المراحل الثماني مكتملة، وسجل القرار (من قرّر ومتى ونصه)، وبطاقة الخصم (المبلغ وسببه)، والتصنيف والإجراء المقترح.",
      node: shell("executive", "تأخر متكرر في الدوام", <InvestigationDetailsDemo investigationId={investigationIds.decided} canManage={false} canDecide />),
    },
    {
      key: "closed-no-violation",
      label: "أُغلق بلا مخالفة",
      when: "أُغلق في المرحلة الثالثة بلا مخالفة: الجدول الزمني ينتهي بإغلاق مبكر وسببه، وما بعده لا يُعرض.",
      node: shell("monitoring", "تسجيل زيارة دون مغادرة الدوام", <InvestigationDetailsDemo investigationId={investigationIds.closed} />),
    },
    {
      key: "close-dialog",
      label: "إغلاق: لا مخالفة",
      when: "«إغلاق: لا مخالفة» يفتح نافذة السبب: الزر معطّل حتى يُكتب (حتى 1000 حرف). الإغلاق يوقف الملف في مرحلته ولا يُعدَّل.",
      node: shell("monitoring", "فرق عينات بعد المزامنة", <InvestigationDetailsDemo investigationId={investigationIds.stage4} initialCloseOpen />),
    },
    {
      key: "submit-confirm",
      label: "تأكيد الرفع",
      when: "«رفع للقرار» (بتصنيف «إهمال» وإجراء مقترح) يفتح تأكيداً: «يُرفع الملف إلى المدير التنفيذي بتصنيف … ولا يُعدَّل بعده.»",
      node: shell("monitoring", "فرق مخزون بعد جرد المستودع الرئيسي", <InvestigationDetailsDemo investigationId={investigationIds.stage7} initialSubmitForm={filledSubmit} initialSubmitConfirming />),
    },
    {
      key: "invalid-status",
      label: "تغيّرت الحالة (409)",
      when: "أُكملت المرحلة من جهة أخرى قبلك (invalid_status): شريط «تغيّرت حالة الملف» ونصه من الخادم، وتبقى المسودة. حدّث الصفحة لرؤية المرحلة الحالية.",
      node: shell("monitoring", "فرق عينات بعد المزامنة", <InvestigationDetailsDemo investigationId={investigationIds.stage4} initialStageForm={filledStage} initialActionError="invalid_status" />),
    },
    {
      key: "delegate-forbidden",
      label: "المفوَّض: لا صلاحية",
      when: "المفوَّض عن المدير التنفيذي لا يرى ملفات التحقيق ولا يقرّر فيها: لا تفويض في التحقيق (القرار 13)، فرابط الملف يُظهر «لا صلاحية».",
      node: (
        <ShellScreen user="delegate" activeKey="home-sales-manager" breadcrumbs={breadcrumbsFor("ملف تحقيق")}>
          <ForbiddenState />
        </ShellScreen>
      ),
    },
    {
      key: "not-found",
      label: "غير موجود",
      when: "رابط ملف غير موجود (not_found): «العنصر غير موجود أو خارج نطاقك» وزر رجوع.",
      node: shell("monitoring", "ملف تحقيق", <InvestigationDetailsDemo investigationId={investigationIds.stage1} mode="not-found" />),
    },
    ...systemStates({
      loading: shell("monitoring", "ملف تحقيق", <InvestigationDetailsDemo investigationId={investigationIds.stage1} mode="loading" />),
      error: shell("monitoring", "ملف تحقيق", <InvestigationDetailsDemo investigationId={investigationIds.stage1} mode="error" />),
      // السوبرفايزر لا يملك investigations.view: عنصرها غير ظاهر له، وفتح رابطها يُظهر «لا صلاحية».
      forbidden: (
        <ShellScreen user="supervisor" activeKey="home-supervisor" breadcrumbs={breadcrumbsFor("ملف تحقيق")}>
          <ForbiddenState />
        </ShellScreen>
      ),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function InvestigationPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

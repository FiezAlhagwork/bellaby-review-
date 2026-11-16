import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { DailyReportDetailsDemo } from "./DailyReportDetailsDemo";

// S03 · تقييم التقرير اليومي. الحالات في SCREENS.md (default وconfirm وrated وlate-rating وrating-locked)، ومعها غير موجود والحالات العامة.
// تفاعلية: اختر درجة ثم «حفظ التقييم» فالتأكيد، فيُقفل ويظهر للقراءة، و«إضافة ملاحظة» بعده. للسوبرفايزر (daily_reports.rate): الوكيل «لا صلاحية».

const breadcrumbsFor = (label: string) => [{ label: "الرئيسية", href: "#" }, { label: "التقارير اليومية", href: "#" }, { label }];

const supervisor = (label: string, node: ReactNode) => (
  <ShellScreen user="supervisor" activeKey="daily-reports" breadcrumbs={breadcrumbsFor(label)}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "S03",
  name: "تقييم التقرير اليومي",
  states: [
    {
      key: "default",
      label: "بانتظار التقييم",
      when: "تقرير سامر الحلبي ليوم 9 تشرين الثاني: البيانات وزيارات اليوم والملخص، ثم التقييم بالسلّم الموحّد (ممتاز 100 … ضعيف 20). «حفظ التقييم» معطّل وسببه ظاهر حتى تختار درجة. المتبقي من مهلة 24 ساعة عمل في شريط.",
      node: supervisor("تقرير سامر الحلبي", <DailyReportDetailsDemo reportId={114} />),
    },
    {
      key: "confirm",
      label: "تأكيد الحفظ",
      when: "«حفظ التقييم» يفتح تأكيداً: «التقييم يُقفل بعد الحفظ ولا يُعدَّل». التأكيد يقفله فيظهر للقراءة بدرجته ومن قيّم ومتى.",
      node: supervisor("تقرير سامر الحلبي", <DailyReportDetailsDemo reportId={114} initialDraft={{ score: "80", comment: "تغطية جيدة." }} initialConfirming />),
    },
    {
      key: "rated",
      label: "مقيَّم ومقفل",
      when: "تقرير مقيَّم: شريط «التقييم مقفل» والدرجة وملاحظتها ومن قيّم وهل ضمن المهلة، و«إضافة ملاحظة» (حتى 2000 حرف) تُضاف إلى سجل الملاحظات. لا تعديل للتقييم.",
      node: supervisor("تقرير سامر الحلبي", <DailyReportDetailsDemo reportId={105} />),
    },
    {
      key: "late-rating",
      label: "متأخر",
      when: "تقرير عمر الخطيب ليوم 8 تشرين الثاني تجاوز مهلة 24 ساعة عمل: شارة «متأخر» وشريط تحذير. يُسجَّل التقييم متأخراً (بعد المهلة) عند الحفظ.",
      node: supervisor("تقرير عمر الخطيب", <DailyReportDetailsDemo reportId={110} initialDraft={{ score: "60", comment: "" }} />),
    },
    {
      key: "rating-locked",
      label: "مقيَّم مسبقاً (409)",
      when: "قيّمه غيرك قبلك: الخادم يردّ 409 rating_locked فيظهر نصه في شريط خطر فوق التقييم. حدّث الصفحة لرؤية التقييم الأول.",
      node: supervisor("تقرير سامر الحلبي", <DailyReportDetailsDemo reportId={114} initialDraft={{ score: "80", comment: "" }} initialSaveError="rating_locked" />),
    },
    {
      key: "not-found",
      label: "غير موجود",
      when: "رابط تقرير غير موجود أو خارج نطاق السوبرفايزر (not_found): «العنصر غير موجود أو خارج نطاقك» وزر رجوع.",
      node: supervisor("تقرير", <DailyReportDetailsDemo reportId={114} mode="not-found" />),
    },
    ...systemStates({
      loading: supervisor("تقرير سامر الحلبي", <DailyReportDetailsDemo reportId={114} mode="loading" />),
      error: supervisor("تقرير سامر الحلبي", <DailyReportDetailsDemo reportId={114} mode="error" />),
      // الوكيل لا يقرأ التقارير اليومية: عنصرها غير ظاهر له، وفتح رابطها يُظهر «لا صلاحية».
      forbidden: (
        <ShellScreen user="agent" activeKey="home-agent" breadcrumbs={breadcrumbsFor("تقرير")}>
          <ForbiddenState />
        </ShellScreen>
      ),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function DailyReportPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

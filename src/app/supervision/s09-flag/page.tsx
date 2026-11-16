import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { flagIds } from "@/mocks/flags";
import { FlagsDemo } from "../s08-flags/FlagsDemo";

// S09 · معالجة العلامة: درج فوق قائمة العلامات (S08). الحالات في SCREENS.md (open وstock-discrepancy وclock-skew وattendance وauto-cleared وescalated)، ومعها علامة الزيارة
// (تُعالَج من S06) وقرّر غيرك (409) وفشل السجل المرتبط والحالات العامة. تفاعلية: اختر نهاية ثم «حفظ القرار». المراقبة لا تملك عقوبة (القرار 4).

const breadcrumbs = [{ label: "الرئيسية", href: "#" }, { label: "العلامات", href: "#" }, { label: "معالجة علامة" }];

const shell = (node: ReactNode) => (
  <ShellScreen user="monitoring" activeKey="flags" breadcrumbs={breadcrumbs}>
    {node}
  </ShellScreen>
);

const screen: ScreenDefinition = {
  id: "S09",
  name: "معالجة العلامة",
  states: [
    {
      key: "open",
      label: "مفتوحة",
      when: "إغلاق آلي لجلسة دوام: النوع وتفاصيل الجلسة وصاحبها، ثم النهايات الثلاث: «لا مشكلة» · «مشكلة مسجّلة» · «تحويل لتحقيق» (بعنوان اختياري للملف) وملاحظة. «حفظ القرار» معطّل حتى تُختار نهاية.",
      node: shell(<FlagsDemo initialOpenId={flagIds.autoClosed} />),
    },
    {
      key: "stock-discrepancy",
      label: "فرق مخزون",
      when: "فرق بين المتوقع والفعلي (-3 علب عينات) مع الصنف والدفعة والصرف المرتبط وصاحب السجل، وشارة المهلة.",
      node: shell(<FlagsDemo initialOpenId={flagIds.stock} />),
    },
    {
      key: "clock-skew",
      label: "انحراف الساعة",
      when: "فرق ساعة الجهاز عن الخادم (12 دقيقة، والحد 5) في دفعة مزامنة: ساعة الجهاز وساعة الخادم.",
      node: shell(<FlagsDemo initialOpenId={flagIds.clock} />),
    },
    {
      key: "attendance",
      label: "دوام",
      when: "دوام ناقص (6 س 50 د من 8 ساعات) لجلسة: يوم العمل والمدة والمطلوب. تجاوزت المهلة فيظهر شريط «تجاوزت المهلة».",
      node: shell(<FlagsDemo initialOpenId={flagIds.attendance} />),
    },
    {
      key: "auto-cleared",
      label: "زال سببها",
      when: "أُغلقت تلقائياً لأن سببها زال: شريط محايد، بلا قرار بشري ولا نهايات.",
      node: shell(<FlagsDemo initialOpenId={flagIds.autoCleared} />),
    },
    {
      key: "escalated",
      label: "محوّلة",
      when: "حُوّلت لتحقيق: سجل القرار (من أغلقها ومتى وملاحظته وعولجت خلال N ساعة عمل) ورابط «فتح ملف التحقيق».",
      node: shell(<FlagsDemo initialOpenId={flagIds.escalated} />),
    },
    {
      key: "visit-flag",
      label: "علامة زيارة",
      when: "علامة زيارة (خارج النطاق) لا تُعالَج هنا: «تُعالَج من تفاصيل الزيارة» وزر «فتح الزيارة» (القرار يمرّ بـ POST /visits/{id}/decision).",
      node: shell(<FlagsDemo initialOpenId={flagIds.visit} />),
    },
    {
      key: "already-decided",
      label: "قرّر غيرك (409)",
      when: "أغلقها مراقب آخر قبلك: شريط «قرّر غيرك قبلك» وسجل القرار بدل النهايات (القرار 12).",
      node: shell(<FlagsDemo initialOpenId={flagIds.stock} closedByOther initialDecisionError="already_decided" />),
    },
    {
      key: "linked-error",
      label: "تعذّر السجل المرتبط",
      when: "فشل جلب السجل المرتبط وحده: «تعذّر تحميل البيانات» داخل قسمه، وتبقى بقية الدرج والمعالجة.",
      node: shell(<FlagsDemo initialOpenId={flagIds.stock} linkedMode="error" />),
    },
    ...systemStates({
      loading: shell(<FlagsDemo mode="loading" initialOpenId={flagIds.stock} linkedMode="loading" />),
      error: shell(<FlagsDemo mode="error" />),
      // السوبرفايزر لا يعالج العلامات: عنصرها غير ظاهر له، وفتح رابطها يُظهر «لا صلاحية».
      forbidden: (
        <ShellScreen user="supervisor" activeKey="home-supervisor" breadcrumbs={breadcrumbs}>
          <ForbiddenState />
        </ShellScreen>
      ),
    }),
  ],
};

type PageProps = { searchParams: ScreenSearchParams };

export const generateMetadata = ({ searchParams }: PageProps) => screenMetadata(screen, searchParams);

export default function FlagPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

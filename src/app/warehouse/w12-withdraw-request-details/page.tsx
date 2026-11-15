import type { ReactNode } from "react";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { ShellScreen } from "@/lib/design/ShellScreen";
import { ScreenStates, screenMetadata, type ScreenDefinition, type ScreenSearchParams } from "@/lib/design/ScreenStates";
import { systemStates } from "@/lib/design/systemStates";
import { findWithdrawRequest, isWithdrawRepActive } from "@/mocks/withdraw-requests";
import { WithdrawRequestDetailsDemo } from "./WithdrawRequestDetailsDemo";

// W12 · تفاصيل طلب السحب. الحالات في SCREENS.md (requested وhanded-over وcancelled وrep-deactivated)، ومعها نافذتا الإلغاء والتأكيد عن المندوب،
// والتسليم المؤكَّد عن مندوب معطَّل، والحالات العامة لتفاصيل الكيان. تفاعلية: الإلغاء والتأكيد عن المندوب يغيّران الطلب فتظهر النتيجة.
// للوجستي وحده (withdraw.create للإلغاء وwithdraw.confirm_on_behalf للتأكيد): عامل المستودع «لا صلاحية».

const breadcrumbsFor = (label: string) => [{ label: "الرئيسية", href: "#" }, { label: "طلبات السحب", href: "#" }, { label }];

const logistics = (label: string, node: ReactNode) => (
  <ShellScreen user="logistics" activeKey="withdraw-requests" breadcrumbs={breadcrumbsFor(label)}>
    {node}
  </ShellScreen>
);

const requested = findWithdrawRequest(12); // عمر الخطيب (فعّال): عينات وفلاير
const handedOver = findWithdrawRequest(7); // سامر الحلبي سلّم 16 من 18
const cancelled = findWithdrawRequest(3); // هدى العلي
const deactivated = findWithdrawRequest(13); // ريم الشامي (معطَّلة): ما زال مطلوباً
const confirmedOnBehalf = findWithdrawRequest(5); // أُكِّد عن ريم الشامي: 22 من 25 عينة

const demo = (request: typeof requested, props: { initialCancelOpen?: boolean; initialOnBehalfOpen?: boolean; mode?: "ready" | "loading" | "error" | "not-found" } = {}) => (
  <WithdrawRequestDetailsDemo initialRequest={request} repActive={isWithdrawRepActive(request)} {...props} />
);

const screen: ScreenDefinition = {
  id: "W12",
  name: "تفاصيل طلب السحب",
  states: [
    {
      key: "requested",
      label: "مطلوب",
      when: "طلب بانتظار تسليم المندوب من تطبيقه: المطلوب لكل صنف ودفعة والسبب. للوجستي «إلغاء الطلب» بسبب. لا ينقص رصيد المندوب قبل تسليمه.",
      node: logistics("طلب #12", demo(requested)),
    },
    {
      key: "cancel",
      label: "نافذة الإلغاء",
      when: "«إلغاء الطلب» يفتح نافذة تطلب السبب (إلزامي) والزر معطّل حتى يُكتب. الإلغاء قبل التسليم فقط، والتأكيد يحوّل الطلب إلى «ملغى».",
      node: logistics("طلب #12", demo(requested, { initialCancelOpen: true })),
    },
    {
      key: "handed-over",
      label: "مسلَّم",
      when: "سلّمه المندوب من تطبيقه: الفعلي بجانب المطلوب، وشارة «أقل من المطلوب» على السطر الذي اختلفت كميته (16 من 18).",
      node: logistics("طلب #7", demo(handedOver)),
    },
    {
      key: "cancelled",
      label: "ملغى",
      when: "ألغاه اللوجستي قبل التسليم: الشريط يعرض من ألغى وسببه. لا أزرار.",
      node: logistics("طلب #3", demo(cancelled)),
    },
    {
      key: "rep-deactivated",
      label: "مندوب معطَّل",
      when: "المندوب معطَّل فلا يستطيع التسليم من التطبيق: شارة «معطَّل» وتنبيه، وللوجستي «تأكيد الاستلام عنه» بالكمية الفعلية. الفرق عن رصيده فرق مخزون (القرار 14).",
      node: logistics("طلب #13", demo(deactivated)),
    },
    {
      key: "on-behalf",
      label: "نافذة التأكيد عن المندوب",
      when: "كمية فعلية لكل سطر (الزر معطّل حتى تُدخل كلها) مع المجموع الفعلي مقابل المطلوب. التأكيد يحوّل الطلب إلى «مسلَّم» بشارة «أُكِّد عن المندوب».",
      node: logistics("طلب #13", demo(deactivated, { initialOnBehalfOpen: true })),
    },
    {
      key: "handed-over-on-behalf",
      label: "مسلَّم عن المندوب",
      when: "أكّده اللوجستي عن مندوبة معطَّلة (22 من 25 عينة): الشريط يذكر من أكّد، وأن الفرق فرق مخزون للمراقب.",
      node: logistics("طلب #5", demo(confirmedOnBehalf)),
    },
    {
      key: "not-found",
      label: "غير موجود",
      when: "رابط طلب غير موجود أو خارج نطاق المستخدم (not_found): «العنصر غير موجود أو خارج نطاقك» وزر رجوع.",
      node: logistics("طلب", demo(requested, { mode: "not-found" })),
    },
    ...systemStates({
      loading: logistics("طلب #12", demo(requested, { mode: "loading" })),
      error: logistics("طلب #12", demo(requested, { mode: "error" })),
      // عامل المستودع لا يملك withdraw.create: عنصر طلبات السحب غير ظاهر له، وفتح رابطه يُظهر «لا صلاحية».
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

export default function WithdrawRequestDetailsPage({ searchParams }: PageProps) {
  return <ScreenStates screen={screen} searchParams={searchParams} />;
}

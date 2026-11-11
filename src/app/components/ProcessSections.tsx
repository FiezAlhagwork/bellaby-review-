"use client";

import { Barcode, CheckSquare, ClipboardText, Flag, MinusCircle, Package, UserSwitch } from "@phosphor-icons/react";
import { useState } from "react";
import { ActivityLog, type ActivityEvent } from "@/components/data/ActivityLog";
import { DecisionPanel, DecisionRecord } from "@/components/data/DecisionPanel";
import { DescriptionList } from "@/components/data/DescriptionList";
import { NotificationList, type NotificationGroup } from "@/components/data/NotificationList";
import { StageTimeline, type Stage } from "@/components/data/StageTimeline";
import { StatusBadge } from "@/components/data/StatusBadge";
import { Banner } from "@/components/ui/Banner";
import { RadioCard, RadioGroup } from "@/components/ui/Radio";
import { floatingPanelClass } from "@/components/ui/OptionList";
import { CaptureRow } from "@/lib/design/CaptureMode";
import { DESKTOP, HostFrame, MOBILE, TABLET } from "./DataSections";
import { GalleryGroup, GallerySection } from "./gallery-kit";

const noop = () => {};

const detail = (what: string, by: string, at: string) => ({ what, by, at });

const investigation: Stage[] = [
  { key: "s1", label: "المرحلة 1", status: "done", detail: detail("فُتح الملف من علامة مؤكَّدة.", "سامر الحلبي", "2026-11-03T08:10:00Z") },
  { key: "s2", label: "المرحلة 2", status: "done", detail: detail("جُمعت الإفادات الأولية.", "رامي السيد", "2026-11-04T10:30:00Z") },
  { key: "s3", label: "المرحلة 3", status: "done", detail: detail("رُوجع سجل الزيارات والحركات.", "ليلى الأحمد", "2026-11-05T13:00:00Z") },
  { key: "s4", label: "المرحلة 4", status: "current" },
  { key: "s5", label: "المرحلة 5", status: "upcoming" },
  { key: "s6", label: "المرحلة 6", status: "upcoming" },
  { key: "s7", label: "المرحلة 7", status: "upcoming" },
  { key: "s8", label: "المرحلة 8", status: "upcoming" },
];

const dispute: Stage[] = [
  { key: "s1", label: "المرحلة 1", status: "done", detail: detail("سُجّل النزاع.", "سامر الحلبي", "2026-11-03T08:10:00Z") },
  { key: "s2", label: "المرحلة 2", status: "done", detail: detail("أُبلغ الطرفان.", "رامي السيد", "2026-11-04T10:30:00Z") },
  { key: "s3", label: "المرحلة 3", status: "done", detail: detail("استُلمت المستندات.", "ليلى الأحمد", "2026-11-05T13:00:00Z") },
  { key: "s4", label: "المرحلة 4", status: "done", detail: detail("دُرست المستندات.", "ليلى الأحمد", "2026-11-06T09:00:00Z") },
  { key: "s5", label: "المرحلة 5", status: "done", detail: detail("عُقدت جلسة التسوية.", "سامر الحلبي", "2026-11-07T11:15:00Z") },
  { key: "s6", label: "المرحلة 6", status: "done", detail: detail("رُفعت التوصية.", "رامي السيد", "2026-11-08T12:00:00Z") },
  { key: "d", label: "القرار", status: "current", kind: "decision" },
  { key: "s7", label: "المرحلة 7", status: "upcoming" },
];

export function StageSection() {
  return (
    <GallerySection
      name="StageTimeline"
      title="المراحل"
      usage="لملف التحقيق (8 مراحل) والنزاع (7 مراحل مع القرار بين 6 و7، بشكل معيّن). مكتب: أفقي من اليمين، المكتملة success بعلامة ✓ والحالية info بحلقة والقادمة neutral. تابلت وموبايل: عمودي وتحت كل مرحلة مكتملة ما جرى ومن نفّذه ومتى. الإغلاق المبكر نهاية عند مرحلته بسببه."
    >
      <GalleryGroup title="التحقيق: 8 مراحل (الحالية الرابعة)">
        <div className="flex flex-col gap-6">
          <HostFrame label="مكتب 1280: أفقي" widthClass={DESKTOP}>
            <StageTimeline stages={investigation} />
          </HostFrame>
          <HostFrame label="تابلت 1024: عمودي" widthClass={TABLET}>
            <StageTimeline stages={investigation} />
          </HostFrame>
          <HostFrame label="موبايل 390: عمودي" widthClass={MOBILE}>
            <StageTimeline stages={investigation} />
          </HostFrame>
        </div>
      </GalleryGroup>

      <GalleryGroup title="النزاع: القرار بين المرحلتين 6 و7">
        <HostFrame label="مكتب: معيّن القرار حالي" widthClass={DESKTOP}>
          <StageTimeline stages={dispute} />
        </HostFrame>
      </GalleryGroup>

      <GalleryGroup title="الإغلاق المبكر عند المرحلة 3">
        <div className="flex flex-col gap-6">
          <HostFrame label="مكتب" widthClass={DESKTOP}>
            <StageTimeline stages={investigation.map((stage) => ({ ...stage }))} earlyClose={{ atKey: "s3", label: "أُغلق دون مخالفة", reason: "لم تثبت المخالفة بعد مراجعة السجلات." }} />
          </HostFrame>
          <HostFrame label="موبايل" widthClass={MOBILE}>
            <StageTimeline stages={investigation} earlyClose={{ atKey: "s3", label: "أُغلق دون مخالفة", reason: "لم تثبت المخالفة بعد مراجعة السجلات." }} />
          </HostFrame>
        </div>
      </GalleryGroup>
    </GallerySection>
  );
}

const events: ActivityEvent[] = [
  { id: 1, icon: ClipboardText, sentence: "رفض رامي السيد الجرد", reason: "العدّ غير مطابق لرصيد النظام في دفعتين.", at: "2026-11-09T14:05:00Z" },
  { id: 2, icon: CheckSquare, sentence: "اعتمد سامر الحلبي طلب العينات", at: "2026-11-09T09:30:00Z", onBehalf: true },
  { id: 3, icon: MinusCircle, sentence: "خصم المدير التنفيذي من المندوب وأغلق المهمة", reason: "تأخر التسليم أسبوعاً دون مبرر.", at: "2026-11-07T16:20:00Z" },
  { id: 4, icon: Barcode, sentence: "أُوقفت الدفعة LOT-2609-C", at: "2026-11-05T11:00:00Z" },
  { id: 5, icon: UserSwitch, sentence: "فُوِّض سامر الحلبي حتى 15 تشرين الثاني", at: "2026-11-03T08:00:00Z" },
];

export function ActivitySection() {
  return (
    <GallerySection
      name="ActivityLog · DescriptionList"
      title="السجل وقائمة التفاصيل"
      usage="ActivityLog: خط زمني على البداية، لكل حدث أيقونة وجملة وسبب في اقتباس والوقت، والأحدث أعلى، والقرار بالتفويض بشارة info. DescriptionList: أزواج «تسمية: قيمة» في عمودين (تابلت وما فوق) أو عمود، والفارغ «—»."
    >
      <GalleryGroup title="ActivityLog">
        <div className="flex flex-col gap-6">
          <HostFrame label="مكتب" widthClass={DESKTOP}>
            <div className="max-w-xl">
              <ActivityLog events={events} />
            </div>
          </HostFrame>
          <HostFrame label="موبايل" widthClass={MOBILE}>
            <ActivityLog events={events.slice(0, 3)} />
          </HostFrame>
          <HostFrame label="تحميل وفارغ" widthClass={DESKTOP}>
            <div className="flex max-w-xl flex-col gap-8">
              <ActivityLog events={[]} loading />
              <ActivityLog events={[]} />
            </div>
          </HostFrame>
        </div>
      </GalleryGroup>

      <GalleryGroup title="DescriptionList">
        <div className="flex flex-col gap-6">
          <HostFrame label="تابلت وما فوق: عمودان" widthClass={DESKTOP}>
            <DescriptionList
              items={[
                { label: "المندوب", value: "سامر الحلبي" },
                { label: "الوجهة", value: "وكالة الياسمين للتوزيع" },
                { label: "الدفعة", value: <span dir="ltr">LOT-2611-A</span> },
                { label: "الكمية", value: "360 علبة" },
                { label: "ملاحظات", value: null },
                { label: "المرجع", value: "" },
              ]}
            />
          </HostFrame>
          <HostFrame label="موبايل: عمود" widthClass={MOBILE}>
            <DescriptionList
              items={[
                { label: "المندوب", value: "سامر الحلبي" },
                { label: "الوجهة", value: "وكالة الياسمين للتوزيع" },
                { label: "ملاحظات", value: null },
              ]}
            />
          </HostFrame>
        </div>
      </GalleryGroup>
    </GallerySection>
  );
}

function DamagePanel() {
  const [responsibility, setResponsibility] = useState<string | null>(null);
  return (
    <DecisionPanel
      summary="تقرير تالف: 12 علبة من الدفعة LOT-2611-A رفعه المندوب سامر الحلبي."
      approveDisabled={responsibility === null}
      approveHint="اختر المسؤولية لتفعيل «اعتماد»."
      onApprove={noop}
      onReject={noop}
    >
      <RadioGroup value={responsibility} onValueChange={setResponsibility} aria-label="المسؤولية">
        <RadioCard value="warehouse" title="المستودع" description="تُحمَّل على المستودع." />
        <RadioCard value="manufacturer" title="المصنّع" description="تُطالَب بها الشركة المصنّعة." />
        <RadioCard value="other" title="جهة أخرى" description="تُسجَّل على جهة غير المذكورة." />
      </RadioGroup>
    </DecisionPanel>
  );
}

export function DecisionSection() {
  return (
    <GallerySection
      name="DecisionPanel · DecisionRecord"
      title="القرار"
      usage="DecisionPanel لطلب معلّق وأنا أملك القرار: «بانتظار قرارك» والزرّان اعتماد (primary) ورفض (danger، يفتح ReasonDialog). وبعد القرار يحل DecisionRecord محله. الحالات الخاصة: ينتظر قرار غيري، already_decided، self_decision_forbidden، السجل المقفل، والقرار بالتفويض."
    >
      <GalleryGroup title="DecisionPanel (العمود الجانبي)">
        <CaptureRow className="items-start gap-6">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <p className="text-label font-medium text-fg-muted">بانتظار قراري</p>
            <DecisionPanel summary="طلب إجازة 3 أيام للمندوب عمر الخطيب من 15 تشرين الثاني." onApprove={noop} onReject={noop} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <p className="text-label font-medium text-fg-muted">مع خيار يحدده العقد (قرار التالف)</p>
            <DamagePanel />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <p className="text-label font-medium text-fg-muted">الاعتماد يُنفَّذ</p>
            <DecisionPanel summary="طلب إجازة 3 أيام للمندوب عمر الخطيب من 15 تشرين الثاني." approving onApprove={noop} onReject={noop} />
          </div>
        </CaptureRow>
        <CaptureRow className="items-start gap-6">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <p className="text-label font-medium text-fg-muted">ينتظر قرار غيري</p>
            <DecisionPanel state="awaiting-other" summary="طلب إجازة 3 أيام للمندوب عمر الخطيب." waitingFor="بانتظار قرار مدير المبيعات أو المدير التنفيذي" onApprove={noop} onReject={noop} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <p className="text-label font-medium text-fg-muted">self_decision_forbidden</p>
            <DecisionPanel state="self-decision-forbidden" summary="طلب إجازتك أنت من 20 تشرين الثاني." forbiddenNote="ينتظر قرار المدير التنفيذي." onApprove={noop} onReject={noop} />
          </div>
          <div className="min-w-0 flex-1" />
        </CaptureRow>
      </GalleryGroup>

      <GalleryGroup title="DecisionRecord وما يُركَّب معه في الشاشة">
        <CaptureRow className="items-start gap-6">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <p className="text-label font-medium text-fg-muted">قُرّر: مرفوض مع السبب</p>
            <DecisionRecord badge={<StatusBadge entity="leave" status="REJECTED" />} decidedBy="سامر الحلبي" decidedAt="2026-11-09T14:05:00Z" reason="لا يتوفر بديل في الفريق لهذه الفترة." />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <p className="text-label font-medium text-fg-muted">بالتفويض</p>
            <DecisionRecord badge={<StatusBadge entity="leave" status="APPROVED" />} decidedBy="سامر الحلبي" decidedAt="2026-11-09T09:30:00Z" onBehalf />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <p className="text-label font-medium text-fg-muted">already_decided (409): Banner ثم السجل</p>
            <Banner kind="warning" title="قرّر غيرك قبلك">اعتمد سامر الحلبي هذا الطلب في 9 تشرين الثاني الساعة 14:05.</Banner>
            <DecisionRecord badge={<StatusBadge entity="leave" status="APPROVED" />} decidedBy="سامر الحلبي" decidedAt="2026-11-09T14:05:00Z" />
          </div>
        </CaptureRow>
      </GalleryGroup>

      <GalleryGroup title="الموبايل">
        <CaptureRow>
          <HostFrame label="اللوحة والسجل بعرض الإطار" widthClass={MOBILE}>
            <div className="flex flex-col gap-4">
              <DecisionPanel summary="طلب إجازة 3 أيام للمندوب عمر الخطيب من 15 تشرين الثاني." onApprove={noop} onReject={noop} />
              <DecisionRecord badge={<StatusBadge entity="leave" status="APPROVED" />} decidedBy="سامر الحلبي" decidedAt="2026-11-09T14:05:00Z" />
            </div>
          </HostFrame>
        </CaptureRow>
      </GalleryGroup>
    </GallerySection>
  );
}

const NOW = "2026-11-10T14:00:00Z";
const groups: NotificationGroup[] = [
  {
    key: "today",
    items: [
      { id: 1, icon: CheckSquare, title: "طلب جديد بانتظار قرارك", body: "طلب إجازة من المندوب عمر الخطيب لمدة 3 أيام يحتاج قراراً منك.", at: "2026-11-10T13:55:00Z", unread: true },
      { id: 2, icon: Package, title: "وصل الصرف TRF-000154", body: "استلمت وكالة الياسمين للتوزيع الشحنة كاملة.", at: "2026-11-10T11:00:00Z", unread: true },
    ],
  },
  {
    key: "week",
    items: [{ id: 3, icon: Flag, title: "علامة جديدة على زيارة", body: "رُفعت علامة على زيارة المندوب سامر الحلبي لصيدلية الشفاء.", at: "2026-11-09T09:00:00Z", unread: false }],
  },
  {
    key: "older",
    items: [{ id: 4, icon: Barcode, title: "أُوقفت دفعة", body: "أُوقفت الدفعة LOT-2609-C بقرار من المدير التنفيذي.", at: "2026-10-20T10:00:00Z", unread: false }],
  },
];

export function NotificationSection() {
  return (
    <GallerySection
      name="NotificationList"
      title="قائمة الإشعارات"
      usage="popover من الجرس على المكتب وصفحة كاملة على الموبايل. لكل إشعار أيقونة في دائرة surface-sunken وعنوان ونص بسطرين ووقت نسبي. غير المقروء بخلفية primary-soft ونقطة. مجموعات اليوم · هذا الأسبوع · أقدم، و«تعليم الكل كمقروء» في الرأس."
    >
      <GalleryGroup title="الحالات">
        <div className="flex flex-col gap-6">
          <HostFrame label="مكتب: داخل popover بعرض 384" widthClass={DESKTOP}>
            <div className="flex">
              <div className={`${floatingPanelClass} w-96`}>
                <NotificationList groups={groups} now={NOW} onOpen={noop} onMarkAllRead={noop} />
              </div>
            </div>
          </HostFrame>
          <HostFrame label="موبايل: صفحة كاملة" widthClass={MOBILE}>
            <NotificationList groups={groups} now={NOW} onOpen={noop} onMarkAllRead={noop} />
          </HostFrame>
          <HostFrame label="تحميل · فارغ" widthClass={MOBILE}>
            <div className="flex flex-col gap-6">
              <NotificationList groups={[]} loading onOpen={noop} />
              <NotificationList groups={[]} onOpen={noop} />
            </div>
          </HostFrame>
        </div>
      </GalleryGroup>
    </GallerySection>
  );
}

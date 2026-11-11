"use client";

import { useState, type ReactNode } from "react";
import { Banner, type BannerKind } from "@/components/ui/Banner";
import { BottomSheet, Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DatePicker } from "@/components/ui/DatePicker";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { OverlayHost } from "@/components/ui/OverlayHost";
import { ReasonDialog } from "@/components/ui/ReasonDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { ToastProvider, ToastView, toastActionClass, useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";
import { CaptureRow } from "@/lib/design/CaptureMode";
import { GalleryGroup, GallerySection, StateStack } from "./gallery-kit";

const noop = () => {};

const kinds: readonly { kind: BannerKind; label: string }[] = [
  { kind: "info", label: "info" },
  { kind: "success", label: "success" },
  { kind: "warning", label: "warning" },
  { kind: "danger", label: "danger" },
  { kind: "neutral", label: "neutral" },
];

export function BannerSection() {
  return (
    <GallerySection
      name="Banner"
      title="التنبيه"
      usage="شريط بعرض المحتوى لحالة تخص الصفحة كلها: دفعة موقوفة، شهر مغلق، سجل مقفل، تفويض نشط، قرار سبقك. لا يُستعمل لخطأ في حقل ولا لتأكيد نجاح عابر (Toast)."
    >
      <GalleryGroup title="الألوان الخمسة (نص فقط)">
        <StateStack
          alignLabel="top"
          states={kinds.map(({ kind, label }) => ({ label, node: <Banner kind={kind}>تم تحديث بيانات الصرف قبل دقيقة.</Banner> }))}
        />
      </GalleryGroup>

      <GalleryGroup title="مع عنوان، وإجراء، وإغلاق">
        <StateStack
          alignLabel="top"
          states={[
            { label: "عنوان", node: <Banner kind="info" title="تفويض نشط">تعمل الآن بالتفويض عن المدير التنفيذي حتى 20 تشرين الثاني.</Banner> },
            {
              label: "إجراء",
              node: (
                <Banner
                  kind="danger"
                  title="الدفعة موقوفة"
                  action={
                    <Button variant="ghost" size="sm">
                      عرض السبب
                    </Button>
                  }
                >
                  أوقفها المراقب في 3 تشرين الثاني، ولا يمكن صرفها حتى فكّ الإيقاف.
                </Banner>
              ),
            },
            { label: "إغلاق", node: <Banner kind="success" onClose={noop}>اكتمل استيراد الأسعار.</Banner> },
            {
              label: "عنوان وإجراء وإغلاق",
              node: (
                <Banner
                  kind="warning"
                  title="الشهر مغلق"
                  onClose={noop}
                  action={
                    <Button variant="ghost" size="sm">
                      طلب إعادة الفتح
                    </Button>
                  }
                >
                  أُغلق شهر تشرين الأول، فلا يمكن تعديل سطور الجرد فيه.
                </Banner>
              ),
            },
            { label: "قرار سبقك", node: <Banner kind="neutral" title="قرّر غيرك أولاً">اعتمد سامر الحلبي هذا الطلب في 9 تشرين الثاني الساعة 14:05.</Banner> },
          ]}
        />
      </GalleryGroup>
    </GallerySection>
  );
}

function LiveToasts() {
  const toast = useToast();
  return (
    <div className="flex flex-col gap-2">
      <CaptureRow className="gap-2">
      <Button variant="secondary" onClick={() => toast.show({ kind: "success", message: "اعتُمد الصرف" })}>
        نجاح
      </Button>
      <Button variant="secondary" onClick={() => toast.show({ kind: "success", message: "أُنشئ الصرف", action: { label: "عرض", onClick: noop } })}>
        نجاح مع «عرض»
      </Button>
      </CaptureRow>
      <CaptureRow className="gap-2">
      <Button variant="secondary" onClick={() => toast.show({ kind: "danger", message: "عدد الطلبات كثير. انتظر قليلاً ثم أعد المحاولة." })}>
        خطأ
      </Button>
      <Button variant="secondary" onClick={() => toast.show({ kind: "info", message: "تُزامَن البيانات في الخلفية." })}>
        معلومة
      </Button>
      </CaptureRow>
    </div>
  );
}

export function ToastSection() {
  return (
    <GallerySection
      name="Toast"
      title="الإشعار العابر"
      usage="أسفل البداية (أسفل يمين) على المكتب، وأعلى الشاشة على الموبايل. يختفي بعد 5 ثوانٍ ويبقى إن مرّ عليه المؤشر. للتأكيد بعد النجاح ولأخطاء الإجراء العامة. بقاء الظاهر 3 كحد أقصى."
    >
      <GalleryGroup title="الشكل">
        <StateStack
          alignLabel="top"
          states={[
            { label: "success", node: <ToastView kind="success" message="اعتُمد الصرف" /> },
            { label: "success مع إجراء", node: <ToastView kind="success" message="أُنشئ الصرف" action={<span className={toastActionClass}>عرض</span>} /> },
            { label: "danger", node: <ToastView kind="danger" message="عدد الطلبات كثير. انتظر قليلاً ثم أعد المحاولة." /> },
            { label: "info", node: <ToastView kind="info" message="تُزامَن البيانات في الخلفية." /> },
          ]}
        />
      </GalleryGroup>

      <GalleryGroup title="حي (أسفل يمين النافذة، وأعلى إطار الموبايل)">
        <StateStack
          alignLabel="top"
          states={[
            {
              label: "على المكتب",
              node: (
                <ToastProvider>
                  <LiveToasts />
                </ToastProvider>
              ),
            },
          ]}
        />
        <MobileFrame label="على الموبايل: إطار 390 بمضيفه">
          <ToastProvider>
            <div className="flex flex-col gap-3 p-4">
              <LiveToasts />
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-24 w-full" />
            </div>
          </ToastProvider>
        </MobileFrame>
      </GalleryGroup>
    </GallerySection>
  );
}

export function FakePage() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-3 p-6">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

/** إطار بمضيفه (OverlayHost): النوافذ داخله تبقى داخله وتقيس عرضه. 390 للموبايل، وإلا بعرض الحاوية. */
export function Frame({ label, mobile = false, height = "h-96", children }: { label: string; mobile?: boolean; height?: string; children: ReactNode }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", !mobile && "flex-1")}>
      <p className="text-label font-medium text-fg-muted">{label}</p>
      <CaptureRow>
        <OverlayHost className={cn("overflow-hidden rounded-lg bg-bg ring-1 ring-border", height, mobile ? "w-97.5" : "flex-1")}>{children}</OverlayHost>
      </CaptureRow>
    </div>
  );
}

function MobileFrame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Frame label={label} mobile height="h-96">
      {children}
    </Frame>
  );
}

const sizes = [
  { size: "sm" as const, label: "sm: 480" },
  { size: "md" as const, label: "md: 640" },
  { size: "lg" as const, label: "lg: 880" },
];

function FormBody({ rows = 2 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-4">
      <Field label="اسم الجهة" required>
        <Input placeholder="مثال: صيدلية الشفاء" />
      </Field>
      {rows > 1 ? (
        <Field label="ملاحظات" optional>
          <Textarea placeholder="تظهر في تفاصيل الجهة." />
        </Field>
      ) : null}
    </div>
  );
}

function SaveActions({ onCancel }: { onCancel: () => void }) {
  return [
    <Button key="cancel" variant="secondary" onClick={onCancel}>
      إلغاء
    </Button>,
    <Button key="save">حفظ</Button>,
  ];
}

function LiveDialogs() {
  const [open, setOpen] = useState<null | "confirm" | "danger" | "reason" | "form" | "sheet">(null);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const close = () => setOpen(null);

  const runDanger = () => {
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      close();
    }, 1500);
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <CaptureRow className="gap-2">
        <Button variant="secondary" onClick={() => setOpen("confirm")}>
          تأكيد
        </Button>
        <Button variant="secondary" onClick={() => setOpen("danger")}>
          تأكيد خطر (تحميل 1.5 ثانية)
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setReason("");
            setOpen("reason");
          }}
        >
          سبب
        </Button>
        </CaptureRow>
        <CaptureRow className="gap-2">
        <Button variant="secondary" onClick={() => setOpen("form")}>
          نافذة md
        </Button>
        <Button variant="secondary" onClick={() => setOpen("sheet")}>
          ورقة سفلية
        </Button>
        </CaptureRow>
      </div>
      <ConfirmDialog
        open={open === "confirm"}
        onOpenChange={(next) => !next && close()}
        title="اعتماد الصرف؟"
        description="سيُخصم الرصيد من المستودع فور الاعتماد."
        confirmLabel="اعتماد"
        onConfirm={close}
      />
      <ConfirmDialog
        open={open === "danger"}
        onOpenChange={(next) => !next && close()}
        title="إيقاف الدفعة؟"
        description="لن يُصرف منها شيء حتى فكّ الإيقاف."
        confirmLabel="إيقاف الدفعة"
        danger
        loading={loading}
        onConfirm={runDanger}
      />
      <ReasonDialog
        open={open === "reason"}
        onOpenChange={(next) => !next && close()}
        title="رفض الطلب؟"
        description="يصل المندوب إشعار بالسبب."
        confirmLabel="رفض"
        danger
        reason={reason}
        onReasonChange={setReason}
        onConfirm={close}
      />
      <Dialog open={open === "form"} onOpenChange={(next) => !next && close()} size="md" title="إضافة جهة" description="تظهر في قوائم الصرف بعد الحفظ." actions={SaveActions({ onCancel: close })}>
        <FormBody />
      </Dialog>
      <BottomSheet open={open === "sheet"} onOpenChange={(next) => !next && close()} title="فلاتر (3)" actions={SaveActions({ onCancel: close })}>
        <FormBody />
      </BottomSheet>
    </>
  );
}

function FrameLive() {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-4 p-4">
      <Button variant="secondary" onClick={() => setOpen(true)}>
        تأكيد داخل الإطار
      </Button>
      <Field label="تاريخ التسليم">
        <DatePicker value={date} onValueChange={setDate} today="2026-11-10" />
      </Field>
      <Skeleton className="h-24 w-full" />
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="اعتماد الصرف؟"
        description="سيُخصم الرصيد من المستودع فور الاعتماد."
        confirmLabel="اعتماد"
        onConfirm={() => setOpen(false)}
      />
    </div>
  );
}

export function DialogSection() {
  return (
    <GallerySection
      name="Dialog · ConfirmDialog · ReasonDialog · BottomSheet"
      title="النوافذ"
      usage="في الوسط بعرض 480 أو 640 أو 880، وعلى الموبايل ورقة سفلية بعرض الإطار. رأس بعنوان وإغلاق، وجسم يمرّر، وتذييل إجراءات: الإلغاء ثم الأساسي. تحبس التركيز وتغلق بـ Esc. تُرسم في مضيفها (OverlayHost) فتبقى داخل إطارها."
    >
      <GalleryGroup title="الأحجام على المكتب (مفتوحة، ثابتة للعرض)">
        <div className="flex flex-col gap-6">
          {sizes.map(({ size, label }) => (
            <Frame key={size} label={label} height="h-112">
              <FakePage />
              <Dialog
                preview
                open
                onOpenChange={noop}
                size={size}
                title={size === "sm" ? "إيقاف الدفعة؟" : "إضافة جهة"}
                description={size === "sm" ? "لن يُصرف منها شيء حتى فكّ الإيقاف." : "تظهر في قوائم الصرف بعد الحفظ."}
                actions={SaveActions({ onCancel: noop })}
              >
                {size === "sm" ? null : <FormBody rows={size === "lg" ? 2 : 1} />}
              </Dialog>
            </Frame>
          ))}
        </div>
      </GalleryGroup>

      <GalleryGroup title="ConfirmDialog (على الموبايل: ورقة سفلية)">
        <CaptureRow className="gap-6">
          <Frame label="تأكيد" mobile height="h-120">
            <FakePage />
            <ConfirmDialog preview open onOpenChange={noop} title="اعتماد الصرف؟" description="سيُخصم الرصيد من المستودع فور الاعتماد." confirmLabel="اعتماد" onConfirm={noop} />
          </Frame>
          <Frame label="خطر" mobile height="h-120">
            <FakePage />
            <ConfirmDialog preview open onOpenChange={noop} title="إيقاف الدفعة؟" description="لن يُصرف منها شيء حتى فكّ الإيقاف." confirmLabel="إيقاف الدفعة" danger onConfirm={noop} />
          </Frame>
          <Frame label="يُنفَّذ الطلب (الزر يحمّل والإلغاء معطّل)" mobile height="h-120">
            <FakePage />
            <ConfirmDialog preview open onOpenChange={noop} title="إيقاف الدفعة؟" description="لن يُصرف منها شيء حتى فكّ الإيقاف." confirmLabel="إيقاف الدفعة" danger loading onConfirm={noop} />
          </Frame>
        </CaptureRow>
      </GalleryGroup>

      <GalleryGroup title="ReasonDialog (السبب إلزامي، والزر معطّل ومعه سببه)">
        <CaptureRow className="gap-6">
          <Frame label="السبب فارغ" mobile height="h-136">
            <FakePage />
            <ReasonDialog preview open onOpenChange={noop} title="رفض الطلب؟" description="يصل المندوب إشعار بالسبب." confirmLabel="رفض" danger reason="" onReasonChange={noop} onConfirm={noop} />
          </Frame>
          <Frame label="السبب مكتوب" mobile height="h-136">
            <FakePage />
            <ReasonDialog preview open onOpenChange={noop} title="رفض الطلب؟" description="يصل المندوب إشعار بالسبب." confirmLabel="رفض" danger reason="الكمية المطلوبة تتجاوز المتاح في المستودع." onReasonChange={noop} onConfirm={noop} />
          </Frame>
          <Frame label="خطأ من الخادم (validation_failed)" mobile height="h-136">
            <FakePage />
            <ReasonDialog
              preview
              open
              onOpenChange={noop}
              title="رفض الطلب؟"
              description="يصل المندوب إشعار بالسبب."
              confirmLabel="رفض"
              danger
              reason="غير مناسب"
              onReasonChange={noop}
              error="السبب يجب ألا يقل عن 10 أحرف."
              onConfirm={noop}
            />
          </Frame>
        </CaptureRow>
      </GalleryGroup>

      <GalleryGroup title="BottomSheet (ورقة في كل المقاسات)">
        <CaptureRow className="gap-6">
          <Frame label="فلاتر (3)" mobile height="h-120">
            <FakePage />
            <BottomSheet open onOpenChange={noop} title="فلاتر (3)" actions={SaveActions({ onCancel: noop })} preview>
              <FormBody />
            </BottomSheet>
          </Frame>
        </CaptureRow>
      </GalleryGroup>

      <GalleryGroup title="حي: انقر (في النافذة الحقيقية: Esc، الضغط خارجها، Tab محبوس داخلها)">
        <StateStack alignLabel="top" states={[{ label: "على المكتب", node: <LiveDialogs /> }]} />
        <MobileFrame label="داخل إطار الموبايل: النافذة ورقة سفلية داخل الإطار، والتاريخ يفتح ورقة">
          <FrameLive />
        </MobileFrame>
      </GalleryGroup>
    </GallerySection>
  );
}

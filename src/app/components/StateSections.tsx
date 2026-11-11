"use client";

import { MagnifyingGlass, Package, Plus } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { NotFoundState } from "@/components/ui/NotFoundState";
import { errorMessages } from "@/lib/api/error-messages";
import { CaptureRow } from "@/lib/design/CaptureMode";
import { GalleryGroup, GallerySection, ShowcaseCard, StateCard } from "./gallery-kit";

const noop = () => {};

export function EmptyStatesSection() {
  return (
    <GallerySection
      name="EmptyState"
      title="حالات الفراغ والخطأ"
      usage="EmptyState وErrorState وForbiddenState وNotFoundState: تحل مكان المحتوى حين لا يوجد ما يُعرض. الأزرار بـ callbacks فلا يعرف المكوّن الـ router ولا الشبكة. ارتفاع الجدول الفارغ 320."
    >
      <GalleryGroup title="الفراغ: نوعان">
        <CaptureRow className="gap-6">
          <StateCard label="لا يوجد شيء بعد (مع الإجراء الذي ينشئ أول عنصر)">
            <EmptyState
              className="min-h-80"
              icon={Package}
              title="لا توجد صرفيات بعد"
              description="ابدأ بإنشاء أول صرف ليظهر هنا."
              action={
                <Button icon={Plus} onClick={noop}>
                  صرف جديد
                </Button>
              }
            />
          </StateCard>
          <StateCard label="لا نتائج للفلتر (مع مسح الفلاتر)">
            <EmptyState
              className="min-h-80"
              icon={MagnifyingGlass}
              title="لا نتائج"
              description="لا شيء يطابق الفلاتر الحالية. جرّب تغييرها أو مسحها."
              action={
                <Button variant="secondary" onClick={noop}>
                  مسح الفلاتر
                </Button>
              }
            />
          </StateCard>
        </CaptureRow>
      </GalleryGroup>

      <GalleryGroup title="الخطأ: النص من error-messages.ts بمفتاح code">
        <CaptureRow className="gap-6">
          <StateCard label="رمز معروف (too_many_requests) مع إعادة المحاولة">
            <ErrorState className="min-h-80" code="too_many_requests" onRetry={noop} />
          </StateCard>
          <StateCard label="تُعاد المحاولة الآن">
            <ErrorState className="min-h-80" code="too_many_requests" onRetry={noop} retrying />
          </StateCard>
          <StateCard label="رمز غير معروف: الرسالة الاحتياطية">
            <ErrorState className="min-h-80" code="unexpected_server_error" onRetry={noop} />
          </StateCard>
        </CaptureRow>
      </GalleryGroup>

      <GalleryGroup title="لا صلاحية، وغير موجود">
        <CaptureRow className="gap-6">
          <StateCard label="forbidden">
            <ForbiddenState className="min-h-80" onGoHome={noop} />
          </StateCard>
          <StateCard label="not_found (غير موجود أو خارج النطاق)">
            <NotFoundState className="min-h-80" onBack={noop} />
          </StateCard>
        </CaptureRow>
      </GalleryGroup>
    </GallerySection>
  );
}

export function ErrorMessagesSection() {
  const entries = Object.entries(errorMessages);
  return (
    <GallerySection
      name="error-messages"
      title="رموز الخطأ ونصوصها"
      usage={`${entries.length} رمزاً من العقد. للمراجعة قبل الاعتماد. رمز غير معروف يأخذ الرسالة الاحتياطية.`}
    >
      <ShowcaseCard>
        {entries.map(([code, message]) => (
          <CaptureRow key={code} className="min-h-12 items-center border-b border-border py-2 last:border-b-0">
            <span dir="ltr" className="w-80 shrink-0 px-4 text-end text-label text-fg-muted">
              {code}
            </span>
            <span className="min-w-0 flex-1 px-4 text-body text-fg">{message}</span>
          </CaptureRow>
        ))}
      </ShowcaseCard>
    </GallerySection>
  );
}

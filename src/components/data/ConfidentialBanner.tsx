import { ShieldCheck } from "@phosphor-icons/react";
import { Banner } from "@/components/ui/Banner";

/**
 * شريط السرية (DESIGN.md 11.8): أعلى كل صفحة من ملفات التحقيق والنزاعات. كل اطلاع على الملف يُسجَّل في الخادم (العقد)،
 * فالنص يخبر القارئ بذلك ولا يعرض سجل الاطلاع.
 */
export function ConfidentialBanner({ className }: { className?: string }) {
  return (
    <Banner kind="neutral" icon={ShieldCheck} className={className}>
      ملف سري. اطّلاعك مسجّل.
    </Banner>
  );
}

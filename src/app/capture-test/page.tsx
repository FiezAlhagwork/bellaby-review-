import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isReviewEnv } from "@/lib/design/review";
import type { ReactNode } from "react";
import { CaptureScope } from "@/lib/design/CaptureMode";
import { DomOrderCheck } from "@/lib/design/DomOrderCheck";
import { DataTableDemo, FieldDemo, SidebarDemo } from "./demos";

export const metadata: Metadata = { title: "اختبار الالتقاط" };

function Panel({ capture, children }: { capture: boolean; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <p className="text-label font-medium text-fg-muted">
        {capture ? "وضع الالتقاط (?capture=1)" : "الوضع العادي (RTL)"}
      </p>
      {/* @container بلا padding ولا border، والـ padding على ابنه (DESIGN.md 2.1). */}
      <CaptureScope capture={capture} className="@container rounded-lg bg-bg">
        <div className="p-6">
          <DomOrderCheck expectOrdered={capture}>{children}</DomOrderCheck>
        </div>
      </CaptureScope>
    </div>
  );
}

function Comparison({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-h2 font-semibold text-fg">{title}</h2>
      <div className="grid grid-cols-2 gap-8">
        <Panel capture={false}>{children}</Panel>
        <Panel capture>{children}</Panel>
      </div>
    </section>
  );
}

export default function CaptureTestPage() {
  // نسخة الزبون (REVIEW_MODE=1) لا تعرض الأدوات الداخلية.
  if (isReviewEnv()) notFound();

  return (
    <main className="flex flex-col gap-12 bg-surface-sunken p-8">
      <header className="flex max-w-3xl flex-col gap-2">
        <h1 className="text-h1 font-bold text-fg">اختبار الالتقاط</h1>
        <p className="text-body text-fg-muted">
          كل مكوّن بالوضعين جنباً إلى جنب. المطلوب: الشكل متطابق بصرياً، وترتيب الـ DOM في وضع الالتقاط مطابق للترتيب من
          اليسار (يتحقق منه السطر تحت كل لوحة). افتح الصفحة بلا ?capture=1 في الرابط.
        </p>
      </header>
      <Comparison title="Field / Input">
        <FieldDemo />
      </Comparison>
      <Comparison title="DataTable">
        <DataTableDemo />
      </Comparison>
      <Comparison title="Sidebar">
        <SidebarDemo />
      </Comparison>
    </main>
  );
}

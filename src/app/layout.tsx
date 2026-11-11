import type { Metadata } from "next";
import { CaptureModeProvider } from "@/lib/design/CaptureMode";
import { isReviewEnv } from "@/lib/design/review";
import "../styles/globals.css";
// بعد globals.css دائماً: يعتمد على ترتيب طبقات Tailwind.
import "../lib/design/capture.css";

// نسخة المراجعة للزبون: اسم مناسب له، ولا تُفهرس في محركات البحث.
export const metadata: Metadata = isReviewEnv()
  ? { title: "Bellaby · مراجعة التصميم", robots: { index: false, follow: false } }
  : { title: "Bellaby · Design" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="font-sans antialiased">
        <CaptureModeProvider>{children}</CaptureModeProvider>
      </body>
    </html>
  );
}

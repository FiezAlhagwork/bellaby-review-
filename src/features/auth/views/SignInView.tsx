"use client";

import { GoogleLogo } from "@phosphor-icons/react";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { errorMessage } from "@/lib/api/error-messages";

/** حالة محاولة الدخول. `rejected` يحمل رمز الرفض من العقد (account_not_provisioned وaccount_disabled وemail_blocked). */
export type SignInStatus = { status: "idle" } | { status: "signing-in" } | { status: "rejected"; code: string };

type SignInViewProps = {
  status: SignInStatus;
  onGoogleSignIn?: () => void;
};

/**
 * تسجيل الدخول (G01): «Bellaby» وجملة وزر Google. لا تسجيل ذاتي، والحساب يضيفه IT.
 * العقد: Clerk ثم GET /me. المرفوض يعرض نص الرمز من error-messages.ts.
 */
export function SignInView({ status, onGoogleSignIn }: SignInViewProps) {
  const signingIn = status.status === "signing-in";

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <header className="flex flex-col items-center gap-2 text-center">
          {/* شعار المرحلة 1: الكلمة نصاً. */}
          <h1 className="text-display font-bold text-fg">Bellaby</h1>
          <p className="text-body text-fg-muted">سجّل الدخول بحساب Google الخاص بالشركة للوصول إلى لوحة التحكم.</p>
        </header>

        <Card>
          <div className="flex flex-col gap-4">
            {status.status === "rejected" ? (
              <Banner kind="danger" title="الدخول مرفوض">
                {errorMessage(status.code)}
              </Banner>
            ) : null}

            <Button variant="primary" size="lg" fullWidth icon={GoogleLogo} loading={signingIn} onClick={onGoogleSignIn}>
              الدخول بحساب Google
            </Button>

            {signingIn ? (
              <p role="status" className="text-center text-label text-fg-muted">
                جارٍ التحقق من الحساب…
              </p>
            ) : null}
          </div>
        </Card>

        <p className="text-center text-caption text-fg-muted">لا يوجد تسجيل ذاتي. الحساب يضيفه قسم IT.</p>
      </div>
    </main>
  );
}

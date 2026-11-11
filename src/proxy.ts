import { NextResponse, type NextRequest } from "next/server";

// حماية نسخة المراجعة بكلمة مرور (Basic Auth). تعمل فقط حين يوجد REVIEW_PASSWORD (على Vercel)، ومحلياً بدونه تبقى مفتوحة.
// أي اسم مستخدم يُقبل: الكلمة وحدها هي السر. لا يُنقل للإنتاج.

export function proxy(request: NextRequest) {
  const password = process.env.REVIEW_PASSWORD;
  if (!password) return NextResponse.next();

  const [scheme, encoded] = (request.headers.get("authorization") ?? "").split(" ");
  if (scheme === "Basic" && encoded) {
    const decoded = atob(encoded);
    if (decoded.slice(decoded.indexOf(":") + 1) === password) return NextResponse.next();
  }

  return new NextResponse("يلزم إدخال كلمة المرور.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Bellaby review", charset="UTF-8"' },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|fonts/).*)"],
};

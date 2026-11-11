// وضع المراجعة: نسخة للزبون تعرض الشاشات فقط، كل شاشة داخل غلاف فيه شرحها ومبدّل حالاتها.
// تُفعَّل بمتغيّر البيئة REVIEW_MODE=1 (على Vercel)، ومحلياً للمعاينة بـ ?review=1.
// وضع الالتقاط ?capture=1 لا يعرض الغلاف أبداً. هذا الملف لا يُنقل للإنتاج.

type SearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** البيئة نفسها نسخة مراجعة: الأدوات الداخلية (المكوّنات والأساسيات والاختبار) تُحجب. */
export const isReviewEnv = () => process.env.REVIEW_MODE === "1";

/** هذا الطلب يُعرض بوضع المراجعة: البيئة، أو معاينة محلية بـ ?review=1. */
export const isReviewRequest = (params: SearchParams) => isReviewEnv() || first(params.review) === "1";

export const isCaptureRequest = (params: SearchParams) => first(params.capture) === "1";

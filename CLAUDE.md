@AGENTS.md

# CLAUDE.md — bellaby-web-design

## ما هذا المشروع

مشروع **رسم واجهات** لكل أجزاء الويب في نظام **Bellaby**: نظام إدارة التوزيع والمندوبين لشركة Trust (حليب أطفال).
الهدف: بناء الشاشات بكل حالاتها، عرضها في المتصفح، ثم التقاطها إلى Figma كطبقات قابلة للتعديل.

**الأجزاء التي تُرسم:**
1. **لوحة التحكم** لكل أدوار الويب: الوكيل، واللوجستي وعامل المستودع، والسوبرفايزر، والمراقبة، ومدير المبيعات، ومدير المكتب العلمي، والمدير التنفيذي، وIT، والمحاسبة، والقانوني. عربية فقط.
2. **موقع الشركة العام**: الصفحات الخمس في القرار 14.

هذا ليس مشروع الإنتاج. الإنتاج مشروع Next.js جديد يُنشأ بعد اعتماد التصميم، ويأخذ من هنا كما هي: `components/`، و`features/*/views/`، و`styles/globals.css`، و`config/navigation.ts`، ودليل التنفيذ `docs/handoff/`. لذلك يُكتب كل شيء هنا **بجودة الإنتاج**: views نقية، وأنواع العقد، ولا اختصارات.

**المُخرَج:** ملف Figma، وكود المكوّنات والـ views، ودليل التنفيذ.

تطبيق المندوب مشروع آخر (`bellaby-app-design`). الباك Laravel، والعقد في `openapi.yml`.

---

## المراحل

| المرحلة | ما يُبنى | الثيم |
|---|---|---|
| **1 · Wireframe** | الأساسيات، `components/`، الـ views بكل حالاتها، الالتقاط | رمادي |
| **2 · التصميم** | استبدال قيم الـ tokens بالهوية، تلميع المكوّنات، إعادة الالتقاط | الهوية |

**المرحلة الحالية: 1.**

---

## القاعدة الأولى

- اقرأ `docs/progress.md` أول كل جلسة، وحدّثه بعد كل شاشة.
- مع كل شاشة تخلص، اكتب دليل تنفيذها في `docs/handoff/web.json` تحت مفتاح المعرّف (الشكل في `docs/handoff/README.md`).
- **اقرأ `DESIGN.md` كاملاً قبل أي عمل، والتزم به حرفياً.** هو المرجع الوحيد للألوان والخط والمسافات والمكوّنات والـ responsive، وهو المرجع الأصلي للمشروعين.
- قبل أي التقاط إلى Figma: اقرأ `FIGMA.md` والتزم به.
- إن احتجت قراراً غير موجود في هذه الملفات، **توقّف واسأل**. لا تخترع لوناً ولا مكوّناً ولا نمطاً ولا حقلاً.

---

## المراجع وأولويتها

| الموضوع | المرجع |
|---|---|
| الداتا: النماذج، الحقول، قيم الحالات، رموز الأخطاء، مفاتيح الصلاحيات | **`openapi.yml`**، وهو الأعلى |
| التدفق: ترتيب الشاشات، ومن يرى ماذا، والسلوك الذي لا يظهر في العقد | `docs/flows/Bellaby-UserFlow-*.pdf` |
| القواعد وأسبابها | `docs/srs/Bellaby-SRS-v1.3.pdf` وملحق القرارات 1–15 |
| قائمة الشاشات وحالاتها | `SCREENS.md` ثم `docs/progress.md` |
| الشكل | `DESIGN.md` |

- الحقول وقيم الحالات بأسمائها في العقد حرفياً.
- إن احتاجت شاشة حقلاً أو حالة أو صلاحية غير موجودة في العقد، أو اختلف العقد عن ملف التدفق: **لا تخمّن**. اكتبه في «أسئلة مفتوحة» بـ `docs/progress.md` واسأل. هذه الأسئلة تُرسل للباك قبل أن يبرمج.

---

## التقنيات

| المجال | المكتبة | الإصدار | ملاحظات |
|---|---|---|---|
| الإطار | Next.js (App Router) + TypeScript strict | `next` 16.4.5 · `typescript` 5.9.3 | كل الصفحات صفحات رسم |
| Memoization | React Compiler (مفعّل) | `babel-plugin-react-compiler` 1.0.0 | لا `useMemo` ولا `useCallback` ولا `memo` يدوياً |
| التنسيق | Tailwind CSS v4 | `tailwindcss` 4.3.5 · `@tailwindcss/turbopack` 4.3.5 | الـ theme في `@theme` داخل `src/styles/globals.css`، ولا `tailwind.config` |
| السلوك المعقّد | Base UI (`@base-ui/react`) | 1.9.0 | داخل `components/ui` فقط، والشكل كله منّا |
| الأيقونات | `@phosphor-icons/react` | 2.1.10 | |
| دمج الـ classes | `clsx` + `tailwind-merge` | 2.1.1 · 3.7.0 | `cn()` في `lib/cn.ts`، وكل مكوّن يدمج به `className` |
| الأنواع من العقد | `openapi-typescript` | 7.13.0 (dev) | تُولَّد من `openapi.yml` |
| الرسوم البيانية | Recharts | 3.10.1 | داخل `components/data` فقط |
| الخط | IBM Plex Sans Arabic | — | مؤقت حتى يصل خط الهوية (انظر «الخط») |

- تُثبّت كل حزمة بإصدار دقيق (بلا `^` ولا `~`)، ويُسجَّل الإصدار في هذا الجدول. لا `npm update` ولا `npm audit fix --force`.
- **نفس الإصدارات ستُثبّت في مشروع الإنتاج**، فلا تُضاف حزمة لا يحتاجها الإنتاج.
- **ممنوع أي مكتبة مكوّنات جاهزة** (shadcn، MUI، Mantine، Ant…). كل المكوّنات منّا.

---

## الخط

- الخط مؤقت. ملفاته في `public/fonts/`، ويُعرَّف في `globals.css` بـ `@font-face` باسم العائلة الحقيقي `"IBM Plex Sans Arabic"` بالأوزان 400 و500 و600 و700.
- **لا `next/font`:** يولّد اسم عائلة مشفّراً (`__IBM_Plex_…`)، فيصل إلى Figma باسم لا يطابق أي خط.
- كل المكوّنات تستعمل token واحداً (`font-sans`). تبديل الخط لاحقاً = تبديل الملفات واسم العائلة في `globals.css` فقط.
- الأرقام لاتينية.

---

## الهوية (للمرحلة 2، لا تُستعمل الآن)

- الشعار: قلب فيه وجه طفل، وكلمة «Bellaby» وتحتها «Beautiful Start for Every Babe». ملفاته في `public/brand/`. **في المرحلة 1 الشعار كلمة «Bellaby» نصاً.**
- اللونان الأساسيان (مقدَّران من قيم CMYK للطباعة، بانتظار HEX الرسمي):
  - وردي ترابي `#CF8977`
  - تركوازي `#1DA6B2`
- كلاهما لا يحقق تباين 4.5:1 مع نص أبيض. في المرحلة 2 تُشتق منهما درجات أغمق للأزرار والنصوص (`DESIGN.md`).

---

## الثيم: مرحلة واحدة تُبدَّل بالقيم

- المكوّنات تستعمل **الأسماء الدلالية فقط**: `bg-surface`، `text-fg-muted`، `bg-primary`، `border-border`، `bg-danger-soft`.
- الدرجات الخام (`neutral-*` وغيرها) تُستعمل داخل `@theme` لتعريف الأسماء الدلالية، لا في المكوّنات.
- في المرحلة 1 قيم الأسماء الدلالية رمادية مع لون إبراز واحد (`DESIGN.md`). الانتقال للمرحلة 2 = تعديل القيم في `@theme`، دون لمس أي مكوّن أو شاشة. **أي لون مكتوب في مكوّن يكسر هذه القاعدة.**

---

## اللغة والاتجاه

- `<html lang="ar" dir="rtl">`. لا i18n. النصوص عربية فصحى مكتوبة في الكود مباشرة.
- الموقع العام عربي حالياً، واللغة الثانية سؤال مفتوح.
- **الخصائص المنطقية فقط:** `ms-* me-* ps-* pe-* start-* end-* text-start text-end`.
- **ممنوع:** `ml- mr- pl- pr- left- right- text-left text-right`.
- الأيقونات الاتجاهية (أسهم، chevron) تنقلب بـ `rtl:-scale-x-100`.
- الأرقام داخل النص العربي تُعزل اتجاهياً بـ `⁦…⁩`.
- **الأوقات:** تصل UTC، وتُعرض بتوقيت `Asia/Damascus` عبر `lib/format.ts` فقط.
- **المبالغ:** نص عشري بالدولار (`"125.50"`). عرض فقط، ولا حساب عليها بـ `parseFloat`.

---

## البنية

```
bellaby-web-design/
├── CLAUDE.md  DESIGN.md  FIGMA.md  SCREENS.md
├── openapi.yml                  ← نسخة من عقد الباك، تُستبدل كاملة عند كل تحديث
├── docs/
│   ├── progress.md              ← التتبّع والقرارات والأسئلة المفتوحة
│   ├── handoff/                 ← README.md، web.json: دليل تنفيذ كل شاشة لمشروع الإنتاج
│   ├── flows/                   ← ملفات تدفق المستخدم الثمانية (PDF)
│   ├── srs/                     ← SRS v1.3 وملحق القرارات
│   └── reference/               ← CaptureMode.tsx من مشروع وفاء، للمرجع فقط
├── public/fonts/  public/brand/
└── src/
    ├── app/                     ← صفحات الرسم فقط
    │   ├── layout.tsx           ← <html lang="ar" dir="rtl">، الخط، globals.css
    │   ├── page.tsx             ← فهرس بروابط لكل الشاشات والحالات
    │   ├── foundations/page.tsx ← الألوان، الخط، المسافات، الزوايا
    │   ├── components/page.tsx  ← كل مكوّن بكل حالاته
    │   ├── shared/g01-sign-in/page.tsx
    │   ├── warehouse/w03-dispatch/page.tsx
    │   └── …                    ← مجلد لكل مجموعة (جدول المعرّفات)
    ├── features/<feature>/      ← مجلد لكل موضوع في العقد: transfers، stock-counts، visits …
    │   ├── views/               ← TransferDetailView.tsx … (props فقط، تُنقل للإنتاج)
    │   └── components/          ← أجزاء خاصة بالموضوع: TransferLinesTable.tsx …
    ├── site/                    ← أقسام الموقع العام (تُنقل للإنتاج)
    ├── components/
    │   ├── ui/                  ← العامة: Button، Input، Field، Dialog، Select، Badge …
    │   ├── layout/              ← DashboardShell، Sidebar، Topbar، PageHeader، Stack، Grid
    │   └── data/                ← DataTable، Pagination، FilterBar، KpiTile، StatusBadge، Chart
    ├── mocks/                   ← بيانات وهمية بأنواع العقد (لا تُنقل)
    ├── lib/
    │   ├── api/schema.d.ts      ← مولّد، لا يُعدَّل يدوياً
    │   ├── api/types.ts         ← أسماء مختصرة: export type Transfer = components["schemas"]["Transfer"]
    │   ├── api/error-messages.ts← نص عربي لكل رمز خطأ في العقد
    │   ├── design/              ← ScreenStates، ScreenFrame، CaptureMode (لا تُنقل)
    │   ├── loadable.ts  cn.ts  format.ts
    ├── config/navigation.ts     ← عناصر القائمة الجانبية لكل دور، لكل عنصر صلاحيته
    └── styles/globals.css       ← @font-face و@theme
```

- **ما يُنقل للإنتاج:** `components/`، و`features/*/views` و`components`، و`site/`، و`lib/api/types.ts` و`error-messages.ts`، و`lib/loadable.ts` و`cn.ts` و`format.ts`، و`config/navigation.ts`، و`styles/globals.css`.
- **ما لا يُنقل:** `app/`، و`mocks/`، و`lib/design/`.
- **ولذلك:** لا شيء مما يُنقل يستورد مما لا يُنقل.
- `site/` لا يستورد من `features/`، و`features/` لا تستورد من `site/`. المشترك بينهما: `globals.css` والخط و`components/ui`.
- `features/` بأسماء مواضيع العقد لا بأسماء الأدوار. شاشة الصرف واحدة في `features/transfers` ولو رآها اللوجستي والمدير التنفيذي. الدور يظهر في مسار الرسم وفي `config/navigation.ts` فقط.

---

## الـ views (أهم قاعدة في المشروع)

**الـ view** (`features/*/views/*View.tsx`) مكوّن نقي:
- يأخذ كل شيء props: الداتا بأنواع العقد، وحالة التحميل والخطأ، وأعلام الصلاحية، والـ callbacks.
- لا يجلب داتا، ولا يقرأ الرابط، ولا يستورد من `mocks/`، ولا يعرف الدور.
- الصلاحية فيه **علم boolean** (`canApprove`)، لا دور ولا مفتاح صلاحية.

```tsx
// lib/loadable.ts
export type Loadable<T> =
  | { status: "loading" }
  | { status: "error"; code: string }
  | { status: "ready"; data: T };

// features/transfers/views/TransferDetailView.tsx
type TransferDetailViewProps = {
  transfer: Loadable<Transfer>;
  canCancel: boolean;
  canConfirm: boolean;
  onCancel?: (reason: string) => void;
  onConfirm?: () => void;
};
```

- **صفحة الرسم** (`app/<group>/<id>-<name>/page.tsx`) تعرض الـ view في كل حالة عبر `ScreenStates`، ببيانات من `mocks/`.
- **في مشروع الإنتاج** تُكتب حول كل view حاوية تأخذ الداتا من hooks، وتحوّلها إلى `Loadable`، وتحسب الأعلام من `me.permissions`. الـ view يُنقل كما هو.
- **النماذج:** الـ view يعرض الحقول وقيمها وأخطاءها من props. ربطها بمكتبة نماذج من شأن الإنتاج.

---

## الأنواع والبيانات الوهمية

- `npm run gen:api` يولّد `src/lib/api/schema.d.ts` من `openapi.yml`.
- كل ملف في `mocks/` مكتوب بأنواع العقد ومعه `satisfies`، فأي حقل ناقص أو باسم خاطئ يكسر `tsc`.
- الأسماء سورية واقعية، والمحافظات سورية، والأصناف أصناف حليب أطفال واقعية الشكل.
- **عند تحديث العقد:** استبدل `openapi.yml`، شغّل `gen:api` ثم `typecheck`، وأصلح الـ mocks والـ views، وسجّل ما تغيّر في `docs/progress.md`.

---

## الـ responsive: مرة واحدة، داخل المكوّنات

- الشاشة لا تعرف شيئاً عن المقاسات. **السلوك حسب المقاس داخل `components/ui` و`components/layout` و`components/data` فقط** (الجدول في `DESIGN.md`).
- **container queries لا media queries:** المكوّن يتجاوب مع عرض الإطار الذي يحتويه، لا مع عرض نافذة المتصفح. لذلك يُعرض إطار 390 بشكل الموبايل داخل نافذة عريضة، ويُلتقط دون تصغير المتصفح.
  - `DashboardShell` و`ScreenFrame` يحملان `@container`.
  - **العنصر الذي يحمل `@container` بلا padding ولا border:** الاستعلام يقيس عرض المحتوى داخله، فإطار 1440 بـ padding 24 يصير 1392. الـ padding على ابنه.
  - المقاسات معرّفة في `@theme`: `--container-tablet: 48rem` (768) و`--container-desktop: 80rem` (1280)، فتعمل `@tablet:` و`@desktop:`.
  - جُرّب هذان الـ variantان في Tailwind v4 ويعملان (9 تشرين الثاني 2026).
- **ممنوع** `sm: md: lg: xl:` في أي ملف.
- **ممنوع** `@tablet: @desktop:` في الـ views وصفحات الرسم. إن احتاجت شاشة ترتيباً مختلفاً، تستعمل props مكوّنات التخطيط: `<Grid cols={{ base: 1, tablet: 2, desktop: 3 }}>`.
- **الإطارات:** `desktop` بعرض 1440 × 900 لكل الشاشات، و`mobile` بعرض 390 × 844 لشاشات الأدوار الميدانية فقط (`SCREENS.md` يحدّدها). التابلت يُراجع في المتصفح ولا يُلتقط.

---

## الحالات

- **كل شاشة فيها داتا من الخادم لها:** التحميل (`Skeleton`)، والفراغ (`EmptyState`)، والخطأ مع «إعادة المحاولة» (`ErrorState`)، و«لا صلاحية» (`forbidden`).
- **ومعها حالاتها الخاصة من العقد والتدفق**، مثل:
  - `already_decided`: قرّر غيرك أولاً، مع من قرّر ومتى (القرار 12).
  - `self_decision_forbidden`: المفوَّض لا يقرر فيما يخصّه.
  - `month_closed`، `lines_locked`، `rating_locked`.
  - الدفعة الموقوفة.
  - القرار «بالتفويض عن المدير التنفيذي».
- **كل حالة إطار مستقل.** لا تتجاوز أي حالة مذكورة في `docs/progress.md`.
- **الأخطاء:**
  - شكلها في العقد `{ message, code }`.
  - النص المعروض من `lib/api/error-messages.ts` بمفتاح `code`.
  - خطأ التحقق `validation_failed` يحمل `errors: { field: ["نص عربي"] }`، فيُعرض نص الخادم تحت حقله كما هو.
- **القوائم:**
  - مرقّمة بأسلوب Laravel (`meta.current_page`، `last_page`، `total`).
  - مكوّن `Pagination` بأرقام الصفحات والعدد الكلي تحت كل جدول. لا «تحميل المزيد».

---

## صفحات الرسم والالتقاط

- **`ScreenStates`** (في `lib/design/`) يغلّف كل صفحة رسم:
  - `?state=<key>` يعرض الحالة وحدها بحجم الإطار، و`?state=all` يعرض كل الحالات تحت بعضها مع عناوينها للمراجعة.
  - بلا `state` تُعرض الحالة الأولى، وهي الافتراضية.
- **`&frame=mobile`** يعرض الحالة في إطار 390، والافتراضي `desktop`.
- **الجذر الذي يُلتقط** يحمل `id="screen"`.
- **عنوان الصفحة** = اسم الإطار في Figma: `W03 · الصرف · الافتراضي`.
- **وضع الالتقاط `?capture=1`:**
  - أداة الالتقاط إلى Figma تتجاهل RTL: ترتّب العناصر بترتيب الـ DOM من اليسار، وتقرأ `start` يساراً.
  - وضع الالتقاط يجعل ترتيب الـ DOM مطابقاً للترتيب البصري من اليمين. الوضع العادي لا يتغيّر.
  - الفكرة مطبّقة في `docs/reference/CaptureMode.tsx` (مشروع وفاء، React Native). انقل الفكرة لا الكود.
  - **قبل أي شاشة:** اختبر `TextField` و`DataTable` و`Sidebar` بالوضعين جنباً إلى جنب في المتصفح، وتوقّف حتى أوافق.
  - المكوّنات التي تُنقل للإنتاج تستورد من `lib/design/CaptureMode` عبر hooks صغيرة. في الإنتاج يُكتب ملف بالأسماء نفسها لا يفعل شيئاً. أبقِ هذه الواجهة صغيرة.

---

## الصلاحيات

- `GET /me` يُرجع `permissions` بصيغة `transfers.view`، و`active_delegation` إن وُجد تفويض.
- كل عنصر في `config/navigation.ts` يحمل صلاحيته.
- في صفحات الرسم: لكل دور قائمته الجانبية كما يراها، من `config/navigation.ts` بصلاحيات وهمية.
- **لا فحص للدور** (`role.key === …`) في أي مكان. في الـ view دائماً العلم.

---

## معرّفات الشاشات

| البادئة | المجموعة | ملف التدفق | مسار الرسم |
|---|---|---|---|
| `G` | المشترك: الدخول، الإطار، المهام، الإجازات، الطلبات بين الأقسام، التقارير الدورية والخطة، الإشعارات، الملف الشخصي | Reports + أجزاء من كل ملف | `/shared/` |
| `A` | الوكيل | Agent | `/agent/` |
| `W` | المستودع: اللوجستي وعامل المستودع | Warehouse | `/warehouse/` |
| `S` | الإشراف والمراقبة | Supervision | `/supervision/` |
| `M` | مدير المبيعات ومدير المكتب العلمي | Managers | `/managers/` |
| `E` | المدير التنفيذي | Executive | `/executive/` |
| `I` | IT والمحاسبة والقانوني | IT-Accounting-Legal | `/it-accounting-legal/` |
| `P` | موقع الشركة | القرار 14 | `/site/` |

(`R` محجوزة لتطبيق المندوب في المشروع الآخر.)

| وين | الصيغة | مثال |
|---|---|---|
| المعرّف | حرف + رقمان. **لا يتغيّر ولا يُعاد ترقيمه**، والشاشة الجديدة تأخذ الرقم التالي | `W03` |
| مفتاح الحالة | المعرّف + اسم الحالة بالإنجليزية kebab-case، فريد في المشروعين | `W03-already-decided` |
| صفحة الرسم | المسار + المعرّف صغيراً + اسم إنجليزي | `/warehouse/w03-dispatch` |
| رابط الحالة | الصفحة + `?state=` (+ `&frame=mobile`) | `/warehouse/w03-dispatch?state=suspended-batch` |
| إطار Figma | المعرّف · اسم الشاشة · اسم الحالة (· موبايل) | `W03 · الصرف · دفعة موقوفة` |

---

## طريقة العمل

1. **الإعداد:** Next.js، والـ tokens الرمادية، والخط، وRTL، و`cn()`، و`gen:api`، و`ScreenStates`.
2. **اختبار الالتقاط** (القسم أعلاه)، ثم توقّف.
3. **`components/ui`** بكل حالاتها في `/components`: افتراضي، hover، focus، معطّل، تحميل، خطأ. ثم توقّف للمراجعة.
4. **`components/layout` و`components/data`** بسلوكها في المقاسات الثلاثة. ثم توقّف.
5. **الشاشات مجموعةً مجموعة** بالترتيب في `SCREENS.md`. أنهِ المجموعة واعرضها قبل التالية.
6. **بعد كل مجموعة:** RTL سليم، والمقاسات الثلاثة، وبلا أخطاء console، و`typecheck` نظيف. ثم المراجعة في المتصفح، ثم الالتقاط.

- **المكوّنات قبل الشاشات:** لا تُبنى شاشة قبل أن تكون مكوّناتها في `/components` بكل حالاتها.
- **لا تُعِد كتابة مكوّن موجود.** إن احتاج تعديلاً، عدّله في مكانه وحدّث حالاته في المعرض.
- **مع كل شاشة تخلص:** سجّل حالاتها بمفاتيحها في `docs/progress.md`، واكتب مدخلها في `docs/handoff/web.json`: الطلبات من العقد، ومتى تظهر كل حالة، والتنقل، والحالات الحقيقية التي لم تُرسم.

---

## الأوامر

البيئة: Windows.

```bash
npm run dev          # التشغيل
npm run typecheck    # tsc --noEmit
npm run lint
npm run gen:api      # openapi.yml ← src/lib/api/schema.d.ts
```

---

## الممنوعات

- **في الداتا:**
  - أي مكتبة بيانات أو شبكة أو حالة: axios، TanStack Query، Zustand، Redux، react-hook-form، zod.
    - المقصود: ألا تُضاف إلى `package.json`، وألا تُستورد في `src/`.
    - التبعيات غير المباشرة لا تُحسب ولا تُزال: `zod` يأتي مع `eslint-config-next`، و`redux` مع Recharts.
    - للتحقق: `npm ls zod redux` يجب ألا يُظهرهما إلا تحت هاتين الحزمتين.
  - أي اتصال بخادم، وServer Actions.
  - حقل أو حالة أو صلاحية أو رمز خطأ غير موجود في العقد.
  - الحساب على المبالغ.
- **في الـ views:** جلب داتا، وقراءة الرابط، والاستيراد من `mocks/` أو `app/`، وفحص الدور أو مفتاح الصلاحية.
- **في الشكل:**
  - لون hex أو درجة خام في مكوّن (الأسماء الدلالية فقط).
  - القيم الاعتباطية (`bg-[#fff]`، `p-[13px]`).
  - `left/right` وأخواتها.
- **في الـ responsive:** `sm: md: lg: xl:` في أي ملف، و`@tablet: @desktop:` خارج `components/`.
- **في المكوّنات:** أي مكتبة مكوّنات جاهزة، واستيراد Base UI خارج `components/ui`.
- **في الكود:** `any`، وتعديل `schema.d.ts` يدوياً، و`memo` اليدوي.

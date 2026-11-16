export type CatalogScreen = {
  /** حرف + رقمان، مثل W03. ثابت لا يتغيّر. */
  id: string;
  name: string;
  /** تُرسم بإطار 390 أيضاً (SCREENS.md). */
  mobile: boolean;
  /** مفاتيح الحالات بلا بادئة المعرّف. الأولى هي الافتراضية. */
  states: readonly string[];
  /** الاسم الإنجليزي في مسار صفحة الرسم. غيابه = لم تُبنَ الشاشة بعد. */
  slug?: string;
  /** للزبون في نسخة المراجعة: جملة أو جملتان عن الشاشة، ما هي وماذا يفعل فيها. تُكتب حين تُبنى الشاشة. */
  summary?: string;
  /** للزبون: من يستعمل الشاشة، بصيغة قصيرة («الوكيل»، «اللوجستي والمدير التنفيذي»). */
  audience?: string;
};

export type CatalogSection = {
  number: string;
  title: string;
  screens: readonly CatalogScreen[];
};

export type CatalogGroup = {
  prefix: string;
  key: string;
  title: string;
  /** مسار الرسم، مثل /warehouse. */
  path: string;
  sections: readonly CatalogSection[];
};

// فهرس شاشات الويب (133 شاشة). المصدر: SCREENS.md وdocs/progress.md.
// المعرّف لا يتغيّر ولا يُعاد ترقيمه. الشاشة الجديدة تأخذ الرقم التالي.
// `slug`: الاسم الإنجليزي في مسار صفحة الرسم. يُضاف حين تُبنى الشاشة فيُفعَّل رابطها في الفهرس.
export const screenCatalog: readonly CatalogGroup[] = [
  {
    prefix: "G",
    key: "shared",
    title: "المشترك في الويب",
    path: "/shared",
    sections: [
      {
        number: "01",
        title: "الدخول والإطار",
        screens: [
          {
            id: "G01",
            name: "تسجيل الدخول",
            mobile: true,
            states: ["default", "signing-in", "not-allowed", "account-disabled", "blocked"],
            slug: "sign-in",
            summary:
              "نقطة دخول الجميع إلى لوحة التحكم. يدخل الموظف بحساب Google الخاص بالشركة فقط، ولا يوجد تسجيل ذاتي: الحساب يضيفه قسم IT مسبقاً. إن لم يكن البريد مسجّلاً أو كان معطّلاً أو محظوراً تظهر رسالة تشرح السبب.",
            audience: "كل مستخدمي لوحة الويب",
          },
          {
            id: "G02",
            name: "إطار اللوحة",
            mobile: true,
            states: ["default", "executive", "delegate-active", "delegation-given", "tablet", "mobile-drawer"],
            slug: "dashboard-frame",
            summary:
              "الإطار الذي تظهر فيه كل شاشات اللوحة: قائمة جانبية بعناصر دور المستخدم، وشريط علوي فيه الإشعارات و«بانتظار قراري» وحسابه. تصغر القائمة على التابلت إلى أيقونات، وتصير درجاً على الموبايل. وحين يكون المستخدم مفوَّضاً أو فوّض غيره يظهر شريط يوضح ذلك.",
            audience: "كل مستخدمي لوحة الويب (القائمة تختلف بحسب الدور)",
          },
          { id: "G03", name: "الإشعارات", mobile: false, states: ["default", "empty"] },
          { id: "G04", name: "بانتظار قراري", mobile: false, states: ["default", "sales-manager", "delegate", "empty"] },
          { id: "G05", name: "ملفي الشخصي", mobile: false, states: ["default", "provisional"] },
        ],
      },
      {
        number: "02",
        title: "المهام",
        screens: [
          { id: "G06", name: "المهام", mobile: false, states: ["assigned-to-me", "assigned-by-me", "overdue-filter"] },
          { id: "G07", name: "تفاصيل المهمة", mobile: false, states: ["assignee-new", "assignee-in-progress", "assignee-submitted", "assignee-rejected", "assigner-submitted", "assigner-approved", "reassign", "overdue-resolve", "resolved"] },
          { id: "G08", name: "إسناد مهمة", mobile: false, states: ["empty", "filled", "validation", "no-assignees"] },
        ],
      },
      {
        number: "03",
        title: "الطلبات بين الأقسام",
        screens: [
          { id: "G09", name: "الطلبات بين الأقسام", mobile: false, states: ["incoming", "outgoing"] },
          { id: "G10", name: "تفاصيل الطلب", mobile: false, states: ["incoming-open", "incoming-in-progress", "outgoing", "done", "rejected", "overdue"] },
        ],
      },
      {
        number: "04",
        title: "التقرير الدوري والخطة",
        screens: [
          { id: "G11", name: "التقارير الدورية", mobile: false, states: ["head", "monitoring", "executive", "new-optional"] },
          { id: "G12", name: "التقرير: المسودة والتحرير", mobile: false, states: ["draft", "validation", "submitted", "returned", "overdue", "targets-sales", "targets-scientific"] },
          { id: "G13", name: "مراجعة المراقبة", mobile: false, states: ["default", "reviewed"] },
          { id: "G14", name: "قرار المدير التنفيذي على التقرير", mobile: false, states: ["default", "follow-up-action", "returned", "approved"] },
          { id: "G15", name: "نسخ التقرير", mobile: false, states: ["default"] },
          { id: "G16", name: "الخطة الشهرية", mobile: false, states: ["approved", "revision-pending", "revision-form", "revision-decision", "no-plan"] },
        ],
      },
      {
        number: "05",
        title: "الإجازات",
        screens: [
          { id: "G17", name: "إجازاتي", mobile: false, states: ["default", "request-form", "past-days", "cancel-confirm"] },
          { id: "G18", name: "طلبات الإجازة للموافقة", mobile: false, states: ["approver", "accountant", "past-days-approved"] },
        ],
      },
    ],
  },
  {
    prefix: "A",
    key: "agent",
    title: "الوكيل",
    path: "/agent",
    sections: [
      {
        number: "01",
        title: "اللوحة والاستلام",
        screens: [
          { id: "A01", name: "لوحة الوكيل", mobile: false, states: ["default", "pending-receipt", "overdue-payments"] },
          { id: "A02", name: "الاستلامات", mobile: false, states: ["default"] },
          { id: "A03", name: "تفاصيل الصرف", mobile: false, states: ["in-transit", "confirm", "received", "cancelled"] },
          { id: "A04", name: "رصيدي", mobile: false, states: ["default", "suspended-batch", "near-expiry"] },
        ],
      },
      {
        number: "02",
        title: "العملاء",
        screens: [
          { id: "A05", name: "عملائي", mobile: false, states: ["default", "search"] },
          { id: "A06", name: "عميل جديد", mobile: false, states: ["empty", "link-suggestion", "linked", "validation"] },
          { id: "A07", name: "صفحة العميل", mobile: false, states: ["default", "linked-point"] },
        ],
      },
      {
        number: "03",
        title: "التسليم والتحصيل",
        screens: [
          { id: "A08", name: "تسجيل تسليم", mobile: false, states: ["empty", "filled", "over-balance", "payment-date-limit", "review", "saved"] },
          { id: "A09", name: "التسليمات", mobile: false, states: ["default", "filter-unpaid"] },
          { id: "A10", name: "تفاصيل التسليم", mobile: false, states: ["unpaid", "collect-confirm", "paid", "overdue", "request-form", "approval-pending", "cancelled", "written-off", "request-rejected", "referred"] },
          { id: "A11", name: "المستحقات", mobile: false, states: ["default", "due-soon", "overdue"] },
        ],
      },
      {
        number: "04",
        title: "المرتجع والتالف والإرجاع",
        screens: [
          { id: "A12", name: "مرتجع من صيدلية", mobile: false, states: ["empty", "over-returnable", "submitted"] },
          { id: "A13", name: "المرتجعات والتالف", mobile: false, states: ["returns", "damage"] },
          { id: "A14", name: "تقرير تالف", mobile: false, states: ["empty", "submitted"] },
          { id: "A15", name: "طلب إرجاع للمستودع", mobile: false, states: ["empty", "recall-reason", "submitted"] },
          { id: "A16", name: "طلبات الإرجاع للمستودع", mobile: false, states: ["default"] },
        ],
      },
    ],
  },
  {
    prefix: "W",
    key: "warehouse",
    title: "المستودع",
    path: "/warehouse",
    sections: [
      {
        number: "01",
        title: "اللوحة والأرصدة",
        screens: [
          {
            id: "W01",
            name: "لوحة المستودع",
            mobile: false,
            states: ["default", "alerts", "worker", "loading", "empty", "error", "forbidden"],
            slug: "dashboard",
            summary:
              "نظرة سريعة على ما يحتاج انتباهاً في المستودع: أصناف نزل رصيدها تحت الحد الأدنى، ودفعات قريبة الانتهاء، وصرف لم يُؤكَّد استلامه، وإرجاعات الوكلاء بانتظار الاستلام، والجرد الجاري. وتحتها قوائم التنبيهات نفسها. وعامل المستودع يرى مهامه والجرد المسند إليه.",
            audience: "اللوجستي وعامل المستودع",
          },
          {
            id: "W02",
            name: "الأرصدة",
            mobile: false,
            states: ["default", "all-locations", "at-time", "worker", "loading", "empty", "error", "forbidden"],
            slug: "balances",
            summary:
              "أرصدة المخزون: الصنف والدفعة والموقع والكمية، وما خرج بالطريق ولم يُؤكَّد استلامه. تصفّيها بالموقع أو الصنف أو النوع، وتعرض الرصيد كما كان في يوم سابق. وعامل المستودع يراها للقراءة فقط.",
            audience: "اللوجستي وعامل المستودع",
          },
          {
            id: "W03",
            name: "حركات المخزون",
            mobile: false,
            states: ["default", "from-balance", "loading", "empty", "error", "forbidden"],
            slug: "movements",
            summary:
              "سجل كل ما غيّر المخزون من الأحدث إلى الأقدم: إدخال وصرف وتسليم وإرجاع وتسوية جرد وتالف وعكس، مع الكمية والموقع والمنفّذ والمرجع. تصفّيه بالموقع أو الصنف أو الدفعة أو النوع أو الفترة، وهو للقراءة فقط.",
            audience: "اللوجستي",
          },
        ],
      },
      {
        number: "02",
        title: "الإدخال",
        screens: [
          {
            id: "W04",
            name: "إدخال بضاعة",
            mobile: false,
            states: ["empty", "filled", "expired", "near-expiry", "batch-exists", "batch-mismatch", "validation-failed", "saved", "loading", "error", "forbidden"],
            slug: "intake",
            summary:
              "إدخال بضاعة وصلت إلى المستودع: الموقع، ثم أسطر (صنف، رقم الدفعة، تاريخ الانتهاء، الكمية). تظهر القواعد قبل الإرسال: المنتهي لا يُدخل، والقريب الانتهاء يحتاج تأكيداً، والدفعة الموجودة بالتاريخ نفسه تُضاف كميتها، وبتاريخ مختلف تعارض. بعد الإدخال ملخص بما أُنشئ.",
            audience: "اللوجستي",
          },
          {
            id: "W05",
            name: "سجل الإدخال",
            mobile: false,
            states: ["default", "details", "reverse", "loading", "empty", "error", "forbidden"],
            slug: "intake-log",
            summary:
              "سجل كل بضاعة أُدخلت إلى المستودع من الأحدث إلى الأقدم: الوقت والمرجع والموقع والأصناف ومجموع الكمية والمنفّذ. تصفّيه بالموقع أو الصنف أو الدفعة أو الفترة، وتنقر إدخالاً لترى أسطره ودفعاته وهل أُنشئت الدفعة أم أُضيفت لدفعة موجودة، ومنه تعكس إدخالاً خاطئاً بسبب. ومنه إلى «إدخال بضاعة».",
            audience: "اللوجستي",
          },
        ],
      },
      {
        number: "03",
        title: "الصرف وطلبات العينات",
        screens: [
          {
            id: "W06",
            name: "صرف جديد",
            mobile: false,
            states: ["empty", "agent", "rep", "type-mismatch", "suspended-batch", "insufficient", "from-sample-request", "saved", "loading", "error", "forbidden"],
            slug: "new-dispatch",
            summary:
              "اصرف بضاعة من المستودع إلى وكيل (منتجات) أو مندوب (عينات ومواد). تُقترح الدفعة الأقرب انتهاءً لكل صنف مع متاحها، وتُعلَّم الأصناف التي لا تناسب المستلم والدفعة الموقوفة والكمية الأكبر من المتاح. بعد الاعتماد يبقى الصرف «بالطريق» حتى يؤكد المستلم. ويمكن تعبئته من طلب عينات.",
            audience: "اللوجستي",
          },
          {
            id: "W07",
            name: "الصرف",
            mobile: false,
            states: ["default", "unconfirmed", "loading", "empty", "error", "forbidden"],
            slug: "dispatch",
            summary:
              "كل الصرفيات من المستودع إلى الوكلاء والمندوبين: الرقم والمستلم والتاريخ والكمية والحالة وساعات بالطريق. ما بقي «بالطريق» أكثر من 48 ساعة معلَّم، ويمكن عرضه وحده. بحث برقم الصرف أو المستلم، وفلاتر الحالة والمستلم والفترة. ومنها إلى «صرف جديد».",
            audience: "اللوجستي",
          },
          {
            id: "W08",
            name: "تفاصيل الصرف",
            mobile: false,
            states: ["in-transit", "cancel", "received", "cancelled", "receipt-rejected", "overdue-48h", "not-found", "loading", "error", "forbidden"],
            slug: "transfer-details",
            summary:
              "تفاصيل صرفية واحدة: المرجع وحالتها، والمستلم ومن صرف، والأسطر بدفعاتها، وطلب العينات المرتبط، والسجل. ما دامت بالطريق يلغيها اللوجستي بسبب (تعود الكمية للمستودع)، ويُعلَّم ما مضى عليه 48 ساعة دون تأكيد.",
            audience: "اللوجستي",
          },
          {
            id: "W09",
            name: "طلبات العينات",
            mobile: false,
            states: ["default", "loading", "empty", "error", "forbidden"],
            slug: "sample-requests",
            summary:
              "طلبات العينات والمواد الدعائية التي يرفعها مدير المكتب العلمي للمندوبين: المندوب والطالب والأصناف والسبب والتاريخ والحالة (جديد، مصروف، مرفوض، ملغى). تصفّيها بالحالة أو المندوب أو الفترة، وتفتح الطلب لتصرفه أو ترفضه.",
            audience: "اللوجستي",
          },
          {
            id: "W10",
            name: "تفاصيل طلب العينات",
            mobile: false,
            states: ["new", "reject", "dispatched", "rejected", "cancelled", "not-found", "loading", "error", "forbidden"],
            slug: "sample-request-details",
            summary:
              "تفاصيل طلب عينات واحد: المندوب والطالب والسبب، والمطلوب والمصروف لكل صنف، والسجل. للجديد يصرفه اللوجستي (يفتح صرفاً معبّأً من الطلب) أو يرفضه بسبب. الإلغاء للطالب وحده.",
            audience: "اللوجستي",
          },
        ],
      },
      {
        number: "04",
        title: "ما يعود للمستودع",
        screens: [
          {
            id: "W11",
            name: "طلبات السحب",
            mobile: false,
            states: ["default", "new-form", "new-form-filled", "new-form-validation", "loading", "empty", "error", "forbidden"],
            slug: "withdraw-requests",
            summary:
              "طلبات استلام العينات والمواد من أرصدة المندوبين: المندوب والأصناف والسبب والتاريخ والحالة (مطلوب، مسلَّم، ملغى). تصفّيها بالحالة أو المندوب، وتطلب سحباً جديداً من نافذة تأخذ الأصناف من رصيد المندوب.",
            audience: "اللوجستي",
          },
          {
            id: "W12",
            name: "تفاصيل طلب السحب",
            mobile: false,
            states: ["requested", "cancel", "handed-over", "cancelled", "rep-deactivated", "on-behalf", "handed-over-on-behalf", "not-found", "loading", "error", "forbidden"],
            slug: "withdraw-request-details",
            summary:
              "تفاصيل طلب سحب واحد: المطلوب والفعلي لكل صنف ودفعة، والسبب، والسجل. للمطلوب يلغيه اللوجستي بسبب قبل التسليم، وإن كان المندوب معطَّلاً يؤكد الاستلام عنه بالكمية الفعلية (والفرق فرق مخزون).",
            audience: "اللوجستي",
          },
          {
            id: "W13",
            name: "إرجاعات الوكلاء",
            mobile: false,
            states: ["in-transit", "details", "confirm", "received", "loading", "empty", "error", "forbidden"],
            slug: "agent-returns",
            summary:
              "الإرجاعات التي اعتمدها مدير المبيعات وتصل المستودع من الوكلاء: الوكيل والأصناف والسبب والوجهة. تفتح التفاصيل في درج وتؤكد الاستلام كاملاً (بلا جزئي) فتصير «مستلم».",
            audience: "اللوجستي",
          },
        ],
      },
      {
        number: "05",
        title: "الجرد",
        screens: [
          {
            id: "W14",
            name: "الجرد",
            mobile: false,
            states: ["default", "new-form", "new-form-filled", "new-form-validation", "worker", "loading", "empty", "error", "forbidden"],
            slug: "stock-counts",
            summary:
              "جرود مواقع المستودع: الموقع والمكلَّف والتاريخ وعدد الأسطر التي فيها فرق والحالة (قيد العدّ، مرسل، معتمد، ملغى). تصفّيها بالحالة أو الموقع أو المكلَّف، وتبدأ جرداً جديداً وتسنده لعامل. عامل المستودع يرى المسنَد إليه فقط.",
            audience: "اللوجستي وعامل المستودع",
          },
          {
            id: "W15",
            name: "العدّ",
            mobile: false,
            states: ["in-progress", "line-saved", "with-diff", "submit", "submitted", "returned", "cancel", "cancelled", "worker", "not-found", "loading", "error", "forbidden"],
            slug: "stock-count",
            summary:
              "عدّ جرد موقع سطراً بسطر: الصنف والدفعة والكمية الفعلية، فيُحفظ السطر فور إدخاله بمتوقعه (رصيد النظام لحظة العدّ) وفرقه. ثم الإرسال للاعتماد فتُقفل الأسطر. الجرد المُرجَع يبقي أسطره القديمة في السجل. الإلغاء قبل الإرسال بسبب.",
            audience: "اللوجستي وعامل المستودع",
          },
          {
            id: "W16",
            name: "اعتماد الجرد",
            mobile: false,
            states: ["awaiting-me", "return-dialog", "returned", "approved", "approved-delegated", "self-decision-forbidden", "approve-failed", "not-found", "loading", "error", "forbidden"],
            slug: "stock-count-approval",
            summary:
              "شاشة العدّ للمدير التنفيذي: الأسطر والفروق، ولوحة القرار: «اعتماد» (تتولّد التسويات وتُحال الفروق للمراقبة) أو «إرجاع لإعادة العدّ» بسبب. يشمله التفويض، لا لجرد المفوَّض نفسه.",
            audience: "المدير التنفيذي",
          },
        ],
      },
      {
        number: "06",
        title: "الدفعات",
        screens: [
          {
            id: "W17",
            name: "الدفعات",
            mobile: false,
            states: ["default", "suspended-filter", "loading", "empty", "error", "forbidden"],
            slug: "batches",
            summary: "جدول الدفعات: الصنف ورقم الدفعة وتاريخ الانتهاء (مع تنبيه المنتهية والقريبة منه) والكمية الكلية وما بقي في المستودع والحالة، بفلاتر الصنف والحالة و«المتوفرة فقط» وترقيم. الصف يفتح التفاصيل.",
            audience: "اللوجستي والمدير التنفيذي",
          },
          {
            id: "W18",
            name: "تفاصيل الدفعة",
            mobile: false,
            states: ["active", "suspend", "suspended", "unsuspend", "suspended-logistics", "suspend-failed", "not-found", "loading", "error", "forbidden"],
            slug: "batch",
            summary:
              "بيانات الدفعة ورصيدها في كل موقع وسجل الإيقاف والفك. الإيقاف بسبب للوجستي والمدير التنفيذي (لا ينقص رصيداً، وتتوقف حركتها في كل المواقع)، وفكّه بسبب للمدير التنفيذي وحده، وعند اللوجستي يظهر معطّلاً بسببه.",
            audience: "اللوجستي والمدير التنفيذي",
          },
          {
            id: "W19",
            name: "تقرير تتبع السحب",
            mobile: false,
            states: ["default", "distributed-after", "exporting", "not-found", "loading", "error", "forbidden"],
            slug: "recall-trace",
            summary:
              "أين الدفعة الآن وإلى أين وصلت: الباقي في كل موقع، وما وصل لكل عميل عبر وكيله بتاريخه، وما وُزّع في الزيارات (مع تعليم ما وُزّع بعد الإيقاف من جهاز دون اتصال). تصدير PDF أو Excel.",
            audience: "اللوجستي والمدير التنفيذي",
          },
        ],
      },
      {
        number: "07",
        title: "تالف المستودع",
        screens: [
          {
            id: "W20",
            name: "تقرير تالف المستودع",
            mobile: false,
            states: ["empty", "filled", "uploading", "suspended-batch", "insufficient", "validation-failed", "submitted", "loading", "error", "forbidden"],
            slug: "damage-report",
            summary: "رفع تقرير تالف من موقع مستودع: السبب من قائمة الأسباب، وأسطر بدفعاتها (الموقوفة مسموحة ومعلَّمة)، وملاحظة، وصور مرفقة. بعد الرفع يبقى «بانتظار القرار» حتى يقرّره مدير المبيعات.",
            audience: "اللوجستي",
          },
          {
            id: "W21",
            name: "تقارير تالف المستودع",
            mobile: false,
            states: ["default", "pending-filter", "loading", "empty", "error", "forbidden"],
            slug: "damage-reports",
            summary: "جدول تقارير التالف: التاريخ والأصناف والسبب والموقع والحالة (معلّق، تالف مقبول، مرفوض) والمسؤولية، بفلاتر الحالة والموقع وترقيم. «تقرير تالف» يفتح W20، والصف يفتح M08 للقراءة.",
            audience: "اللوجستي",
          },
        ],
      },
    ],
  },
  {
    prefix: "S",
    key: "supervision",
    title: "الإشراف والمراقبة",
    path: "/supervision",
    sections: [
      {
        number: "01",
        title: "السوبرفايزر",
        screens: [
          {
            id: "S01",
            name: "لوحة السوبرفايزر",
            mobile: false,
            states: ["default", "attendance-alerts", "loading", "error", "forbidden"],
            slug: "dashboard",
            summary: "خمس خلايا لمندوبي محافظاته: الزيارات مقابل الخطة، والدوام، والتقارير بانتظار تقييمه (وأقربها موعداً)، وطلبات الإجازة، وتنبيهات الدوام. وتحتها جدول تنبيهات الدوام (ناقص أو غياب). النطاق يُفحص على الخادم.",
            audience: "السوبرفايزر",
          },
          {
            id: "S02",
            name: "التقارير اليومية",
            mobile: false,
            states: ["supervisor", "read-only", "loading", "empty", "error", "forbidden"],
            slug: "daily-reports",
            summary: "جدول التقارير اليومية: المندوب ويوم العمل والاستلام والتقييم. للسوبرفايزر بانتظار تقييمه أولاً مع الوقت المتبقي من مهلة 24 ساعة عمل (أو «متأخر»)، ولمدير المكتب العلمي كل المندوبين للقراءة بلا تقييم. فلاتر المندوب والفترة والحالة.",
            audience: "السوبرفايزر ومدير المكتب العلمي",
          },
          {
            id: "S03",
            name: "تقييم التقرير اليومي",
            mobile: false,
            states: ["default", "confirm", "rated", "late-rating", "rating-locked", "not-found", "loading", "error", "forbidden"],
            slug: "daily-report",
            summary: "التقرير (البيانات، وزيارات اليوم، والملخص) ثم التقييم بالسلّم الموحّد (ممتاز 100 … ضعيف 20) وملاحظة. الحفظ يُقفل التقييم بعد تأكيد، وبعده للقراءة مع «إضافة ملاحظة». تجاوز المهلة «متأخر».",
            audience: "السوبرفايزر",
          },
          {
            id: "S04",
            name: "الدوام",
            mobile: false,
            states: ["default", "short-day", "absent", "auto-closed", "loading", "empty", "error", "forbidden"],
            slug: "attendance",
            summary: "جلسات دوام المندوبين: البدء والانتهاء والمدة و«يوم كامل؟» والعلامات (إغلاق آلي، عطلة، دوام ناقص، غياب)، بفلاتر المندوب والفترة والعرض. للاطلاع: الخصم قرار يدوي للمدير التنفيذي.",
            audience: "السوبرفايزر",
          },
          {
            id: "S05",
            name: "الزيارات",
            mobile: false,
            states: ["list", "map", "flagged-filter", "loading", "empty", "error", "forbidden"],
            slug: "visits",
            summary: "زيارات المندوبين قائمةً وخريطة (نقطتا البدء والإنهاء بلا مسار): الجهة والوقت والمدة والمسافة وحالة التحقق وعلاماتها، بفلاتر المندوب والفترة وحالة التحقق. الخريطة مستطيل وهمي بنقاط.",
            audience: "السوبرفايزر والمراقبة",
          },
          {
            id: "S06",
            name: "تفاصيل الزيارة",
            mobile: false,
            states: ["read-only", "qa-flagged", "confirm", "reject", "confirmed", "rejected", "photo-pending", "already-decided", "not-found", "loading", "error", "forbidden"],
            slug: "visit",
            summary: "حقول الزيارة وما وُزِّع وصورتها وحالة رفعها وموقعا البدء والإنهاء بالمسافة ونطاق التحقق وعلاماتها. للمراقبة قرار على المشكوك فيها: تأكيد الزيارة أو رفضها بسبب (القرار 4).",
            audience: "السوبرفايزر والمراقبة",
          },
          {
            id: "S07",
            name: "صفحة المندوب",
            mobile: false,
            states: ["default", "negative-balance", "partial-error", "not-found", "loading", "error", "forbidden"],
            slug: "rep",
            summary: "بيانات المندوب ودوام اليوم وزياراته ورصيده من العينات والمواد وما وزّعه وتقاريره ونقاطه الشهرية. لكل قسم حالته، والرصيد السالب بشريط.",
            audience: "السوبرفايزر",
          },
        ],
      },
      {
        number: "02",
        title: "المراقبة",
        screens: [
          {
            id: "S08",
            name: "العلامات",
            mobile: false,
            states: ["default", "by-type", "near-deadline", "closed", "loading", "empty", "error", "forbidden"],
            slug: "flags",
            summary: "قائمة واحدة لكل أنواع العلامات مجمّعة حسب الشخص: النوع والسجل المرتبط والعمر والوقت المتبقي من مهلة 72 ساعة عمل، بفلاتر النوع والحالة والشخص. الصف يفتح درج المعالجة.",
            audience: "المراقبة",
          },
          {
            id: "S09",
            name: "معالجة العلامة",
            mobile: false,
            states: ["open", "stock-discrepancy", "clock-skew", "attendance", "auto-cleared", "escalated", "visit-flag", "already-decided", "linked-error", "loading", "error", "forbidden"],
            slug: "flag",
            summary: "درج بنوع العلامة وتفاصيلها والسجل المرتبط وصاحبه، ونهايات المعالجة الثلاث: لا مشكلة · مشكلة مسجّلة · تحويل لتحقيق، وملاحظة. المراقبة لا تملك عقوبة (القرار 4).",
            audience: "المراقبة",
          },
          {
            id: "S10",
            name: "الجهات الجديدة",
            mobile: false,
            states: ["default", "reject", "bulk-reject", "already-decided", "loading", "empty", "error", "forbidden"],
            slug: "new-places",
            summary: "الجهات التي أضافها المندوبون وتنتظر المراجعة: لكل جهة «مقبولة» أو «مرفوضة» (تُعطَّل وتعود زياراتها مشكوكاً فيها)، ورفض جماعي لزيارات الجهات المحدّدة.",
            audience: "المراقبة",
          },
          {
            id: "S11",
            name: "دمج جهتين",
            mobile: false,
            states: ["default", "confirm", "not-duplicate", "merge-failed", "not-found", "loading", "error", "forbidden"],
            slug: "merge-places",
            summary: "الجهتان المكررتان جنباً إلى جنب (الاسم والموقع والزيارات والعميل المربوط)، واختيار الباقية، و«دمج» (تنتقل الزيارات وربط العميل وتُعطَّل الأخرى) أو «ليستا مكررتين».",
            audience: "المراقبة",
          },
          {
            id: "S12",
            name: "شكاوى الموقع",
            mobile: false,
            states: ["default", "details", "loading", "empty", "error", "forbidden"],
            slug: "complaints",
            summary: "رسائل موقع الشركة من نوع «شكوى»، للاطلاع: الاسم والهاتف والنص والتاريخ والحالة، والصف يفتح الشكوى كاملة. المعالجة لمدير المبيعات.",
            audience: "المراقبة",
          },
        ],
      },
      {
        number: "03",
        title: "التحقيق",
        screens: [
          {
            id: "S13",
            name: "ملفات التحقيق",
            mobile: false,
            states: ["default", "executive", "awaiting", "loading", "empty", "error", "forbidden"],
            slug: "investigations",
            summary: "ملفات التحقيق السرية بعنوانها وموظفها ومرحلتها وتاريخها، بفلتر الحالة. المراقبة تفتح ملفاً، والمدير التنفيذي يقرأ. كل اطلاع يُسجَّل.",
            audience: "المراقبة والمدير التنفيذي",
          },
          {
            id: "S14",
            name: "فتح ملف تحقيق",
            mobile: false,
            states: ["direct", "from-flag", "validation", "submitting", "forbidden"],
            slug: "new-investigation",
            summary: "فتح ملف على موظف: الموظف والعنوان والوصف، مباشرةً أو من علامة (فيُقفل الموظف على صاحبها وتظهر العلامة المصدر). الملف يبدأ في المرحلة الأولى.",
            audience: "المراقبة",
          },
          {
            id: "S15",
            name: "ملف التحقيق",
            mobile: false,
            states: [
              "stage-1",
              "stage-4",
              "stage-7",
              "awaiting-decision",
              "executive-decision",
              "decision-confirm",
              "decided",
              "closed-no-violation",
              "close-dialog",
              "submit-confirm",
              "invalid-status",
              "delegate-forbidden",
              "not-found",
              "loading",
              "error",
              "forbidden",
            ],
            slug: "investigation",
            summary: "ملف سري بثماني مراحل لا قفز بينها: إكمال المرحلة بملخص ومستندات، وإغلاق «لا مخالفة» بسبب، والرفع للقرار بتصنيف وإجراء مقترح، ثم قرار المدير التنفيذي بنص وخصم اختياري (لا تفويض).",
            audience: "المراقبة والمدير التنفيذي",
          },
        ],
      },
    ],
  },
  {
    prefix: "M",
    key: "managers",
    title: "المديرون",
    path: "/managers",
    sections: [
      {
        number: "01",
        title: "مدير المبيعات",
        screens: [
          { id: "M01", name: "لوحة مدير المبيعات", mobile: false, states: ["default", "provisional"] },
          { id: "M02", name: "الوكلاء", mobile: false, states: ["default"] },
          { id: "M03", name: "صفحة الوكيل", mobile: false, states: ["default", "deactivated"] },
          { id: "M04", name: "العملاء", mobile: false, states: ["default"] },
          { id: "M05", name: "صفحة العميل", mobile: false, states: ["default"] },
          { id: "M06", name: "التسليمات", mobile: false, states: ["read-only", "approval-pending-view"] },
          { id: "M07", name: "المستحقات", mobile: false, states: ["default", "refer", "referred"] },
          { id: "M08", name: "قرارات المرتجع والتالف", mobile: false, states: ["customer-return", "agent-damage", "warehouse-damage", "agent-return", "already-decided"] },
          { id: "M09", name: "زيارة جديدة", mobile: true, states: ["default", "locating", "location-denied", "saved"] },
          { id: "M10", name: "زياراتي", mobile: true, states: ["default"] },
          { id: "M11", name: "رسائل الموقع", mobile: false, states: ["default", "handle", "handled"] },
        ],
      },
      {
        number: "02",
        title: "مدير المكتب العلمي",
        screens: [
          { id: "M12", name: "لوحة المكتب العلمي", mobile: false, states: ["default"] },
          { id: "M13", name: "المندوبون", mobile: false, states: ["default"] },
          { id: "M14", name: "جهات الزيارة", mobile: false, states: ["list", "map", "disabled-filter"] },
          { id: "M15", name: "صفحة الجهة", mobile: false, states: ["default", "disabled"] },
          { id: "M16", name: "تقرير معلومات السوق", mobile: false, states: ["competitor-price", "requested-product"] },
          { id: "M17", name: "أرصدة عينات المندوبين", mobile: false, states: ["default", "low"] },
          { id: "M18", name: "طلبات العينات", mobile: false, states: ["default", "new-form", "cancel"] },
        ],
      },
    ],
  },
  {
    prefix: "E",
    key: "executive",
    title: "المدير التنفيذي",
    path: "/executive",
    sections: [
      {
        number: "01",
        title: "اللوحة والمتابعة",
        screens: [
          { id: "E01", name: "لوحة المدير التنفيذي", mobile: false, states: ["default", "provisional"] },
          { id: "E02", name: "سجل التدقيق", mobile: false, states: ["audit", "access"] },
        ],
      },
      {
        number: "02",
        title: "المال والتقييم",
        screens: [
          { id: "E03", name: "الميزانية والمصاريف", mobile: false, states: ["default", "edit", "missing-actual", "closed"] },
          { id: "E04", name: "بنود المصاريف", mobile: false, states: ["default", "form", "system"] },
          { id: "E05", name: "الخصومات", mobile: false, states: ["default", "new-form", "reverse", "month-closed"] },
          { id: "E06", name: "إغلاق الشهر", mobile: false, states: ["open", "waiting", "closed"] },
          { id: "E07", name: "التقييم اليدوي", mobile: false, states: ["default", "incomplete", "locked"] },
          { id: "E08", name: "النقاط الشهرية", mobile: false, states: ["provisional", "final"] },
          { id: "E09", name: "موظف الشهر", mobile: false, states: ["default", "tie", "skipped", "choose-other", "approved"] },
        ],
      },
      {
        number: "03",
        title: "الأصناف والأسعار",
        screens: [
          { id: "E10", name: "الأصناف", mobile: false, states: ["default", "disabled-filter"] },
          { id: "E11", name: "صنف جديد", mobile: false, states: ["empty", "validation"] },
          { id: "E12", name: "صفحة الصنف", mobile: false, states: ["product", "sample", "new-price", "past-date", "disable"] },
        ],
      },
      {
        number: "04",
        title: "الإعدادات والتفويض",
        screens: [
          { id: "E13", name: "الإعدادات العامة", mobile: false, states: ["default", "edit", "verification-note"] },
          { id: "E14", name: "القوائم", mobile: false, states: ["default", "system-entry"] },
          { id: "E15", name: "العطل الرسمية", mobile: false, states: ["default", "form", "past"] },
          { id: "E16", name: "الأوزان ومجموعات المقارنة", mobile: false, states: ["default", "edit", "sum-error", "next-month-note"] },
          { id: "E17", name: "الهيكل الجغرافي", mobile: false, states: ["default", "form"] },
          { id: "E18", name: "التفويض", mobile: false, states: ["none", "active", "form", "overlap"] },
        ],
      },
    ],
  },
  {
    prefix: "I",
    key: "it-accounting-legal",
    title: "IT والمحاسبة والقانوني",
    path: "/it-accounting-legal",
    sections: [
      {
        number: "01",
        title: "IT",
        screens: [
          { id: "I01", name: "المستخدمون", mobile: false, states: ["default", "disabled-filter"] },
          { id: "I02", name: "حساب جديد", mobile: false, states: ["web", "rep", "validation"] },
          { id: "I03", name: "صفحة المستخدم", mobile: false, states: ["active", "deactivate-preview", "rep-active-warning", "disabled"] },
          { id: "I04", name: "الأدوار والصلاحيات", mobile: false, states: ["list", "edit", "system-role", "delete"] },
          { id: "I05", name: "الأجهزة", mobile: false, states: ["default"] },
          { id: "I06", name: "طلبات تغيير الجهاز", mobile: false, states: ["pending", "unsynced-warning", "approved", "rejected"] },
          { id: "I07", name: "المحاولات غير المصرّح بها", mobile: false, states: ["default", "handle", "handled"] },
          { id: "I08", name: "الحظر", mobile: false, states: ["default", "lift"] },
          { id: "I09", name: "إصدارات التطبيق", mobile: false, states: ["default", "edit"] },
          { id: "I10", name: "محتوى الموقع", mobile: false, states: ["pages", "products", "agents", "notice"] },
        ],
      },
      {
        number: "02",
        title: "المحاسبة",
        screens: [
          { id: "I11", name: "لوحة المحاسبة", mobile: false, states: ["default", "expense-reminder"] },
          { id: "I12", name: "المصروف الفعلي", mobile: false, states: ["default", "missing", "closed"] },
          { id: "I13", name: "تقرير الدوام", mobile: false, states: ["provisional", "final"] },
          { id: "I14", name: "تقرير الخصومات", mobile: false, states: ["provisional", "final", "with-reversal"] },
        ],
      },
      {
        number: "03",
        title: "القانوني",
        screens: [
          { id: "I15", name: "الوثائق القانونية", mobile: false, states: ["default", "expiring-filter"] },
          { id: "I16", name: "وثيقة جديدة", mobile: false, states: ["empty", "validation"] },
          { id: "I17", name: "صفحة الوثيقة", mobile: false, states: ["active", "expiring", "renew", "intentional-expiry", "expired"] },
          { id: "I18", name: "النزاعات", mobile: false, states: ["default"] },
          { id: "I19", name: "فتح نزاع", mobile: false, states: ["direct", "from-referral"] },
          { id: "I20", name: "ملف النزاع", mobile: false, states: ["stage-2", "stage-6", "awaiting-decision", "stage-7", "closed", "closed-resolved"] },
          { id: "I21", name: "قرار النزاع", mobile: false, states: ["awaiting-me", "other-solution"] },
        ],
      },
    ],
  },
  {
    prefix: "P",
    key: "site",
    title: "موقع الشركة",
    path: "/site",
    sections: [
      {
        number: "01",
        title: "موقع الشركة",
        screens: [
          { id: "P01", name: "الرئيسية", mobile: false, states: ["default"] },
          { id: "P02", name: "من نحن", mobile: false, states: ["default"] },
          { id: "P03", name: "المنتجات", mobile: false, states: ["default"] },
          { id: "P04", name: "صفحة المنتج", mobile: false, states: ["default", "not-found"] },
          { id: "P05", name: "أين تجد منتجاتنا", mobile: false, states: ["default", "filtered", "no-agents"] },
          { id: "P06", name: "تواصل معنا", mobile: false, states: ["empty", "validation", "sending", "sent", "rate-limited"] },
        ],
      },
    ],
  },
];

export type CatalogMatch = { group: CatalogGroup; section: CatalogSection; screen: CatalogScreen };

/** الشاشة بمعرّفها (W03)، أو undefined لصفحة ليست في الفهرس. */
export function findCatalogScreen(id: string): CatalogMatch | undefined {
  for (const group of screenCatalog) {
    for (const section of group.sections) {
      const screen = section.screens.find((candidate) => candidate.id === id);
      if (screen) return { group, section, screen };
    }
  }
  return undefined;
}

/** مسار صفحة الرسم لشاشة مبنيّة، أو undefined إن لم تُبنَ. */
export function screenHref({ group, screen }: CatalogMatch): string | undefined {
  return screen.slug ? `${group.path}/${screen.id.toLowerCase()}-${screen.slug}` : undefined;
}

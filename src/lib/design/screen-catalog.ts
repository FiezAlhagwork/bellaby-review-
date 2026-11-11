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
              "سجل كل ما غيّر المخزون من الأحدث إلى الأقدم: إدخال وصرف وتسليم وإرجاع وتسوية جرد وتالف وعكس، مع الكمية والموقع والمنفّذ والمرجع. تصفّيه بالموقع أو الصنف أو الدفعة أو الفترة، وهو للقراءة فقط.",
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
            states: ["default", "details", "loading", "empty", "error", "forbidden"],
            slug: "intake-log",
            summary:
              "سجل كل بضاعة أُدخلت إلى المستودع من الأحدث إلى الأقدم: الوقت والمرجع والموقع والأصناف ومجموع الكمية والمنفّذ. تصفّيه بالموقع أو الفترة، وتنقر إدخالاً لترى أسطره ودفعاته وهل أُنشئت الدفعة أم أُضيفت لدفعة موجودة. ومنه إلى «إدخال بضاعة».",
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
          { id: "W07", name: "الصرف", mobile: false, states: ["default", "unconfirmed"] },
          { id: "W08", name: "تفاصيل الصرف", mobile: false, states: ["in-transit", "cancel", "received", "cancelled", "overdue-48h"] },
          { id: "W09", name: "طلبات العينات", mobile: false, states: ["default"] },
          { id: "W10", name: "تفاصيل طلب العينات", mobile: false, states: ["new", "dispatched", "rejected", "cancelled"] },
        ],
      },
      {
        number: "04",
        title: "ما يعود للمستودع",
        screens: [
          { id: "W11", name: "طلبات السحب", mobile: false, states: ["default", "new-form"] },
          { id: "W12", name: "تفاصيل طلب السحب", mobile: false, states: ["requested", "handed-over", "cancelled", "rep-deactivated"] },
          { id: "W13", name: "إرجاعات الوكلاء", mobile: false, states: ["in-transit", "confirm", "received"] },
        ],
      },
      {
        number: "05",
        title: "الجرد",
        screens: [
          { id: "W14", name: "الجرد", mobile: false, states: ["default", "new-form", "worker"] },
          { id: "W15", name: "العدّ", mobile: false, states: ["in-progress", "line-saved", "with-diff", "submitted", "returned", "cancel", "worker"] },
          { id: "W16", name: "اعتماد الجرد", mobile: false, states: ["awaiting-me", "approved", "returned"] },
        ],
      },
      {
        number: "06",
        title: "الدفعات",
        screens: [
          { id: "W17", name: "الدفعات", mobile: false, states: ["default", "suspended-filter"] },
          { id: "W18", name: "تفاصيل الدفعة", mobile: false, states: ["active", "suspend", "suspended", "unsuspend", "suspended-logistics"] },
          { id: "W19", name: "تقرير تتبع السحب", mobile: false, states: ["default", "distributed-after"] },
        ],
      },
      {
        number: "07",
        title: "تالف المستودع",
        screens: [
          { id: "W20", name: "تقرير تالف المستودع", mobile: false, states: ["empty", "submitted"] },
          { id: "W21", name: "تقارير تالف المستودع", mobile: false, states: ["default"] },
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
          { id: "S01", name: "لوحة السوبرفايزر", mobile: false, states: ["default", "attendance-alerts"] },
          { id: "S02", name: "التقارير اليومية", mobile: false, states: ["supervisor", "read-only"] },
          { id: "S03", name: "تقييم التقرير اليومي", mobile: false, states: ["default", "confirm", "rated", "late-rating", "rating-locked"] },
          { id: "S04", name: "الدوام", mobile: false, states: ["default", "short-day", "absent", "auto-closed"] },
          { id: "S05", name: "الزيارات", mobile: false, states: ["list", "map", "flagged-filter"] },
          { id: "S06", name: "تفاصيل الزيارة", mobile: false, states: ["read-only", "qa-flagged", "confirmed", "rejected", "photo-pending"] },
          { id: "S07", name: "صفحة المندوب", mobile: false, states: ["default", "negative-balance"] },
        ],
      },
      {
        number: "02",
        title: "المراقبة",
        screens: [
          { id: "S08", name: "العلامات", mobile: false, states: ["default", "by-type", "near-deadline", "closed"] },
          { id: "S09", name: "معالجة العلامة", mobile: false, states: ["open", "stock-discrepancy", "clock-skew", "attendance", "auto-cleared", "escalated"] },
          { id: "S10", name: "الجهات الجديدة", mobile: false, states: ["default", "reject", "bulk-reject"] },
          { id: "S11", name: "دمج جهتين", mobile: false, states: ["default", "confirm", "not-duplicate"] },
          { id: "S12", name: "شكاوى الموقع", mobile: false, states: ["default"] },
        ],
      },
      {
        number: "03",
        title: "التحقيق",
        screens: [
          { id: "S13", name: "ملفات التحقيق", mobile: false, states: ["default"] },
          { id: "S14", name: "فتح ملف تحقيق", mobile: false, states: ["direct", "from-flag"] },
          { id: "S15", name: "ملف التحقيق", mobile: false, states: ["stage-1", "stage-4", "stage-7", "awaiting-decision", "executive-decision", "decided", "closed-no-violation"] },
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

# handoff — دليل تنفيذ شاشات الويب لمشروع الإنتاج

هذا المجلد يقرؤه Claude في مشروع الإنتاج (Next.js)، ليكتب حول كل view حاويته ويربطها بالـ API.

**مصادر الحقيقة:**
- **الشكل:** الـ views نفسها (`features/*/views/`)، تُنقل كما هي، وملف Figma (كل إطار اسمه مفتاح الحالة).
- **الداتا:** `openapi.yml`.

## الملفات

| الملف | المحتوى |
|---|---|
| `web.json` | كل شاشات الويب تحت `screens`، كل شاشة بمفتاح معرّفها (`G01`…`P06`) |

النصوص عربية مكتوبة في الـ views مباشرة، ونصوص الأخطاء في `lib/api/error-messages.ts` بمفتاح `code`. لذلك لا ملف نصوص هنا.

## شكل الشاشة الواحدة داخل `screens`

```jsonc
{
  "id": "W08",                              // ثابت لا يتغيّر
  "name": "تفاصيل الصرف",
  "group": "warehouse",                      // shared | agent | warehouse | supervision | managers | executive | it-accounting-legal | site
  "design_source": {
    "view": "src/features/transfers/views/TransferDetailView.tsx",   // يُنقل كما هو
    "page": "src/app/warehouse/w08-transfer/page.tsx"                 // صفحة الرسم، لا تُنقل
  },
  "route": "/dashboard/warehouse/transfers/[id]",                    // المسار المقترح في الإنتاج
  "api": [                                   // الطلبات التي تطلقها الشاشة أو تحتاجها
    { "id": "getTransfer",   "method": "GET",  "path": "/transfers/{id}",        "success": { "status": 200, "model": "Transfer" } },
    { "id": "cancelTransfer","method": "POST", "path": "/transfers/{id}/cancel", "request": { "reason": "string" }, "success": { "status": 200, "model": "Transfer" } }
  ],
  "view_props": {                            // ما تحسبه الحاوية وتمرّره للـ view
    "transfer": "Loadable<Transfer> ← getTransfer",
    "canCancel": "permission transfers.cancel && transfer.status === 'IN_TRANSIT'"
  },
  "permissions": ["transfers.view", "transfers.cancel"],
  "components": ["PageHeader", "StatusBadge", "LineItemsEditor(read-only)", "ActivityLog", "ReasonDialog"],
  "states": [
    {
      "key": "W08-cancel",                   // = اسم إطار Figma
      "label": "نافذة الإلغاء",
      "figma_node": "212-4",
      "drawn": true,                         // false = حالة حقيقية لم تُرسم، تُبنى من الوصف
      "when": { "ui": "ضغط «إلغاء» والحالة IN_TRANSIT" },
      "ui": ["ReasonDialog بنص: «تعود الكمية للمستودع. للإلغاء لخطأ في الإدخال فقط.»"]
    },
    {
      "key": "W08-received",
      "label": "مستلم",
      "figma_node": "212-6",
      "drawn": true,
      "when": { "data": "transfer.status === 'RECEIVED'" },
      "ui": ["لا زر إلغاء", "DecisionRecord: received_by · received_at"]
    },
    {
      "key": "W08-cancel-invalid-status",
      "label": "أُكّد قبل الإلغاء",
      "drawn": false,
      "when": { "api": "cancelTransfer", "status": 422, "codes": ["invalid_status"] },
      "ui": ["Toast danger من error-messages.ts", "إعادة جلب getTransfer"]
    }
  ],
  "navigation": [
    { "on": "click sample_request link", "to": "W10", "pass": { "id": "transfer.sample_request_id" } }
  ],
  "after_mutation": ["invalidate getTransfer", "invalidate listTransfers", "invalidate dashboard"],
  "notes": ["الإلغاء قبل التأكيد فقط، لخطأ في الإدخال (ملف المستودع ص3)."]
}
```

## قواعد عامة لكل الشاشات

- **`when`** بأحد ثلاثة: `api` + `status` + `codes` (رد الخادم)، أو `data` (شرط على الداتا)، أو `ui` (فعل المستخدم).
- **الحالات بـ `"drawn": false`** حقيقية لكنها غير مرسومة في Figma (مثل «عم يحفظ»): تُبنى من وصفها في `ui`.
- **الحالات العامة** (`loading`، `error`، `forbidden`، `not_found`) لا تتكرر في كل مدخل إلا إن كان لها شكل خاص. تُبنى من `Loadable` والمكوّنات العامة.
- **`view_props`** كل prop في الـ view ومن أين تحسبه الحاوية. الصلاحية دائماً من `me.permissions`، لا من الدور.
- **`after_mutation`** ما يُحدَّث بعد كل تعديل: القائمة، والتفاصيل، واللوحة، وعدّاد «بانتظار قراري».
- **قرارات «الأسبق يسري»** (409 `already_decided`): إعادة جلب الكيان وعرض `DecisionRecord` مع `Banner`.
- **الأرقام داخل النص** معزولة بـ `⁦…⁩` في الـ views، والمبالغ نص يُنسَّق بـ `lib/format.ts` بلا حساب.

# progress.md — تتبّع واجهات Bellaby · الويب

ملف تتبّع، لا كود فيه. يُقرأ أول كل جلسة، ويُحدَّث بعد كل شاشة.

- **الحالة:** ⬜ لم تبدأ · ⏳ قيد العمل · 👀 بانتظار المراجعة · ✅ معتمدة وملتقطة
- **المراجع:** `SCREENS.md` (الشاشات وحالاتها، **المرجع الأول للمحتوى**) · `openapi.yml` (الداتا والأخطاء) · `DESIGN.md` (الشكل) · `docs/flows/` و`docs/srs/` (السلوك وأسبابه).
- **مفاتيح الحالات** في الجداول من `SCREENS.md`. الحالات العامة (`loading` · `empty` · `error` · `forbidden`) في قسم «الحالات العامة» أدناه، لا في كل صف.
- **العدد:** 133 شاشة.
- **الشعار** في المرحلة 1 كلمة «Bellaby» نصاً.

### قواعد التسمية

| وين | الصيغة | مثال |
|---|---|---|
| المعرّف | حرف + رقمان. **لا يتغيّر ولا يُعاد ترقيمه**، والشاشة الجديدة تأخذ الرقم التالي | `W03` |
| مفتاح الحالة | المعرّف + اسم الحالة بالإنجليزية kebab-case، فريد في المشروعين | `W03-already-decided` |
| صفحة الرسم | المسار + المعرّف صغيراً + اسم إنجليزي | `src/app/warehouse/w03-dispatch/page.tsx` |
| رابط الحالة | الصفحة + `?state=` (+ `&frame=mobile`) | `/warehouse/w03-dispatch?state=suspended-batch` |
| كل الحالات للمراجعة | `?state=all` | `/warehouse/w03-dispatch?state=all` |
| إطار Figma | المعرّف · اسم الشاشة · اسم الحالة (· موبايل) | `W03 · الصرف · دفعة موقوفة` |

**دليل التنفيذ:** مع كل شاشة تخلص يُكتب مدخلها في `docs/handoff/` تحت مفتاح المعرّف (الشكل في `docs/handoff/README.md`). عمود «الحالة» لا يصير ✅ قبل أن يُكتب المدخل.

---

## المكوّنات

| المجلد | المكوّنات | DESIGN.md | الحالة |
|---|---|---|---|
| `ui` | Button · IconButton | 9.1–9.2 | 👀 |
| `ui` | Field · Input · Textarea · SearchInput · MoneyInput · PhoneInput | 9.3 | 👀 |
| `ui` | NumberInput | 9.4 | 👀 |
| `ui` | Select · Combobox | 9.5 | 👀 |
| `ui` | DatePicker · DateRangePicker · MonthPicker | 9.6 | 👀 |
| `ui` | Checkbox · Radio · RadioCard · Switch · SegmentedControl | 9.7 | 👀 |
| `ui` | FileUpload · AttachmentList | 9.8 | 👀 |
| `ui` · `data` | Badge (ui) · StatusBadge + status-map.ts (data، حسب DESIGN.md 9.9) | 9.9 | 👀 |
| `ui` | Banner · Toast | 9.10–9.11 | 👀 |
| `ui` | Dialog · ConfirmDialog · ReasonDialog · BottomSheet | 9.12 | 👀 |
| `ui` | Drawer | 9.13 | 👀 |
| `ui` | Menu · Popover · Tooltip | 9.14 | 👀 |
| `ui` | Tabs · Card | 9.15–9.16 | 👀 |
| `ui` | Avatar · PersonCell | 9.17 | 👀 |
| `ui` | Skeleton · Spinner | 9.18 | 👀 |
| `ui` | EmptyState · ErrorState · ForbiddenState · NotFoundState | 9.18 | 👀 |
| `layout` | DashboardShell · Sidebar · Topbar · Breadcrumbs | 10.1–10.3 | 👀 |
| `layout` | PageHeader · Stack · Grid · Section | 10.4–10.5 | 👀 |
| `data` | DataTable (+ الخلايا الجاهزة) · BulkBar | 10.6 | 👀 |
| `data` | Pagination · FilterBar | 10.7–10.8 | 👀 |
| `data` | KpiTile · Chart | 10.9–10.10 | 👀 |
| `data` | BatchChip · StockLine · LineItemsEditor | 10.11 | 👀 |
| `data` | StageTimeline · ActivityLog · DescriptionList | 10.12–10.14 | 👀 |
| `data` | DecisionPanel · DecisionRecord | 10.15 | 👀 |
| `data` | MapPlaceholder (الخريطة الوهمية: مستطيل بحد متقطع ونقاط بدء وإنهاء) | 13.4 | 👀 |
| `data` | ConfidentialBanner (شريط السرية: «ملف سري. اطّلاعك مسجّل.») | 11.8 | 👀 |
| `data` | NotificationList | 10.16 | 👀 |
| `site` | SiteHeader · Hero · ProductCard · ProductDetail · AgentsByGovernorate · ContactForm · BreastfeedingNotice · SiteFooter | 14 | ⬜ |

---

## المشترك في الويب — G

### 01 · الدخول والإطار — G01 إلى G05

| # | الشاشة | الحالات (المفاتيح) | العقد | ملاحظات | الحالة |
|---|---|---|---|---|---|
| G01 | تسجيل الدخول · موبايل | `default` · `signing-in` · `not-allowed` · `account-disabled` · `blocked` | Clerk، ثم `GET /me` | `/shared/g01-sign-in`، والـ view في `features/auth/views/SignInView.tsx`. رموز الرفض: `account_not_provisioned` و`account_disabled` و`email_blocked` | 👀 |
| G02 | إطار اللوحة · موبايل | `default` · `executive` · `delegate-active` · `delegation-given` · `tablet` · `mobile-drawer` | `GET /me` (`permissions`، `active_delegation`، `role`، `department`، `governorates`) | `/shared/g02-dashboard-frame`. الشاشة هي `DashboardShell` نفسه، والقائمة من `config/navigation.ts` بالصلاحيات (74 عنصراً، 26 مفتاحاً مؤقتاً في `docs/backend-requests.md`). `tablet` و`mobile-drawer` مخفيتان في نسخة المراجعة (مبدّل المقاس يغطيهما) | 👀 |
| G03 | الإشعارات | `default` · `empty` | `GET /notifications`، و`POST /notifications/{id}/read`، و`POST /notifications/read-all` |  | ⬜ |
| G04 | بانتظار قراري | `default` · `sales-manager` · `delegate` · `empty` | `GET /me/pending-decisions` |  | ⬜ |
| G05 | ملفي الشخصي | `default` · `provisional` | `GET /me/profile` |  | ⬜ |

### 02 · المهام — G06 إلى G08

| # | الشاشة | الحالات (المفاتيح) | العقد | ملاحظات | الحالة |
|---|---|---|---|---|---|
| G06 | المهام | `assigned-to-me` · `assigned-by-me` · `overdue-filter` | `GET /tasks` |  | ⬜ |
| G07 | تفاصيل المهمة | `assignee-new` · `assignee-in-progress` · `assignee-submitted` · `assignee-rejected` · `assigner-submitted` · `assigner-approved` · `reassign` · `overdue-resolve` · `resolved` | `GET /tasks/{id}`، و`POST /tasks/{id}/start`، و`/submissions`، و`/submissions/{sid}/decision`، و`/reassign`، و`/resolve`، و`POST /deductions` |  | ⬜ |
| G08 | إسناد مهمة | `empty` · `filled` · `validation` · `no-assignees` | `GET /me/assignees`، و`POST /tasks`، و`POST /uploads` |  | ⬜ |

### 03 · الطلبات بين الأقسام — G09 إلى G10

| # | الشاشة | الحالات (المفاتيح) | العقد | ملاحظات | الحالة |
|---|---|---|---|---|---|
| G09 | الطلبات بين الأقسام | `incoming` · `outgoing` | `GET /department-requests` |  | ⬜ |
| G10 | تفاصيل الطلب | `incoming-open` · `incoming-in-progress` · `outgoing` · `done` · `rejected` · `overdue` | `GET /department-requests/{id}`، و`/decision`، و`/complete`، و`POST /tasks` (`department_request_id`) |  | ⬜ |

### 04 · التقرير الدوري والخطة — G11 إلى G16

| # | الشاشة | الحالات (المفاتيح) | العقد | ملاحظات | الحالة |
|---|---|---|---|---|---|
| G11 | التقارير الدورية | `head` · `monitoring` · `executive` · `new-optional` | `GET /periodic-reports`، و`POST /periodic-reports` |  | ⬜ |
| G12 | التقرير: المسودة والتحرير | `draft` · `validation` · `submitted` · `returned` · `overdue` · `targets-sales` · `targets-scientific` | `GET /periodic-reports/{id}`، و`PATCH`، و`/submit` |  | ⬜ |
| G13 | مراجعة المراقبة | `default` · `reviewed` | `POST /periodic-reports/{id}/review` |  | ⬜ |
| G14 | قرار المدير التنفيذي على التقرير | `default` · `follow-up-action` · `returned` · `approved` | `POST /periodic-reports/{id}/decision` |  | ⬜ |
| G15 | نسخ التقرير | `default` | `GET /periodic-reports/{id}/versions` |  | ⬜ |
| G16 | الخطة الشهرية | `approved` · `revision-pending` · `revision-form` · `revision-decision` · `no-plan` | `GET /plans/{department}/{month}`، و`POST …/revisions`، و`…/revisions/{id}/decision` |  | ⬜ |

### 05 · الإجازات — G17 إلى G18

| # | الشاشة | الحالات (المفاتيح) | العقد | ملاحظات | الحالة |
|---|---|---|---|---|---|
| G17 | إجازاتي | `default` · `request-form` · `past-days` · `cancel-confirm` | `GET /leaves`، و`POST /leaves`، و`POST /leaves/{id}/cancel` |  | ⬜ |
| G18 | طلبات الإجازة للموافقة | `approver` · `accountant` · `past-days-approved` | `GET /leaves`، و`POST /leaves/{id}/decision` |  | ⬜ |

## الوكيل — A

### 01 · اللوحة والاستلام — A01 إلى A04

| # | الشاشة | الحالات (المفاتيح) | العقد | ملاحظات | الحالة |
|---|---|---|---|---|---|
| A01 | لوحة الوكيل | `default` · `pending-receipt` · `overdue-payments` | `GET /dashboard/summary`، و`GET /transfers?status=IN_TRANSIT`، و`GET /receivables` |  | ⬜ |
| A02 | الاستلامات | `default` | `GET /transfers` |  | ⬜ |
| A03 | تفاصيل الصرف | `in-transit` · `confirm` · `received` · `cancelled` | `GET /transfers/{id}`، و`POST /transfers/{id}/receive` |  | ⬜ |
| A04 | رصيدي | `default` · `suspended-batch` · `near-expiry` | `GET /stock/balances` |  | ⬜ |

### 02 · العملاء — A05 إلى A07

| # | الشاشة | الحالات (المفاتيح) | العقد | ملاحظات | الحالة |
|---|---|---|---|---|---|
| A05 | عملائي | `default` · `search` | `GET /customers` |  | ⬜ |
| A06 | عميل جديد | `empty` · `link-suggestion` · `linked` · `validation` | `GET /customers/link-suggestions`، و`POST /customers` (`visit_point_id`) |  | ⬜ |
| A07 | صفحة العميل | `default` · `linked-point` | `GET /customers/{id}`، و`GET /deliveries?customer_id=` |  | ⬜ |

### 03 · التسليم والتحصيل — A08 إلى A11

| # | الشاشة | الحالات (المفاتيح) | العقد | ملاحظات | الحالة |
|---|---|---|---|---|---|
| A08 | تسجيل تسليم | `empty` · `filled` · `over-balance` · `payment-date-limit` · `review` · `saved` | `POST /deliveries`، و`GET /stock/fefo-suggestion`، و`GET /settings` (`max_payment_term_days`) |  | ⬜ |
| A09 | التسليمات | `default` · `filter-unpaid` | `GET /deliveries` |  | ⬜ |
| A10 | تفاصيل التسليم | `unpaid` · `collect-confirm` · `paid` · `overdue` · `request-form` · `approval-pending` · `cancelled` · `written-off` · `request-rejected` · `referred` | `GET /deliveries/{id}`، و`/collect`، و`/request-approval` |  | ⬜ |
| A11 | المستحقات | `default` · `due-soon` · `overdue` | `GET /receivables` |  | ⬜ |

### 04 · المرتجع والتالف والإرجاع — A12 إلى A16

| # | الشاشة | الحالات (المفاتيح) | العقد | ملاحظات | الحالة |
|---|---|---|---|---|---|
| A12 | مرتجع من صيدلية | `empty` · `over-returnable` · `submitted` | `POST /customer-returns` (`delivery_line_id`)، و`DeliveryLine.returnable_quantity` |  | ⬜ |
| A13 | المرتجعات والتالف | `returns` · `damage` | `GET /customer-returns`، و`GET /damage-reports` |  | ⬜ |
| A14 | تقرير تالف | `empty` · `submitted` | `POST /damage-reports` |  | ⬜ |
| A15 | طلب إرجاع للمستودع | `empty` · `recall-reason` · `submitted` | `POST /agent-returns` |  | ⬜ |
| A16 | طلبات الإرجاع للمستودع | `default` | `GET /agent-returns`. --- |  | ⬜ |

## المستودع — W

### 01 · اللوحة والأرصدة — W01 إلى W03

| # | الشاشة | الحالات (المفاتيح) | العقد | ملاحظات | الحالة |
|---|---|---|---|---|---|
| W01 | لوحة المستودع | `default` · `alerts` · `worker` · `loading` · `empty` · `error` · `forbidden` | `GET /dashboard/summary`، و`GET /stock/expiry-alerts`، و`GET /stock/low-stock`، و`GET /transfers?status=IN_TRANSIT` | `/warehouse/w01-dashboard`، والـ view في `features/stock/views/WarehouseDashboardView.tsx`. العدّ من أطوال قوائم العقد لأن `DashboardSummary` بلا حقول (`docs/backend-requests.md`). مع الحالات العامة | 👀 |
| W02 | الأرصدة | `default` · `all-locations` · `at-time` · `worker` · `loading` · `empty` · `error` · `forbidden` | `GET /stock/balances`، و`GET /locations` | `/warehouse/w02-balances`، والـ view في `features/stock/views/StockBalancesView.tsx`. الفلاتر تفاعلية في صفحة الرسم. بلا ترقيم صفحات لأن العقد يعيد مصفوفة، و`at` بتاريخ اليوم (أسئلة في `docs/backend-requests.md` §5) | 👀 |
| W03 | حركات المخزون | `default` · `from-balance` · `loading` · `empty` · `error` · `forbidden` | `GET /stock/movements`، و`GET /locations` | `/warehouse/w03-movements`، والـ view في `features/stock/views/StockMovementsView.tsx`. أول شاشة بترقيم (`Pagination`). الفلاتر والترقيم تفاعلية في صفحة الرسم. أسئلة في `docs/backend-requests.md` §6 | 👀 |

### 02 · الإدخال — W04 إلى W05

| # | الشاشة | الحالات (المفاتيح) | العقد | ملاحظات | الحالة |
|---|---|---|---|---|---|
| W04 | إدخال بضاعة | `empty` · `filled` · `expired` · `near-expiry` · `batch-exists` · `batch-mismatch` · `validation-failed` · `saved` · `loading` · `error` · `forbidden` | `POST /stock-receipts`، و`GET /locations`، و`GET /items`، و`GET /batches?item_id=` | `/warehouse/w04-intake`، والـ view في `features/stock/views/StockReceiptFormView.tsx`، ومحرّر الأسطر `components/data/BatchEntryEditor.tsx`. أول شاشة نموذج. أضفت `validation-failed` (نص الخادم تحت حقله). أسئلة في `docs/backend-requests.md` §7 | 👀 |
| W05 | سجل الإدخال | `default` · `details` · `loading` · `empty` · `error` · `forbidden` | `GET /stock-receipts`، و`GET /locations` | `/warehouse/w05-intake-log`، والـ view في `features/stock/views/StockReceiptsView.tsx`. صف لكل إدخال (شكل العقد)، وأسطره في درج. الفلاتر والترقيم والدرج تفاعلية. أسئلة في `docs/backend-requests.md` §8 | 👀 |

### 03 · الصرف وطلبات العينات — W06 إلى W10

| # | الشاشة | الحالات (المفاتيح) | العقد | ملاحظات | الحالة |
|---|---|---|---|---|---|
| W06 | صرف جديد | `empty` · `agent` · `rep` · `type-mismatch` · `suspended-batch` · `insufficient` · `from-sample-request` · `saved` · `loading` · `error` · `forbidden` | `POST /transfers`، و`GET /stock/fefo-suggestion`، و`GET /locations`، و`GET /items`، و`GET /stock/balances`، و`GET /sample-requests/{id}` | `/warehouse/w06-new-dispatch`، والـ view في `features/transfers/views/TransferFormView.tsx`، ويعيد استعمال `LineItemsEditor`. تفاعلية: بدّل المستلم وعدّل الأسطر ثم «اعتماد الصرف». أسئلة في `docs/backend-requests.md` §9 | 👀 |
| W07 | الصرف | `default` · `unconfirmed` · `loading` · `empty` · `error` · `forbidden` | `GET /transfers`، و`GET /locations` | `/warehouse/w07-dispatch`، والـ view في `features/transfers/views/TransfersListView.tsx`. بحث وفلاتر وترقيم تفاعلية. `q` مضاف في الواجهة (غير موجود في العقد)؛ أسئلة في `docs/backend-requests.md` §10 | 👀 |
| W08 | تفاصيل الصرف | `in-transit` · `cancel` · `received` · `cancelled` · `overdue-48h` · `not-found` · `loading` · `error` · `forbidden` | `GET /transfers/{id}`، و`POST /transfers/{id}/cancel`، و`GET /settings` | `/warehouse/w08-transfer-details`، والـ view في `features/transfers/views/TransferDetailsView.tsx`. أول صفحة تفاصيل كيان. السجل يُبنى من حقول الصرف. أسئلة في `docs/backend-requests.md` §11 | 👀 |
| W09 | طلبات العينات | `default` · `loading` · `empty` · `error` · `forbidden` | `GET /sample-requests`، و`GET /locations` | `/warehouse/w09-sample-requests`، والـ view في `features/transfers/views/SampleRequestsListView.tsx`. فلاتر الحالة والمندوب والفترة (الفترة مضافة في الواجهة وغير موجودة في العقد) وترقيم تفاعلية. أسئلة في `docs/backend-requests.md` §12 | 👀 |
| W10 | تفاصيل طلب العينات | `new` · `reject` · `dispatched` · `rejected` · `cancelled` · `not-found` · `loading` · `error` · `forbidden` | `GET /sample-requests/{id}`، و`POST /sample-requests/{id}/reject` | `/warehouse/w10-sample-request-details`، والـ view في `features/transfers/views/SampleRequestDetailsView.tsx`. تفاعلية: «رفض» يفتح نافذة السبب والتأكيد يحوّل الطلب إلى «مرفوض». أسئلة في `docs/backend-requests.md` §13 | 👀 |

### 04 · ما يعود للمستودع — W11 إلى W13

| # | الشاشة | الحالات (المفاتيح) | العقد | ملاحظات | الحالة |
|---|---|---|---|---|---|
| W11 | طلبات السحب | `default` · `new-form` · `new-form-filled` · `new-form-validation` · `loading` · `empty` · `error` · `forbidden` | `GET /withdraw-requests`، و`POST /withdraw-requests`، و`GET /locations`، و`GET /stock/balances` | `/warehouse/w11-withdraw-requests`، والـ view في `features/transfers/views/WithdrawRequestsListView.tsx` ونافذة الطلب `WithdrawRequestFormView.tsx` (الأصناف من رصيد المندوب، والدفعة الموقوفة مسموحة). تفاعلية: الفلاتر والترقيم والإرسال يضيف الطلب. أسئلة في `docs/backend-requests.md` §14 | 👀 |
| W12 | تفاصيل طلب السحب | `requested` · `cancel` · `handed-over` · `cancelled` · `rep-deactivated` · `on-behalf` · `handed-over-on-behalf` · `not-found` · `loading` · `error` · `forbidden` | `GET /withdraw-requests/{id}`، و`POST /cancel`، و`POST /confirm-on-behalf` | `/warehouse/w12-withdraw-request-details`، والـ view `WithdrawRequestDetailsView.tsx`. الإلغاء بسبب إلزامي، والتأكيد عن مندوب معطَّل بالكمية الفعلية لكل سطر. `repActive` prop مضاف في الواجهة (العقد بلا حالة للمندوب). أسئلة في §15 | 👀 |
| W13 | إرجاعات الوكلاء | `in-transit` · `details` · `confirm` · `received` · `loading` · `empty` · `error` · `forbidden` | `GET /agent-returns`، و`POST /agent-returns/{id}/receive`، و`GET /locations` | `/warehouse/w13-agent-returns`، والـ view في `features/returns/views/AgentReturnsListView.tsx` (قائمة ودرج تفاصيل ونافذة تأكيد). الاستلام كامل بلا جزئي. أسئلة في §16 | 👀 |

### 05 · الجرد — W14 إلى W16

| # | الشاشة | الحالات (المفاتيح) | العقد | ملاحظات | الحالة |
|---|---|---|---|---|---|
| W14 | الجرد | `default` · `new-form` · `new-form-filled` · `new-form-validation` · `worker` · `loading` · `empty` · `error` · `forbidden` | `GET /stock-counts`، و`POST /stock-counts`، و`GET /locations` | `/warehouse/w14-stock-counts`، والـ view في `features/stock-counts/views/StockCountsListView.tsx` ونافذة الإنشاء `StockCountFormView.tsx`. فلاتر الحالة والموقع والمكلَّف وترقيم تفاعلية، وعامل المستودع يرى المسنَد إليه فقط. أسئلة في `docs/backend-requests.md` §17 | 👀 |
| W15 | العدّ | `in-progress` · `line-saved` · `with-diff` · `submit` · `submitted` · `returned` · `cancel` · `cancelled` · `worker` · `not-found` · `loading` · `error` · `forbidden` | `GET /stock-counts/{id}`، و`POST /lines`، و`/submit`، و`/cancel` | `/warehouse/w15-stock-count`، والـ view `StockCountDetailsView.tsx` (نفسه لـ W16). كل سطر يُحفظ فور إدخاله بمتوقعه وفرقه، والإرسال يقفل الأسطر، والأسطر القديمة بعد الإرجاع في بطاقة «أسطر سابقة». تفاعلية. أسئلة في §18 | 👀 |
| W16 | اعتماد الجرد | `awaiting-me` · `return-dialog` · `returned` · `approved` · `approved-delegated` · `self-decision-forbidden` · `approve-failed` · `not-found` · `loading` · `error` · `forbidden` | `POST /stock-counts/{id}/approve`، و`/return` | `/warehouse/w16-stock-count-approval`: شاشة W15 للمدير التنفيذي بلوحة القرار (`DecisionPanel` بزر «إرجاع لإعادة العدّ») وبطاقة القرار بعده. أضفتُ `rejectLabel` إلى `DecisionPanel`. أسئلة في §19 | 👀 |

### 06 · الدفعات — W17 إلى W19

| # | الشاشة | الحالات (المفاتيح) | العقد | ملاحظات | الحالة |
|---|---|---|---|---|---|
| W17 | الدفعات | `default` · `suspended-filter` · `loading` · `empty` · `error` · `forbidden` | `GET /batches` | `/warehouse/w17-batches`، والـ view `BatchesListView.tsx`. جدول مرقّم (24 دفعة) بتنبيه المنتهية والقريبة من الانتهاء، وفلاتر الصنف والحالة و«المتوفرة فقط». تفاعلية. أسئلة في §20 | 👀 |
| W18 | تفاصيل الدفعة | `active` · `suspend` · `suspended` · `unsuspend` · `suspended-logistics` · `suspend-failed` · `not-found` · `loading` · `error` · `forbidden` | `GET /batches/{id}`، و`/suspend`، و`/unsuspend`، و`GET /recalls`، و`GET /stock/balances?batch_id=` | `/warehouse/w18-batch`، والـ view `BatchDetailsView.tsx`. بيانات الدفعة ورصيدها في كل موقع وسجل الإيقاف والفك. الإيقاف بسبب (اللوجستي والمدير التنفيذي)، والفك للمدير التنفيذي وحده، وعند اللوجستي معطّل بسببه. تفاعلية. أسئلة في §21 | 👀 |
| W19 | تقرير تتبع السحب | `default` · `distributed-after` · `exporting` · `not-found` · `loading` · `error` · `forbidden` | `GET /batches/{id}/recall-trace` | `/warehouse/w19-recall-trace`، والـ view `RecallTraceView.tsx`. الباقي في كل موقع، وما وصل للعملاء، وما وُزّع في الزيارات (المعلَّم «بعد الإيقاف»)، وتصدير PDF وExcel. أسئلة في §22 | 👀 |

### 07 · تالف المستودع — W20 إلى W21

| # | الشاشة | الحالات (المفاتيح) | العقد | ملاحظات | الحالة |
|---|---|---|---|---|---|
| W20 | تقرير تالف المستودع | `empty` · `filled` · `uploading` · `suspended-batch` · `insufficient` · `validation-failed` · `submitted` · `loading` · `error` · `forbidden` | `POST /damage-reports` (`location_id`) | `/warehouse/w20-damage-report`، والـ view `DamageReportFormView.tsx`. الموقع والسبب والأسطر بدفعاتها (الموقوفة مسموحة ومعلَّمة) والملاحظة وصور مرفقة. بعد الرفع «بانتظار القرار». تفاعلية (رفع مرفق محاكى). أسئلة في §23 | 👀 |
| W21 | تقارير تالف المستودع | `default` · `pending-filter` · `loading` · `empty` · `error` · `forbidden` | `GET /damage-reports` | `/warehouse/w21-damage-reports`، والـ view `DamageReportsListView.tsx`. جدول مرقّم (14 تقريراً) بالتاريخ والأصناف والسبب والموقع والحالة والمسؤولية، وفلاتر الحالة والموقع. الصف يفتح M08 (لم تُرسم). تفاعلية. أسئلة في §24 | 👀 |

## الإشراف والمراقبة — S

### 01 · السوبرفايزر — S01 إلى S07

| # | الشاشة | الحالات (المفاتيح) | العقد | ملاحظات | الحالة |
|---|---|---|---|---|---|
| S01 | لوحة السوبرفايزر | `default` · `attendance-alerts` · `loading` · `error` · `forbidden` | `GET /dashboard/summary` | `/supervision/s01-dashboard`، والـ view `SupervisorDashboardView.tsx`. خمس خلايا (الزيارات والدوام والتقارير المنتظرة وطلبات الإجازة وتنبيهات الدوام) وجدول التنبيهات. المؤشرات محسوبة من القوائم لأن `DashboardSummary` بلا حقول. أسئلة في §25 | 👀 |
| S02 | التقارير اليومية | `supervisor` · `read-only` · `loading` · `empty` · `error` · `forbidden` | `GET /daily-reports` | `/supervision/s02-daily-reports`، والـ view `DailyReportsListView.tsx`. بانتظار التقييم أولاً مع الوقت المتبقي من المهلة (`rating_due_at` مضاف: §26.2)، ومدير المكتب العلمي للقراءة. تفاعلية. أسئلة في §26 | 👀 |
| S03 | تقييم التقرير اليومي | `default` · `confirm` · `rated` · `late-rating` · `rating-locked` · `not-found` · `loading` · `error` · `forbidden` | `GET /daily-reports/{id}`، و`/rating`، و`/notes` | `/supervision/s03-daily-report`، والـ view `DailyReportDetailsView.tsx`. التقرير وزيارات يومه والملخص، وتقييم بالسلّم الموحّد (`Radio`) يُقفل بعد تأكيد، و«إضافة ملاحظة» بعده. تفاعلية. أسئلة في §27 | 👀 |
| S04 | الدوام | `default` · `short-day` · `absent` · `auto-closed` · `loading` · `empty` · `error` · `forbidden` | `GET /attendance-sessions` | `/supervision/s04-attendance`، والـ view `AttendanceSessionsView.tsx`. 22 صفاً بعلامات (إغلاق آلي، عطلة، دوام ناقص، غياب، جارية) وفلاتر المندوب والفترة والعرض. صف الغياب مضاف في الواجهة (§28.2). أسئلة في §28 | 👀 |
| S05 | الزيارات | `list` · `map` · `flagged-filter` · `loading` · `empty` · `error` · `forbidden` | `GET /visits` | `/supervision/s05-visits`، والـ view `VisitsListView.tsx`. قائمة وخريطة (مستطيل وهمي بنقاط: بدء ● وإنهاء ■ بلا مسار) بفلاتر المندوب والفترة والتحقق. مكوّن جديد `MapPlaceholder`. الخريطة تعرض نقاط الصفحة الحالية (§29.1). أسئلة في §29 | 👀 |
| S06 | تفاصيل الزيارة | `read-only` · `qa-flagged` · `confirm` · `reject` · `confirmed` · `rejected` · `photo-pending` · `already-decided` · `not-found` · `loading` · `error` · `forbidden` | `GET /visits/{id}`، و`POST /visits/{id}/decision` | `/supervision/s06-visit`، والـ view `VisitDetailsView.tsx`. حقول الزيارة وما وُزِّع والصورة والموقعان على خريطة مصغّرة والعلامات. للمراقبة `DecisionPanel` «تأكيد الزيارة»/«رفض الزيارة» (الرفض بسبب إلزامي في الواجهة: §29.2) ثم `DecisionRecord`. أُضيف `approveLabel` على `DecisionPanel`. أسئلة في §29 | 👀 |
| S07 | صفحة المندوب | `default` · `negative-balance` · `partial-error` · `not-found` · `loading` · `error` · `forbidden` | `GET /users/{id}`، و`GET /visits?rep_id=`، و`GET /stock/balances?location=`، و`GET /scores` | `/supervision/s07-rep`، والـ view `RepProfileView.tsx`. ستة أقسام بحالات مستقلة: البيانات، دوام اليوم، زيارات اليوم، الرصيد (السالب بشريط)، ما وزّعه، التقارير، المؤشرات الشهرية. المندوب تابع للشركة لا لوكيل. أسئلة في §30 | 👀 |

### 02 · المراقبة — S08 إلى S12

| # | الشاشة | الحالات (المفاتيح) | العقد | ملاحظات | الحالة |
|---|---|---|---|---|---|
| S08 | العلامات | `default` · `by-type` · `near-deadline` · `closed` · `loading` · `empty` · `error` · `forbidden` | `GET /qa-flags` | `/supervision/s08-flags`، والـ view `FlagsListView.tsx`. 13 علامة مجمّعة حسب الشخص بنوعها والسجل المرتبط والعمر والمهلة (72 ساعة عمل: `due_at` مضاف §31.2). فلاتر النوع والحالة (مفتوحة · قاربت المهلة · مغلقة، الأخيرتان مشتقتان) والشخص. أسئلة في §31 | 👀 |
| S09 | معالجة العلامة | `open` · `stock-discrepancy` · `clock-skew` · `attendance` · `auto-cleared` · `escalated` · `visit-flag` · `already-decided` · `linked-error` · `loading` · `error` · `forbidden` | `POST /qa-flags/{id}/decision` | `/supervision/s09-flag`، والـ view `FlagDrawerView.tsx`. درج فوق S08: النوع والتفاصيل والسجل المرتبط وصاحبه، ونهايات المعالجة الثلاث (لا مشكلة · مشكلة مسجّلة · تحويل لتحقيق) وملاحظة، ثم سجل القرار. علامات الزيارة والجهات تُحال إلى شاشاتها. مفاتيح `details` مفترضة (§32.1) | 👀 |
| S10 | الجهات الجديدة | `default` · `reject` · `bulk-reject` · `already-decided` · `loading` · `empty` · `error` · `forbidden` | `GET /qa-flags?type=NEW_VISIT_POINT`، و`POST /qa-flags/{id}/decision`، و`POST /visit-points/{id}/reject-visits` | `/supervision/s10-new-places`، والـ view `NewVisitPointsView.tsx`. ثلاث جهات بانتظار المراجعة بعدد زياراتها (`visits_count` مضاف §33.3): «مقبولة» فوراً، و«مرفوضة» بسبب، وتحديد متعدد ورفض جماعي لزياراتها بـ`BulkBar`. أسئلة في §33 | 👀 |
| S11 | دمج جهتين | `default` · `confirm` · `not-duplicate` · `merge-failed` · `not-found` · `loading` · `error` · `forbidden` | `POST /visit-points/merge` | `/supervision/s11-merge-places`، والـ view `MergePointsView.tsx`. الجهتان جنباً إلى جنب مع المسافة بينهما، واختيار الباقية، و«دمج» بتأكيد، و«ليستا مكررتين». أسئلة في §34 | 👀 |
| S12 | شكاوى الموقع | `default` · `details` · `loading` · `empty` · `error` · `forbidden` | `GET /site/messages?type=COMPLAINT` | `/supervision/s12-complaints`، والـ view `SiteComplaintsView.tsx`. تسع شكاوى للاطلاع بفلتر الحالة، والصف يفتح الشكوى كاملة ومعالجتها. لا زر معالجة. أسئلة في §35 | 👀 |

### 03 · التحقيق — S13 إلى S15

| # | الشاشة | الحالات (المفاتيح) | العقد | ملاحظات | الحالة |
|---|---|---|---|---|---|
| S13 | ملفات التحقيق | `default` · `executive` · `awaiting` · `loading` · `empty` · `error` · `forbidden` | `GET /investigations` | `/supervision/s13-investigations`، والـ view `InvestigationsListView.tsx`. اثنا عشر ملفاً سرياً بفلتر الحالة (قيد التحقيق مشتق: §36.1) وترقيم. «فتح ملف» للمراقبة وحدها. أُضيف `ConfidentialBanner` وأيقونة اختيارية في `Banner`. أسئلة في §36 | 👀 |
| S14 | فتح ملف تحقيق | `direct` · `from-flag` · `validation` · `submitting` · `forbidden` | `POST /investigations` | `/supervision/s14-new-investigation`، والـ view `InvestigationFormView.tsx`. الموظف والعنوان إلزاميان، والوصف (مكانه في الباك غير معروف: §37.2)، ومن علامة تُقفل الموظف وتظهر العلامة المصدر. أسئلة في §37 | 👀 |
| S15 | ملف التحقيق | `stage-1` · `stage-4` · `stage-7` · `awaiting-decision` · `executive-decision` · `decision-confirm` · `decided` · `closed-no-violation` · `close-dialog` · `submit-confirm` · `invalid-status` · `delegate-forbidden` · `not-found` · `loading` · `error` · `forbidden` | `GET /investigations/{id}`، و`/complete-stage`، و`/close-no-violation`، و`/submit-for-decision`، و`/decision` | `/supervision/s15-investigation`، والـ view `InvestigationDetailsView.tsx`. `StageTimeline` بثماني مراحل لا قفز بينها: نموذج المرحلة (ملخص ومستندات)، وإغلاق «لا مخالفة» بسبب، والمرحلة 7 بتصنيف وإجراء للرفع، وقرار المدير التنفيذي بنص وخصم اختياري، وسجل القرار. تفاعلية. أسئلة في §38 | 👀 |

## المديرون — M

### 01 · مدير المبيعات — M01 إلى M11

| # | الشاشة | الحالات (المفاتيح) | العقد | ملاحظات | الحالة |
|---|---|---|---|---|---|
| M01 | لوحة مدير المبيعات | `default` · `provisional` · `loading` · `empty` · `error` · `forbidden` | `GET /dashboard/summary`، و`GET /plans/{department}/{month}` | `/managers/m01-sales-dashboard`، والـ view `features/sales/views/SalesManagerDashboardView.tsx`. خمس بطاقات والمبيعات لكل منتج ولكل وكيل مقابل أهدافها. وُسِّع `Chart` بهدف لكل عمود (`targetKey`). `empty` = لا خطة معتمدة. أسئلة في §39 | 👀 |
| M02 | الوكلاء | `default` · `loading` · `empty` · `error` · `forbidden` | `GET /agents` | `/managers/m02-agents`، والـ view `features/agents/views/AgentsListView.tsx`. الرصيد والمبيعات حقلان مضافان في الواجهة (§40.1). بحث وفلتر محافظة وترقيم | 👀 |
| M03 | صفحة الوكيل | `default` · `balances` · `deliveries` · `receivables` · `returns` · `deactivated` · `return-form` · `return-filled` · `return-validation` · `return-created` · `not-found` · `loading` · `error` · `forbidden` | `GET /agents/{id}`، و`POST /agent-returns` (`created_on_behalf_of_agent`) | `/managers/m03-agent`، والـ view `features/agents/views/AgentDetailsView.tsx`، ونموذج الإرجاع المشترك مع A15 في `features/returns/views/AgentReturnFormView.tsx` (صفحة لا نافذة: §41.5). التبويبات من نقاطها (§41.1). أسئلة في §41 | 👀 |
| M04 | العملاء | `default` · `loading` · `empty` · `error` · `forbidden` | `GET /customers` | `/managers/m04-customers`، والـ view `features/customers/views/CustomersListView.tsx`. بحث وفلاتر الوكيل والمحافظة وترقيم. الصف يفتح M05 (الدفعة التالية). §42 | 👀 |
| M05 | صفحة العميل | `default` · `payment` · `returns` · `rep-visits` · `my-visits` · `unlinked` · `not-found` · `loading` · `error` · `forbidden` | `GET /customers/{id}`، و`GET /deliveries?customer_id=` | `/managers/m05-customer`، والـ view `features/customers/views/CustomerDetailsView.tsx` (مشترك مع A07 بعلم `showVisits`). بيانات العميل وجهة الزيارة المربوطة، وأقسام التسليمات والسداد والمرتجعات وزيارات المندوبين وزياراتي. أسئلة في §45 | 👀 |
| M06 | التسليمات | `read-only` · `filter-unpaid` · `details` · `approval-pending-view` · `paid` · `written-off` · `cancelled` · `referred` · `not-found` · `loading` · `empty` · `error` · `forbidden` | `GET /deliveries`، و`GET /deliveries/{id}` | `/managers/m06-deliveries`، والـ views `features/deliveries/views/DeliveriesListView.tsx` وDeliveryDetailsView.tsx (مشتركان مع A09 وA10). للقراءة: لا زر قرار، وتُضاف أفعال الوكيل في A10. أسئلة في §46 | 👀 |
| M07 | المستحقات | `default` · `refer` · `referred` · `refer-conflict` · `loading` · `empty` · `error` · `forbidden` | `GET /receivables`، و`POST /deliveries/{id}/refer-dispute` | `/managers/m07-receivables`، والـ view `features/receivables/views/ReceivablesView.tsx`. التحصيل لكل وكيل فوق جدول التسليمات غير المسدّدة (المتأخر أولاً) و«إحالة للقانوني» بنافذة. أسئلة في §43 | 👀 |
| M08 | قرارات المرتجع والتالف | `list` · `customer-return` · `customer-return-damaged` · `agent-damage` · `warehouse-damage` · `agent-return` · `reject-dialog` · `already-decided` · `decided` · `no-permission` · `loading` · `empty` · `error` · `forbidden` | `GET /customer-returns`، و`GET /damage-reports`، و`GET /agent-returns`، و`…/{id}/decision` لكل منها | `/managers/m08-return-decisions`، والـ views `features/returns/views/ReturnDecisionsView.tsx` وReturnDecisionDrawer.tsx. أربعة تبويبات بعدّاد المعلّق ودرج قرار لكل نوع (الطلب لا صفحة: §47.6). تفاعلية: القرار يحوّل الطلب لمقرَّر، و409 «قرّر غيرك». أُصدرت أعمدة كل نوع لـA13 وA16. أسئلة في §47 | 👀 |
| M09 | زيارة جديدة · موبايل | `default` · `locating` · `location-denied` · `ready` · `validation` · `saved` · `forbidden` | `POST /manager-visits` (`customer_id` أو `visit_point_id`، والإحداثيات إلزامية) | `/managers/m09-new-visit`، والـ view `features/manager-visits/views/NewManagerVisitView.tsx`. حالة الموقع prop (`idle · locating · denied · ready`) تلتقطها الحاوية. لا حفظ بلا موقع. أسئلة في §48 | 👀 |
| M10 | زياراتي · موبايل | `default` · `no-goal` · `loading` · `empty` · `error` · `forbidden` | `GET /manager-visits` | `/managers/m10-my-visits`، والـ view `features/manager-visits/views/ManagerVisitsView.tsx`. عدد الزيارات مقابل هدف الشهر، وقائمة بفلتر الفترة وترقيم. أسئلة في §49 | 👀 |
| M11 | رسائل الموقع | `default` · `details` · `handle` · `handled` · `already-handled` · `loading` · `empty` · `error` · `forbidden` | `GET /site/messages`، و`POST /site/messages/{id}/handle` | `/managers/m11-site-messages`، والـ view `features/site-messages/views/SiteMessagesView.tsx`. كل الأنواع بفلتر النوع والحالة، ودرج، ونافذة معالجة بملاحظة إلزامية. أسئلة في §44 | 👀 |

### 02 · مدير المكتب العلمي — M12 إلى M18

| # | الشاشة | الحالات (المفاتيح) | العقد | ملاحظات | الحالة |
|---|---|---|---|---|---|
| M12 | لوحة المكتب العلمي | `default` · `no-plan` · `loading` · `error` · `forbidden` | `GET /dashboard/summary`، و`GET /dashboard/coverage` | `/managers/m12-scientific-dashboard`، والـ view `features/scientific-office/views/ScientificDashboardView.tsx`. ثلاث بطاقات مقابل الخطة، والتغطية لكل محافظة، وزيارات اليوم على الخريطة. أسئلة في §50 | 👀 |
| M13 | المندوبون | `default` · `loading` · `empty` · `error` · `forbidden` | `GET /users?role=rep` | `/managers/m13-reps`، والـ view `features/reps/views/RepsListView.tsx`. فلتر المنطقة والسوبرفايزر، والصف → S07. أسئلة في §51 | 👀 |
| M14 | جهات الزيارة | `list` · `map` · `disabled-filter` · `loading` · `empty` · `error` · `forbidden` | `GET /visit-points` | `/managers/m14-visit-points`، والـ view `features/visit-points/views/VisitPointsListView.tsx`. قائمة/خريطة بالفلاتر الأربعة. أسئلة في §52 | 👀 |
| M15 | صفحة الجهة | `default` · `edit` · `disabled` · `disabled-merged` · `not-found` · `loading` · `error` · `forbidden` | `GET /visit-points/{id}`، و`PATCH` (البيانات لا الموقع) | `/managers/m15-visit-point`، والـ view `features/visit-points/views/VisitPointDetailsView.tsx`. التعديل في درج (لا الموقع)، والمعطّلة للقراءة. أسئلة في §52 | 👀 |
| M16 | تقرير معلومات السوق | `competitor-price` · `requested-product` · `loading` · `empty` · `error` · `forbidden` | `GET /market-intel` | `/managers/m16-market-intel`، والـ view `features/market-intel/views/MarketIntelView.tsx`. تبويب لكل نوع بأعمدة حقوله (`intel-types.ts`). أسئلة في §53 | 👀 |
| M17 | أرصدة عينات المندوبين | `default` · `low` · `loading` · `empty` · `error` · `forbidden` | `GET /stock/balances?location_type=REP` | `/managers/m17-rep-sample-balances`، والـ view `features/stock/views/RepSampleBalancesView.tsx`. «وزّع هذا الشهر» وشارات المنخفض والسالب. أسئلة في §54 | 👀 |
| M18 | طلبات العينات | `default` · `new-form` · `cancel` · `loading` · `empty` · `error` · `forbidden` | `GET /sample-requests`، و`POST /sample-requests`، و`/cancel` | `/managers/m18-sample-requests`، والـ views `SampleRequestsListView` (W09 بـ`ownRequests`) و`SampleRequestFormView` في `features/transfers/views/`. أسئلة في §55 | 👀 |

## المدير التنفيذي — E

### 01 · اللوحة والمتابعة — E01 إلى E02

| # | الشاشة | الحالات (المفاتيح) | العقد | ملاحظات | الحالة |
|---|---|---|---|---|---|
| E01 | لوحة المدير التنفيذي | `default` · `provisional` · `loading` · `error` · `forbidden` | `GET /dashboard/executive`، و`GET /me/pending-decisions` | `/executive/e01-dashboard`، والـ view `features/executive/views/ExecutiveDashboardView.tsx`. التارغيت والمصاريف جداول لا رسوم (المبالغ نصية). أسئلة في §56 | 👀 |
| E02 | سجل التدقيق | `audit` · `access` · `details` · `monitoring` · `loading` · `empty` · `error` · `forbidden` | `GET /audit-logs`، و`GET /access-logs` | `/executive/e02-audit`، والـ view `features/audit/views/AuditLogView.tsx`، والأسماء في `components/data/audit-labels.ts`. أسئلة في §57 | 👀 |

### 02 · المال والتقييم — E03 إلى E09

| # | الشاشة | الحالات (المفاتيح) | العقد | ملاحظات | الحالة |
|---|---|---|---|---|---|
| E03 | الميزانية والمصاريف | `default` · `edit` · `missing-actual` · `closed` · `month-closed` · `loading` · `error` · `forbidden` | `GET /budgets/{month}`، و`PUT /budgets/{month}` | `/executive/e03-budget`، والـ view `features/budgets/views/BudgetView.tsx`. التعديل في الجدول نفسه. أسئلة في §58 | 👀 |
| E04 | بنود المصاريف | `default` · `form` · `system` · `loading` · `empty` · `error` · `forbidden` | `GET /expense-categories`، و`POST`، و`PATCH /expense-categories/{id}` | `/executive/e04-expense-categories`، والـ view `features/budgets/views/ExpenseCategoriesView.tsx`. تُفتح من E03. أسئلة في §58 | 👀 |
| E05 | الخصومات | `default` · `new-form` · `reverse` · `month-closed` · `loading` · `empty` · `error` · `forbidden` | `GET /deductions`، و`POST /deductions`، و`/reverse` | `/executive/e05-deductions`، والـ view `features/deductions/views/DeductionsView.tsx`. أسئلة في §59 | 👀 |
| E06 | إغلاق الشهر | `open` · `waiting` · `closed` · `loading` · `error` · `forbidden` | `GET /month-closings/{month}` | `/executive/e06-month-close`، والـ view `features/scoring/views/MonthClosingView.tsx`. لا زر إغلاق (آلي). أسئلة في §60 | 👀 |
| E07 | التقييم اليدوي | `default` · `incomplete` · `locked` · `loading` · `empty` · `error` · `forbidden` | `PUT /manual-ratings` | `/executive/e07-manual-rating`، والـ view `features/scoring/views/ManualRatingsView.tsx`. يُحفظ عند الاختيار. أسئلة في §61 | 👀 |
| E08 | النقاط الشهرية | `provisional` · `final` · `loading` · `empty` · `error` · `forbidden` | `GET /scores` | `/executive/e08-points`، والـ view `features/scoring/views/ScoresView.tsx`. أسئلة في §62 | 👀 |
| E09 | موظف الشهر | `default` · `tie` · `skipped` · `choose-other` · `approved` · `month-not-closed` · `loading` · `error` · `forbidden` | `GET /month-winners/{month}`، و`/approve` | `/executive/e09-month-winner`، والـ view `features/scoring/views/MonthWinnersView.tsx`. أُضيف `month_not_closed` إلى `error-messages.ts`. أسئلة في §63 | 👀 |

### 03 · الأصناف والأسعار — E10 إلى E12

| # | الشاشة | الحالات (المفاتيح) | العقد | ملاحظات | الحالة |
|---|---|---|---|---|---|
| E10 | الأصناف | `default` · `disabled-filter` · `loading` · `empty` · `error` · `forbidden` | `GET /items` | `/executive/e10-items`، والـ view `features/items/views/ItemsListView.tsx`. أسئلة في §64 | 👀 |
| E11 | صنف جديد | `empty` · `product-site` · `validation` · `forbidden` | `POST /items` | `/executive/e11-new-item`، والـ view `features/items/views/ItemFormView.tsx` (صفحة لا نافذة). أسئلة في §65 | 👀 |
| E12 | صفحة الصنف | `product` · `sample` · `new-price` · `past-date` · `disable` · `disabled` · `not-found` · `loading` · `error` · `forbidden` | `GET /items/{id}`، و`PATCH`، و`/prices`، و`/unit-costs` | `/executive/e12-item`، والـ view `features/items/views/ItemDetailsView.tsx`. أسئلة في §66 | 👀 |

### 04 · الإعدادات والتفويض — E13 إلى E18

| # | الشاشة | الحالات (المفاتيح) | العقد | ملاحظات | الحالة |
|---|---|---|---|---|---|
| E13 | الإعدادات العامة | `default` · `edit` · `verification-note` · `loading` · `error` · `forbidden` | `GET /settings`، و`PATCH /settings` | `/executive/e13-settings`، والـ view `features/settings/views/SettingsView.tsx`. أسئلة في §67 | 👀 |
| E14 | القوائم | `default` · `form` · `system-entry` · `loading` · `empty` · `error` · `forbidden` | `GET /lists/{key}`، و`POST`، و`PATCH /lists/{key}/{id}` | `/executive/e14-lists`، والـ view `features/settings/views/ListsView.tsx`. أسئلة في §68 | 👀 |
| E15 | العطل الرسمية | `default` · `form` · `past` · `loading` · `empty` · `error` · `forbidden` | `GET /holidays`، و`POST`، و`DELETE /holidays/{id}` | `/executive/e15-holidays`، والـ view `features/settings/views/HolidaysView.tsx`. أسئلة في §69 | 👀 |
| E16 | الأوزان ومجموعات المقارنة | `default` · `edit` · `sum-error` · `next-month-note` · `loading` · `error` · `forbidden` | `GET /kpi-weights`، و`PUT`، و`GET /comparison-groups`، و`PUT` | `/executive/e16-weights`، والـ view `features/settings/views/KpiWeightsView.tsx`. أسئلة في §70 | 👀 |
| E17 | الهيكل الجغرافي | `default` · `form` · `move` · `loading` · `error` · `forbidden` | `GET /geo`، و`POST /geo/regions`، و`PATCH`، و`POST /geo/governorates`، و`PATCH` | `/executive/e17-geo`، والـ view `features/settings/views/GeoView.tsx`. أسئلة في §71 | 👀 |
| E18 | التفويض | `none` · `active` · `form` · `overlap` · `loading` · `error` · `forbidden` | `GET /delegations`، و`POST /delegations`، و`/end` | `/executive/e18-delegation`، والـ view `features/delegations/views/DelegationView.tsx`. أسئلة في §72 | 👀 |

## IT والمحاسبة والقانوني — I

### 01 · IT — I01 إلى I10

| # | الشاشة | الحالات (المفاتيح) | العقد | ملاحظات | الحالة |
|---|---|---|---|---|---|
| I01 | المستخدمون | `default` · `disabled-filter` | `GET /users` |  | ⬜ |
| I02 | حساب جديد | `web` · `rep` · `validation` | `POST /users` |  | ⬜ |
| I03 | صفحة المستخدم | `active` · `deactivate-preview` · `rep-active-warning` · `disabled` | `GET /users/{id}`، و`PATCH`، و`/deactivation-preview`، و`/deactivate`، و`/activate`، و`PUT /users/{id}/contract` |  | ⬜ |
| I04 | الأدوار والصلاحيات | `list` · `edit` · `system-role` · `delete` | `GET /roles`، و`POST`، و`PUT /roles/{id}`، و`DELETE`، و`GET /permissions` |  | ⬜ |
| I05 | الأجهزة | `default` | `GET /devices` |  | ⬜ |
| I06 | طلبات تغيير الجهاز | `pending` · `unsynced-warning` · `approved` · `rejected` | `GET /device-change-requests`، و`/{id}/decision` |  | ⬜ |
| I07 | المحاولات غير المصرّح بها | `default` · `handle` · `handled` | `GET /security-events`، و`/{id}/handle` |  | ⬜ |
| I08 | الحظر | `default` · `lift` | `GET /blocks`، و`POST /blocks`، و`/{id}/lift` |  | ⬜ |
| I09 | إصدارات التطبيق | `default` · `edit` | `GET /settings/app-version`، و`PUT` |  | ⬜ |
| I10 | محتوى الموقع | `pages` · `products` · `agents` · `notice` | `GET /site/pages/{slug}`، و`PUT`، و`PATCH /items/{id}`، و`PATCH /agents/{id}`، و`PUT /settings/site` |  | ⬜ |

### 02 · المحاسبة — I11 إلى I14

| # | الشاشة | الحالات (المفاتيح) | العقد | ملاحظات | الحالة |
|---|---|---|---|---|---|
| I11 | لوحة المحاسبة | `default` · `expense-reminder` | `GET /dashboard/summary`، و`GET /deliveries` |  | ⬜ |
| I12 | المصروف الفعلي | `default` · `missing` · `closed` | `GET /budgets/{month}`، و`PUT /expenses/{month}` |  | ⬜ |
| I13 | تقرير الدوام | `provisional` · `final` | `GET /accounting/attendance-report` |  | ⬜ |
| I14 | تقرير الخصومات | `provisional` · `final` · `with-reversal` | `GET /accounting/deductions-report` |  | ⬜ |

### 03 · القانوني — I15 إلى I21

| # | الشاشة | الحالات (المفاتيح) | العقد | ملاحظات | الحالة |
|---|---|---|---|---|---|
| I15 | الوثائق القانونية | `default` · `expiring-filter` | `GET /legal-documents` |  | ⬜ |
| I16 | وثيقة جديدة | `empty` · `validation` | `POST /legal-documents` |  | ⬜ |
| I17 | صفحة الوثيقة | `active` · `expiring` · `renew` · `intentional-expiry` · `expired` | `GET /legal-documents/{id}`، و`/versions`، و`/intentional-expiry` |  | ⬜ |
| I18 | النزاعات | `default` | `GET /disputes` |  | ⬜ |
| I19 | فتح نزاع | `direct` · `from-referral` | `POST /disputes` |  | ⬜ |
| I20 | ملف النزاع | `stage-2` · `stage-6` · `awaiting-decision` · `stage-7` · `closed` · `closed-resolved` | `GET /disputes/{id}`، و`/complete-stage`، و`/recommendation`، و`/execute`، و`/close-resolved` |  | ⬜ |
| I21 | قرار النزاع | `awaiting-me` · `other-solution` | `POST /disputes/{id}/decision` | (شاشة I20) | ⬜ |

## موقع الشركة — P

### 01 · موقع الشركة — P01 إلى P06

| # | الشاشة | الحالات (المفاتيح) | العقد | ملاحظات | الحالة |
|---|---|---|---|---|---|
| P01 | الرئيسية | `default` | `GET /public/site`، و`GET /public/pages/home`، و`GET /public/products` |  | ⬜ |
| P02 | من نحن | `default` | `GET /public/pages/about` |  | ⬜ |
| P03 | المنتجات | `default` | `GET /public/products` |  | ⬜ |
| P04 | صفحة المنتج | `default` · `not-found` | `GET /public/products/{slug}` |  | ⬜ |
| P05 | أين تجد منتجاتنا | `default` · `filtered` · `no-agents` | `GET /public/where-to-buy` |  | ⬜ |
| P06 | تواصل معنا | `empty` · `validation` · `sending` · `sent` · `rate-limited` | `POST /public/contact`. --- |  | ⬜ |

---

## الحالات العامة

ترسم مرة لكل نوع شاشة، وتُسجَّل هنا الشاشة التي رُسمت عليها.

| النوع | الحالات | رُسمت على | الحالة |
|---|---|---|---|
| قائمة (جدول) | `loading` · `empty` · `error` · `forbidden` | — | ⬜ |
| تفاصيل كيان | `loading` · `error` · `forbidden` (`not_found`) | — | ⬜ |
| نموذج | `loading` · `error` | — | ⬜ |
| لوحة | `loading` · `error` | — | ⬜ |

---

## قرارات محسومة

| # | القرار | السبب | التاريخ |
|---|---|---|---|
| 1 | إدخال البضاعة (W04) بأسطر متعددة (سطر واحد افتراضياً) | العقد يقبل `lines[]`، والشحنة الواقعية فيها أكثر من صنف أو دفعة | 12 تشرين الثاني 2026 |
| 2 | سجل الإدخال (W05): صف لكل إدخال، والأسطر في درج | الترقيم في العقد يعدّ الإدخالات لا الأسطر، وصف لكل سطر يكرّر المرجع | 12 تشرين الثاني 2026 |
| 3 | أنواع حركة المخزون بالمفردات المعتمدة في `status-map.ts`، و`CUSTOMER_RETURN` = «مرتجع صيدلية» | العقد يسمّي قسم المرتجعات «مرتجع الصيدلية وإرجاع الوكيل» | 12 تشرين الثاني 2026 |
| 4 | صرف جديد (W06): يبقى اختيار «من» ومفتاح «وكيل | مندوب»، و«من» يُقفل بمستودع المستخدم الواحد | `from_location_id` إلزامي، والمفتاح يطبّق قاعدة نوع الصنف للمستلم | 12 تشرين الثاني 2026 |
| 5 | النقر على صف الأرصدة (W02) يفتح W03 بالصنف والدفعة والموقع، وكلها قابلة للإزالة | الصف هو (موقع، صنف، دفعة) | 12 تشرين الثاني 2026 |
| 6 | عكس إدخال خاطئ (W05) مسموح: اللوجستي (والمدير التنفيذي إن اعتمدتم)، إدخال كامل، سبب إلزامي، قيد معاكس بلا حذف | الحركات «إضافة فقط» ونوع `REVERSAL` موجود في العقد | 12 تشرين الثاني 2026 |
| 7 | نسخة المراجعة للزبون محمية بكلمة سر (`REVIEW_PASSWORD`) وأدواتها الداخلية مخفية | الزبون يرى الشاشات فقط | 11 تشرين الثاني 2026 |
| 8 | لغة الموقع العام: العربية فقط حالياً | قرار المستخدم | 12 تشرين الثاني 2026 |
| 9 | ما ينقص العقد (معامل أو endpoint أو مفتاح أو حقل رد) يُبنى في الواجهة مباشرة ويُسجَّل في `docs/backend-requests.md` (§0 فهرس) | إنهاء الشاشات أولاً ثم الربط، وإرسال الملف للباك آخراً | 12 تشرين الثاني 2026 |
| 10 | سجل أحداث الصرف (W08) يُبنى من حقول `Transfer` (أنشأه، أكّد، ألغاه بسببه)، ولا نطلب فتح سجل التدقيق للوجستي | لا انتقالات أخرى للصرف في العقد، وسجل التدقيق أداة رقابة (`audit.view`) | 12 تشرين الثاني 2026 |
| 11 | إلغاء الصرف: أي لوجستي يحمل `transfers.create`، بسبب إلزامي يظهر في السجل | كما في العقد، ولا يتعطّل الصرف إن غاب منشئه | 12 تشرين الثاني 2026 |
| 12 | تأكيد مندوب بلا اتصال بعد الإلغاء يُرفض (`transfer_cancelled`): نُعلم اللوجستي (شريط وحدث في السجل) والحل «صرف جديد»؛ ونطلب الإشعار والحقل من الباك | البضاعة قد تكون مع المندوب والإلغاء نهائي | 12 تشرين الثاني 2026 |

---

## أسئلة مفتوحة

أي تعارض بين العقد والتدفق أو حقل ناقص في العقد يُكتب هنا ويُرسل للباك. لا تخمين.

| # | السؤال | الشاشات |
|---|---|---|
| 1 | **صورة الزيارة:** `visits` في الـ push تحمل `has_photo` فقط. ما مسار رفع الصورة بعد المزامنة وربطها بالزيارة؟ | R14 · S06 |
| 2 | **الإشعارات:** قائمة قيم `Notification.type` غير معرّفة كـ enum. نحتاجها لأيقونة كل نوع والتنقل منه. | G03 · R32 |
| 4 | **لون التركيز (المرحلة 2):** `--color-focus` يساوي `info` الأزرق، ولا يعجب المستخدم. يُقرَّر مع الهوية، ولا يُغيَّر في المرحلة 1. | كل الحقول |


### قرارات منتج وتصميم (ليست للباك)

ما حُسم منها انتقل إلى «قرارات محسومة». المتبقي مؤجَّل بقرار المستخدم (12 تشرين الثاني) حتى ينتهي رسم الشاشات.

| # | السؤال | الشاشات |
|---|---|---|
| 12 | **المرحلة 2:** HEX الرسمي للهوية، والخط، والشعار. بانتظارها لاستبدال القيم في `@theme` (انظر أيضاً 4). | كل الشاشات |
| 13 | **Figma:** استبدال أقسام الـ13 يدوياً (عليك)، لأن `use_figma` محجوب بخطة Starter؛ `generate_figma_design` فقط يعمل. | الالتقاط |

---

## سجل التقدّم

| التاريخ | الشاشة أو المكوّن | الحالات بمفاتيحها | ملاحظة |
|---|---|---|---|
| 9 تشرين الثاني 2026 | الخطوة 1 · الإعداد | — | `globals.css` من 16.1 · `lib/loadable.ts` · `lib/format.ts` · `lib/api/types.ts` · `lib/design/ScreenStates` و`ScreenFrame` · `/` و`/foundations` |
| 9 تشرين الثاني 2026 | الخطوة 2 · اختبار الالتقاط | — | `Field` و`Input` و`DataTable` و`Sidebar` نسخ أولى فقط لاختبار `?capture=1` في `/capture-test`. لم تُعتمد، وتُستكمل حالاتها في الخطوتين 3 و4 |
| 9 تشرين الثاني 2026 | الخطوة 3 · الدفعة 1 | — | `Button` و`IconButton` و`Badge` و`StatusBadge` و`Skeleton` و`Spinner` في `/components`. بانتظار المراجعة |
| 10 تشرين الثاني 2026 | الخطوة 3 · الدفعة 2 | — | `Field`/`Input` (مكتمل) و`Textarea` و`SearchInput` و`MoneyInput` و`PhoneInput` و`NumberInput`، و`EmptyState` و`ErrorState` و`ForbiddenState` و`NotFoundState`، و`lib/api/error-messages.ts` (40 رمزاً)، و`formatPhone`. الزر: الدوار فوق النص، ورمزا `danger-hover` و`danger-pressed` في الثيم و`DESIGN.md`. بانتظار المراجعة |
| 10 تشرين الثاني 2026 | معرض الحقول | — | الحالات السبع لكل حقل مكدّسة بعرض 384 (`StateStack`) بدل أعمدة ضيقة قصّت القيمة. لا تغيير في أي مكوّن |
| 10 تشرين الثاني 2026 | الخطوة 3 · الدفعة 3 | — | `Select` و`Combobox` (واحد ومتعدد وبحث من الخادم) و`Checkbox` و`Radio` و`RadioCard` و`Switch` و`SegmentedControl` فوق Base UI، و`OptionList` للأجزاء المشتركة، و`fieldShellClass` مستخرج من `FieldShell`. كل مكوّن يلفّ نفسه بـ `DirectionProvider` (rtl). بانتظار المراجعة |
| 10 تشرين الثاني 2026 | الخطوة 3 · الدفعة 4 | — | `DatePicker` و`DateRangePicker` و`MonthPicker` فوق `Calendar` و`PickerField` (Popover من Base UI)، و`FileUpload` و`AttachmentList`. التواريخ نصوص ISO كما في العقد، وحسابها في `lib/calendar.ts` بلا مكتبة تواريخ. الورقة السفلية للموبايل مؤجلة إلى دفعة النوافذ (المحتوى مكوّنات مستقلة تُنقل إليها). بانتظار المراجعة |
| 10 تشرين الثاني 2026 | الخطوة 3 · الدفعة 5 | — | `Banner` و`Toast` (`ToastProvider` وuseToast) و`Dialog` و`ConfirmDialog` و`ReasonDialog` و`BottomSheet`، و`OverlayHost` (مضيف الطبقات: @container مع contain-layout) وهو جذر `ScreenFrame` وسيكون جذر DashboardShell. المنتقيات تفتح ورقة سفلية حين يقلّ عرض المضيف عن التابلت. بانتظار المراجعة |
| 10 تشرين الثاني 2026 | الخطوة 3 · الدفعة 6 | — | `Drawer` و`Menu` و`Popover` و`Tooltip` و`Tabs` و`Card` و`Avatar` و`PersonCell`. بهذه تنتهي مكوّنات `components/ui` وتنتظر المراجعة قبل الخطوة 4 |
| 10 تشرين الثاني 2026 | الخطوة 4 · الدفعة 4أ (الهيكل) | — | `DashboardShell` و`Sidebar` (مصغّرة 72 بـ tooltip، وكاملة 264، ودرج 300 `NavDrawer` على الموبايل) و`Topbar` و`Breadcrumbs` و`PageHeader` و`Stack` و`Section` و`Grid` (وضع التقاط يعكس الصفوف). `OverlayHost` يعرض `breakpoint`. قراران: المسار في الشريط العلوي، وقائمة المستخدم: الملف الشخصي وتسجيل الخروج. بانتظار المراجعة |
| 10 تشرين الثاني 2026 | الخطوة 4 · الدفعة 4ب (الجداول) | — | `DataTable` (مكتب وتابلت وبطاقات الموبايل، فرز، تحديد، كثافة، حالات) و`BulkBar` والخلايا الجاهزة (`cells.tsx`) و`Pagination` و`FilterBar` و`KpiTile` و`Chart` (Recharts، ثلاثة أنواع). مسوّدة DataTable أُعيد بناؤها كاملة. بانتظار المراجعة |
| 10 تشرين الثاني 2026 | الخطوة 4 · الدفعة 4ج (المخزون) | — | `BatchChip` (4 حالات) و`StockLine` (رصيد سالب بـ tooltip) و`LineItemsEditor` (FEFO، متاح، خطأ سطر، موقوفة/منتهية معطّلة، قراءة فقط، بطاقات الموبايل) و`BatchCell`، مع `item-types.ts` وأنواع `ItemRef`/`BatchRef`. بانتظار المراجعة |
| 10 تشرين الثاني 2026 | الخطوة 4 · الدفعة 4د (العمليات والقرار) | — | `StageTimeline` (أفقي على المكتب وعمودي على التابلت والموبايل، معيّن القرار، إغلاق مبكر) و`ActivityLog` و`DescriptionList` و`DecisionPanel` و`DecisionRecord` و`NotificationList`، مع `formatRelative`. **بهذه تنتهي مكوّنات الخطوة 4** وتنتظر مراجعتك. |
| 11 تشرين الثاني 2026 | الالتقاط الأول إلى Figma (الأساسيات ومكوّنات الويب) | — | التُقطت 8 أقسام للأساسيات و40 قسماً لمكوّنات الويب (بلا قسم رموز الخطأ)، كل قسم في Section مستقلة باسمها `NN · الاسم`. صفحات الرسم تدعم `?section=<id>` و`?sections=a,b,c` و`&clean=1` (يحذف الملاحظات المكتوبة للفريق للعرض على العميل) في `/components` و`/foundations` (`section=all`). الألوان قيم مباشرة لا مربوطة بـ variables بعد. |
| 11 تشرين الثاني 2026 | إعادة رفع 13 قسماً مصحّحاً إلى Figma | — | بعد إصلاح أرقام الهاتف والمبلغ في Input (عرض أوسع لصندوق النص في وضع الالتقاط وLRM قبل البادئة) وحذف التلميحات، رُفع كل قسم لوحده (field وselect وcombobox وdate-picker وdate-range-picker وmonth-picker وfile-upload وtoast وdialog وfloating وshell وdata-table وpagination) كإطار مستقل على صفحة «مكوّنات الويب» (العقد 33:2 إلى 45:2). الاستبدال مكان الأقسام القديمة يدوي لأن أدوات Figma MCP محجوبة بحدّ خطة Starter. |
| 11 تشرين الثاني 2026 | وضع المراجعة للزبون + G01 | `G01-default` · `G01-signing-in` · `G01-not-allowed` · `G01-account-disabled` · `G01-blocked` | `ReviewShell` و`ReviewHub` و`ScaledStage` في `lib/design/`، و`proxy.ts`. بُنيت G01 كأول شاشة لتجربة الغلاف: تحققت من التصغير داخل المنصّة (تفتح قائمة Select في مكانها) ومن الحجب والحماية بـ `REVIEW_MODE=1`. بانتظار موافقتك على الشكل قبل بقية الشاشات والنشر. |
| 11 تشرين الثاني 2026 | غلاف المراجعة المتجاوب | — | `ScreenFrame` بوضع `fluid` و`ReviewStage` (يحلّ محل `ScaledStage`) و`StateStepper` و`systemStates()` لإضافة حالات النظام (`loading` · `empty` · `error` · `forbidden`) لأي شاشة فيها داتا بسطر واحد. تحققت بنوافذ 1440 و1024 و768 و390 على إطار لوحة تجريبي: يتحول بين مكتب وتابلت (قائمة مصغّرة) وموبايل (درج وعمود واحد)، ولا تمرير أفقي، ويعمل السهمان وأزرار المقاس. حُذفت صفحات الاختبار المؤقتة. |
| 11 تشرين الثاني 2026 | G02 · إطار اللوحة | `G02-default` · `G02-executive` · `G02-delegate-active` · `G02-delegation-given` · `G02-tablet` · `G02-mobile-drawer` | `config/navigation.ts` (قائمة كل الأدوار بالصلاحيات، `navigationFor(me.permissions)`، 29 مفتاحاً مؤقتاً بقاعدة تسمية موحّدة) و`mocks/shell-users.ts` (11 دوراً، ويتحقق عند التحميل أن قائمة كل دور هي عناصره وحدها). `DashboardShell` صار يقبل `defaultMenuOpen`. أُنشئ `docs/backend-requests.md` ليُرسل للباك في آخر المطاف. فحصت المكتب والتابلت والموبايل ولا تمرير أفقي. |
| 11 تشرين الثاني 2026 | W01 · لوحة المستودع | `W01-default` · `W01-alerts` · `W01-worker` · `W01-loading` · `W01-empty` · `W01-error` · `W01-forbidden` | `WarehouseDashboardView` (خلايا المؤشرات الخمس وقوائم التنبيهات تحتها، وعامل المستودع يرى مهامه والجرد المسند إليه)، و`systemStates()` للحالات العامة، و`ShellScreen` (إطار الدور لصفحات الرسم)، وكيان `priority` في `status-map.ts`، و`mocks/warehouse-dashboard.ts`. فحصت المكتب والتابلت والموبايل ولا تمرير أفقي. |
| 11 تشرين الثاني 2026 | W02 · الأرصدة | `W02-default` · `W02-all-locations` · `W02-at-time` · `W02-worker` · `W02-loading` · `W02-empty` · `W02-error` · `W02-forbidden` | `StockBalancesView` (فلاتر الموقع والصنف والنوع، و«الرصيد في لحظة سابقة» بـ DatePicker وشريط Banner، وجدول بالدفعة وتاريخ الانتهاء والخارج بالطريق، وفراغ «لا أرصدة بعد» أو «لا نتائج للفلتر»). تعديلات مكوّنات: `FilterBar` صار `search` فيه اختيارياً وصفّه يلتف على التابلت، و`BatchChip` يلتف حين يضيق. غلاف تفاعلي في `app/` يرشّح بيانات المعرض. فحصت حدود عناصر الإطار بمقاسات 1440 و1024 و390 والمثبّتة، ولا فيض ولا أخطاء console. |
| 11 تشرين الثاني 2026 | إصلاح W02 و`FilterBar` | — | شارات الفلاتر المفعّلة في `FilterBar` تلتف على أسطر بدل التمرير الأفقي (مكوّن مشترك)، ومثال «موبايل بثلاثة فلاتر» في المعرض. وأكدت أن جدول W02 على التابلت (768 و890 و1100) بلا تراكب بين الخلايا. فحصت حدود العناصر وتقاطع خلايا الصف بنوافذ 390 و768 و890 و1100 و1280 و1440 والمثبّتة، ولا أخطاء console. |
| 11 تشرين الثاني 2026 | W03 · حركات المخزون | `W03-default` · `W03-from-balance` · `W03-loading` · `W03-empty` · `W03-error` · `W03-forbidden` | جدول مرقّم (44 حركة في المعرض، 3 صفحات) بأنواع العقد الأحد عشر في `status-map` (كيان `stockMovementKind`)، وفلاتر الموقع والصنف والفترة (والدفعة في «فلاتر أخرى»). الصف للقراءة فقط. جُرّبت بنوافذ 390 و768 و890 و1000 و1100 و1280 و1440 والمثبّتة: لا خروج عن الإطار ولا تراكب بين الخلايا ولا أخطاء console، والترقيم والفلاتر والفراغ المفلتر تعمل. |
| 11 تشرين الثاني 2026 | W04 · إدخال بضاعة | `W04-empty` · `W04-filled` · `W04-expired` · `W04-near-expiry` · `W04-batch-exists` · `W04-batch-mismatch` · `W04-validation-failed` · `W04-saved` · `W04-loading` · `W04-error` · `W04-forbidden` | نموذج بأسطر (العقد يقبل عدة أسطر بينما SCREENS يعرض سطراً، فاعتمدت العقد). القواعد تظهر قبل الإرسال بدفعات الصنف المعروفة: منتهٍ يمنع، وقريب الانتهاء يحتاج تأكيداً (`confirm_near_expiry`)، ودفعة موجودة بالتاريخ نفسه تُضاف، وبتاريخ مختلف تعارض. زر «إدخال» معطّل وسببه ظاهر. ملخص النتيجة بـ `batch_created`. مكوّن جديد `BatchEntryEditor` في المعرض (`?section=batch-entry`). تغيير في أدوات الرسم: تجميع «حالات النظام» صار بعلم `system` في الحالة لا بمفتاحها، لأن W04 تسمّي حالتها الخاصة `empty`. جُرّبت بنوافذ 390 و768 و890 و1100 و1280 و1440 والمثبّتة: لا خروج عن الإطار ولا أخطاء console. |
| 11 تشرين الثاني 2026 | W05 · سجل الإدخال | `W05-default` · `W05-details` · `W05-loading` · `W05-empty` · `W05-error` · `W05-forbidden` | جدول مرقّم (26 إدخالاً في المعرض، صفحتان) بصف لكل إدخال لأن الأسطر (صنف ودفعة وكمية) داخل الإدخال في العقد؛ النقر يفتح `Drawer` بالأسطر وشارة «دفعة جديدة/أُضيفت لدفعة موجودة». فلاتر الموقع والفترة، وزر «إدخال بضاعة». تنظيف مشترك: خلية `DateTimeStackCell` في `components/data/cells.tsx` (كانت محلية في W03)، وقائمة `ReceiptLinesList` مشتركة بين W04 وW05. جُرّبت بنوافذ 390 و768 و890 و1000 و1100 و1280 و1440 والمثبّتة: لا خروج عن الإطار ولا أخطاء console، والترقيم والدرج والفلاتر تعمل. |
| 11 تشرين الثاني 2026 | W06 · صرف جديد | `W06-empty` · `W06-agent` · `W06-rep` · `W06-type-mismatch` · `W06-suspended-batch` · `W06-insufficient` · `W06-from-sample-request` · `W06-saved` · `W06-loading` · `W06-error` · `W06-forbidden` | نموذج: المستودع، ثم المستلم (وكيل | مندوب) فتُصفّى الأصناف بنوعه، ثم أسطر `LineItemsEditor` بالدفعة المقترحة الأقرب انتهاءً. أسطر الصنف الذي لا يناسب المستلم تُعلَّم، وزر «اعتماد الصرف» معطّل بسبب ظاهر (المستلم، الأسطر، تعارض النوع، دفعة موقوفة، تجاوز المتاح). `from-sample-request` يقفل المستلم ويذكر المطلوب. `saved` بالمرجع وشارة «بالطريق». تعديل مشترك على `LineItemsEditor`: الصف ذو الأعمدة من 1280 فقط، وتحته بطاقة (الصنف بعرض كامل ثم الدفعة والمتاح والكمية بأسماء ظاهرة) لأن أعمدة التابلت ضاقت فاقتُطعت الدفعة؛ وعزل رقم الدفعة اتجاهياً في نص الخيار. جُرّبت بنوافذ 390 و768 و890 و1000 و1100 و1280 و1440 والمثبّتة. |
| 11 تشرين الثاني 2026 | إصلاح النوافذ العائمة على هاتف الزبون (مراجعة) | — | أرسل المستخدم لقطتين من iPhone: ورقة الفلاتر ودرج القائمة تظهران ملصوقتين بأسفل الصفحة ولا تغطيان الشاشة. السبب: `OverlayHost` يحمل `contain-layout` فيصير كتلة احتواء للطبقات `fixed`، والشاشة على الهاتف بطول الصفحة (5000px)، فتصير الطبقة بطولها وتلتصق الورقة السفلية بنهايتها والدرج ببدايتها. لم أره سابقاً لأن اختباري على 390 لم يفتح الطبقات؛ أعدت إنتاجه بمحاكاة iPhone (نقر «فلاتر» فانتقلت الصفحة إلى 4415 والدرج امتد 4600px). الإصلاح: `OverlayPortalContext` في `OverlayHost` (الإنتاج بلا مزوّد فلا تغيير)، و`ReviewStage` يرسم الطبقات في عنصر `fixed` بطول النافذة وبموضع الشاشة وعرضها (وعلى الهاتف بعرض النافذة)، فتظهر الأوراق والأدراج والمنتقيات في مكان نظر الزبون مهما تمرّر وتبقى داخل «إطار» الموبايل/التابلت المثبّت على الكمبيوتر. وقائمة التابلت الموسّعة تُرسم في الحاوية نفسها. وإصلاح شريط أبيض بعرض 36px على جانب القائمة في درج الموبايل (القائمة بعرض الدرج 300). جُرّبت على محاكاة iPhone: القائمة والفلاتر والفترة (ورقة فوق ورقة) وتفاصيل W05 ومنتقي التاريخ في W04 ومنتقي المستلم في W06، وإغلاقها بالنقر على الخلفية، وقفل التمرير خلفها. |
| 12 تشرين الثاني 2026 | استكمال ما ينقص العقد (W03 وW05) | `W05-reverse` | تصحيح لمخالفة قاعدة «ما ينقص العقد نبنيه ونسجّله»: فلتر النوع (`kind`) في W03، وفلتر الصنف والدفعة في W05، وزر «عكس الإدخال» بنافذة سبب إلزامي (`canReverse`، حالة `W05-reverse`)، كلها في الواجهة بصفة مؤقتة وطلبها في `docs/backend-requests.md`. وأُضيف أعلاه فهرس «ما أضفناه في الواجهات وليس في العقد» (§0)، وقسم «قرارات منتج وتصميم» في الأسئلة المفتوحة. |
| 12 تشرين الثاني 2026 | إغلاق الأسئلة المفتوحة | — | حُسمت القرارات 1–9 في «قرارات محسومة». طُبّق منها: `CUSTOMER_RETURN` = «مرتجع صيدلية»، و«من» في W06 يُقفل بمستودع واحد، وحالة `W03-from-balance` بالموقع والصنف والدفعة، وتمرير `location_id` من W02. المؤجَّل: هوية المرحلة 2 (HEX والخط والشعار) ورفع Figma، ولون التركيز. وبقي سؤالا الباك (صورة الزيارة وأنواع الإشعارات) يُرسلان مع الملف النهائي. |
| 12 تشرين الثاني 2026 | W07 · الصرف | `W07-default` · `W07-unconfirmed` · `W07-loading` · `W07-empty` · `W07-error` · `W07-forbidden` | جدول مرقّم (26 صرفاً، صفحتان) بالرقم والمستلم (ونوعه) والتاريخ والكمية والحالة وساعات بالطريق مع شارة تحذير «أكثر من 48 ساعة». بحث برقم الصرف أو المستلم (`q` مقترح)، وفلاتر الحالة والمستلم والفترة، وفلتر «بالطريق أكثر من 48 ساعة» يرسل `in_transit_over_hours` (موجود في العقد؛ صحّحتُ سؤال W01 §4.2). نقلتُ `TransferFormView` (W06) إلى `features/transfers/views` (مجلد باسم موضوع العقد). جُرّبت بنوافذ 390 و768 و890 و1000 و1100 و1280 و1440 والمثبّتة وبمحاكاة iPhone لورقة الفلاتر: لا خروج عن الإطار ولا تراكب ولا console، والبحث والفلاتر وغير المؤكَّد (3 صرفيات) والترقيم تعمل. |
| 12 تشرين الثاني 2026 | W08 · تفاصيل الصرف | `W08-in-transit` · `W08-cancel` · `W08-received` · `W08-cancelled` · `W08-overdue-48h` · `W08-not-found` · `W08-loading` · `W08-error` · `W08-forbidden` | رأس بالمرجع وشارة الحالة، وشريط تحذير للمتأخر (48 ساعة)، وشريط للملغى (من ألغى ولماذا)، وبطاقات: التفاصيل (المستلم والمستودع ومن أنشأ وطلب العينات المرتبط) والأسطر (`StockLine` والمجموع) والسجل (`ActivityLog` من حقول الصرف). «إلغاء الصرف» للوجستي بنافذة سبب إلزامي، والتأكيد يحوّل الصرف إلى «ملغى» فيرى الزبون النتيجة. تصحيح: `GET /settings` موجود ويُرجع `expiry_alert_days` و`transfer_unconfirmed_alert_hours`، فصحّحتُ ما كتبته أنه ناقص (W04 §7.2 والفهرس وW07 §10.2 وحقول handoff). جُرّبت بنوافذ 390 و768 و890 و1000 و1100 و1280 و1440 والمثبّتة ومحاكاة iPhone: لا خروج عن الإطار ولا console. |
| 12 تشرين الثاني 2026 | W08 · قرارات النقاش | `W08-receipt-rejected` | حالة جديدة: صرف عينات لمندوب (TRF-000149) أُلغي ثم رُفض تأكيده: شريط تنبيه بزر «صرف جديد» وحدث «رُفض تأكيد استلام سامر الحلبي لأن الصرف مُلغى» في السجل. prop جديد `rejectedReceipts` (مؤقت حتى يوفّره الباك) و`onNewTransfer`. وسُجّلت القرارات 10–12، وصار طلب الإشعار والحقل `rejected_receipts` في `docs/backend-requests.md` §11.4 وفهرس §0. جُرّبت بنوافذ 1440 و890 و390 (iPhone): لا خروج عن الإطار ولا console. |
| 12 تشرين الثاني 2026 | W09 · طلبات العينات | `W09-default` · `W09-loading` · `W09-empty` · `W09-error` · `W09-forbidden` | جدول مرقّم (22 طلباً: 6 جديد، 5 مصروف، 6 مرفوض، 5 ملغى؛ صفحتان) بالمندوب والطالب والأصناف (الأول وعدد الأسطر) والسبب والتاريخ والحالة. فلاتر الحالة والمندوب (`rep_id` = معرّف المستخدم من `location.user.id`) والفترة (`from`/`to` مقترحان). الصف يفتح W10. عدّلتُ W08 ليربط الصرف TRF-000156 بالطلب #17 المصروف (كان مربوطاً بالطلب #21 الجديد في W06). جُرّبت بنوافذ 390 و768 و890 و1000 و1100 و1280 و1440 والمثبّتة ومحاكاة iPhone: لا خروج عن الإطار ولا تراكب ولا console، والفلاتر (جديد = 6) والمندوب (7 لعمر الخطيب) والترقيم تعمل. |
| 12 تشرين الثاني 2026 | W10 · تفاصيل طلب العينات | `W10-new` · `W10-reject` · `W10-dispatched` · `W10-rejected` · `W10-cancelled` · `W10-not-found` · `W10-loading` · `W10-error` · `W10-forbidden` | رأس بالحالة و«رفض» و«صرف» للجديد فقط، وشرائط للمرفوض (السبب) والمصروف (رابط الصرف وتنبيه إن صُرف أقل من المطلوب) والملغى (ألغاه الطالب)، وبطاقات التفاصيل والأصناف (المطلوب والمصروف وشارة «أقل من المطلوب») والسجل من حقول الطلب. «رفض» يفتح `ReasonDialog` (السبب إلزامي). بذلك ينتهي القسم 03. **تصحيح:** مفتاح عنصر «طلبات العينات» في القائمة صار `transfers.create` (مؤكَّد في العقد) بدل `sample_requests.manage`، فصارت المفاتيح المؤقتة 28. أُضيف في الواجهة وسُجّل للباك: `decided_by` و`transfer_reference` وإشعار الطالب (§13). |
| 15 تشرين الثاني 2026 | W11 · طلبات السحب | `W11-default` · `W11-new-form` · `W11-new-form-filled` · `W11-new-form-validation` · `W11-loading` · `W11-empty` · `W11-error` · `W11-forbidden` | جدول مرقّم (16 طلباً: 7 مطلوب، 7 مسلَّم، 2 ملغى) بالمندوب والأصناف والسبب والتاريخ والحالة، وفلاتر الحالة والمندوب. «طلب سحب» يفتح نافذة: مندوب (الفعّال وحده)، ومستودع الاستلام (واحد فيُقفل)، وسبب إلزامي، وأصناف من رصيد المندوب نفسه بدفعاتها (الموقوفة معلّمة ومسموحة كما في العقد). الزر معطّل وسببه ظاهر. الإرسال يضيف الطلب للقائمة. تصحيح: مفتاح عنصر «طلبات السحب» صار `withdraw.create` (مؤكَّد) بدل `withdraw.confirm_on_behalf`، فصارت المفاتيح المؤقتة 27. |
| 15 تشرين الثاني 2026 | W12 · تفاصيل طلب السحب | `W12-requested` · `W12-cancel` · `W12-handed-over` · `W12-cancelled` · `W12-rep-deactivated` · `W12-on-behalf` · `W12-handed-over-on-behalf` · `W12-not-found` · `W12-loading` · `W12-error` · `W12-forbidden` | رأس بالحالة و«إلغاء الطلب» (بسبب) و«تأكيد الاستلام عنه» (للمندوب المعطَّل فقط). شرائط لكل حالة، وبطاقات التفاصيل والأصناف (المطلوب والفعلي وشارة «أقل/أكثر من المطلوب») والسجل. نافذة التأكيد عن المندوب بكمية فعلية لكل سطر والمجموع مقابل المطلوب، والزر معطّل حتى تكتمل. أُضيف في الواجهة وسُجّل للباك: حالة المندوب (`repActive`) و`cancelled_at` (§15). |
| 15 تشرين الثاني 2026 | W13 · إرجاعات الوكلاء | `W13-in-transit` · `W13-details` · `W13-confirm` · `W13-received` · `W13-loading` · `W13-empty` · `W13-error` · `W13-forbidden` | قائمة مرقّمة بالإرجاعات بالطريق (5) والمستلمة (4) بالوكيل والأصناف والسبب والوجهة والاعتماد، وفلتر الحالة والوكيل. الصف يفتح درجاً بالأسطر ودفعاتها (منها موقوفة) والسبب ومن اعتمد، وزر «تأكيد الاستلام» ونافذة تشرح أنه كامل بلا جزئي؛ التأكيد يحوّل الإرجاع إلى «مستلم». بذلك ينتهي القسم 04. أسئلة في §16. |
| 15 تشرين الثاني 2026 | W14 · الجرد | `W14-default` · `W14-new-form` · `W14-new-form-filled` · `W14-new-form-validation` · `W14-worker` · `W14-loading` · `W14-empty` · `W14-error` · `W14-forbidden` | جدول مرقّم (15 جرداً: قيد العدّ ومرسل ومعتمد وملغى) بالموقع والمكلَّف والتاريخ وعدد الأسطر التي فيها فرق والحالة، وفلاتر الحالة والموقع والمكلَّف. «جرد جديد» يفتح نافذة (الموقع، وإسناد اختياري، وملاحظة) والإنشاء يضيف الجرد قيد العدّ. عامل المستودع يرى المسنَد إليه وحده بلا زر إنشاء. مصدر عمال الإسناد غير موجود في العقد (§17.5). |
| 15 تشرين الثاني 2026 | W15 · العدّ | `W15-in-progress` · `W15-line-saved` · `W15-with-diff` · `W15-submit` · `W15-submitted` · `W15-returned` · `W15-cancel` · `W15-cancelled` · `W15-worker` · `W15-not-found` · `W15-loading` · `W15-error` · `W15-forbidden` | بطاقة «عدّ صنف» (الصنف، والدفعة الموقوفة منها قابلة للعدّ، والكمية الفعلية) تحفظ السطر فور إدخاله فيظهر بمتوقعه وفرقه (مطابق · نقص · زيادة)، وملخص الفروق. الاستبدال بالصنف والدفعة نفسيهما. الإرسال بتأكيد يقفل الأسطر، والإلغاء بسبب إلزامي، والعامل يعدّ ويرسل ولا يلغي. الجرد المُرجَع يعرض السبب والأسطر القديمة في بطاقة منفصلة. السجل من حقول الجرد (بلا فاعل للإرسال ولا وقت للإلغاء: §18.2). |
| 15 تشرين الثاني 2026 | W16 · اعتماد الجرد | `W16-awaiting-me` · `W16-return-dialog` · `W16-returned` · `W16-approved` · `W16-approved-delegated` · `W16-self-decision-forbidden` · `W16-approve-failed` · `W16-not-found` · `W16-loading` · `W16-error` · `W16-forbidden` | شاشة W15 للمدير التنفيذي: ملخص الفروق ولوحة القرار («اعتماد»، «إرجاع لإعادة العدّ» بسبب)، وبعد الاعتماد بطاقة القرار (ومنها «بالتفويض عن المدير التنفيذي»). جرد المفوَّض نفسه: اللوحة معطّلة وسببها. فشل الاعتماد (409 invalid_status) بشريط. بذلك ينتهي القسم 05. أسئلة في §19. |
| 15 تشرين الثاني 2026 | W17 · الدفعات | `W17-default` · `W17-suspended-filter` · `W17-loading` · `W17-empty` · `W17-error` · `W17-forbidden` | جدول مرقّم (24 دفعة، صفحتان) بالصنف ورقم الدفعة وتاريخ الانتهاء (شارة «تنتهي بعد N يوماً» ضمن 60 يوماً و«منتهية منذ N يوماً») والكمية الكلية (المستلمة) وما بقي في المستودع والحالة، وفلاتر الصنف والحالة و«المتوفرة فقط». الصف يفتح W18. تصحيح: مفتاح عنصر «الدفعات» صار `batches.suspend` (مؤكَّد) بدل `batches.view`، فصارت المفاتيح المؤقتة 26. أسئلة في §20. |
| 15 تشرين الثاني 2026 | W18 · تفاصيل الدفعة | `W18-active` · `W18-suspend` · `W18-suspended` · `W18-unsuspend` · `W18-suspended-logistics` · `W18-suspend-failed` · `W18-not-found` · `W18-loading` · `W18-error` · `W18-forbidden` | بيانات الدفعة، وبطاقة «الكمية في كل موقع» (من `/stock/balances?batch_id=`)، وسجل الإيقاف والفك (مع شارة التفويض). «إيقاف الدفعة» بسبب إلزامي لا ينقص رصيداً، و«فك الإيقاف» للمدير التنفيذي وحده بسبب. عند اللوجستي زر الفك معطّل وسببه ظاهر في شريط. 409 يظهر تحت السبب. أسئلة في §21. |
| 15 تشرين الثاني 2026 | W19 · تقرير تتبع السحب | `W19-default` · `W19-distributed-after` · `W19-exporting` · `W19-not-found` · `W19-loading` · `W19-error` · `W19-forbidden` | الباقي في كل موقع (مع ما بالطريق)، وما وصل لكل عميل عبر وكيله بتاريخه وهاتفه، والتوزيع في الزيارات مع شارة «بعد الإيقاف» وشريط تنبيه بمجموعه. تصدير PDF وExcel. بذلك ينتهي القسم 06. أسئلة في §22 (أولوية: `suspended_at`). |
| 15 تشرين الثاني 2026 | W20 · تقرير تالف المستودع | `W20-empty` · `W20-filled` · `W20-uploading` · `W20-suspended-batch` · `W20-insufficient` · `W20-validation-failed` · `W20-submitted` · `W20-loading` · `W20-error` · `W20-forbidden` | نموذج بصفحة: موقع المستودع (تبديله يفرغ الأسطر)، والسبب من `damage_reasons` (إلزامي)، وملاحظة، وأسطر `LineItemsEditor` (الدفعة الموقوفة مسموحة ومعلَّمة «موقوفة» مع شريط، والكمية ≤ المتاح)، وصور مرفقة (حتى 5، 10MB: حدّ مؤقت §23.2) بتقدّم الرفع. الزر معطّل وسببه ظاهر. بعد الرفع ملخص «بانتظار القرار». تعديلان على مكوّنين: `LineItemsEditor` يعلّم الدفعة الموقوفة باسمها حين تُسمح (فاستفاد منه W11 أيضاً)، و`AttachmentList` صار `size` فيه اختيارياً. أسئلة في §23. |
| 15 تشرين الثاني 2026 | W21 · تقارير تالف المستودع | `W21-default` · `W21-pending-filter` · `W21-loading` · `W21-empty` · `W21-error` · `W21-forbidden` | جدول مرقّم (14 تقريراً، 4 معلّق و7 تالف مقبول و3 مرفوض) بالأحدث أولاً، والمسؤولية للمقبول وحده بسطر توضيح تحت الجدول «للعلم لا ذمة مالية»، وفلاتر الحالة (بدون `RESTOCKED`) والموقع. «تقرير تالف» يفتح W20، والصف M08 للقراءة. تصحيح: مفتاح عنصر «التالف» صار `damage.create` (مؤكَّد) بدل `damage.view`، فصارت المفاتيح المؤقتة 25. بذلك ينتهي القسم 07. أسئلة في §24. |
| 16 تشرين الثاني 2026 | S01 · لوحة السوبرفايزر | `S01-default` · `S01-attendance-alerts` · `S01-loading` · `S01-error` · `S01-forbidden` | خمس `KpiTile` قابلة للضغط: الزيارات اليوم (5 من 15) والدوام (3 من 3) وتقارير بانتظار تقييمي (5، وأقربها تجاوز المهلة) وطلبات الإجازة (2) وتنبيهات الدوام. وجدول تنبيهات الدوام (ناقص أو غياب) أو «لا تنبيهات». المؤشرات محسوبة من القوائم (§25.1). |
| 16 تشرين الثاني 2026 | S02 · التقارير اليومية | `S02-supervisor` · `S02-read-only` · `S02-loading` · `S02-empty` · `S02-error` · `S02-forbidden` | 14 تقريراً: بانتظار التقييم أولاً (5) بـ«متبقٍّ N ساعات» أو «متأخر»، ثم المقيَّمة بدرجتها وبعد المهلة إن لزم. فلاتر المندوب والفترة والحالة وترقيم. مدير المكتب العلمي يقرأ كل المندوبين بلا وقت متبقٍّ. أُضيف `daily_reports.view` مؤقتاً لعنصر القائمة (§26.1) فصارت المفاتيح المؤقتة 26. |
| 16 تشرين الثاني 2026 | S03 · تقييم التقرير اليومي | `S03-default` · `S03-confirm` · `S03-rated` · `S03-late-rating` · `S03-rating-locked` · `S03-not-found` · `S03-loading` · `S03-error` · `S03-forbidden` | بيانات التقرير، وجدول زيارات اليوم، والملخص (أرقام وأسباب عدم اللقاء وأبرز نتيجة ومشكلة وخطة الغد)، ثم التقييم: `Radio` بالسلّم الموحّد (ممتاز 100 … ضعيف 20) وملاحظة وزر «حفظ التقييم» (معطّل وسببه ظاهر). التأكيد «يُقفل بعد الحفظ»، وبعده شريط قفل وقراءة و«إضافة ملاحظة». «متأخر» عند تجاوز المهلة، و409 `rating_locked` بشريط. لا مكوّن جديد غير `rating-scale.ts` (تسميات السلّم). |
| 16 تشرين الثاني 2026 | S04 · الدوام | `S04-default` · `S04-short-day` · `S04-absent` · `S04-auto-closed` · `S04-loading` · `S04-empty` · `S04-error` · `S04-forbidden` | 22 صفاً (جلسات وغياب) من الأحدث بالبدء والانتهاء والمدة و«يوم كامل؟» والعلامات (إغلاق آلي، عطلة، دوام ناقص، غياب، جارية). مفتاح «العرض» يُظهر الحالات الثلاث. سطر «الخصم قرار يدوي». بذلك تنتهي الدفعة الأولى من القسم 01 (S01–S04). أسئلة في §28 (أولوية: الغياب). |
| 16 تشرين الثاني 2026 | S05 · الزيارات | `S05-list` · `S05-map` · `S05-flagged-filter` · `S05-loading` · `S05-empty` · `S05-error` · `S05-forbidden` | قائمة مرقّمة (80 زيارة) من الأحدث بالجهة والوقت والمدة والمسافة وحالة التحقق وعلاماتها، وخريطة وهمية بنقاط البدء والإنهاء مع بطاقة الزيارة المحددة. فلاتر المندوب والفترة والتحقق. مكوّن جديد `MapPlaceholder` في المعرض (`map`)، و`flag-types.ts` لأسماء العلامات. خريطة الصفحة الحالية وحدها (§29.1). |
| 16 تشرين الثاني 2026 | S06 · تفاصيل الزيارة | `S06-read-only` · `S06-qa-flagged` · `S06-confirm` · `S06-reject` · `S06-confirmed` · `S06-rejected` · `S06-photo-pending` · `S06-already-decided` · `S06-not-found` · `S06-loading` · `S06-error` · `S06-forbidden` | بيانات الزيارة وما وُزِّع والصورة وحالة رفعها والموقعان بالمسافة ونطاق التحقق والعلامات. المراقبة تقرر على المشكوك فيها: «تأكيد الزيارة» (تأكيد بلا سبب) و«رفض الزيارة» (سبب إلزامي في الواجهة، اختياري في العقد) ثم سجل القرار. للسوبرفايزر شريط «بانتظار المراقبة». أُضيف مستخدم `monitoring` وprop `approveLabel`. أسئلة في §29. |
| 16 تشرين الثاني 2026 | S07 · صفحة المندوب | `S07-default` · `S07-negative-balance` · `S07-partial-error` · `S07-not-found` · `S07-loading` · `S07-error` · `S07-forbidden` | سامر الحلبي: بياناته ودوام اليوم وزياراته ورصيده (السالب بشريط وشارة) وما وزّعه وآخر تقاريره ونقاطه الشهرية (مبدئية ونهائية). بذلك ينتهي القسم 01 (السوبرفايزر). أسئلة في §30. |
| 16 تشرين الثاني 2026 | S08 · العلامات | `S08-default` · `S08-by-type` · `S08-near-deadline` · `S08-closed` · `S08-loading` · `S08-empty` · `S08-error` · `S08-forbidden` | 13 علامة (مفتوحة 10 ومغلقة 4: لا مشكلة ومؤكَّدة ومحوّلة وزال سببها) مجمّعة حسب الشخص: الأكثر علامات مفتوحة أولاً. لكل علامة النوع والسجل المرتبط والعمر والمهلة. الصف يفتح S09. أُصلح تصريف «ساعة/ساعات» في `lib/deadline.ts` (14 ساعة) وأُضيفت `flagDeadline`. |
| 16 تشرين الثاني 2026 | S09 · معالجة العلامة | `S09-open` · `S09-stock-discrepancy` · `S09-clock-skew` · `S09-attendance` · `S09-auto-cleared` · `S09-escalated` · `S09-visit-flag` · `S09-already-decided` · `S09-linked-error` · `S09-loading` · `S09-error` · `S09-forbidden` | درج بنوع العلامة وتفاصيلها والسجل المرتبط، ونهايات المعالجة الثلاث وملاحظة وعنوان اختياري لملف التحقيق. «حفظ القرار» معطّل حتى تُختار نهاية. بعد الحفظ سجل القرار ورابط الملف للمحوّلة. علامات الزيارة والجهات تُحال. أُضيف `flags.decide` للمراقبة. |
| 16 تشرين الثاني 2026 | S10 · الجهات الجديدة | `S10-default` · `S10-reject` · `S10-bulk-reject` · `S10-already-decided` · `S10-loading` · `S10-empty` · `S10-error` · `S10-forbidden` | ثلاث جهات بانتظار المراجعة: «مقبولة» (تخرج) و«مرفوضة» (سبب إلزامي) والتحديد والرفض الجماعي بشريط `BulkBar` وسبب إلزامي وشريط «رُفضت N زيارة». |
| 16 تشرين الثاني 2026 | S11 · دمج جهتين | `S11-default` · `S11-confirm` · `S11-not-duplicate` · `S11-merge-failed` · `S11-not-found` · `S11-loading` · `S11-error` · `S11-forbidden` | جهتان (الشفا والشفاء بفارق 15 م) بالمقارنة، واختيار الباقية، و«دمج» بتأكيد وشريط نجاح، و«ليستا مكررتين». |
| 16 تشرين الثاني 2026 | S12 · شكاوى الموقع | `S12-default` · `S12-details` · `S12-loading` · `S12-empty` · `S12-error` · `S12-forbidden` | تسع شكاوى (4 عولجت و5 جديدة) بفلتر الحالة وترقيم ودرج للقراءة. بذلك ينتهي القسم 02 (المراقبة) وتنتهي S08 إلى S12. أسئلة في §31 إلى §35. |
| 16 تشرين الثاني 2026 | S13 · ملفات التحقيق | `S13-default` · `S13-executive` · `S13-awaiting` · `S13-loading` · `S13-empty` · `S13-error` · `S13-forbidden` | اثنا عشر ملفاً سرياً بعنوانها وموظفها ومرحلتها وتاريخ فتحها، وشريط السرية، وفلتر الحالة وترقيم. المراقبة بـ«فتح ملف» والمدير التنفيذي للقراءة. أُضيف عنصر «التحقيقات» لدور المدير التنفيذي في القائمة. |
| 16 تشرين الثاني 2026 | S14 · فتح ملف تحقيق | `S14-direct` · `S14-from-flag` · `S14-validation` · `S14-submitting` · `S14-forbidden` | الموظف والعنوان والوصف، ومن علامة تُقفل الموظف وتظهر العلامة المصدر. «فتح الملف» معطّل وسببه ظاهر. |
| 16 تشرين الثاني 2026 | S15 · ملف التحقيق | `S15-stage-1` · `S15-stage-4` · `S15-stage-7` · `S15-awaiting-decision` · `S15-executive-decision` · `S15-decision-confirm` · `S15-decided` · `S15-closed-no-violation` · `S15-close-dialog` · `S15-submit-confirm` · `S15-invalid-status` · `S15-delegate-forbidden` · `S15-not-found` · `S15-loading` · `S15-error` · `S15-forbidden` | ملف سري بثماني مراحل: نموذج المرحلة (ملخص ومستندات)، وإغلاق «لا مخالفة» (سبب إلزامي)، والمرحلة 7 بتصنيف من الخمسة وإجراء مقترح و«رفع للقرار» بتأكيد، وبطاقة قرار المدير التنفيذي (نص إلزامي وخصم اختياري بتأكيد)، وسجل القرار. أُضيف `classification.ts` و`investigation-stages.ts`. بذلك ينتهي القسم 03 وتنتهي مجموعة S كلها (S01 إلى S15). أسئلة في §36 إلى §38. |
| 16 تشرين الثاني 2026 | M01 · لوحة مدير المبيعات | `M01-default` · `M01-provisional` · `M01-loading` · `M01-empty` · `M01-error` · `M01-forbidden` | خمس بطاقات (التحصيل، العملاء الجدد، إعادة الطلب، زياراتي، بانتظار قراري) والمبيعات لكل منتج ولكل وكيل مقابل أهدافها. الافتراضي شهر مغلق، و`provisional` الشهر الجاري، و`empty` بلا خطة. وُسِّع `Chart` بـ`targetKey`. أُضيف مستخدم `sales_manager` إلى مستخدمي الإطار. |
| 16 تشرين الثاني 2026 | M02 · الوكلاء | `M02-default` · `M02-loading` · `M02-empty` · `M02-error` · `M02-forbidden` | ستة وكلاء (بينهم معطّل) بمحافظاتهم ورصيدهم ومبيعاتهم ومستحقهم. بحث وفلتر محافظة وترقيم. |
| 16 تشرين الثاني 2026 | M03 · صفحة الوكيل | `M03-default` · `M03-balances` · `M03-deliveries` · `M03-receivables` · `M03-returns` · `M03-deactivated` · `M03-return-form` · `M03-return-filled` · `M03-return-validation` · `M03-return-created` · `M03-not-found` · `M03-loading` · `M03-error` · `M03-forbidden` | بيانات الوكيل وخمسة تبويبات، والوكيل المعطّل بشريطه وزر الإرجاع عنه ونموذج الإرجاع المشترك (بأسطره من الرصيد) وملخصه. |
| 16 تشرين الثاني 2026 | M04 · العملاء | `M04-default` · `M04-loading` · `M04-empty` · `M04-error` · `M04-forbidden` | 24 عميلاً بوكيلهم ومحافظتهم وهل هم مربوطون بجهة زيارة. |
| 16 تشرين الثاني 2026 | M07 · المستحقات | `M07-default` · `M07-refer` · `M07-referred` · `M07-refer-conflict` · `M07-loading` · `M07-empty` · `M07-error` · `M07-forbidden` | التحصيل لكل وكيل (بطاقة تفلتر الجدول)، والتسليمات غير المسدّدة (المتأخر أولاً) و«إحالة للقانوني» بنافذة، والمحال يعرض رقم نزاعه، وتعارض 409. |
| 16 تشرين الثاني 2026 | M11 · رسائل الموقع | `M11-default` · `M11-details` · `M11-handle` · `M11-handled` · `M11-already-handled` · `M11-loading` · `M11-empty` · `M11-error` · `M11-forbidden` | 17 رسالة بأنواعها الثلاثة، الجديدة أولاً، بفلتر النوع والحالة ودرج ونافذة «تعليم: عولجت» بملاحظة إلزامية. أُضيف `site-message-types.ts`. بذلك تنتهي الدفعة الأولى من قسم مدير المبيعات؛ تبقى M05 وM06 وM08 وM09 وM10 للدفعة الثانية. أسئلة في §39 إلى §44. |
| 16 تشرين الثاني 2026 | M05 · صفحة العميل | `M05-default` · `M05-payment` · `M05-returns` · `M05-rep-visits` · `M05-my-visits` · `M05-unlinked` · `M05-not-found` · `M05-loading` · `M05-error` · `M05-forbidden` | بيانات العميل وجهة الزيارة المربوطة، وخمسة أقسام للقراءة. العميل غير المربوط بلا زيارات مندوبين. الـview مشترك مع A07. |
| 16 تشرين الثاني 2026 | M06 · التسليمات | `M06-read-only` · `M06-filter-unpaid` · `M06-details` · `M06-approval-pending-view` · `M06-paid` · `M06-written-off` · `M06-cancelled` · `M06-referred` · `M06-not-found` · `M06-loading` · `M06-empty` · `M06-error` · `M06-forbidden` | قائمة التسليمات وتفاصيلها للقراءة بلا زر قرار: طلب الإلغاء والشطب يراه مدير المبيعات وقراره للمدير التنفيذي. الـviews مشتركة مع A09 وA10. |
| 16 تشرين الثاني 2026 | M08 · قرارات المرتجع والتالف | `M08-list` · `M08-customer-return` · `M08-customer-return-damaged` · `M08-agent-damage` · `M08-warehouse-damage` · `M08-agent-return` · `M08-reject-dialog` · `M08-already-decided` · `M08-decided` · `M08-no-permission` · `M08-loading` · `M08-empty` · `M08-error` · `M08-forbidden` | أربعة تبويبات بعدّاد المعلّق، ودرج قرار لكل نوع (أُعيد للمخزون · تالف بمسؤولية · اعتماد · رفض بسبب)، و409 `already_decided` بسجل القرار الساري. أُضيف `return-kinds.ts`. |
| 16 تشرين الثاني 2026 | M09 · زيارة جديدة | `M09-default` · `M09-locating` · `M09-location-denied` · `M09-ready` · `M09-validation` · `M09-saved` · `M09-forbidden` | نموذج الزيارة بموقع المتصفح الإلزامي: الطلب والرفض («فعّل الموقع») ولا حفظ بلا موقع. موبايل أولاً. |
| 16 تشرين الثاني 2026 | M10 · زياراتي | `M10-default` · `M10-no-goal` · `M10-loading` · `M10-empty` · `M10-error` · `M10-forbidden` | عدد زياراتي مقابل هدف الشهر (13 من 20) وقائمتها بفلتر الفترة. موبايل أولاً. بذلك ينتهي القسم 01 (مدير المبيعات M01–M11)؛ تبقى A07 وA09 وA10 وA13 وA16 لمجموعة A بأفعال الوكيل. أسئلة في §45 إلى §49. |
| 17 تشرين الثاني 2026 | M12–M18 · مدير المكتب العلمي | `M12` · `M13` · `M14` · `M15` · `M16` · `M17` · `M18` (المفاتيح في جدول القسم) | بُنيت الشاشات السبع بإعادة استعمال W09 (طلبات العينات) وأنماط M01 والزيارات. Views جديدة: `ScientificDashboardView` و`RepsListView` و`VisitPointsListView` و`VisitPointDetailsView` و`MarketIntelView` و`RepSampleBalancesView` و`SampleRequestFormView`، و`intel-types.ts`. بذلك ينتهي القسم 02 ومجموعة المديرين M. أسئلة في §50 إلى §55. |
| 17 تشرين الثاني 2026 | E01–E02 · اللوحة والمتابعة | `E01-default` · `E01-provisional` · `E02-audit` · `E02-access` · `E02-details` · `E02-monitoring` والحالات العامة | لوحة المدير التنفيذي (للعرض لا للتقييم) وسجل التدقيق بتبويب الاطلاع على السري ودرج التغييرات. بذلك ينتهي القسم 01 من مجموعة E. أسئلة في §56 و§57. |
| 17 تشرين الثاني 2026 | E03–E05 · الميزانية والبنود والخصومات | `E03-default` · `E03-edit` · `E03-missing-actual` · `E03-closed` · `E04-default` · `E04-form` · `E04-system` · `E05-default` · `E05-new-form` · `E05-reverse` · `E05-month-closed` والحالات العامة | الدفعة الأولى من القسم 02؛ تبقى E06–E09. أسئلة في §58 و§59. |
| 17 تشرين الثاني 2026 | E06–E09 · الإغلاق والتقييم والنقاط وموظف الشهر | `E06-open` · `E06-waiting` · `E06-closed` · `E07-default` · `E07-incomplete` · `E07-locked` · `E08-provisional` · `E08-final` · `E09-default` · `E09-tie` · `E09-skipped` · `E09-choose-other` · `E09-approved` · `E09-month-not-closed` والحالات العامة | بذلك ينتهي القسم 02 (E03–E09). أسئلة في §60 إلى §63. |
| 17 تشرين الثاني 2026 | E10–E12 · الأصناف والأسعار | `E10-default` · `E10-disabled-filter` · `E11-empty` · `E11-product-site` · `E11-validation` · `E12-product` · `E12-sample` · `E12-new-price` · `E12-past-date` · `E12-disable` · `E12-disabled` والحالات العامة | أُضيف `components/data/portfolio.ts`. وأُزيلت `@tablet:` من views هذه الجلسة (الميزانية والنقاط وطلب العينات) التزاماً بقاعدة الـ responsive. أسئلة في §64 إلى §66. |
| 17 تشرين الثاني 2026 | E13–E15 · الإعدادات العامة والقوائم والعطل | `E13-default` · `E13-edit` · `E13-verification-note` · `E14-default` · `E14-form` · `E14-system-entry` · `E15-default` · `E15-form` · `E15-past` والحالات العامة | أُضيف `features/settings/components/SettingsTabs.tsx` (أقسام الإعدادات E13–E17 تبويبات تحت عنصر «الإعدادات»)، و`components/data/list-keys.ts` (أسماء مفاتيح القوائم وتصنيف المناطق)، و`weights_must_total_100` في `error-messages.ts`. أسئلة في §67 إلى §69. |
| 18 تشرين الثاني 2026 | E16–E18 · الأوزان والهيكل الجغرافي والتفويض | `E16-default` · `E16-edit` · `E16-sum-error` · `E16-next-month-note` · `E17-default` · `E17-form` · `E17-move` · `E18-none` · `E18-active` · `E18-form` · `E18-overlap` والحالات العامة | انتهت مجموعة المدير التنفيذي (E01–E18). أُضيف `delegatedTo` إلى `ShellScreen` (شريط «فوّضت …» في E18). `delegation_overlap` بـ 409 كما في العقد (SCREENS تقول 422). أسئلة في §70 إلى §72. |

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
| `data` | NotificationList | 10.16 | 👀 |
| `site` | SiteHeader · Hero · ProductCard · ProductDetail · AgentsByGovernorate · ContactForm · BreastfeedingNotice · SiteFooter | 14 | ⬜ |

---

## المشترك في الويب — G

### 01 · الدخول والإطار — G01 إلى G05

| # | الشاشة | الحالات (المفاتيح) | العقد | ملاحظات | الحالة |
|---|---|---|---|---|---|
| G01 | تسجيل الدخول · موبايل | `default` · `signing-in` · `not-allowed` · `account-disabled` · `blocked` | Clerk، ثم `GET /me` | `/shared/g01-sign-in`، والـ view في `features/auth/views/SignInView.tsx`. رموز الرفض: `account_not_provisioned` و`account_disabled` و`email_blocked` | 👀 |
| G02 | إطار اللوحة · موبايل | `default` · `executive` · `delegate-active` · `delegation-given` · `tablet` · `mobile-drawer` | `GET /me` (`permissions`، `active_delegation`، `role`، `department`، `governorates`) | `/shared/g02-dashboard-frame`. الشاشة هي `DashboardShell` نفسه، والقائمة من `config/navigation.ts` بالصلاحيات (74 عنصراً، 29 مفتاحاً مؤقتاً في `docs/backend-requests.md`). `tablet` و`mobile-drawer` مخفيتان في نسخة المراجعة (مبدّل المقاس يغطيهما) | 👀 |
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
| W01 | لوحة المستودع | `default` · `alerts` · `worker` | `GET /dashboard/summary`، و`GET /stock/expiry-alerts`، و`GET /stock/low-stock`، و`GET /transfers?status=IN_TRANSIT` |  | ⬜ |
| W02 | الأرصدة | `default` · `all-locations` · `at-time` · `worker` | `GET /stock/balances`، و`GET /locations` |  | ⬜ |
| W03 | حركات المخزون | `default` | `GET /stock/movements` |  | ⬜ |

### 02 · الإدخال — W04 إلى W05

| # | الشاشة | الحالات (المفاتيح) | العقد | ملاحظات | الحالة |
|---|---|---|---|---|---|
| W04 | إدخال بضاعة | `empty` · `filled` · `expired` · `near-expiry` · `batch-exists` · `batch-mismatch` · `saved` | `POST /stock-receipts` |  | ⬜ |
| W05 | سجل الإدخال | `default` | `GET /stock-receipts` |  | ⬜ |

### 03 · الصرف وطلبات العينات — W06 إلى W10

| # | الشاشة | الحالات (المفاتيح) | العقد | ملاحظات | الحالة |
|---|---|---|---|---|---|
| W06 | صرف جديد | `empty` · `agent` · `rep` · `type-mismatch` · `suspended-batch` · `insufficient` · `from-sample-request` · `saved` | `POST /transfers` (`sample_request_id`)، و`GET /stock/fefo-suggestion` |  | ⬜ |
| W07 | الصرف | `default` · `unconfirmed` | `GET /transfers` |  | ⬜ |
| W08 | تفاصيل الصرف | `in-transit` · `cancel` · `received` · `cancelled` · `overdue-48h` | `GET /transfers/{id}`، و`POST /transfers/{id}/cancel` |  | ⬜ |
| W09 | طلبات العينات | `default` | `GET /sample-requests` |  | ⬜ |
| W10 | تفاصيل طلب العينات | `new` · `dispatched` · `rejected` · `cancelled` | `GET /sample-requests/{id}`، و`/reject` |  | ⬜ |

### 04 · ما يعود للمستودع — W11 إلى W13

| # | الشاشة | الحالات (المفاتيح) | العقد | ملاحظات | الحالة |
|---|---|---|---|---|---|
| W11 | طلبات السحب | `default` · `new-form` | `GET /withdraw-requests`، و`POST /withdraw-requests` |  | ⬜ |
| W12 | تفاصيل طلب السحب | `requested` · `handed-over` · `cancelled` · `rep-deactivated` | `GET /withdraw-requests/{id}`، و`/cancel`، و`/confirm-on-behalf` |  | ⬜ |
| W13 | إرجاعات الوكلاء | `in-transit` · `confirm` · `received` | `GET /agent-returns`، و`POST /agent-returns/{id}/receive` |  | ⬜ |

### 05 · الجرد — W14 إلى W16

| # | الشاشة | الحالات (المفاتيح) | العقد | ملاحظات | الحالة |
|---|---|---|---|---|---|
| W14 | الجرد | `default` · `new-form` · `worker` | `GET /stock-counts`، و`POST /stock-counts` |  | ⬜ |
| W15 | العدّ | `in-progress` · `line-saved` · `with-diff` · `submitted` · `returned` · `cancel` · `worker` | `GET /stock-counts/{id}`، و`/lines`، و`/submit`، و`/cancel` |  | ⬜ |
| W16 | اعتماد الجرد | `awaiting-me` · `approved` · `returned` | `/approve`، و`/return` | (شاشة W15) | ⬜ |

### 06 · الدفعات — W17 إلى W19

| # | الشاشة | الحالات (المفاتيح) | العقد | ملاحظات | الحالة |
|---|---|---|---|---|---|
| W17 | الدفعات | `default` · `suspended-filter` | `GET /batches` |  | ⬜ |
| W18 | تفاصيل الدفعة | `active` · `suspend` · `suspended` · `unsuspend` · `suspended-logistics` | `GET /batches/{id}`، و`/suspend`، و`/unsuspend`، و`GET /recalls` |  | ⬜ |
| W19 | تقرير تتبع السحب | `default` · `distributed-after` | `GET /batches/{id}/recall-trace` |  | ⬜ |

### 07 · تالف المستودع — W20 إلى W21

| # | الشاشة | الحالات (المفاتيح) | العقد | ملاحظات | الحالة |
|---|---|---|---|---|---|
| W20 | تقرير تالف المستودع | `empty` · `submitted` | `POST /damage-reports` (`location_id`) |  | ⬜ |
| W21 | تقارير تالف المستودع | `default` | `GET /damage-reports` |  | ⬜ |

## الإشراف والمراقبة — S

### 01 · السوبرفايزر — S01 إلى S07

| # | الشاشة | الحالات (المفاتيح) | العقد | ملاحظات | الحالة |
|---|---|---|---|---|---|
| S01 | لوحة السوبرفايزر | `default` · `attendance-alerts` | `GET /dashboard/summary` |  | ⬜ |
| S02 | التقارير اليومية | `supervisor` · `read-only` | `GET /daily-reports` |  | ⬜ |
| S03 | تقييم التقرير اليومي | `default` · `confirm` · `rated` · `late-rating` · `rating-locked` | `GET /daily-reports/{id}`، و`/rating`، و`/notes` |  | ⬜ |
| S04 | الدوام | `default` · `short-day` · `absent` · `auto-closed` | `GET /attendance-sessions` |  | ⬜ |
| S05 | الزيارات | `list` · `map` · `flagged-filter` | `GET /visits` |  | ⬜ |
| S06 | تفاصيل الزيارة | `read-only` · `qa-flagged` · `confirmed` · `rejected` · `photo-pending` | `GET /visits/{id}`، و`POST /visits/{id}/decision` |  | ⬜ |
| S07 | صفحة المندوب | `default` · `negative-balance` | `GET /users/{id}`، و`GET /visits?rep_id=`، و`GET /stock/balances?location=`، و`GET /scores` |  | ⬜ |

### 02 · المراقبة — S08 إلى S12

| # | الشاشة | الحالات (المفاتيح) | العقد | ملاحظات | الحالة |
|---|---|---|---|---|---|
| S08 | العلامات | `default` · `by-type` · `near-deadline` · `closed` | `GET /qa-flags` |  | ⬜ |
| S09 | معالجة العلامة | `open` · `stock-discrepancy` · `clock-skew` · `attendance` · `auto-cleared` · `escalated` | `POST /qa-flags/{id}/decision` |  | ⬜ |
| S10 | الجهات الجديدة | `default` · `reject` · `bulk-reject` | `GET /qa-flags?type=NEW_VISIT_POINT`، و`POST /qa-flags/{id}/decision`، و`POST /visit-points/{id}/reject-visits` |  | ⬜ |
| S11 | دمج جهتين | `default` · `confirm` · `not-duplicate` | `POST /visit-points/merge` |  | ⬜ |
| S12 | شكاوى الموقع | `default` | `GET /site/messages?type=COMPLAINT` |  | ⬜ |

### 03 · التحقيق — S13 إلى S15

| # | الشاشة | الحالات (المفاتيح) | العقد | ملاحظات | الحالة |
|---|---|---|---|---|---|
| S13 | ملفات التحقيق | `default` | `GET /investigations` |  | ⬜ |
| S14 | فتح ملف تحقيق | `direct` · `from-flag` | `POST /investigations` |  | ⬜ |
| S15 | ملف التحقيق | `stage-1` · `stage-4` · `stage-7` · `awaiting-decision` · `executive-decision` · `decided` · `closed-no-violation` | `GET /investigations/{id}`، و`/complete-stage`، و`/close-no-violation`، و`/submit-for-decision`، و`/decision` |  | ⬜ |

## المديرون — M

### 01 · مدير المبيعات — M01 إلى M11

| # | الشاشة | الحالات (المفاتيح) | العقد | ملاحظات | الحالة |
|---|---|---|---|---|---|
| M01 | لوحة مدير المبيعات | `default` · `provisional` | `GET /dashboard/summary`، و`GET /plans/{department}/{month}` |  | ⬜ |
| M02 | الوكلاء | `default` | `GET /agents` |  | ⬜ |
| M03 | صفحة الوكيل | `default` · `deactivated` | `GET /agents/{id}`، و`POST /agent-returns` (`created_on_behalf_of_agent`) |  | ⬜ |
| M04 | العملاء | `default` | `GET /customers` |  | ⬜ |
| M05 | صفحة العميل | `default` |  | (شاشة A07) | ⬜ |
| M06 | التسليمات | `read-only` · `approval-pending-view` |  | (شاشة A09 وA10) | ⬜ |
| M07 | المستحقات | `default` · `refer` · `referred` | `GET /receivables`، و`POST /deliveries/{id}/refer-dispute` |  | ⬜ |
| M08 | قرارات المرتجع والتالف | `customer-return` · `agent-damage` · `warehouse-damage` · `agent-return` · `already-decided` | `GET /customer-returns`، و`GET /damage-reports`، و`GET /agent-returns`، و`…/{id}/decision` لكل منها |  | ⬜ |
| M09 | زيارة جديدة · موبايل | `default` · `locating` · `location-denied` · `saved` | `POST /manager-visits` (`customer_id` أو `visit_point_id`، والإحداثيات إلزامية) |  | ⬜ |
| M10 | زياراتي · موبايل | `default` | `GET /manager-visits` |  | ⬜ |
| M11 | رسائل الموقع | `default` · `handle` · `handled` | `GET /site/messages`، و`POST /site/messages/{id}/handle` |  | ⬜ |

### 02 · مدير المكتب العلمي — M12 إلى M18

| # | الشاشة | الحالات (المفاتيح) | العقد | ملاحظات | الحالة |
|---|---|---|---|---|---|
| M12 | لوحة المكتب العلمي | `default` | `GET /dashboard/summary`، و`GET /dashboard/coverage` |  | ⬜ |
| M13 | المندوبون | `default` | `GET /users?role=rep` |  | ⬜ |
| M14 | جهات الزيارة | `list` · `map` · `disabled-filter` | `GET /visit-points` |  | ⬜ |
| M15 | صفحة الجهة | `default` · `disabled` | `GET /visit-points/{id}`، و`PATCH` (البيانات لا الموقع) |  | ⬜ |
| M16 | تقرير معلومات السوق | `competitor-price` · `requested-product` | `GET /market-intel` |  | ⬜ |
| M17 | أرصدة عينات المندوبين | `default` · `low` | `GET /stock/balances?location_type=REP` |  | ⬜ |
| M18 | طلبات العينات | `default` · `new-form` · `cancel` | `GET /sample-requests`، و`POST /sample-requests`، و`/cancel` |  | ⬜ |

## المدير التنفيذي — E

### 01 · اللوحة والمتابعة — E01 إلى E02

| # | الشاشة | الحالات (المفاتيح) | العقد | ملاحظات | الحالة |
|---|---|---|---|---|---|
| E01 | لوحة المدير التنفيذي | `default` · `provisional` | `GET /dashboard/executive`، و`GET /me/pending-decisions` |  | ⬜ |
| E02 | سجل التدقيق | `audit` · `access` | `GET /audit-logs`، و`GET /access-logs` |  | ⬜ |

### 02 · المال والتقييم — E03 إلى E09

| # | الشاشة | الحالات (المفاتيح) | العقد | ملاحظات | الحالة |
|---|---|---|---|---|---|
| E03 | الميزانية والمصاريف | `default` · `edit` · `missing-actual` · `closed` | `GET /budgets/{month}`، و`PUT /budgets/{month}` |  | ⬜ |
| E04 | بنود المصاريف | `default` · `form` · `system` | `GET /expense-categories`، و`POST`، و`PATCH /expense-categories/{id}` |  | ⬜ |
| E05 | الخصومات | `default` · `new-form` · `reverse` · `month-closed` | `GET /deductions`، و`POST /deductions`، و`/reverse` |  | ⬜ |
| E06 | إغلاق الشهر | `open` · `waiting` · `closed` | `GET /month-closings/{month}` |  | ⬜ |
| E07 | التقييم اليدوي | `default` · `incomplete` · `locked` | `PUT /manual-ratings` |  | ⬜ |
| E08 | النقاط الشهرية | `provisional` · `final` | `GET /scores` |  | ⬜ |
| E09 | موظف الشهر | `default` · `tie` · `skipped` · `choose-other` · `approved` | `GET /month-winners/{month}`، و`/approve` |  | ⬜ |

### 03 · الأصناف والأسعار — E10 إلى E12

| # | الشاشة | الحالات (المفاتيح) | العقد | ملاحظات | الحالة |
|---|---|---|---|---|---|
| E10 | الأصناف | `default` · `disabled-filter` | `GET /items` |  | ⬜ |
| E11 | صنف جديد | `empty` · `validation` | `POST /items` |  | ⬜ |
| E12 | صفحة الصنف | `product` · `sample` · `new-price` · `past-date` · `disable` | `GET /items/{id}`، و`PATCH`، و`/prices`، و`/unit-costs` |  | ⬜ |

### 04 · الإعدادات والتفويض — E13 إلى E18

| # | الشاشة | الحالات (المفاتيح) | العقد | ملاحظات | الحالة |
|---|---|---|---|---|---|
| E13 | الإعدادات العامة | `default` · `edit` · `verification-note` | `GET /settings`، و`PATCH /settings` |  | ⬜ |
| E14 | القوائم | `default` · `system-entry` | `GET /lists/{key}`، و`POST`، و`PATCH /lists/{key}/{id}` |  | ⬜ |
| E15 | العطل الرسمية | `default` · `form` · `past` | `GET /holidays`، و`POST`، و`DELETE /holidays/{id}` |  | ⬜ |
| E16 | الأوزان ومجموعات المقارنة | `default` · `edit` · `sum-error` · `next-month-note` | `GET /kpi-weights`، و`PUT`، و`GET /comparison-groups`، و`PUT` |  | ⬜ |
| E17 | الهيكل الجغرافي | `default` · `form` | `GET /geo`، و`POST /geo/regions`، و`PATCH`، و`POST /geo/governorates`، و`PATCH` |  | ⬜ |
| E18 | التفويض | `none` · `active` · `form` · `overlap` | `GET /delegations`، و`POST /delegations`، و`/end` |  | ⬜ |

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

---

## أسئلة مفتوحة

أي تعارض بين العقد والتدفق أو حقل ناقص في العقد يُكتب هنا ويُرسل للباك. لا تخمين.

| # | السؤال | الشاشات |
|---|---|---|
| 1 | **صورة الزيارة:** `visits` في الـ push تحمل `has_photo` فقط. ما مسار رفع الصورة بعد المزامنة وربطها بالزيارة؟ | R14 · S06 |
| 2 | **الإشعارات:** قائمة قيم `Notification.type` غير معرّفة كـ enum. نحتاجها لأيقونة كل نوع والتنقل منه. | G03 · R32 |
| 3 | **لغة الموقع العام:** عربية فقط؟ (`/public/*` بلا معامل لغة) | P01–P06 |
| 4 | **لون التركيز (المرحلة 2):** `--color-focus` يساوي `info` الأزرق، ولا يعجب المستخدم. يُقرَّر مع الهوية، ولا يُغيَّر في المرحلة 1. | كل الحقول |

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

"use client";

import { MoneyCell } from "@/components/data/cells";
import { departmentLabels, userTypeLabels } from "@/components/data/departments";
import { DescriptionList } from "@/components/data/DescriptionList";
import { Grid } from "@/components/layout/Grid";
import { PageHeader } from "@/components/layout/PageHeader";
import { AttachmentList } from "@/components/ui/AttachmentList";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Dialog } from "@/components/ui/Dialog";
import { ErrorState } from "@/components/ui/ErrorState";
import { Field } from "@/components/ui/Field";
import { NotFoundState } from "@/components/ui/NotFoundState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import type { DeactivationPreview, Profile, User } from "@/lib/api/types";
import { dayLabel } from "@/lib/calendar";
import { countPhrase, formatDateTime, formatMoney, formatPhone, formatQuantity, isolate } from "@/lib/format";
import type { Loadable } from "@/lib/loadable";

type UserDetailsViewProps = {
  user: Loadable<User>;
  /** `GET /users/{id}/profile`: العقد والراتب (null لمن لا يراهما). */
  contract: Profile["contract"] | null;
  /** `users.manage`: التعطيل والتفعيل. */
  canManage: boolean;
  /** معاينة ما هو معلّق (`GET /deactivation-preview`). null = النافذة مغلقة. */
  preview: Loadable<DeactivationPreview> | null;
  onOpenPreview?: () => void;
  onClosePreview?: () => void;
  reason: string;
  onReasonChange: (reason: string) => void;
  /** نص الخادم تحت السبب (`errors.reason`). */
  reasonError?: string;
  /** `POST /users/{id}/deactivate { reason }`. */
  onDeactivate?: () => void;
  confirmingActivate: boolean;
  onConfirmingActivateChange: (open: boolean) => void;
  /** `POST /users/{id}/activate`. */
  onActivate?: () => void;
  /** تنزيل ملف العقد (`contract.file.url`). */
  onDownloadContract?: () => void;
  submitting?: boolean;
  onBack?: () => void;
  onRetry?: () => void;
};

/** أنواع المستندات المعلّقة (`pending_documents[].type` نص حر في العقد، §75): المعروف منها بالعربية، وغيره كما هو. */
const documentLabels: Readonly<Record<string, string>> = { transfer: "صرف", return: "مرتجع", stock_count: "جرد", delivery: "تسليم" };

/** سطر في المعاينة: ما هو معلّق، وما يحدث له عند التعطيل (من وصف `/deactivate` في العقد). */
function PendingRow({ label, value, outcome }: { label: string; value: string; outcome: string }) {
  return (
    <li className="flex flex-col gap-1 border-b border-border py-3 last:border-b-0">
      <span className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-body text-fg">{label}</span>
        <span className="text-body text-fg">{value}</span>
      </span>
      <span className="text-label text-fg-muted">{outcome}</span>
    </li>
  );
}

/**
 * صفحة المستخدم (I03): بياناته، وآخر مزامنة للمندوب، والعقد والراتب لمن يراهما، و«تعطيل الحساب» أو «تفعيله».
 * التعطيل فوري ولا يحذف شيئاً (القرار 14): قبله نافذة «ما المعلّق عليه» وما يحدث لكل منه، وسبب إلزامي.
 */
export function UserDetailsView({
  user,
  contract,
  canManage,
  preview,
  onOpenPreview,
  onClosePreview,
  reason,
  onReasonChange,
  reasonError,
  onDeactivate,
  confirmingActivate,
  onConfirmingActivateChange,
  onActivate,
  onDownloadContract,
  submitting = false,
  onBack,
  onRetry,
}: UserDetailsViewProps) {
  if (user.status === "loading") {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }
  if (user.status === "error") return user.code === "not_found" ? <NotFoundState onBack={onBack} /> : <ErrorState code={user.code} onRetry={onRetry} />;

  const data = user.data;
  const rep = data.type === "REP";
  const contact = rep ? (data.phone ? <span dir="ltr">{formatPhone(data.phone)}</span> : null) : data.email ? <span dir="ltr">{data.email}</span> : null;

  const actions = canManage
    ? data.is_active
      ? [{ id: "deactivate", label: "تعطيل الحساب", danger: true, onSelect: () => onOpenPreview?.() }]
      : [{ id: "activate", label: "تفعيل الحساب", primary: true, onSelect: () => onConfirmingActivateChange(true) }]
    : [];

  const ready = preview?.status === "ready" ? preview.data : null;
  const balance = ready?.balance ?? [];

  return (
    <>
      <PageHeader
        title={data.name ?? "مستخدم"}
        badge={<Badge color={data.is_active ? "success" : "neutral"}>{data.is_active ? "مفعّل" : "معطّل"}</Badge>}
        description={[data.role?.name, data.department ? departmentLabels[data.department] : null].filter(Boolean).join(" · ")}
        actions={actions}
      />

      <div className="flex flex-col gap-4">
        {!data.is_active ? (
          <Banner kind="warning" title="الحساب معطّل">
            لا يدخل ولا يُسند إليه عمل، وجهازه غير مربوط. سجلّه وما أنجزه باقٍ. فعّله ليعود.
          </Banner>
        ) : null}

        <Grid cols={{ base: 1, desktop: 2 }} gap={4}>
          <Card title="البيانات">
            <DescriptionList
              items={[
                { label: "النوع", value: data.type ? userTypeLabels[data.type] : null },
                { label: rep ? "الهاتف" : "بريد Google", value: contact },
                { label: "الدور", value: data.role?.name },
                { label: "القسم", value: data.department ? departmentLabels[data.department] : null },
                { label: "رئيس القسم", value: data.type === "WEB" ? (data.is_department_head ? "نعم" : "لا") : null },
                { label: "المدير المباشر", value: data.manager?.name },
                { label: "الوكيل", value: data.agent?.name },
                { label: "المحافظات", value: (data.governorates ?? []).map((item) => item.name).join("، ") || null },
                { label: "آخر دخول", value: data.last_login_at ? formatDateTime(data.last_login_at) : "لم يدخل بعد" },
                { label: "أُنشئ في", value: data.created_at ? formatDateTime(data.created_at) : null },
              ]}
            />
          </Card>

          <div className="flex flex-col gap-4">
            {rep ? (
              <Card title="الجهاز">
                <DescriptionList
                  items={[
                    { label: "آخر مزامنة", value: data.last_sync_at ? formatDateTime(data.last_sync_at) : "لم يزامن بعد" },
                    { label: "الربط", value: data.is_active ? "يُدار من «الأجهزة»" : "فُكّ عند التعطيل" },
                  ]}
                />
              </Card>
            ) : null}

            {contract ? (
              <Card title="العقد والراتب" action={<Badge color="neutral">سري</Badge>}>
                <div className="flex flex-col gap-4">
                  <DescriptionList
                    items={[
                      { label: "من", value: contract.starts_on ? dayLabel(contract.starts_on) : null },
                      { label: "إلى", value: contract.ends_on ? dayLabel(contract.ends_on) : "مفتوح" },
                      { label: "الراتب الشهري", value: contract.salary ? <MoneyCell value={contract.salary} /> : null },
                    ]}
                  />
                  {contract.file?.upload_id && contract.file.name ? <AttachmentList attachments={[{ id: contract.file.upload_id, name: contract.file.name }]} onDownload={() => onDownloadContract?.()} /> : null}
                </div>
              </Card>
            ) : null}
          </div>
        </Grid>
      </div>

      <Dialog
        open={preview !== null}
        onOpenChange={(open) => {
          if (!open) onClosePreview?.();
        }}
        dismissible={!submitting}
        size="md"
        title={`تعطيل حساب ${data.name ?? ""}؟`}
        description="فوري: يُفكّ ربط الجهاز وتنتهي الجلسة. لا يُحذف شيء، ويمكن التفعيل لاحقاً."
        actions={[
          <Button key="cancel" variant="secondary" disabled={submitting} onClick={onClosePreview}>
            إلغاء
          </Button>,
          <Button key="deactivate" variant="danger" loading={submitting} disabled={ready === null || reason.trim() === ""} onClick={onDeactivate}>
            تعطيل الحساب
          </Button>,
        ]}
      >
        {preview?.status === "loading" ? (
          <div className="flex flex-col gap-3" aria-busy="true">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : preview?.status === "error" ? (
          <ErrorState code={preview.code} onRetry={onOpenPreview} />
        ) : ready ? (
          <div className="flex flex-col gap-4">
            {balance.length > 0 ? (
              <Banner kind="warning" title={rep ? "المندوب عليه رصيد" : "على الحساب رصيد"}>
                {rep ? "يصل تنبيه للوجستي ليسترد الرصيد. الأفضل تسويته قبل التعطيل." : "يتولّى مدير المبيعات رصيد الوكيل بعد التعطيل."}
              </Banner>
            ) : null}

            <ul className="flex flex-col" aria-label="ما المعلّق على الحساب">
              {balance.length > 0 ? (
                <li className="flex flex-col gap-1 border-b border-border py-3">
                  <span className="text-body text-fg">الرصيد</span>
                  <ul className="flex flex-col gap-1">
                    {balance.map((line) => (
                      <li key={`${line.item?.id}-${line.batch?.id}`} className="flex flex-wrap justify-between gap-2 text-label text-fg-muted">
                        <span>{`${line.item?.name ?? ""} · ${line.batch?.batch_no ?? ""}`}</span>
                        <span>{formatQuantity(line.quantity ?? 0, "علبة")}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ) : (
                <PendingRow label="الرصيد" value="لا رصيد" outcome="لا شيء يُسترد." />
              )}
              {rep ? <PendingRow label="آخر مزامنة" value={ready.last_sync_at ? formatDateTime(ready.last_sync_at) : "لم يزامن"} outcome="ما لم يُرفع قبل التعطيل لا يصل بعد فك ربط الجهاز." /> : null}
              <PendingRow label="مهام مسندة إليه" value={isolate(ready.open_tasks_assigned_to ?? 0)} outcome="تبقى مفتوحة ليعيد من أسندها توزيعها." />
              <PendingRow label="مهام أسندها" value={isolate(ready.open_tasks_assigned_by ?? 0)} outcome="تنتقل إلى مديره المباشر." />
              <PendingRow label="طلبات مفتوحة" value={isolate(ready.open_requests ?? 0)} outcome="تبقى بحالتها ويقرّر فيها أصحاب القرار." />
              {ready.unpaid_deliveries_value ? <PendingRow label="مستحقات غير مسدَّدة" value={formatMoney(ready.unpaid_deliveries_value)} outcome="يتولّاها مدير المبيعات." /> : null}
              {(ready.pending_documents ?? []).length > 0 ? (
                <PendingRow
                  label="مستندات معلّقة"
                  value={countPhrase(ready.pending_documents?.length ?? 0, ["مستند", "مستندان", "مستندات"])}
                  outcome={(ready.pending_documents ?? []).map((doc) => `${documentLabels[doc.type ?? ""] ?? doc.type ?? ""} ${isolate(`#${doc.id ?? ""}`)}`).join("، ")}
                />
              ) : null}
            </ul>

            <Field label="سبب التعطيل" required error={reasonError} hint="يُسجَّل في سجل التدقيق.">
              <Textarea value={reason} maxLength={1000} onChange={(event) => onReasonChange(event.target.value)} placeholder="مثل: انتهاء العقد" />
            </Field>
          </div>
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={confirmingActivate}
        onOpenChange={onConfirmingActivateChange}
        title="تفعيل الحساب؟"
        description={rep ? "يعود المندوب للدخول، ويُربط جهازه من جديد عند أول دخول." : "يعود الموظف للدخول ببريده."}
        confirmLabel="تفعيل الحساب"
        loading={submitting}
        onConfirm={() => onActivate?.()}
      />
    </>
  );
}

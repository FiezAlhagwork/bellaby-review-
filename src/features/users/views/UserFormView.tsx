"use client";

import { departmentLabels, departmentOrder } from "@/components/data/departments";
import { Grid } from "@/components/layout/Grid";
import { PageHeader } from "@/components/layout/PageHeader";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Combobox } from "@/components/ui/Combobox";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import type { Option } from "@/components/ui/OptionList";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { RadioCard, RadioGroup } from "@/components/ui/Radio";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { errorMessage } from "@/lib/api/error-messages";
import type { Department, Governorate, Role, UserRef } from "@/lib/api/types";

/** النوع يحدّد طريقة الدخول: موظف الويب ببريد Google، والمندوب برقم هاتفه وجهازه. */
export type AccountType = "WEB" | "REP";

/**
 * حالة النموذج كما تُرسل إلى `POST /users` (`UserInput`). `phone` الأرقام الوطنية التسعة (تُرسل `+963…`)،
 * والمعرّفات نصوص الاختيار (تُرسل أرقاماً).
 */
export type UserForm = {
  type: AccountType | null;
  name: string;
  roleId: string | null;
  department: Department | null;
  isDepartmentHead: boolean;
  managerId: string | null;
  agentId: string | null;
  governorateIds: readonly string[];
  email: string;
  phone: string;
};

export const emptyUserForm: UserForm = { type: null, name: "", roleId: null, department: null, isDepartmentHead: false, managerId: null, agentId: null, governorateIds: [], email: "", phone: "" };

type UserFormViewProps = {
  form: UserForm;
  onFormChange: (form: UserForm) => void;
  /** الأدوار (`GET /roles`)، وتُصفّى بمنصة النوع. */
  roles: readonly Role[];
  /** المرشّحون للمدير المباشر. */
  managers: readonly UserRef[];
  /** الوكلاء (لحساب يتبع وكيلاً). */
  agents: readonly { id?: number; name?: string }[];
  governorates: readonly Governorate[];
  /** `errors` من `validation_failed`: `{ email: "نص", phone: "نص" }`. */
  errors?: Readonly<Record<string, string>>;
  submitError?: string;
  submitting?: boolean;
  onSubmit?: () => void;
  onCancel?: () => void;
};

const PHONE_DIGITS = /^9\d{8}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const typeDescriptions: Record<AccountType, string> = {
  WEB: "يدخل لوحة التحكم ببريد Google المضاف هنا.",
  REP: "يدخل تطبيق المندوب برقم هاتفه، ويُربط جهازه عند أول دخول.",
};

/**
 * حساب جديد (I02): النوع (ويب أو مندوب)، والاسم، والدور، والقسم، والمدير المباشر، والمحافظات، ثم بريد Google للويب أو هاتف المندوب.
 * لا تسجيل ذاتي: الحساب يُنشأ من هنا وحده. «إنشاء الحساب» معطّل وسببه ظاهر حتى تكتمل الحقول الإلزامية.
 */
export function UserFormView({ form, onFormChange, roles, managers, agents, governorates, errors = {}, submitError, submitting = false, onSubmit, onCancel }: UserFormViewProps) {
  const set = (patch: Partial<UserForm>) => onFormChange({ ...form, ...patch });

  const roleOptions: Option[] = roles.filter((role) => role.platform === form.type).map((role) => ({ value: String(role.id), label: role.name ?? "" }));
  const departmentOptions: Option<Department>[] = departmentOrder.map((value) => ({ value, label: departmentLabels[value] }));
  const managerOptions: Option[] = managers.map((user) => ({ value: String(user.id), label: user.name ?? "" }));
  const agentOptions: Option[] = agents.map((agent) => ({ value: String(agent.id), label: agent.name ?? "" }));
  const governorateOptions: Option[] = governorates.map((item) => ({ value: String(item.id), label: item.name ?? "" }));

  const disabledReason =
    form.type === null
      ? "اختر نوع الحساب."
      : form.name.trim() === ""
        ? "اكتب الاسم."
        : form.roleId === null
          ? "اختر الدور."
          : form.type === "WEB" && !EMAIL.test(form.email.trim())
            ? "اكتب بريد Google صحيحاً."
            : form.type === "REP" && !PHONE_DIGITS.test(form.phone.replace(/\s/g, ""))
              ? "اكتب رقم الهاتف: 9 أرقام تبدأ بـ 9."
              : null;

  return (
    <>
      <PageHeader title="حساب جديد" description="يُنشأ الحساب مفعّلاً. موظف الويب يدخل ببريد Google، والمندوب برقم هاتفه." />

      <div className="flex flex-col gap-4">
        {submitError ? (
          <Banner kind="danger" title="تعذّر إنشاء الحساب">
            {errorMessage(submitError)}
          </Banner>
        ) : null}

        <Card title="نوع الحساب">
          <Field label="النوع" required error={errors.type}>
            <RadioGroup aria-label="النوع" value={form.type} onValueChange={(type) => set({ type: type as AccountType, roleId: null })}>
              <Grid cols={{ base: 1, tablet: 2 }} gap={3}>
                <RadioCard value="WEB" title="موظف ويب" description={typeDescriptions.WEB} />
                <RadioCard value="REP" title="مندوب" description={typeDescriptions.REP} />
              </Grid>
            </RadioGroup>
          </Field>
        </Card>

        {form.type ? (
          <Card title="البيانات">
            <div className="flex flex-col gap-4">
              <Grid cols={{ base: 1, tablet: 2 }} gap={4}>
                <Field label="الاسم" required error={errors.name}>
                  <Input value={form.name} maxLength={100} onChange={(event) => set({ name: event.target.value })} placeholder="الاسم الكامل" />
                </Field>
                {form.type === "WEB" ? (
                  <Field label="بريد Google" required error={errors.email} hint="يدخل به لوحة التحكم. بريد غير مضاف يُرفض ويُسجَّل محاولةً.">
                    <Input value={form.email} dir="ltr" inputMode="email" onChange={(event) => set({ email: event.target.value })} placeholder="name@trust.example" />
                  </Field>
                ) : (
                  <Field label="هاتف المندوب" required error={errors.phone} hint="يدخل به التطبيق، ويُربط جهازه عند أول دخول.">
                    <PhoneInput value={form.phone} onChange={(event) => set({ phone: event.target.value })} />
                  </Field>
                )}
              </Grid>

              <Grid cols={{ base: 1, tablet: 2 }} gap={4}>
                <Field label="الدور" required error={errors.role_id} hint="الصلاحيات تأتي من الدور.">
                  <Select aria-label="الدور" placeholder="اختر الدور" options={roleOptions} value={form.roleId} onValueChange={(roleId) => set({ roleId })} />
                </Field>
                <Field label="القسم" optional error={errors.department}>
                  <Select aria-label="القسم" placeholder="اختر القسم" options={departmentOptions} value={form.department} onValueChange={(department) => set({ department })} />
                </Field>
              </Grid>

              {form.type === "WEB" ? (
                <Switch label="رئيس القسم" description="تظهر له «الطلبات بين الأقسام» لقسمه." checked={form.isDepartmentHead} onCheckedChange={(isDepartmentHead) => set({ isDepartmentHead })} />
              ) : null}

              <Grid cols={{ base: 1, tablet: 2 }} gap={4}>
                <Field label="المدير المباشر" optional error={errors.manager_id} hint="منه قائمة المكلَّفين بالمهام، وهو من يوافق على الإجازة.">
                  <Combobox aria-label="المدير المباشر" placeholder="ابحث بالاسم" options={managerOptions} value={form.managerId} onValueChange={(managerId) => set({ managerId })} clearable />
                </Field>
                <Field label="الوكيل" optional error={errors.agent_id} hint="لحساب يتبع وكيلاً.">
                  <Combobox aria-label="الوكيل" placeholder="اختر الوكيل" options={agentOptions} value={form.agentId} onValueChange={(agentId) => set({ agentId })} clearable />
                </Field>
              </Grid>

              <Field label="المحافظات" optional error={errors.governorate_ids} hint="المحافظات التي يعمل فيها.">
                <Combobox aria-label="المحافظات" placeholder="اختر المحافظات" multiple options={governorateOptions} value={form.governorateIds} onValueChange={(governorateIds) => set({ governorateIds })} />
              </Field>
            </div>
          </Card>
        ) : null}

        <div className="flex flex-col gap-2">
          {disabledReason ? <p className="text-label text-fg-muted">{disabledReason}</p> : null}
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" loading={submitting} disabled={disabledReason !== null} onClick={onSubmit}>
              إنشاء الحساب
            </Button>
            <Button variant="secondary" disabled={submitting} onClick={onCancel}>
              إلغاء
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

"use client";

import { useState } from "react";
import { UserFormView, emptyUserForm, type UserForm } from "@/features/users/views/UserFormView";
import { agentOptions, governorateOptions, managerOptions, rolesList } from "@/mocks/users";

// غلاف تفاعلي لصفحة الرسم (I02): يملك النموذج وأخطاء الخادم. في الإنتاج: POST /users (UserInput). لا يُنقل للإنتاج.

type NewUserDemoProps = { initialForm?: UserForm; initialErrors?: Readonly<Record<string, string>> };

export function NewUserDemo({ initialForm = emptyUserForm, initialErrors = {} }: NewUserDemoProps) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState(initialErrors);

  return (
    <UserFormView
      form={form}
      onFormChange={(next) => {
        setForm(next);
        setErrors({});
      }}
      roles={rolesList}
      managers={managerOptions}
      agents={agentOptions}
      governorates={governorateOptions}
      errors={errors}
      onSubmit={() => {}}
      onCancel={() => {}}
    />
  );
}

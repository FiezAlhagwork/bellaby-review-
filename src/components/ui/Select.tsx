"use client";

import { Select as BaseSelect } from "@base-ui/react/select";
import { DirectionProvider } from "@base-ui/react/direction-provider";
import { CaretDown, Check, LockSimple, WarningCircle } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { CaptureRow } from "@/lib/design/CaptureMode";
import { fieldShellClass, useControlState } from "./FieldShell";
import {
  OptionContent,
  OptionsEmpty,
  OptionsStatus,
  optionClass,
  optionListClass,
  optionPopupClass,
  type Option,
  type OptionsState,
} from "./OptionList";

type SelectProps<V extends string> = {
  options: readonly Option<V>[];
  /** القيمة المختارة. null = لم يُختر شيء فيظهر النص البديل. */
  value: V | null;
  onValueChange: (value: V) => void;
  placeholder?: string;
  /** حالة تحميل الخيارات (تحميل، خطأ مع إعادة المحاولة). بدونها الخيارات جاهزة. */
  optionsState?: OptionsState;
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  /** للقراءة فقط بقاعدة: بلا حد، وأيقونة قفل بدل السهم. */
  locked?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
  "aria-label"?: string;
  className?: string;
};

/**
 * القائمة المنسدلة للقوائم القصيرة، حتى 10 خيارات (DESIGN.md 9.5). controlled بـ `value` و`onValueChange`.
 * للقوائم الأطول مع بحث: Combobox. الزر بشكل الحقل نفسه (fieldShellClass)، فيتطابق مع Input بكل حالاته.
 * الخيار المعطّل يظهر ولا يُختار ومعه سببه. التنقل بالأسهم والكتابة السريعة من Base UI.
 */
export function Select<V extends string>({
  options,
  value,
  onValueChange,
  placeholder = "اختر",
  optionsState,
  invalid: invalidProp,
  disabled: disabledProp,
  readOnly: readOnlyProp,
  locked = false,
  required: requiredProp,
  id: idProp,
  name,
  "aria-label": ariaLabel,
  className,
}: SelectProps<V>) {
  const control = useControlState({
    id: idProp,
    invalid: invalidProp,
    disabled: disabledProp,
    readOnly: readOnlyProp || locked,
    required: requiredProp,
  });
  const { invalid, disabled, readOnly } = control;
  const unavailable = optionsState !== undefined && optionsState.status !== "ready";

  return (
    <DirectionProvider direction="rtl">
      <BaseSelect.Root
        items={options}
        // الخيارات لم تصل: القيمة لا تُعرض خاماً (معرّفاً) بل النص البديل.
        value={unavailable ? null : value}
        onValueChange={(next) => {
          if (next !== null) onValueChange(next);
        }}
        disabled={disabled}
        readOnly={readOnly}
        required={control.required}
        name={name}
      >
        <BaseSelect.Trigger
          id={control.id}
          aria-label={ariaLabel}
          aria-invalid={invalid || undefined}
          aria-describedby={control.describedBy}
          render={<CaptureRow as="button" />}
          className={cn(
            fieldShellClass({ invalid, disabled, readOnly }),
            "w-full text-start data-popup-open:border-focus data-popup-open:ring-2 data-popup-open:ring-focus",
            className,
          )}
        >
          <BaseSelect.Value placeholder={placeholder} className="min-w-0 flex-1 truncate text-start data-placeholder:text-fg-disabled" />
          {invalid ? <WarningCircle size={20} aria-hidden="true" className="shrink-0 text-danger" /> : null}
          {locked ? (
            <LockSimple size={16} aria-hidden="true" className="shrink-0 text-fg-subtle" />
          ) : !readOnly ? (
            <BaseSelect.Icon className="flex shrink-0 text-fg-muted">
              <CaretDown size={20} aria-hidden="true" />
            </BaseSelect.Icon>
          ) : null}
        </BaseSelect.Trigger>
        <BaseSelect.Portal>
          <BaseSelect.Positioner sideOffset={4} alignItemWithTrigger={false} className="z-50 outline-none">
            <BaseSelect.Popup className={optionPopupClass}>
              {unavailable ? (
                <OptionsStatus state={optionsState} />
              ) : options.length === 0 ? (
                <OptionsEmpty />
              ) : (
                <BaseSelect.List className={optionListClass}>
                  {options.map((option) => (
                    <BaseSelect.Item key={option.value} value={option.value} disabled={option.disabled} className={optionClass}>
                      <OptionContent
                        label={<BaseSelect.ItemText>{option.label}</BaseSelect.ItemText>}
                        reason={option.reason}
                        indicator={
                          <BaseSelect.ItemIndicator>
                            <Check size={16} aria-hidden="true" />
                          </BaseSelect.ItemIndicator>
                        }
                      />
                    </BaseSelect.Item>
                  ))}
                </BaseSelect.List>
              )}
            </BaseSelect.Popup>
          </BaseSelect.Positioner>
        </BaseSelect.Portal>
      </BaseSelect.Root>
    </DirectionProvider>
  );
}

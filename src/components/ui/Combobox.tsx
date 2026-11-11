"use client";

import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { DirectionProvider } from "@base-ui/react/direction-provider";
import { CaretDown, Check, LockSimple, WarningCircle, X } from "@phosphor-icons/react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { CaptureRow } from "@/lib/design/CaptureMode";
import { isolate } from "@/lib/format";
import { Badge } from "./Badge";
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

type ComboboxBaseProps<V extends string> = {
  options: readonly Option<V>[];
  placeholder?: string;
  /** حالة تحميل الخيارات (تحميل، خطأ مع إعادة المحاولة). بدونها الخيارات جاهزة. */
  optionsState?: OptionsState;
  /**
   * البحث من الخادم: يُستدعى بنص البحث، ويُرسل الأب `options` المصفّاة، فلا يصفّي المكوّن بنفسه.
   * بدونه يصفّي المكوّن الخيارات الموجودة محلياً.
   */
  onQueryChange?: (query: string) => void;
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  /** للقراءة فقط بقاعدة: بلا حد، وأيقونة قفل. */
  locked?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
  "aria-label"?: string;
  className?: string;
};

type ComboboxSingleProps<V extends string> = ComboboxBaseProps<V> & {
  multiple?: false;
  value: V | null;
  /** null حين يُمسح الاختيار. */
  onValueChange: (value: V | null) => void;
  /** زر مسح الاختيار (للحقل الاختياري). */
  clearable?: boolean;
};

type ComboboxMultipleProps<V extends string> = ComboboxBaseProps<V> & {
  multiple: true;
  value: readonly V[];
  onValueChange: (value: V[]) => void;
};

export type ComboboxProps<V extends string> = ComboboxSingleProps<V> | ComboboxMultipleProps<V>;

/** أقصى شارات تُعرض داخل الحقل المتعدد، وما زاد «+N» (DESIGN.md 9.5). */
const MAX_CHIPS = 3;

const iconButtonClass =
  "flex size-6 shrink-0 items-center justify-center rounded-sm text-fg-muted outline-none hover:bg-surface-sunken focus-visible:ring-2 focus-visible:ring-focus";

/**
 * القائمة الطويلة مع بحث (DESIGN.md 9.5): الصنف، الدفعة، الصيدلية، الموظف، الوكيل. controlled بـ `value` و`onValueChange`.
 * `multiple` لاختيار عدة قيم: شارات داخل الحقل بزر إزالة، وبعد 3 شارات «+N».
 * الحالات: تحميل، لا نتائج لـ «النص»، خطأ مع إعادة المحاولة. الخيار المعطّل يظهر ومعه سببه.
 */
export function Combobox<V extends string>(props: ComboboxProps<V>) {
  const {
    options,
    placeholder = "ابحث أو اختر",
    optionsState,
    onQueryChange,
    invalid: invalidProp,
    disabled: disabledProp,
    readOnly: readOnlyProp,
    locked = false,
    required: requiredProp,
    id: idProp,
    name,
    "aria-label": ariaLabel,
    className,
  } = props;

  const control = useControlState({
    id: idProp,
    invalid: invalidProp,
    disabled: disabledProp,
    readOnly: readOnlyProp || locked,
    required: requiredProp,
  });
  const { invalid, disabled, readOnly } = control;
  const unavailable = optionsState !== undefined && optionsState.status !== "ready";
  // نص البحث لرسالة «لا نتائج لـ»، ينعكس من الإدخال ولا يتحكم به.
  const [query, setQuery] = useState("");

  const selected: Option<V>[] = [];
  const selectedValues: readonly V[] = props.multiple ? props.value : props.value === null ? [] : [props.value];
  for (const value of selectedValues) {
    const option = options.find((candidate) => candidate.value === value);
    if (option) selected.push(option);
  }

  const handleChange = (next: Option<V> | Option<V>[] | null) => {
    if (props.multiple) props.onValueChange(Array.isArray(next) ? next.map((option) => option.value) : []);
    else props.onValueChange(next === null || Array.isArray(next) ? null : next.value);
  };

  const shell = cn(fieldShellClass({ invalid, disabled, readOnly }), "w-full cursor-text", disabled && "cursor-not-allowed");

  const inputClass = cn(
    "min-w-0 flex-1 bg-transparent text-start outline-none placeholder:text-fg-disabled disabled:cursor-not-allowed",
    props.multiple && "min-w-16",
  );

  // مصفوفة لا Fragment: CaptureRow يعكس أبناءه المباشرين، وFragment يُعدّ ابناً واحداً فيبقى ترتيب ما بداخله.
  const endControls = [
    invalid ? <WarningCircle key="invalid" size={20} aria-hidden="true" className="shrink-0 text-danger" /> : null,
    locked ? <LockSimple key="locked" size={16} aria-hidden="true" className="shrink-0 text-fg-subtle" /> : null,
    !locked && !readOnly && !disabled && !props.multiple && props.clearable && selected.length > 0 ? (
      <BaseCombobox.Clear key="clear" aria-label="مسح الاختيار" className={iconButtonClass}>
        <X size={16} aria-hidden="true" />
      </BaseCombobox.Clear>
    ) : null,
    !locked && !readOnly && !disabled ? (
      <BaseCombobox.Trigger key="trigger" aria-label="فتح القائمة" className={iconButtonClass}>
        <CaretDown size={20} aria-hidden="true" />
      </BaseCombobox.Trigger>
    ) : null,
  ];

  return (
    <DirectionProvider direction="rtl">
      <BaseCombobox.Root<Option<V>, boolean | undefined>
        items={options as Option<V>[]}
        multiple={props.multiple === true}
        value={props.multiple ? selected : (selected[0] ?? null)}
        onValueChange={handleChange}
        onInputValueChange={(text) => {
          setQuery(text);
          onQueryChange?.(text);
        }}
        itemToStringLabel={(option) => option.label}
        isItemEqualToValue={(option, other) => option.value === other.value}
        filter={onQueryChange ? null : undefined}
        disabled={disabled}
        readOnly={readOnly}
        required={control.required}
        name={name}
      >
        <BaseCombobox.InputGroup render={<CaptureRow />} className={cn(shell, className)}>
          {props.multiple ? (
            <BaseCombobox.Chips render={<CaptureRow />} className="min-w-0 flex-1 items-center gap-1 overflow-hidden">
              {selected.slice(0, MAX_CHIPS).map((option) => (
                <BaseCombobox.Chip
                  key={option.value}
                  render={<CaptureRow />}
                  className={cn("h-6 min-w-0 shrink items-center gap-1 rounded-sm px-2 text-label", disabled ? "bg-border text-fg-disabled" : "bg-surface-sunken text-fg")}
                >
                  <span className="min-w-0 truncate">{option.label}</span>
                  {!readOnly && !disabled ? (
                    <BaseCombobox.ChipRemove
                      aria-label={`إزالة ${option.label}`}
                      className="flex size-4 shrink-0 items-center justify-center rounded-sm text-fg-muted outline-none hover:bg-border focus-visible:ring-2 focus-visible:ring-focus"
                    >
                      <X size={12} aria-hidden="true" />
                    </BaseCombobox.ChipRemove>
                  ) : null}
                </BaseCombobox.Chip>
              ))}
              {selected.length > MAX_CHIPS ? <Badge>{isolate(`+${selected.length - MAX_CHIPS}`)}</Badge> : null}
              <BaseCombobox.Input
                id={control.id}
                aria-label={ariaLabel}
                aria-invalid={invalid || undefined}
                aria-describedby={control.describedBy}
                placeholder={selected.length > 0 ? "" : placeholder}
                className={inputClass}
              />
            </BaseCombobox.Chips>
          ) : (
            <BaseCombobox.Input
              id={control.id}
              aria-label={ariaLabel}
              aria-invalid={invalid || undefined}
              aria-describedby={control.describedBy}
              placeholder={placeholder}
              className={inputClass}
            />
          )}
          {endControls}
        </BaseCombobox.InputGroup>
        <BaseCombobox.Portal>
          <BaseCombobox.Positioner sideOffset={4} className="z-50 outline-none">
            <BaseCombobox.Popup className={optionPopupClass}>
              {unavailable ? (
                <OptionsStatus state={optionsState} />
              ) : (
                <>
                  <BaseCombobox.Empty>
                    <OptionsEmpty query={query.trim() === "" ? undefined : query} />
                  </BaseCombobox.Empty>
                  <BaseCombobox.List className={cn(optionListClass, "data-empty:hidden")}>
                    {(option: Option<V>) => (
                      <BaseCombobox.Item key={option.value} value={option} disabled={option.disabled} className={optionClass}>
                        <OptionContent
                          label={option.label}
                          reason={option.reason}
                          indicator={
                            <BaseCombobox.ItemIndicator>
                              <Check size={16} aria-hidden="true" />
                            </BaseCombobox.ItemIndicator>
                          }
                        />
                      </BaseCombobox.Item>
                    )}
                  </BaseCombobox.List>
                </>
              )}
            </BaseCombobox.Popup>
          </BaseCombobox.Positioner>
        </BaseCombobox.Portal>
      </BaseCombobox.Root>
    </DirectionProvider>
  );
}

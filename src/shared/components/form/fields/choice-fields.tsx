"use client";

import type * as React from "react";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import { Switch } from "@/shared/components/ui/switch";
import { asText } from "@/shared/lib/text";
import { cn } from "@/shared/lib/utils";
import type { FieldOption, FieldRendererProps } from "../types";

const MultiCheckboxRenderer = ({
  options: opts,
  selected,
  disabled,
  name: fieldName,
  id,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  "aria-label": ariaLabel,
  onChange: onChangeCb,
}: {
  id?: string | undefined;
  "aria-label"?: string | undefined;
  "aria-invalid"?: boolean | undefined;
  "aria-describedby"?: string | undefined;
  options: FieldOption[];
  selected: string[];
  disabled?: boolean | undefined;
  name?: string | undefined;
  onChange: (val: unknown) => void;
}) => (
  <fieldset
    id={id}
    aria-invalid={ariaInvalid}
    aria-describedby={ariaDescribedBy}
    aria-label={ariaLabel}
    className="m-0 grid min-w-0 grid-cols-2 gap-2 border-0 p-0 pt-1"
  >
    {opts.map((opt) => {
      const isChecked = selected.includes(opt.value);
      const itemId = `${fieldName}-${opt.value}`;
      return (
        <label
          key={opt.value}
          htmlFor={itemId}
          className={cn(
            "flex cursor-pointer items-start gap-2.5 rounded-md border p-3 text-sm transition-colors hover:bg-muted/40",
            isChecked && "border-primary/40 bg-primary/5",
            (opt.disabled || disabled) && "cursor-not-allowed opacity-50",
          )}
        >
          <Checkbox
            id={itemId}
            checked={isChecked}
            disabled={!!(opt.disabled || disabled)}
            onCheckedChange={(checked) => {
              const next = checked
                ? [...selected, opt.value]
                : selected.filter((v) => v !== opt.value);
              onChangeCb(next);
            }}
            className="mt-0.5"
          />
          <div className="min-w-0">
            <p className="font-medium leading-none">{opt.label}</p>
            {opt.description && (
              <p className="mt-1 text-xs text-muted-foreground">{opt.description}</p>
            )}
          </div>
        </label>
      );
    })}
  </fieldset>
);

const RadioRenderer = ({
  options: opts,
  strVal,
  disabled,
  name: fieldName,
  id,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  "aria-label": ariaLabel,
  onChange: onChangeCb,
}: {
  id?: string | undefined;
  "aria-label"?: string | undefined;
  "aria-invalid"?: boolean | undefined;
  "aria-describedby"?: string | undefined;
  options: FieldOption[];
  strVal: string;
  disabled?: boolean | undefined;
  name?: string | undefined;
  onChange: (val: unknown) => void;
}) => (
  <RadioGroup
    id={id}
    aria-invalid={ariaInvalid}
    aria-describedby={ariaDescribedBy}
    aria-label={ariaLabel}
    value={strVal}
    onValueChange={(v) => onChangeCb(v)}
    disabled={!!disabled}
    className="gap-2 pt-1"
  >
    {opts.map((opt) => {
      const itemId = `${fieldName}-${opt.value}`;
      return (
        <label
          key={opt.value}
          htmlFor={itemId}
          className={cn(
            "flex cursor-pointer items-start gap-2.5 rounded-md border p-3 text-sm transition-colors hover:bg-muted/40",
            strVal === opt.value && "border-primary/40 bg-primary/5",
            (opt.disabled || disabled) && "cursor-not-allowed opacity-50",
          )}
        >
          <RadioGroupItem
            id={itemId}
            value={opt.value}
            disabled={!!opt.disabled}
            className="mt-0.5"
          />
          <div className="min-w-0">
            <p className="font-medium leading-none">{opt.label}</p>
            {opt.description && (
              <p className="mt-1 text-xs text-muted-foreground">{opt.description}</p>
            )}
          </div>
        </label>
      );
    })}
  </RadioGroup>
);

export function renderCheckbox({
  value,
  onChange,
  disabled,
  readOnly,
  id,
  onBlur,
  ref,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  "aria-label": ariaLabel,
}: FieldRendererProps) {
  return (
    <Checkbox
      id={id}
      ref={ref as React.Ref<HTMLButtonElement>}
      onBlur={onBlur}
      aria-invalid={ariaInvalid}
      aria-describedby={ariaDescribedBy}
      checked={Boolean(value)}
      onCheckedChange={onChange}
      disabled={!!disabled || !!readOnly}
      aria-label={ariaLabel}
    />
  );
}

export function renderSwitch({
  value,
  onChange,
  disabled,
  readOnly,
  id,
  onBlur,
  ref,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  "aria-label": ariaLabel,
}: FieldRendererProps) {
  return (
    <Switch
      id={id}
      ref={ref as React.Ref<HTMLButtonElement>}
      onBlur={onBlur}
      aria-invalid={ariaInvalid}
      aria-describedby={ariaDescribedBy}
      checked={Boolean(value)}
      onCheckedChange={onChange}
      disabled={!!disabled || !!readOnly}
      aria-label={ariaLabel}
    />
  );
}

export function renderMultiCheckbox({
  value,
  onChange,
  disabled,
  options,
  name,
  id,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  "aria-label": ariaLabel,
}: FieldRendererProps) {
  const selected = Array.isArray(value) ? (value as string[]) : [];
  return (
    <MultiCheckboxRenderer
      options={options ?? []}
      selected={selected}
      disabled={disabled}
      name={name}
      id={id}
      aria-invalid={ariaInvalid}
      aria-describedby={ariaDescribedBy}
      aria-label={ariaLabel}
      onChange={onChange}
    />
  );
}

export function renderRadio({
  value,
  onChange,
  disabled,
  options,
  name,
  id,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  "aria-label": ariaLabel,
}: FieldRendererProps) {
  return (
    <RadioRenderer
      id={id}
      aria-invalid={ariaInvalid}
      aria-describedby={ariaDescribedBy}
      aria-label={ariaLabel}
      options={options ?? []}
      strVal={asText(value)}
      disabled={disabled}
      name={name}
      onChange={onChange}
    />
  );
}

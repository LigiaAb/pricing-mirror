"use client";

import type * as React from "react";
import { asText, toKebabCase } from "@/shared/lib/text";
import { cn } from "@/shared/lib/utils";
import { renderAsync } from "./fields/async-field";
import {
  renderColor,
  renderCombobox,
  renderFile,
  renderSelect,
  renderTextarea,
} from "./fields/basic-fields";
import { renderCatalogo } from "./fields/catalogo-field";
import {
  renderCheckbox,
  renderMultiCheckbox,
  renderRadio,
  renderSwitch,
} from "./fields/choice-fields";
import { DecoratedInput } from "./fields/decorated-input";
import { renderPassword } from "./fields/password-input";
import type {
  FieldA11yProps,
  FieldOption,
  FieldRenderer,
  FieldRendererProps,
  FormFieldConfig,
} from "./types";

const FIELD_RENDERERS: Record<string, FieldRenderer> = {
  checkbox: renderCheckbox,
  switch: renderSwitch,
  "multi-checkbox": renderMultiCheckbox,
  radio: renderRadio,
  textarea: renderTextarea,
  select: renderSelect,
  combobox: renderCombobox,
  catalogo: renderCatalogo,
  async: renderAsync,
  password: renderPassword,
  color: renderColor,
  file: renderFile,
};

export function FieldControl({
  cfg,
  value,
  onChange,
  hasError,
  id,
  onBlur,
  ref,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: Readonly<
  {
    cfg: FormFieldConfig;
    value: unknown;
    onChange: (val: unknown) => void;
    hasError?: boolean | undefined;
  } & FieldA11yProps
>) {
  const a11y: FieldA11yProps = {
    id,
    onBlur,
    ref,
    "aria-invalid": ariaInvalid ?? hasError,
    "aria-describedby": ariaDescribedBy,
    "aria-label": cfg.label ?? cfg.name,
  };
  const {
    type = "text",
    placeholder,
    disabled,
    readOnly,
    rows: _rows,
    options = [],
    icon,
    prefix,
    suffix,
    min,
    max,
    step,
    maxLength,
    autoComplete,
    kebabCase,
  } = cfg;

  const errorCls = hasError ? "border-destructive focus-visible:ring-destructive/20" : undefined;
  const readOnlyCls = readOnly ? "bg-muted/40 cursor-default" : undefined;

  if (cfg.component) {
    const Component = cfg.component;
    return (
      <Component
        value={value}
        onChange={onChange}
        {...(disabled === undefined ? {} : { disabled })}
        {...(readOnly === undefined ? {} : { readOnly })}
        {...(placeholder === undefined ? {} : { placeholder })}
        name={cfg.name}
        {...a11y}
        {...(errorCls === undefined ? {} : { errorCls })}
        {...(readOnlyCls === undefined ? {} : { readOnlyCls })}
        {...(cfg.fixedValue === undefined ? {} : { fixedValue: cfg.fixedValue })}
      />
    );
  }

  const renderer = FIELD_RENDERERS[type];
  if (renderer) {
    return renderer(buildRendererProps(value, onChange, cfg, options, errorCls, readOnlyCls, a11y));
  }

  // ── all other input types ──
  const inputType = type === "datetime" ? "datetime-local" : type;

  return (
    <DecoratedInput
      type={inputType}
      value={asText(value)}
      onChange={(e) => onChange(kebabCase ? toKebabCase(e.target.value) : e.target.value)}
      disabled={!!disabled}
      readOnly={!!readOnly}
      placeholder={placeholder}
      min={min}
      max={max}
      step={step}
      maxLength={maxLength}
      autoComplete={autoComplete}
      aria-label={a11y["aria-label"]}
      id={a11y.id}
      ref={a11y.ref as React.Ref<HTMLInputElement>}
      onBlur={a11y.onBlur}
      aria-invalid={a11y["aria-invalid"]}
      aria-describedby={a11y["aria-describedby"]}
      {...(!prefix && !suffix && icon ? { leadingIcon: icon } : {})}
      {...(prefix === undefined ? {} : { prefix })}
      {...(suffix === undefined ? {} : { suffix })}
      className={cn(errorCls, readOnlyCls)}
    />
  );
}

function buildRendererProps(
  value: unknown,
  onChange: (val: unknown) => void,
  cfg: FormFieldConfig,
  options: FieldOption[],
  errorCls: string | undefined,
  readOnlyCls: string | undefined,
  a11y: FieldA11yProps,
) {
  const opcionales = {
    disabled: cfg.disabled,
    readOnly: cfg.readOnly,
    placeholder: cfg.placeholder,
    rows: cfg.rows,
    icon: cfg.icon,
    name: cfg.name,
    errorCls,
    readOnlyCls,
    maxLength: cfg.maxLength,
    autoComplete: cfg.autoComplete,
    accept: cfg.accept,
    searchable: cfg.searchable,
    portalled: cfg.portalled,
    fixedValue: cfg.fixedValue,
    catalogo: cfg.catalogo,
    buscar: cfg.buscar,
    buscarQueryKey: cfg.buscarQueryKey,
    minSearchLength: cfg.minSearchLength,
    searchPlaceholder: cfg.searchPlaceholder,
    initialOptions: cfg.initialOptions,
  };
  // Solo las props definidas: con `exactOptionalPropertyTypes` un `undefined`
  // explícito no es lo mismo que la prop ausente.
  const props: FieldRendererProps = { ...a11y, value, onChange, options };
  for (const [clave, valor] of Object.entries(opcionales)) {
    if (valor !== undefined) (props as unknown as Record<string, unknown>)[clave] = valor;
  }
  return props;
}

"use client";

import type * as React from "react";
import { Combobox } from "@/shared/components/ui/combobox";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { deduplicarOpciones } from "@/shared/lib/array";
import { asText } from "@/shared/lib/text";
import { cn } from "@/shared/lib/utils";
import type { FieldRendererProps } from "../types";

export function renderTextarea({
  value,
  onChange,
  disabled,
  readOnly,
  placeholder,
  rows,
  maxLength,
  errorCls,
  readOnlyCls,
  id,
  onBlur,
  ref,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  "aria-label": ariaLabel,
}: FieldRendererProps) {
  return (
    <Textarea
      id={id}
      ref={ref as React.Ref<HTMLTextAreaElement>}
      onBlur={onBlur}
      aria-invalid={ariaInvalid}
      aria-describedby={ariaDescribedBy}
      aria-label={ariaLabel}
      value={asText(value)}
      onChange={(e) => onChange(e.target.value)}
      disabled={!!disabled}
      readOnly={!!readOnly}
      placeholder={placeholder}
      rows={rows ?? 3}
      maxLength={maxLength}
      className={cn(errorCls, readOnlyCls)}
    />
  );
}

export function renderSelect(props: FieldRendererProps) {
  const {
    value,
    onChange,
    disabled,
    readOnly,
    placeholder,
    options,
    errorCls,
    searchable,
    id,
    onBlur,
    ref,
    "aria-invalid": ariaInvalid,
    "aria-describedby": ariaDescribedBy,
    "aria-label": ariaLabel,
  } = props;

  if (searchable !== false) return renderCombobox(props);

  const opts = deduplicarOpciones(options ?? []);

  return (
    <Select
      value={asText(value)}
      onValueChange={(v) => onChange(v)}
      disabled={!!disabled || !!readOnly}
    >
      <SelectTrigger
        id={id}
        ref={ref as React.Ref<HTMLButtonElement>}
        onBlur={onBlur}
        className={errorCls}
        aria-label={ariaLabel}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
      >
        <SelectValue placeholder={placeholder ?? "Seleccione"} />
      </SelectTrigger>
      <SelectContent className="max-h-60 overflow-y-auto">
        {opts.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} disabled={!!opt.disabled}>
            <span className="flex items-center gap-2">
              {opt.icon && <opt.icon className="size-4 opacity-60" />}
              {opt.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Campo `select` buscable (por defecto) y `combobox`: ambos montan el mismo `Combobox`. */
export function renderCombobox({
  value,
  onChange,
  disabled,
  readOnly,
  placeholder,
  options,
  portalled,
  isLoading,
  id,
  onBlur,
  ref,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  "aria-label": ariaLabel,
}: FieldRendererProps) {
  return (
    <Combobox
      isLoading={!!isLoading}
      id={id}
      ref={ref as React.Ref<HTMLButtonElement>}
      onBlur={onBlur}
      aria-invalid={ariaInvalid}
      aria-describedby={ariaDescribedBy}
      ariaLabel={ariaLabel}
      value={asText(value)}
      onChange={onChange}
      options={deduplicarOpciones(options ?? [])}
      placeholder={placeholder ?? "Seleccione..."}
      disabled={!!disabled || !!readOnly}
      portalled={portalled ?? true}
      clearable
    />
  );
}

export function renderFile({
  disabled,
  accept,
  onChange,
  id,
  onBlur,
  ref,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  "aria-label": ariaLabel,
}: FieldRendererProps) {
  return (
    <Input
      id={id}
      ref={ref as React.Ref<HTMLInputElement>}
      onBlur={onBlur}
      aria-invalid={ariaInvalid}
      aria-describedby={ariaDescribedBy}
      type="file"
      accept={accept}
      disabled={!!disabled}
      aria-label={ariaLabel}
      onChange={(event) => onChange(event.target.files?.[0] ?? null)}
    />
  );
}

export function renderColor({ value, onChange, disabled }: FieldRendererProps) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={asText(value) || "#000000"}
        onChange={(e) => onChange(e.target.value)}
        disabled={!!disabled}
        className="h-9 w-12 cursor-pointer rounded-md border border-input bg-transparent p-1"
      />
      <input
        type="text"
        value={asText(value)}
        onChange={(e) => onChange(e.target.value)}
        disabled={!!disabled}
        placeholder="Hex color"
        className="w-32 font-mono rounded-md border border-input bg-transparent p-1"
      />
    </div>
  );
}

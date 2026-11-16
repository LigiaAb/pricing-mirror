"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { asText } from "@/shared/lib/text";

interface FieldOption {
  value: string | number;
  label: string;
}

interface Field {
  key: string;
  label: string;
  type?: string;
  multiple?: boolean;
  readOnly?: boolean;
  required?: boolean;
  colSpan?: number;
  options?: FieldOption[];
  actions?: Array<{ icon?: string; label?: string; onClick?: () => void }>;
  placeholder?: string;
  rows?: number;
}

type FieldChangeHandler = (
  key: string,
  value: unknown,
  nextValues?: Record<string, unknown>,
) => Record<string, unknown> | undefined;

interface FormularioAlternativoProps {
  title?: string;
  mensaje?: string;
  initialValues?: Record<string, unknown>;
  fields: Field[];
  identificacionOptions?: FieldOption[];
  validate?: (vals: Record<string, unknown>) => boolean;
  onFieldChange?: FieldChangeHandler;
  onValidityChange?: (valid: boolean) => void;
  onValuesChange?: (vals: Record<string, unknown>) => void;
  onSubmit?: (vals: Record<string, unknown>) => void;
  onRefresh?: () => void;
  labels?: { submit?: string; seleccionar?: string };
  showSubmitButton?: boolean;
  topContent?: ReactNode;
  maxWidth?: string;
}

interface CheckboxOptionProps {
  opt: FieldOption;
  checked: boolean;
  disabled: boolean;
  onToggle: (checked: boolean) => void;
}

function CheckboxOption({ opt, checked, disabled, onToggle }: Readonly<CheckboxOptionProps>) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: Checkbox wraps a native input, browser handles association
    <label className="flex items-center gap-2 text-sm">
      <Checkbox
        checked={checked}
        disabled={disabled}
        onCheckedChange={(c) => onToggle(c === true)}
      />
      {opt.label}
    </label>
  );
}

export function FormularioAlternativo({
  title,
  mensaje,
  initialValues = {},
  fields,
  identificacionOptions = [],
  validate,
  onFieldChange,
  onValidityChange,
  onValuesChange,
  onSubmit,
  onRefresh,
  labels,
  showSubmitButton = true,
  topContent,
  maxWidth = "720px",
}: Readonly<FormularioAlternativoProps>) {
  const [values, setValues] = useState<Record<string, unknown>>(initialValues);

  // Los callbacks y `validate` se recrean en cada render del padre: guardarlos en
  // refs mantiene los efectos dependiendo solo de `values`, que es lo que de
  // verdad los debe disparar.
  const validateRef = useRef(validate);
  validateRef.current = validate;
  const onValidityChangeRef = useRef(onValidityChange);
  onValidityChangeRef.current = onValidityChange;
  const onValuesChangeRef = useRef(onValuesChange);
  onValuesChangeRef.current = onValuesChange;

  // Último objeto publicado hacia arriba. El padre normalmente lo reinyecta como
  // `initialValues` (flujo circular), y ese eco llega un render por detrás de lo
  // que el usuario ya escribió: tratarlo como cambio externo revertía la última
  // tecla, el efecto de abajo la volvía a subir y ambos estados se intercambiaban
  // de generación en cada commit ("Maximum update depth exceeded"). Solo se
  // sincronizan las claves que difieren de lo último publicado, es decir, las que
  // de verdad cambió el padre.
  const publicadosRef = useRef(initialValues);
  useEffect(() => {
    const publicados = publicadosRef.current;
    if (initialValues === publicados) return;
    const cambiadas = Object.keys(initialValues).filter(
      (key) => asText(initialValues[key]) !== asText(publicados[key]),
    );
    if (!cambiadas.length) return;
    setValues((prev) => {
      const next = { ...prev };
      for (const key of cambiadas) next[key] = initialValues[key];
      return next;
    });
  }, [initialValues]);

  useEffect(() => {
    const validar = validateRef.current;
    onValidityChangeRef.current?.(validar ? validar(values) : true);
  }, [values]);

  const handleChange = (key: string, value: unknown) => {
    setValues((prev) => {
      const next = { ...prev, [key]: value };
      if (typeof onFieldChange === "function") {
        const patch = onFieldChange(key, value, next);
        if (patch && typeof patch === "object") {
          Object.assign(next, patch);
        }
      }
      return next;
    });
  };

  useEffect(() => {
    publicadosRef.current = values;
    onValuesChangeRef.current?.(values);
  }, [values]);

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    onSubmit?.(values);
  };

  const isValid = validate ? validate(values) : true;

  const uniqueOptions = (opts: FieldOption[]): FieldOption[] =>
    opts.filter(
      (opt, idx, arr) =>
        opt.value != null &&
        opt.value !== "" &&
        String(opt.value) !== "" &&
        arr.findIndex((o) => o.value === opt.value) === idx,
    );

  const renderFieldInput = (field: Field, val: unknown, isDisabled: boolean) => {
    if (field.type === "select" || field.options) {
      return (
        <Select value={asText(val)} onValueChange={(v) => handleChange(field.key, v)}>
          <SelectTrigger id={field.key} disabled={isDisabled}>
            <SelectValue placeholder={labels?.seleccionar ?? "Seleccione"} />
          </SelectTrigger>
          <SelectContent>
            {uniqueOptions(field.options ?? identificacionOptions).map((opt: FieldOption) => (
              <SelectItem key={String(opt.value)} value={String(opt.value)}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (field.type === "checkbox") {
      const currentVal = Array.isArray(val) ? val : [];
      const handleCheckboxToggle = (optValue: string | number, checked: boolean) => {
        const newVal = checked
          ? [...currentVal, optValue]
          : currentVal.filter((v: unknown) => v !== optValue);
        handleChange(field.key, newVal);
      };
      return (
        <div className="flex flex-wrap gap-3 pt-1">
          {uniqueOptions((field.options ?? []) as FieldOption[]).map((opt: FieldOption) => (
            <CheckboxOption
              key={String(opt.value)}
              opt={opt}
              checked={currentVal.includes(opt.value)}
              disabled={isDisabled}
              onToggle={(c) => handleCheckboxToggle(opt.value, c)}
            />
          ))}
        </div>
      );
    }

    if (field.type === "textarea") {
      return (
        <Textarea
          id={field.key}
          value={asText(val)}
          onChange={(e) => handleChange(field.key, e.target.value)}
          disabled={isDisabled}
          placeholder={field.placeholder}
          rows={field.rows ?? 3}
        />
      );
    }

    const inputTypeMap: Record<string, string> = {
      date: "date",
      datetime: "datetime-local",
      email: "email",
      number: "number",
    };

    return (
      <Input
        id={field.key}
        type={inputTypeMap[field.type ?? ""] ?? "text"}
        value={asText(val)}
        onChange={(e) => handleChange(field.key, e.target.value)}
        disabled={isDisabled}
        placeholder={field.placeholder}
      />
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" style={{ maxWidth }}>
      {title && <h3 className="text-lg font-semibold text-foreground">{title}</h3>}
      {mensaje && <p className="text-sm text-muted-foreground">{mensaje}</p>}
      {topContent && <div className="mb-4">{topContent}</div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
        {fields.map((field) => {
          const val = values[field.key];
          const colSpan = field.colSpan ?? 12;
          const isDisabled = !!field.readOnly;

          return (
            <div
              key={field.key}
              className="space-y-1.5"
              style={{ gridColumn: `span ${Math.min(colSpan, 12)}` }}
            >
              <Label htmlFor={field.key} className="text-xs font-medium">
                {field.label}
                {field.required && <span className="ml-0.5 text-destructive">*</span>}
              </Label>
              {renderFieldInput(field, val, isDisabled)}
            </div>
          );
        })}
      </div>

      <div className="flex gap-2">
        {showSubmitButton && (
          <Button type="submit" disabled={!isValid}>
            {labels?.submit ?? "Guardar"}
          </Button>
        )}
        {onRefresh && (
          <Button type="button" variant="outline" onClick={onRefresh}>
            Refrescar
          </Button>
        )}
      </div>
    </form>
  );
}

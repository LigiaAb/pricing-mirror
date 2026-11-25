"use client";

import { X } from "lucide-react";
import { Combobox, type ComboboxOption } from "@/shared/components/ui/combobox";
import { Field, FieldLabel } from "@/shared/components/ui/field";
import { MultiSelect } from "@/shared/components/ui/multi-select";
import { cn } from "@/shared/lib/utils";

/** "x" al final del input para limpiar el campo. */
function BotonLimpiar({
  label,
  onClick,
  className,
}: Readonly<{ label: string; onClick: () => void; className?: string }>) {
  return (
    <button
      type="button"
      aria-label={`Limpiar ${label}`}
      title="Limpiar"
      tabIndex={-1}
      className={cn(
        "absolute top-1/2 z-10 -translate-y-1/2 rounded-sm text-muted-foreground hover:text-destructive",
        className,
      )}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
    >
      <X className="size-4" aria-hidden="true" />
    </button>
  );
}

/** Select buscable con etiqueta y "x" para limpiar ("" = sin valor). */
export function CampoSelect({
  id,
  label,
  value,
  onChange,
  opciones,
  cargando,
  placeholder = "Seleccione una opción",
  limpiable = true,
}: Readonly<{
  id: string;
  label: string;
  value: string;
  onChange: (valor: string) => void;
  opciones: readonly ComboboxOption[];
  cargando?: boolean | undefined;
  placeholder?: string;
  limpiable?: boolean;
}>) {
  const conX = limpiable && value !== "";
  return (
    <Field className="gap-1">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <Combobox
          id={id}
          value={value}
          onChange={onChange}
          options={opciones}
          isLoading={cargando}
          placeholder={placeholder}
          className={conX ? "pr-16" : undefined}
          popoverClassName="z-[9999]"
        />
        {conX ? (
          <BotonLimpiar label={label} onClick={() => onChange("")} className="right-8" />
        ) : null}
      </div>
    </Field>
  );
}

/** Select de selección múltiple (chips) con "x" para limpiar; el valor va separado por comas. */
export function CampoMultiSelect({
  id,
  label,
  value,
  onChange,
  opciones,
  placeholder = "Todos",
}: Readonly<{
  id: string;
  label: string;
  value: string;
  onChange: (valor: string) => void;
  opciones: readonly ComboboxOption[];
  placeholder?: string;
}>) {
  const elegidos = value ? value.split(",") : [];
  return (
    <Field className="gap-1">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <MultiSelect
          id={id}
          value={elegidos}
          onChange={(valores) => onChange(valores.join(","))}
          options={opciones.map((o) => ({ value: o.value, label: o.label }))}
          placeholder={placeholder}
          searchPlaceholder="Buscar…"
          {...(elegidos.length ? { className: "pr-16" } : {})}
        />
        {elegidos.length ? (
          // Centrado en el botón (h-9), no en el bloque con los chips.
          <BotonLimpiar
            label={label}
            onClick={() => onChange("")}
            className="top-[1.125rem] right-8"
          />
        ) : null}
      </div>
    </Field>
  );
}

/** Fecha con el input nativo (`yyyy-MM-dd`) y "x" si no es requerida. */
export function CampoFecha({
  id,
  label,
  value,
  onChange,
  min,
  max,
  requerida,
}: Readonly<{
  id: string;
  label: string;
  value: string;
  onChange: (valor: string) => void;
  min?: string | undefined;
  max?: string | undefined;
  requerida: boolean;
}>) {
  const conX = !requerida && value !== "";
  return (
    <Field className="gap-1">
      <FieldLabel htmlFor={id}>
        {label}
        {requerida ? " *" : ""}
      </FieldLabel>
      <div className="relative">
        <input
          id={id}
          type="date"
          className={cn("h-9 w-full rounded-md border bg-card px-2 text-sm", conX && "pr-14")}
          value={value}
          min={min || undefined}
          max={max || undefined}
          onChange={(event) => {
            // Requerida: no se deja vaciar.
            if (event.target.value || !requerida) onChange(event.target.value);
          }}
        />
        {conX ? (
          <BotonLimpiar label={label} onClick={() => onChange("")} className="right-9" />
        ) : null}
      </div>
    </Field>
  );
}

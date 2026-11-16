"use client";

/**
 * Renderizador de la lista declarativa de campos del formulario público de
 * entidad (reemplaza al FormularioAlternativo del legacy). Grid de 12 columnas;
 * cada cambio pasa por `onFieldChange` para aplicar parches satélite.
 *
 * Cada campo es un `FieldRow` memoizado por su propio valor: con 7 secciones
 * montadas a la vez y varios `<Select>` de catálogo (país/depto/municipio/
 * industria) por sección, sin esta memoización cada tecla escrita en UN campo
 * reconstruía los ~15 campos de la sección (selects incluidos) en cada
 * keystroke.
 */

import { memo, useCallback } from "react";
import { SubseccionHeader } from "@/shared/components/seccion-header";
import { Combobox } from "@/shared/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import type { CampoEntidadPublic, OpcionContacto } from "./fields";
import type { JsonRecord } from "./model";

interface Props {
  readonly idPrefix: string;
  readonly fields: CampoEntidadPublic[];
  readonly values: JsonRecord;
  readonly onChange: (patch: JsonRecord) => void;
  /** Devuelve el parche satélite derivado de cambiar `key` (o {}). */
  readonly onFieldChange?: (key: string, value: unknown) => JsonRecord;
}

const COL_SPAN: Record<number, string> = {
  2: "col-span-12 md:col-span-2",
  4: "col-span-12 md:col-span-4",
  6: "col-span-12 md:col-span-6",
  10: "col-span-12 md:col-span-10",
  12: "col-span-12",
};

const INPUT_CLASS =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 read-only:bg-muted/40";

// El listado nativo del <select> se dimensiona según el texto más largo de
// sus <option>: sin truncar, el label de contacto (nombre | email | teléfono)
// hace que ese listado se salga del viewport en pantallas angostas (móvil).
const truncar = (valor: string, max: number) =>
  valor.length > max ? `${valor.slice(0, max - 1)}…` : valor;

interface FieldRowProps {
  readonly idPrefix: string;
  readonly field: CampoEntidadPublic;
  readonly value: unknown;
  readonly onChange: (patch: JsonRecord) => void;
  readonly onFieldChange?: ((key: string, value: unknown) => JsonRecord) | undefined;
}

const FieldRow = memo(function FieldRow({
  idPrefix,
  field,
  value: valor,
  onChange,
  onFieldChange,
}: FieldRowProps) {
  const aplicarCambio = useCallback(
    (value: unknown) => {
      const patch = onFieldChange ? onFieldChange(field.key, value) : {};
      onChange({ [field.key]: value, ...patch });
    },
    [field.key, onChange, onFieldChange],
  );

  const id = `${idPrefix}-${field.key}`;
  const span = COL_SPAN[field.colSpan ?? 12] ?? "col-span-12";

  if (field.type === "section") {
    return (
      <div className="col-span-12">
        <SubseccionHeader
          titulo={field.label ?? ""}
          {...(field.icon ? { icono: field.icon } : {})}
        />
      </div>
    );
  }

  if (field.type === "button") {
    const action = field.action;
    if (!action?.visible) return <div className={span} />;
    return (
      <div className={span}>
        <button
          type="button"
          onClick={action.onClick}
          disabled={!action.enabled}
          className="inline-flex h-9 w-full items-center justify-center rounded-md border border-input bg-transparent px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
        >
          {action.nombre}
        </button>
      </div>
    );
  }

  const label = (
    <label htmlFor={id} className="mb-1 block text-sm font-medium">
      {field.label}
      {field.required && <span className="text-destructive ml-1">*</span>}
    </label>
  );

  if (field.type === "select") {
    const opciones = field.options ?? [];
    const opcionesSelect = opciones.map((opt) => ({
      value: String(opt.value),
      label: esContacto(opt)
        ? `${truncar(opt.nombre || "-", 16)} | ${truncar(opt.email || "-", 20)} | ${opt.telefono || "-"}`
        : opt.label,
    }));
    return (
      <div className={span}>
        {label}
        {field.searchable ? (
          <Combobox
            clearable
            id={id}
            value={valor !== null && valor !== undefined ? String(valor) : ""}
            onChange={aplicarCambio}
            options={opcionesSelect}
            placeholder="Seleccionar..."
            disabled={Boolean(field.readOnly)}
          />
        ) : (
          <Select
            value={valor !== null && valor !== undefined ? String(valor) : ""}
            disabled={Boolean(field.readOnly)}
            onValueChange={(v) => aplicarCambio(v)}
          >
            <SelectTrigger id={id}>
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              {opcionesSelect.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    );
  }

  if (field.type === "checkboxes") {
    const seleccionados = Array.isArray(valor) ? valor.map(String) : [];
    return (
      <fieldset className={span}>
        <legend className="mb-1 block text-sm font-medium">
          {field.label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </legend>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {(field.options ?? []).map((opt) => {
            const marcado = seleccionados.includes(String(opt.value));
            return (
              <label key={String(opt.value)} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={marcado}
                  disabled={field.readOnly}
                  onChange={() => {
                    const next = marcado
                      ? seleccionados.filter((v) => v !== String(opt.value))
                      : [...seleccionados, String(opt.value)];
                    aplicarCambio(next);
                  }}
                />
                {opt.label}
              </label>
            );
          })}
        </div>
      </fieldset>
    );
  }

  if (field.type === "textarea") {
    return (
      <div className={span}>
        {label}
        <textarea
          id={id}
          rows={field.rows ?? 2}
          value={String(valor ?? "")}
          readOnly={field.readOnly}
          onChange={(e) => aplicarCambio(e.target.value)}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm read-only:bg-muted/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>
    );
  }

  return (
    <div className={span}>
      {label}
      <input
        id={id}
        type={field.type === "email" ? "email" : "text"}
        value={String(valor ?? "")}
        readOnly={field.readOnly}
        onChange={(e) => aplicarCambio(e.target.value)}
        className={INPUT_CLASS}
      />
    </div>
  );
});

export function FormFieldsRenderer({ idPrefix, fields, values, onChange, onFieldChange }: Props) {
  return (
    <div className="grid grid-cols-12 items-end gap-4">
      {fields.map((field) => (
        <FieldRow
          key={field.key}
          idPrefix={idPrefix}
          field={field}
          value={values[field.key]}
          onChange={onChange}
          onFieldChange={onFieldChange}
        />
      ))}
    </div>
  );
}

function esContacto(opt: unknown): opt is OpcionContacto {
  return Boolean(opt && typeof opt === "object" && "nombre" in (opt as object));
}

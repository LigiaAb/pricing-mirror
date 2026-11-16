"use client";

import { Construction } from "lucide-react";
import type * as React from "react";
import { Field, FieldLabel } from "@/shared/components/ui/field";
import { InputGroup, InputGroupInput } from "@/shared/components/ui/input-group";
import { cn } from "@/shared/lib/utils";

/* ==========================================================================
 * COMPONENTES REUTILIZABLES DE LA VISTA GENERAL (MAQUETA)
 * ========================================================================== */

/** Encabezado de sección con la barra primaria (mismo estilo que Cotizaciones). */
export function SeccionEmbarque({
  titulo,
  acciones,
  children,
  className,
}: {
  titulo: string;
  acciones?: React.ReactNode;
  children: React.ReactNode;
  className?: string | undefined;
}) {
  return (
    <section className={cn("overflow-hidden rounded-lg border bg-card shadow-sm", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 bg-primary px-4 py-2 text-primary-foreground">
        <span className="text-base font-semibold">{titulo}</span>
        {acciones ? <div className="flex items-center gap-2">{acciones}</div> : null}
      </div>
      {children}
    </section>
  );
}

/** Dato corto: etiqueta arriba, valor abajo. */
export function Dato({ label, valor }: { label: string; valor: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col rounded-lg border border-muted bg-background/40 px-3 py-2">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="truncate text-sm font-semibold">{valor}</span>
    </div>
  );
}

/** Campo de solo lectura para maquetar formularios (sin lógica). */
export function CampoMaqueta({
  id,
  label,
  valor = "",
  tipo = "text",
  requerido = false,
  className,
}: {
  id: string;
  label: string;
  valor?: string;
  tipo?: "text" | "date" | "number" | "datetime-local";
  requerido?: boolean;
  className?: string | undefined;
}) {
  return (
    <Field className={cn(className)}>
      <FieldLabel htmlFor={id}>
        {label}
        {requerido && " *"}
      </FieldLabel>
      <InputGroup>
        <InputGroupInput id={id} type={tipo} defaultValue={valor} placeholder={label} readOnly />
      </InputGroup>
    </Field>
  );
}

/** Encabezado de una tab: título, descripción y acciones a la derecha. */
export function EncabezadoPaso({
  titulo,
  descripcion,
  acciones,
}: {
  titulo: string;
  descripcion: string;
  acciones?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2 border-b pb-3">
      <div>
        <h3 className="text-lg font-semibold">{titulo}</h3>
        <p className="text-sm text-muted-foreground">{descripcion}</p>
      </div>
      {acciones ? <div className="flex flex-wrap items-center gap-2">{acciones}</div> : null}
    </div>
  );
}

/** Bloque punteado para lo que aún no se maqueta en detalle. */
export function Pendiente({ texto, className }: { texto: string; className?: string | undefined }) {
  return (
    <div
      className={cn(
        "flex min-h-32 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted p-6 text-center text-sm text-muted-foreground",
        className,
      )}
    >
      <Construction className="size-5" aria-hidden="true" />
      {texto}
    </div>
  );
}

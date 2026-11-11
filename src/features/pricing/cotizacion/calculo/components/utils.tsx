"use client";

/* ==========================================================================
 * COMPONENTES VISUALES REUTILIZABLES DE COTIZACIONES
 *
 * Piezas pequeñas de UI que usan varias pantallas del módulo.
 * Si un componente se repite en más de un archivo, va aquí.
 * (Las funciones puras sin JSX van en lib/utils.ts)
 * ========================================================================== */

import { ChevronDown, ChevronUp } from "lucide-react";
import type React from "react";

import { Button } from "@/shared/components/ui/button";
import { FieldGroup } from "@/shared/components/ui/field";
import { Loader } from "@/shared/components/ui/loader";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/utils";

import { formatNumero } from "../lib/utils";

/* ==========================================================================
 * TEXTO
 * ========================================================================== */

/** Tooltip con el estilo del módulo. */
export const LocalTooltip = ({
  value,
  children,
}: {
  value: string | React.ReactNode;
  children: React.ReactNode;
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent className="bg-card text-card-foreground text-md border-1 rounded border-card-foreground p-1">
        {value}
      </TooltipContent>
    </Tooltip>
  );
};

/** Texto recortado a `length` caracteres; el texto completo se ve en un tooltip. */
export const shortCell = ({ value, length = 11 }: { value: string; length?: number | undefined }) => {
  if (value.length <= length) return <span>{value}</span>;

  return (
    <LocalTooltip value={<span>{value}</span>}>
      <span>
        {value.slice(0, length)}
        {"..."}
      </span>
    </LocalTooltip>
  );
};

/* ==========================================================================
 * MONEDA
 * ========================================================================== */

/** Monto con símbolo de moneda y 2 decimales: "Q 1,234.50". */
export function ValorMoneda({
  simbolo,
  valor,
  total = false,
}: {
  simbolo?: string | null | undefined;
  valor?: string | number | null;
  total?: boolean;
}) {
  return (
    <span className={total ? "font-semibold whitespace-nowrap" : "whitespace-nowrap"}>
      {simbolo ? `${simbolo} ` : ""}
      {formatNumero(valor)}
    </span>
  );
}

/* ==========================================================================
 * DETALLES DE TARIFA
 * ========================================================================== */

/** Lista de detalles de un método ("CW: 120 / $2.50 Por KILO"). Muestra "—" si no hay. */
export function Detalles({ detalles }: { detalles?: Array<Record<string, unknown>> }) {
  if (!detalles?.length) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className="space-y-1 text-xs">
      {detalles.map((detalle) => {
        const tipo = String(detalle.tipo_desc ?? "").trim();

        const descripcion = String(
          detalle.tarifadetalle_descripcion ?? detalle.tarifadetalle_valor ?? "",
        ).trim();

        const key = `${tipo}|${descripcion}`;

        if (!tipo && !descripcion) {
          return null;
        }

        return (
          <div key={key}>
            {tipo ? <span className="font-medium">{tipo}: </span> : null}

            {descripcion}
          </div>
        );
      })}
    </div>
  );
}

/* ==========================================================================
 * CONTENEDORES / SECCIONES
 * ========================================================================== */

/** Envuelve una sección y le pone un loader encima mientras `loading` es true. */
export function SeccionConLoader({
  loading,
  children,
}: Readonly<{
  loading: boolean;
  children: React.ReactNode;
}>) {
  return (
    <div className="relative">
      {children}
      {loading ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-muted/50">
          <Loader />
        </div>
      ) : null}
    </div>
  );
}

/** Encabezado de sección colapsable (barra con título y flecha). */
export function SectionHeader({ title, open, onToggle }: { title: string; open: boolean; onToggle: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      className="h-auto w-full justify-between rounded-b-none bg-primary px-4 py-3 text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
      onClick={onToggle}
    >
      <span className="text-base font-semibold">{title}</span>

      {open ? <ChevronUp className="size-4" aria-hidden="true" /> : <ChevronDown className="size-4" aria-hidden="true" />}
    </Button>
  );
}

/** Grupo de campos de un formulario, con título y borde. */
export function Grupo({
  id,
  titulo,
  visible,
  children,
}: {
  id: string;
  titulo: string;
  visible: boolean;
  children: React.ReactNode;
}) {
  return (
    <FieldGroup
      data-group={id}
      className={cn("grid gap-3 rounded-lg border p-4 md:grid-cols-2", !visible && "hidden")}
    >
      <p className="col-span-full text-center text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {titulo}
      </p>

      {children}
    </FieldGroup>
  );
}

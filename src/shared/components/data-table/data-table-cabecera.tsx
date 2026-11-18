"use client";

import type * as React from "react";
import { cn } from "@/shared/lib/utils";

/** Vista rápida de la tabla: un filtro con nombre y, si aporta, su conteo. */
export interface SegmentoTabla {
  id: string;
  etiqueta: string;
  conteo?: number;
  /** `alerta` tiñe el contador: es el segmento que pide atención. */
  tono?: "neutro" | "alerta";
}

interface DataTableCabeceraProps {
  titulo?: React.ReactNode;
  /** Línea de contexto junto al título (total, hora de actualización, …). */
  resumen?: React.ReactNode | undefined;
  /** Toolbar de la tabla; se alinea a la derecha cuando hay título. */
  children: React.ReactNode;
}

/**
 * Fila superior de la cabecera de marca: título de la vista y toolbar.
 *
 * No pinta el azul ni redefine tokens — de eso se encarga el contenedor
 * `.tabla-marca` de `DataTable`, que envuelve también a los segmentos y a la
 * barra de selección para que las tres piezas compartan un solo bloque.
 */
export function DataTableCabecera({ titulo, resumen, children }: Readonly<DataTableCabeceraProps>) {
  return (
    <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
      {titulo && (
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <h2 className="truncate text-[16px] font-semibold text-foreground">{titulo}</h2>
          {resumen && <span className="tabular text-[14px] text-muted-foreground">{resumen}</span>}
        </div>
      )}
      <div className={cn("min-w-0 flex-1", titulo && "sm:ml-auto")}>{children}</div>
    </div>
  );
}

interface DataTableSegmentosProps {
  segmentos: SegmentoTabla[];
  activo?: string | undefined;
  onChange?: ((id: string) => void) | undefined;
}

/**
 * Segmentos de la cabecera: los filtros que el dominio considera "vistas"
 * (todos, en tránsito, retenidos…). Son botones con `aria-pressed`, no pestañas:
 * no cambian de panel, filtran la misma tabla que ya está debajo.
 */
export function DataTableSegmentos({
  segmentos,
  activo,
  onChange,
}: Readonly<DataTableSegmentosProps>) {
  return (
    <fieldset className="flex min-w-0 flex-wrap items-center gap-0.5 px-3.5 pb-2">
      <legend className="sr-only">Vistas de la tabla</legend>
      {segmentos.map((segmento) => {
        const esActivo = segmento.id === activo;

        return (
          <button
            key={segmento.id}
            type="button"
            aria-pressed={esActivo}
            onClick={() => onChange?.(segmento.id)}
            className={cn(
              "inline-flex h-7.5 items-center gap-1.5 rounded-lg px-2.5 text-[14px] font-medium",
              "text-muted-foreground transition-colors duration-150",
              "hover:bg-accent hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
              esActivo && "bg-accent font-semibold text-foreground",
            )}
          >
            {segmento.etiqueta}
            {segmento.conteo !== undefined && (
              <span
                className={cn(
                  "tabular rounded px-1.5 py-px text-[12px] font-normal",
                  esActivo ? "bg-white/25" : "bg-white/15",
                  segmento.tono === "alerta" && "text-destructive",
                )}
              >
                {segmento.conteo}
              </span>
            )}
          </button>
        );
      })}
    </fieldset>
  );
}

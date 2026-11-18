import { FilterX, Inbox, TriangleAlert } from "lucide-react";
import type * as React from "react";
import { cn } from "@/shared/lib/utils";
import { DENSIDADES, type DensidadTabla } from "./data-table-densidad";

/** Anchos de las barras del esqueleto: irregulares a propósito, como el dato real. */
const ANCHOS_ESQUELETO = ["w-24", "w-40", "w-20", "w-32", "w-28", "w-36"];

interface FilasEsqueletoProps {
  columnas: number;
  filas?: number;
  densidad: DensidadTabla;
}

/**
 * Esqueleto de carga: mantiene el encabezado y la altura de fila reales, así que
 * la tabla no da un salto cuando llegan los datos.
 */
export function FilasEsqueleto({ columnas, filas = 5, densidad }: Readonly<FilasEsqueletoProps>) {
  const escala = DENSIDADES[densidad];

  return (
    <>
      {Array.from({ length: filas }, (_, indiceFila) => (
        <tr
          // biome-ignore lint/suspicious/noArrayIndexKey: filas de adorno, sin identidad propia
          key={indiceFila}
          className="border-t border-border/60 first:border-t-0"
          // Las últimas filas se desvanecen: sugiere que la lista sigue hacia abajo.
          style={{ opacity: Math.max(0.3, 1 - indiceFila * 0.18) }}
        >
          {Array.from({ length: columnas }, (_, indiceColumna) => (
            <td
              // biome-ignore lint/suspicious/noArrayIndexKey: celdas de adorno, sin identidad propia
              key={indiceColumna}
              className={cn(escala.fila, "px-3.5 first:pl-4 last:pr-4")}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "block h-2.5 animate-pulse rounded-full bg-muted-foreground/15",
                  ANCHOS_ESQUELETO[(indiceFila + indiceColumna) % ANCHOS_ESQUELETO.length],
                )}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

interface BloqueEstadoProps {
  icono: React.ReactNode;
  titulo: React.ReactNode;
  mensaje?: React.ReactNode;
  detalle?: React.ReactNode;
  acciones?: React.ReactNode;
}

function BloqueEstado({ icono, titulo, mensaje, detalle, acciones }: Readonly<BloqueEstadoProps>) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      {icono}
      <div className="flex flex-col items-center gap-1.5">
        <p className="text-[16px] font-semibold tracking-[-0.01em] text-foreground">{titulo}</p>
        {mensaje && (
          <p className="max-w-sm text-[14px] leading-[20px] text-muted-foreground">{mensaje}</p>
        )}
        {detalle}
      </div>
      {acciones && (
        <div className="flex flex-wrap items-center justify-center gap-2">{acciones}</div>
      )}
    </div>
  );
}

/** Aún no existe ningún registro: el camino es crear el primero. */
export function EstadoVacio({
  titulo,
  mensaje,
  accion,
}: Readonly<{ titulo: React.ReactNode; mensaje?: React.ReactNode; accion?: React.ReactNode }>) {
  return (
    <BloqueEstado
      icono={
        <Inbox aria-hidden="true" className="h-11 w-11 stroke-[1.25px] text-muted-foreground/50" />
      }
      titulo={titulo}
      mensaje={mensaje}
      acciones={accion}
    />
  );
}

/**
 * Hay registros, pero el filtro los esconde todos. Es un estado distinto del
 * vacío: aquí la salida no es crear nada, es soltar el filtro.
 */
export function EstadoSinResultados({
  total,
  accion,
}: Readonly<{ total: number; accion?: React.ReactNode }>) {
  return (
    <BloqueEstado
      icono={
        <FilterX
          aria-hidden="true"
          className="h-11 w-11 stroke-[1.25px] text-muted-foreground/50"
        />
      }
      titulo="Ningún registro coincide"
      mensaje={
        <>
          Se está filtrando sobre{" "}
          <span className="tabular font-medium text-foreground">{total}</span>{" "}
          {total === 1 ? "registro" : "registros"}.
        </>
      }
      acciones={accion}
    />
  );
}

/** La carga falló. Se dice qué pasó y se ofrece reintentar sin perder el contexto. */
export function EstadoError({
  mensaje,
  referencia,
  accion,
}: Readonly<{
  mensaje?: React.ReactNode;
  referencia?: string | undefined;
  accion?: React.ReactNode;
}>) {
  return (
    <BloqueEstado
      icono={
        <TriangleAlert
          aria-hidden="true"
          className="h-11 w-11 stroke-[1.25px] text-destructive/70"
        />
      }
      titulo="No se pudieron cargar los registros"
      mensaje={mensaje ?? "El servicio no respondió. Tus filtros y tu página siguen intactos."}
      detalle={
        referencia && (
          <code className="mt-0.5 rounded bg-muted px-1.5 py-0.5 font-mono text-[12px] text-muted-foreground">
            {referencia}
          </code>
        )
      }
      acciones={accion}
    />
  );
}

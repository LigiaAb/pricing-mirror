"use client";

import { CalendarDays, Clock, Hash } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import type { Actividad } from "@/features/actividades";
import { Badge } from "@/shared/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { formatearFecha } from "@/shared/lib/date";
import type {
  ActividadObjetivo,
  ObjetivoReporte,
  useObjetivosReporte,
} from "../api/objetivos-reporte";
import {
  cumpleMeta,
  etiquetaPeriodo,
  indicesPeriodo,
  maxPeriodos,
  periodoDeColumna,
} from "../lib/objetivos-reporte-vista";
import {
  type ActividadParaSerie,
  actividadesSemanaActual,
  medidoresObjetivosPeriodoActual,
  serieSemanalPorTipo,
} from "../lib/series-actividades";
import { ModalActividadesObjetivo } from "./modal-actividades-objetivo";

// Recharts vía next/dynamic (2.8): el skeleton reserva la misma altura que el
// gráfico real (`h-80` en graficas-objetivos.tsx) para no mover el layout.
const GraficasObjetivos = dynamic(
  () => import("./graficas-objetivos").then((modulo) => modulo.GraficasObjetivos),
  {
    ssr: false,
    loading: () => <div className="mt-4 h-80 animate-pulse rounded-lg border bg-muted/50" />,
  },
);

/** Reportes 4 y 5: objetivos de actividades por empleado y gráficas de la semana actual. */
export function ReporteObjetivos({
  datos,
  grafica,
  actividadesGrafica = [],
}: Readonly<{
  datos: ReturnType<typeof useObjetivosReporte>["data"];
  grafica: boolean;
  actividadesGrafica?: Actividad[];
}>) {
  const [detalle, setDetalle] = useState<ActividadObjetivo[]>([]);
  const objetivos = datos ?? [];
  if (!objetivos.length && !grafica)
    return (
      <p className="text-muted-foreground">No hay objetivos para los filtros seleccionados.</p>
    );
  if (grafica) {
    const fechas = actividadesGrafica.map((actividad) =>
      typeof actividad.fecha_programada === "string" ? actividad.fecha_programada : undefined,
    );
    const serie = serieSemanalPorTipo(actividadesGrafica as ActividadParaSerie[]);
    const semanaActual = actividadesSemanaActual(fechas);
    const medidores = medidoresObjetivosPeriodoActual(objetivos);
    return (
      <div>
        <h2 className="text-lg font-semibold">Actividad por semana ISO</h2>
        <p className="text-sm text-muted-foreground">
          {semanaActual} actividades programadas para la semana actual. La serie muestra el año ISO
          en curso.
        </p>
        <GraficasObjetivos datos={serie.datos} medidores={medidores} tipos={serie.tipos} />
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {objetivos.map((objetivo) => (
        <div
          className="rounded-lg border p-4"
          key={`${objetivo.cod_tipo_actividad}-${objetivo.descripcion}-${objetivo.fecha_inicial}`}
        >
          <div className="flex flex-wrap items-center gap-2">
            {objetivo.tipo_descripcion && <Badge>{objetivo.tipo_descripcion}</Badge>}
            <h2 className="font-semibold">{objetivo.descripcion}</h2>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-4" />
              {formatearFecha(objetivo.fecha_inicial)} - {formatearFecha(objetivo.fecha_final)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="size-4" />
              Periodicidad: {objetivo.periodicidad_descripcion || "—"}
            </span>
            <span className="flex items-center gap-1.5">
              <Hash className="size-4" />
              Cantidad: {objetivo.cantidad} · {maxPeriodos(objetivo)} periodos
            </span>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left">Empleado</th>
                  {indicesPeriodo(objetivo).map((numero) => (
                    <th className="px-2 text-left" key={numero}>
                      <EncabezadoPeriodo numero={numero} objetivo={objetivo} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {objetivo.empleados.map((empleado) => (
                  <tr key={empleado.cod_usuario}>
                    <td>{empleado.nombre}</td>
                    {indicesPeriodo(objetivo).map((numero) => {
                      const total = empleado.datos[numero - 1]?.actividades.length ?? 0;
                      return (
                        <td
                          className={
                            cumpleMeta(total, objetivo.cantidad)
                              ? "bg-green-100 p-2 dark:bg-green-950"
                              : "bg-destructive/10 p-2 "
                          }
                          key={numero}
                        >
                          <button
                            className="w-full text-left"
                            type="button"
                            onClick={() =>
                              setDetalle(empleado.datos[numero - 1]?.actividades ?? [])
                            }
                          >
                            {total}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
      <ModalActividadesObjetivo actividades={detalle} onClose={() => setDetalle([])} />
    </div>
  );
}

/** Columna de periodo: `numero` del backend y, en el tooltip, sus fechas (legacy). */
function EncabezadoPeriodo({
  objetivo,
  numero,
}: Readonly<{ objetivo: ObjetivoReporte; numero: number }>) {
  const periodo = periodoDeColumna(objetivo, numero);
  const etiqueta = etiquetaPeriodo(objetivo.periodicidad_unidad, periodo?.numero || numero);
  if (!periodo) return etiqueta;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-default whitespace-nowrap">{etiqueta}</span>
        </TooltipTrigger>
        <TooltipContent>
          {formatearFecha(periodo.fecha_inicial)} - {formatearFecha(periodo.fecha_final)}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

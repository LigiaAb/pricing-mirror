"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { Actividad } from "@/features/actividades";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { formatearFechaHora } from "@/shared/lib/date";
import type { useObjetivosReporte } from "../api/objetivos-reporte";
import {
  cumpleMeta,
  etiquetaPeriodo,
  indicesPeriodo,
  maxPeriodos,
} from "../lib/objetivos-reporte-vista";
import {
  type ActividadParaSerie,
  actividadesSemanaActual,
  medidoresObjetivosPeriodoActual,
  serieSemanalPorTipo,
} from "../lib/series-actividades";

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
  const [detalle, setDetalle] = useState<
    Array<{ asunto: string; descripcion: string; fecha_programada: string }>
  >([]);
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
          <h2 className="font-semibold">{objetivo.descripcion}</h2>
          <p className="text-sm text-muted-foreground">
            Meta: {objetivo.cantidad} · {maxPeriodos(objetivo)} periodos
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left">Empleado</th>
                  {indicesPeriodo(objetivo).map((numero) => (
                    <th className="px-2 text-left" key={numero}>
                      {etiquetaPeriodo(objetivo.periodicidad_unidad, numero)}
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
      <Dialog
        open={detalle.length > 0}
        onOpenChange={(abierto) => {
          if (!abierto) setDetalle([]);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Actividades del periodo</DialogTitle>
          </DialogHeader>
          <ul className="max-h-72 space-y-2 overflow-y-auto text-sm">
            {detalle.map((actividad) => (
              <li
                className="rounded border p-2"
                key={actividad.asunto + actividad.fecha_programada}
              >
                <strong>{actividad.asunto}</strong>
                <br />
                {actividad.descripcion}
                <br />
                <span className="text-muted-foreground">
                  {formatearFechaHora(actividad.fecha_programada)}
                </span>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </div>
  );
}

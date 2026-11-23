"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DataTable } from "@/shared/components/data-table/data-table";
import type { ColumnDef } from "@/shared/lib/tanstack-table";
import { type ParamsReporteIcc, useReporteIcc } from "../api/reporte-icc";
import { calcularIcc, type ResumenIcc } from "../lib/reporte-icc";

const formatoPorcentaje = (valor: number | null) => (valor == null ? "—" : `${valor.toFixed(2)}%`);

/**
 * Reporte ICC (Índice de Cumplimiento Comercial, #194): gráfica de barras ICCa/ICCp por persona
 * y tabla con porcentajes.
 * - ICCa = visitas realizadas ÷ visitas programadas.
 * - ICCp = llamadas realizadas ÷ llamadas programadas.
 * - Citas sin resultado = visitas finalizadas con `con_resultado = 0`.
 * ICCc (visitas no programadas) queda pendiente de definir. Los filtros los pone
 * `ReportesCrmClient`; `params = null` hasta que se pulsa Filtrar.
 */
export function ReporteIcc({ params }: Readonly<{ params: ParamsReporteIcc | null }>) {
  const consulta = useReporteIcc(params ?? { fecha_inicio: "", fecha_fin: "" }, params !== null);

  const filas = consulta.data;
  const resumen = useMemo(() => calcularIcc(filas ?? []), [filas]);
  const datosGrafica = useMemo(
    () =>
      resumen.personas.map((persona) => ({
        nombre: persona.nombre,
        ICCa: persona.porTipo.VISITA.icc,
        ICCp: persona.porTipo.LLAMADA.icc,
      })),
    [resumen],
  );

  if (params === null) {
    return (
      <p className="text-sm text-muted-foreground">
        Selecciona las fechas (por fecha programada) y pulsa Filtrar para consultar el ICC.
      </p>
    );
  }
  if (consulta.isError) {
    return (
      <p className="text-sm text-destructive">
        Error al consultar el ICC: {consulta.error.message}
      </p>
    );
  }
  if (consulta.isLoading || !filas) return <div>Cargando el reporte...</div>;

  return (
    <div className="space-y-4">
      {datosGrafica.length > 0 && (
        <div className="h-96 rounded-lg border p-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datosGrafica} margin={{ top: 8, right: 12, left: 40, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="nombre"
                interval={0}
                angle={-45}
                textAnchor="end"
                height={130}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 20, 40, 60, 80, 100]}
                tickFormatter={(valor: number) => `${valor}%`}
              />
              <Tooltip
                formatter={(valor) => formatoPorcentaje(valor == null ? null : Number(valor))}
              />
              <Legend verticalAlign="top" />
              <Bar dataKey="ICCa" name="ICCa (visitas)" fill="#2563eb" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ICCp" name="ICCp (llamadas)" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <DataTable
        columns={COLUMNAS}
        data={resumen.personas}
        searchKeys={["nombre"]}
        searchPlaceholder="Buscar persona…"
        numericColumns={COLUMNAS_NUMERICAS}
        emptyMessage="No hay llamadas ni visitas programadas en el rango."
        footer={resumen.personas.length > 0 && <TotalIcc total={resumen.total} />}
      />
    </div>
  );
}

const columna = (
  id: string,
  header: string,
  valor: (resumen: ResumenIcc) => number | null,
  porcentaje = false,
): ColumnDef<ResumenIcc> => ({
  id,
  header,
  accessorFn: valor,
  cell: ({ row }) => {
    const dato = valor(row.original);
    return porcentaje ? formatoPorcentaje(dato) : (dato ?? 0);
  },
});

const COLUMNAS: ColumnDef<ResumenIcc>[] = [
  { accessorKey: "nombre", header: "Persona" },
  columna("visitas_programadas", "Visitas prog.", (r) => r.porTipo.VISITA.programadas),
  columna("visitas_realizadas", "Visitas real.", (r) => r.porTipo.VISITA.realizadas),
  columna("icca", "ICCa", (r) => r.porTipo.VISITA.icc, true),
  columna("llamadas_programadas", "Llamadas prog.", (r) => r.porTipo.LLAMADA.programadas),
  columna("llamadas_realizadas", "Llamadas real.", (r) => r.porTipo.LLAMADA.realizadas),
  columna("iccp", "ICCp", (r) => r.porTipo.LLAMADA.icc, true),
  columna("sin_resultado", "Citas sin resultado", (r) => r.porTipo.VISITA.sinResultado),
];

const COLUMNAS_NUMERICAS = [
  "visitas_programadas",
  "visitas_realizadas",
  "icca",
  "llamadas_programadas",
  "llamadas_realizadas",
  "iccp",
  "sin_resultado",
];

/** Fila de total debajo de la tabla (el DataTable no tiene pie por columnas). */
function TotalIcc({ total }: Readonly<{ total: ResumenIcc }>) {
  const visitas = total.porTipo.VISITA;
  const llamadas = total.porTipo.LLAMADA;
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-1 border-t bg-muted/50 px-4 py-2 text-sm font-semibold">
      <span>TOTAL</span>
      <span>
        ICCa: {visitas.realizadas}/{visitas.programadas} ({formatoPorcentaje(visitas.icc)})
      </span>
      <span>
        ICCp: {llamadas.realizadas}/{llamadas.programadas} ({formatoPorcentaje(llamadas.icc)})
      </span>
      <span>Citas sin resultado: {visitas.sinResultado}</span>
    </div>
  );
}

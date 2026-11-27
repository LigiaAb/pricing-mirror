"use client";

import { format } from "date-fns";
import { FileDown, Loader2 } from "lucide-react";
import { useMemo, useRef } from "react";
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
import { type BloquePdf, usePdfReporte } from "@/features/pricing/reportes";
import { DataTable } from "@/shared/components/data-table/data-table";
import { Button } from "@/shared/components/ui/button";
import type { ColumnDef } from "@/shared/lib/tanstack-table";
import { type ParamsReporteIcc, useReporteIcc } from "../api/reporte-icc";
import { calcularIcc, type ResumenIcc } from "../lib/reporte-icc";

const formatoPorcentaje = (valor: number | null) => (valor == null ? "—" : `${valor.toFixed(2)}%`);

/**
 * Reporte ICC (Índice de Cumplimiento Comercial, #194): gráfica de barras ICCa/ICCp/ICCc por
 * persona y tabla con porcentajes (programada / no programada / vencida las clasifica el
 * backend, `report_icc`; las sumas en `lib/reporte-icc.ts`).
 * - ICCa = visitas programadas realizadas ÷ visitas programadas.
 * - ICCp = llamadas programadas realizadas ÷ llamadas programadas.
 * - ICCc = visitas no programadas realizadas ÷ total de visitas.
 * - Citas sin resultado = visitas finalizadas con `con_resultado = 0`.
 * - Vencidas = llamadas y visitas abiertas sin resultado más de 7 días. Los filtros los pone
 * `ReportesCrmClient`; `params = null` hasta que se pulsa Filtrar. El PDF se arma como el de
 * Hit Rate (`usePdfReporte`): gráfica oculta sin animación + tabla; `encabezado` son los
 * filtros con nombre (empresa, centro de costo, asesor).
 */
export function ReporteIcc({
  params,
  encabezado = {},
}: Readonly<{ params: ParamsReporteIcc | null; encabezado?: Record<string, string> | undefined }>) {
  const graficaPdf = useRef<HTMLDivElement>(null);
  const pdf = usePdfReporte();
  const consulta = useReporteIcc(params ?? { fecha_inicio: "", fecha_fin: "" }, params !== null);

  const filas = consulta.data;
  const resumen = useMemo(() => calcularIcc(filas ?? []), [filas]);

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

  const generarPdf = () => {
    const fecha = (valor: string) => valor.split("-").reverse().join("-");
    const contenido: BloquePdf[] = [
      { tipo: "titulo", texto: "ICCa / ICCp / ICCc por persona" },
      { tipo: "grafica", elemento: graficaPdf.current },
      {
        tipo: "leyenda",
        entradas: [
          { texto: "ICCa (visitas)", color: COLOR_ICCA },
          { texto: "ICCp (llamadas)", color: COLOR_ICCP },
          { texto: "ICCc (visitas no programadas)", color: COLOR_ICCC },
        ],
      },
      { tipo: "pagina" },
      { tipo: "titulo", texto: "Detalle por persona" },
      {
        tipo: "tabla",
        datos: [...resumen.personas, resumen.total].map((r) =>
          Object.fromEntries([
            ["Persona", { dato: r.nombre }],
            ...COLUMNAS_ICC.map((c) => [c.titulo, { dato: celda(c, r), alignFormat: DERECHA }]),
          ]),
        ),
      },
    ];
    pdf.generar({
      titulo: "ICC — Índice de Cumplimiento Comercial",
      archivo: `icc-${format(new Date(), "ddMMyyyyHHmmss")}.pdf`,
      horizontal: true,
      header: {
        Período: `${fecha(params.fecha_inicio)} al ${fecha(params.fecha_fin)}`,
        ...encabezado,
      },
      contenido,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-3">
        {pdf.error && <p className="text-sm text-destructive">{pdf.error}</p>}
        <Button
          type="button"
          variant="outline"
          disabled={pdf.generando || resumen.personas.length === 0}
          onClick={generarPdf}
        >
          {pdf.generando ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <FileDown className="size-4" />
          )}
          Descargar PDF
        </Button>
      </div>

      {resumen.personas.length > 0 && (
        <div className="h-96 rounded-lg border p-3">
          <GraficaIcc datos={resumen.personas} />
        </div>
      )}

      <DataTable
        columns={COLUMNAS}
        data={resumen.personas}
        searchKeys={["nombre"]}
        searchPlaceholder="Buscar persona…"
        numericColumns={COLUMNAS_ICC.map((c) => c.id)}
        emptyMessage="No hay llamadas ni visitas programadas en el rango."
        footer={resumen.personas.length > 0 && <TotalIcc total={resumen.total} />}
      />

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-100000px",
          top: 0,
          width: "1200px",
          height: "420px",
          pointerEvents: "none",
        }}
        ref={graficaPdf}
      >
        <GraficaIcc datos={resumen.personas} animar={false} />
      </div>
    </div>
  );
}

const COLOR_ICCA = "#2563eb";
const COLOR_ICCP = "#16a34a";
const COLOR_ICCC = "#ea580c";

function GraficaIcc({ datos, animar = true }: Readonly<{ datos: ResumenIcc[]; animar?: boolean }>) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={datos} margin={{ top: 8, right: 12, left: 40, bottom: 8 }}>
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
        <Tooltip formatter={(valor) => formatoPorcentaje(valor == null ? null : Number(valor))} />
        <Legend verticalAlign="top" />
        <Bar
          dataKey="icca"
          name="ICCa (visitas)"
          fill={COLOR_ICCA}
          radius={[4, 4, 0, 0]}
          isAnimationActive={animar}
        />
        <Bar
          dataKey="iccp"
          name="ICCp (llamadas)"
          fill={COLOR_ICCP}
          radius={[4, 4, 0, 0]}
          isAnimationActive={animar}
        />
        <Bar
          dataKey="iccc"
          name="ICCc (visitas no programadas)"
          fill={COLOR_ICCC}
          radius={[4, 4, 0, 0]}
          isAnimationActive={animar}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

const DERECHA = { horizontal: "right" } as const;

/** Columnas de la tabla y del PDF (después de Persona). */
const COLUMNAS_ICC: readonly {
  id: Exclude<keyof ResumenIcc, "nombre">;
  titulo: string;
  porcentaje?: true;
}[] = [
  { id: "visitas_programadas", titulo: "Visitas prog." },
  { id: "visitas_realizadas", titulo: "Visitas real." },
  { id: "icca", titulo: "ICCa", porcentaje: true },
  { id: "llamadas_programadas", titulo: "Llamadas prog." },
  { id: "llamadas_realizadas", titulo: "Llamadas real." },
  { id: "iccp", titulo: "ICCp", porcentaje: true },
  { id: "visitas_no_programadas_realizadas", titulo: "Visitas no prog. real." },
  { id: "visitas_total", titulo: "Total visitas" },
  { id: "iccc", titulo: "ICCc", porcentaje: true },
  { id: "sin_resultado", titulo: "Citas sin resultado" },
  { id: "vencidas", titulo: "Vencidas" },
];

const celda = (columna: (typeof COLUMNAS_ICC)[number], resumen: ResumenIcc) => {
  const valor = resumen[columna.id];
  return columna.porcentaje ? formatoPorcentaje(valor) : (valor ?? 0);
};

const COLUMNAS: ColumnDef<ResumenIcc>[] = [
  { accessorKey: "nombre", header: "Persona" },
  ...COLUMNAS_ICC.map(
    (c): ColumnDef<ResumenIcc> => ({
      id: c.id,
      header: c.titulo,
      accessorFn: (r) => r[c.id],
      cell: ({ row }) => celda(c, row.original),
    }),
  ),
];

/** Fila de total debajo de la tabla (el DataTable no tiene pie por columnas). */
function TotalIcc({ total }: Readonly<{ total: ResumenIcc }>) {
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-1 border-t bg-muted/50 px-4 py-2 text-sm font-semibold">
      <span>TOTAL</span>
      <span>
        ICCa: {total.visitas_realizadas}/{total.visitas_programadas} (
        {formatoPorcentaje(total.icca)})
      </span>
      <span>
        ICCp: {total.llamadas_realizadas}/{total.llamadas_programadas} (
        {formatoPorcentaje(total.iccp)})
      </span>
      <span>
        ICCc: {total.visitas_no_programadas_realizadas}/{total.visitas_total} (
        {formatoPorcentaje(total.iccc)})
      </span>
      <span>Citas sin resultado: {total.sin_resultado}</span>
      <span>Vencidas: {total.vencidas}</span>
    </div>
  );
}

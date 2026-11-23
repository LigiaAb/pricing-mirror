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
 * persona y tabla con porcentajes (programada / no programada / vencida en `lib/reporte-icc.ts`).
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
  const datosGrafica = useMemo<DatoGrafica[]>(
    () =>
      resumen.personas.map((persona) => ({
        nombre: persona.nombre,
        ICCa: persona.porTipo.VISITA.icc,
        ICCp: persona.porTipo.LLAMADA.icc,
        ICCc: persona.porTipo.VISITA.iccNoProgramadas,
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
      { tipo: "tabla", datos: filasPdf(resumen) },
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

      {datosGrafica.length > 0 && (
        <div className="h-96 rounded-lg border p-3">
          <GraficaIcc datos={datosGrafica} />
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
        <GraficaIcc datos={datosGrafica} animar={false} />
      </div>
    </div>
  );
}

const COLOR_ICCA = "#2563eb";
const COLOR_ICCP = "#16a34a";
const COLOR_ICCC = "#ea580c";

type DatoGrafica = {
  nombre: string;
  ICCa: number | null;
  ICCp: number | null;
  ICCc: number | null;
};

function GraficaIcc({
  datos,
  animar = true,
}: Readonly<{ datos: DatoGrafica[]; animar?: boolean }>) {
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
          dataKey="ICCa"
          name="ICCa (visitas)"
          fill={COLOR_ICCA}
          radius={[4, 4, 0, 0]}
          isAnimationActive={animar}
        />
        <Bar
          dataKey="ICCp"
          name="ICCp (llamadas)"
          fill={COLOR_ICCP}
          radius={[4, 4, 0, 0]}
          isAnimationActive={animar}
        />
        <Bar
          dataKey="ICCc"
          name="ICCc (visitas no programadas)"
          fill={COLOR_ICCC}
          radius={[4, 4, 0, 0]}
          isAnimationActive={animar}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Filas de la tabla del PDF (mismas columnas que la pantalla) con el TOTAL al final. */
function filasPdf(resumen: { personas: ResumenIcc[]; total: ResumenIcc }) {
  const derecha = { horizontal: "right" } as const;
  return [...resumen.personas, resumen.total].map((r) => ({
    Persona: { dato: r.nombre },
    "Visitas prog.": { dato: r.porTipo.VISITA.programadas, alignFormat: derecha },
    "Visitas real.": { dato: r.porTipo.VISITA.realizadas, alignFormat: derecha },
    ICCa: { dato: formatoPorcentaje(r.porTipo.VISITA.icc), alignFormat: derecha },
    "Llamadas prog.": { dato: r.porTipo.LLAMADA.programadas, alignFormat: derecha },
    "Llamadas real.": { dato: r.porTipo.LLAMADA.realizadas, alignFormat: derecha },
    ICCp: { dato: formatoPorcentaje(r.porTipo.LLAMADA.icc), alignFormat: derecha },
    "Visitas no prog. real.": {
      dato: r.porTipo.VISITA.noProgramadasRealizadas,
      alignFormat: derecha,
    },
    "Total visitas": { dato: r.porTipo.VISITA.total, alignFormat: derecha },
    ICCc: { dato: formatoPorcentaje(r.porTipo.VISITA.iccNoProgramadas), alignFormat: derecha },
    "Citas sin resultado": { dato: r.porTipo.VISITA.sinResultado, alignFormat: derecha },
    Vencidas: { dato: r.vencidas, alignFormat: derecha },
  }));
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
  columna(
    "visitas_no_programadas_realizadas",
    "Visitas no prog. real.",
    (r) => r.porTipo.VISITA.noProgramadasRealizadas,
  ),
  columna("visitas_total", "Total visitas", (r) => r.porTipo.VISITA.total),
  columna("iccc", "ICCc", (r) => r.porTipo.VISITA.iccNoProgramadas, true),
  columna("sin_resultado", "Citas sin resultado", (r) => r.porTipo.VISITA.sinResultado),
  columna("vencidas", "Vencidas", (r) => r.vencidas),
];

const COLUMNAS_NUMERICAS = [
  "visitas_programadas",
  "visitas_realizadas",
  "icca",
  "llamadas_programadas",
  "llamadas_realizadas",
  "iccp",
  "visitas_no_programadas_realizadas",
  "visitas_total",
  "iccc",
  "sin_resultado",
  "vencidas",
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
      <span>
        ICCc: {visitas.noProgramadasRealizadas}/{visitas.total} (
        {formatoPorcentaje(visitas.iccNoProgramadas)})
      </span>
      <span>Citas sin resultado: {visitas.sinResultado}</span>
      <span>Vencidas: {total.vencidas}</span>
    </div>
  );
}

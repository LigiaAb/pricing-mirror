"use client";

import { format } from "date-fns";
import { useEffect, useMemo, useRef } from "react";
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
import type { ColumnDef } from "@/shared/lib/tanstack-table";
import type { ResumenIcc } from "../../definiciones/crm/reporte-icc";
import { totalIcc } from "../../lib/crm/reporte-icc";
import type { ContenidoReporteProps } from "../../lib/definir-reporte";

const formatoPorcentaje = (valor: number | null) => (valor == null ? "—" : `${valor.toFixed(2)}%`);

/**
 * Vista del reporte ICC (Índice de Cumplimiento Comercial, #194): gráfica de barras
 * ICCa/ICCp/ICCc por persona, tabla con TOTAL y PDF. Recibe las filas por persona que arma
 * `consultar` (definiciones/crm/reporte-icc.tsx); el TOTAL se saca de ellas (`totalIcc`).
 * - ICCa = visitas programadas realizadas ÷ visitas programadas.
 * - ICCp = llamadas programadas realizadas ÷ llamadas programadas.
 * - ICCc = visitas no programadas realizadas ÷ total de visitas.
 * - Citas sin resultado = visitas finalizadas sin resultado.
 * - Vencidas = llamadas y visitas abiertas sin resultado más de 7 días.
 * El PDF (`descargas: { pdf: "contenido" }`) se genera cada vez que se pulsa el botón PDF
 * (`solicitudPdf` cambia) con `usePdfReporte`: gráfica oculta sin animación + tabla.
 */

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
  const valor = resumen[columna.id] as number | null;
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

export function VistaIcc(props: ContenidoReporteProps<ResumenIcc>) {
  const { filas, encabezado, solicitudPdf, onGenerandoPdf, onErrorPdf } = props;
  const graficaPdf = useRef<HTMLDivElement>(null);
  // onError / onGenerando: el botón PDF de la pantalla muestra "Generando PDF..." y el error.
  const { generar } = usePdfReporte({ onError: onErrorPdf, onGenerando: onGenerandoPdf });
  const total = useMemo(() => totalIcc(filas), [filas]);

  // Genera el PDF cuando se pulsa el botón (solicitudPdf cambia), no al abrir la vista.
  const ultimaSolicitud = useRef(solicitudPdf);
  useEffect(() => {
    if (solicitudPdf === ultimaSolicitud.current) return;
    ultimaSolicitud.current = solicitudPdf;
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
        datos: [...filas, total].map((r) =>
          Object.fromEntries([
            ["Persona", { dato: r.nombre }],
            ...COLUMNAS_ICC.map((c) => [c.titulo, { dato: celda(c, r), alignFormat: DERECHA }]),
          ]),
        ),
      },
    ];
    generar({
      titulo: "ICC — Índice de Cumplimiento Comercial",
      archivo: `icc-${format(new Date(), "ddMMyyyyHHmmss")}.pdf`,
      horizontal: true,
      header: encabezado, // ya trae Período, Empresa, Centro de costo y los filtros con nombre
      contenido,
    });
  }, [solicitudPdf, filas, total, encabezado, generar]);

  return (
    <div className="space-y-3">
      {filas.length > 0 && (
        <div className="h-96 rounded-lg border p-3">
          <GraficaIcc datos={filas as ResumenIcc[]} />
        </div>
      )}
      <p className="text-sm">{filas.length} registros</p>
      <DataTable
        columns={COLUMNAS}
        data={filas as ResumenIcc[]}
        searchKeys={["nombre"]}
        searchPlaceholder="Buscar persona…"
        numericColumns={COLUMNAS_ICC.map((c) => c.id)}
        emptyMessage="No hay llamadas ni visitas programadas en el rango."
        footer={filas.length > 0 && <TotalIcc total={total} />}
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
        <GraficaIcc datos={filas as ResumenIcc[]} animar={false} />
      </div>
    </div>
  );
}

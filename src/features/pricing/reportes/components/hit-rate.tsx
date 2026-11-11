"use client";

import { format } from "date-fns";
import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Loader } from "@/shared/components/ui/loader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { cn } from "@/shared/lib/utils";
import {
  type HitRateCentroCosto,
  type HitRateTransporte,
  type HitRateUsuario,
  useHitRate,
} from "../api/hit-rate";
import { usePdfReporte } from "../hooks/use-pdf-reporte";
import type { Filtros } from "../lib/filtros-types";
import type { BloquePdf } from "../lib/pdf-reporte";

const COLORES = ["#2563eb", "#16a34a", "#ea580c", "#9333ea", "#0891b2", "#dc2626"];
const color = (indice: number) => COLORES[indice % COLORES.length] ?? "#2563eb";
const objetivo = 0.85;
const clase = "flex flex-col w-full bg-card border rounded-md p-2";

type formatArray = HitRateUsuario[] | HitRateTransporte[] | HitRateCentroCosto[];

export type BarCharObj = {
  id?: string;
  name: string;
  Alcance?: number;
  value?: number;
  fill?: string;
  valor?: string | number;
  total?: number;
  total_individual?: number;
};

const formatNumber = (valor: number, decimal: number) => valor.toFixed(decimal);

function GenerarTabla({
  data,
  objetivo,
  visible = true,
  diferencial = false,
}: {
  data: BarCharObj[];
  objetivo?: number;
  visible?: boolean;
  diferencial?: boolean;
}) {
  const style = {};
  const classCenter = "text-center";
  const classRight = "text-right";
  const classBase = "bg-primary text-primary-foreground";

  return (
    <div
      className="px-5 w-full"
      aria-hidden={!visible}
      style={
        visible
          ? undefined
          : {
              position: "absolute",
              left: "-100000px",
              top: 0,
              width: "1200px",
              pointerEvents: "none",
            }
      }
    >
      <Table className="w-full">
        <TableHeader className="rounded-lg bg-transparent">
          <TableRow className="rounded-lg bg-transparent">
            <TableHead style={style} className={cn(classCenter, classBase)} />
            <TableHead style={style} className={cn(classCenter, classBase)}>
              Generadas
            </TableHead>
            <TableHead style={style} className={cn(classCenter, classBase)}>
              Confirmados
            </TableHead>
            <TableHead style={style} className={cn(classRight, classBase)}>
              Alcance
            </TableHead>
            {objetivo && (
              <TableHead style={style} className={cn(classRight, classBase)}>
                Objetivo
              </TableHead>
            )}
            {diferencial && (
              <TableHead style={style} className={cn(classRight, classBase)}>
                Diferencial
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((i) => {
            const { total = 0, total_individual = 0 } = i;
            const valor = Number(i.valor ?? 0);
            const color = !objetivo
              ? ""
              : valor < objetivo
                ? "text-destructive"
                : valor === objetivo
                  ? ""
                  : "text-success";
            const resto = 100 - valor;

            return (
              <TableRow key={i.id ?? i.name}>
                <TableCell className="py-0 px-2 m-0">{i.name}</TableCell>
                <TableCell className={`py-0 px-2 m-0 text-center`}>
                  <pre>{total}</pre>
                </TableCell>
                <TableCell className={`py-0 px-2 m-0 text-center`}>
                  <pre>{total_individual}</pre>
                </TableCell>
                <TableCell className={`py-0 px-2 m-0 text-right ${color}`}>
                  <pre>{formatNumber(valor, 2)}%</pre>
                </TableCell>
                {objetivo && (
                  <TableCell className="py-0 px-2 m-0 text-right">
                    <pre>{formatNumber(objetivo, 2)}%</pre>
                  </TableCell>
                )}
                {diferencial && (
                  <TableCell className="py-0 px-2 m-0 text-right">
                    <pre>{formatNumber(resto, 2)}%</pre>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function SimplePieChart({
  data,
  isAnimationActive = true,
  titulo,
  ref,
  visible = true,
}: {
  data: BarCharObj[];
  isAnimationActive?: boolean;
  titulo: string;
  ref?: React.Ref<HTMLDivElement>;
  visible?: boolean;
}) {
  return (
    <div
      style={{
        textAlign: "center",
        width: "100%",
        maxHeight: "300px",
        maxWidth: "600px",
        ...(visible
          ? {}
          : {
              position: "absolute",
              left: "-100000px",
              top: 0,
              width: "1200px",
              pointerEvents: "none",
            }),
      }}
      className="mx-auto"
      aria-hidden={!visible}
      ref={ref}
    >
      <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "10px" }}>{titulo}</h2>

      <PieChart
        responsive
        style={{ width: "100%", maxHeight: "300px", aspectRatio: 1.5 }}
        className="mx-auto"
      >
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cornerRadius="10%"
          paddingAngle={0.5}
          width="100%"
          outerRadius="100%"
          isAnimationActive={isAnimationActive}
          label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
            const RADIAN = Math.PI / 180;
            const radius = Number(innerRadius) + (Number(outerRadius) - Number(innerRadius)) * 0.6;

            const x = Number(cx) + radius * Math.cos(-Number(midAngle) * RADIAN);
            const y = Number(cy) + radius * Math.sin(-Number(midAngle) * RADIAN);

            return (
              <text
                x={x}
                y={y}
                fill="white"
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={12}
                fontWeight="bold"
              >
                {`${(Number(percent ?? 0) * 100).toFixed(2)}%`}
              </text>
            );
          }}
          labelLine={false}
        />
        <Tooltip formatter={(value) => `${(Number(value ?? 0) * 100).toFixed(2)}%`} />
        <Legend />
      </PieChart>
    </div>
  );
}
const SimpleBarChart = ({
  data,
  clave = "Alcance",
  objetivo = 0.85,
  titulo,
  ref,
  isAnimationActive = true,
  visible = true,
}: {
  data: BarCharObj[];
  clave?: string;
  isAnimationActive?: boolean;
  objetivo?: number;
  titulo: string;
  ref?: React.Ref<HTMLDivElement>;
  visible?: boolean;
}) => {
  const ticks = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
  return (
    <div
      style={{
        textAlign: "center",
        width: "100%",
        aspectRatio: 1.618,
        maxHeight: "300px",
        maxWidth: "600px",
        ...(visible
          ? {}
          : {
              position: "absolute",
              left: "-100000px",
              top: 0,
              width: "1200px",
              pointerEvents: "none",
            }),
      }}
      className="mx-auto"
      aria-hidden={!visible}
      ref={ref}
    >
      <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "10px" }}>{titulo}</h2>
      <BarChart
        style={{ width: "100%", maxHeight: "250px", aspectRatio: 1.618 }}
        className="mx-auto"
        responsive
        data={data}
        margin={{
          top: 5,
          right: 5,
          left: 5,
          bottom: 5,
        }}
      >
        <CartesianGrid yAxisId="left" horizontalValues={ticks} vertical={false} />
        <YAxis
          yAxisId="left"
          orientation="left"
          domain={[0, 1]}
          ticks={ticks}
          allowDataOverflow
          tickFormatter={(value: number) => `${(value * 100).toFixed(0)}%`}
        />
        <YAxis
          yAxisId="right"
          ticks={[objetivo]}
          orientation="right"
          domain={[0, 1]}
          allowDataOverflow
          tick={({ x, y }) => (
            <text
              x={Number(x) + 5}
              y={y}
              textAnchor="start"
              dominantBaseline="middle"
              fill={color(5)}
              fontSize={12}
              fontWeight="bold"
            >
              {`${(objetivo * 100).toFixed(0)}%`}
            </text>
          )}
          tickFormatter={(value: number) => `${(value * 100).toFixed(0)}%`}
        />
        <XAxis
          dataKey="name"
          interval={0}
          angle={-45}
          textAnchor="end"
          height={100}
          tick={{ fontSize: 11 }}
        />
        <Tooltip formatter={(value) => `${(Number(value ?? 0) * 100).toFixed(2)}%`} />
        <Legend
          content={({ payload }) => (
            <div className="flex items-center justify-center gap-4 text-xs">
              {payload?.map((entry) => (
                <div key={String(entry.dataKey ?? entry.value)} className="flex items-center gap-1">
                  <div className="size-3" style={{ backgroundColor: entry.color }} />
                  <span style={{ color: entry.color }}>{entry.value}</span>
                </div>
              ))}

              <div className="flex items-center gap-1">
                <div className="w-5 border-t-2 border" style={{ borderColor: color(5) }} />
                <span style={{ color: color(5) }}>Objetivo {objetivo * 100}%</span>
              </div>
            </div>
          )}
        />
        <Bar
          yAxisId="left"
          dataKey={clave}
          fill={color(0)}
          radius={[5, 5, 0, 0]}
          stackId="a"
          isAnimationActive={isAnimationActive}
        />
        <Bar
          yAxisId="left"
          dataKey="resto"
          fill="transparent"
          stackId="a"
          isAnimationActive={isAnimationActive}
        />
        {/* <Bar className="block max-[1400px]:hidden" yAxisId="left" dataKey="extra" fill="transparent" stackId="a" isAnimationActive={isAnimationActive}>
          <LabelList dataKey="valor" position="middle" fontSize={11} formatter={(value) => `${value}%`} />
        </Bar> */}
        <ReferenceLine yAxisId="left" y={objetivo} stroke={color(5)} strokeWidth={2} />
        <ReferenceLine yAxisId="left" y={1} stroke="#000" strokeWidth={1} />
      </BarChart>
    </div>
  );
};

export function HitRate({
  filtros,
  reconsultar,
  tipo,
  descargar = 0,
  onErrorPdf,
  onGenerandoPdf,
}: {
  filtros: Filtros;
  reconsultar: number;
  tipo: string;
  descargar?: number;
  onErrorPdf?: (mensaje: string | null) => void;
  onGenerandoPdf?: (generando: boolean) => void;
}) {
  const hrpp_ref = React.useRef<HTMLDivElement>(null);
  const hrse_terrestre_ref = React.useRef<HTMLDivElement>(null);
  const hrse_aereo_ref = React.useRef<HTMLDivElement>(null);
  const hrse_maritimo_ref = React.useRef<HTMLDivElement>(null);
  const pieRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const ultimaDescarga = React.useRef(descargar);
  const [errorPreparacionPdf, setErrorPreparacionPdf] = React.useState<string | null>(null);
  const {
    generar,
    generando: generandoPdf,
    error: errorPdf,
  } = usePdfReporte({ onError: onErrorPdf, onGenerando: onGenerandoPdf });

  const tipoTransporte = React.useMemo(
    () => filtros.cod_tipo_transporte?.label ?? "AEREO",
    [filtros.cod_tipo_transporte],
  );

  const { data, isLoading, error, refetch } = useHitRate(filtros);

  const barFormatArray = (arr1: formatArray, arr2: formatArray) =>
    arr1.map<BarCharObj>((i) => {
      const confirmadas = arr2?.find((c) => (c.usuario ? c.usuario === i.usuario : c.cc === i.cc));

      const alcance = i.total > 0 ? (confirmadas?.total ?? 0) / i.total : 0;
      const alcanceRounded = Number(alcance.toFixed(4));
      return {
        id: String(i.usuario ?? i.cc),
        name: `${i.nombres ?? ""} ${i.apellidos ?? ""}`.trim(),
        Alcance: alcanceRounded,
        resto: 1 - alcanceRounded,
        valor: Number((alcanceRounded * 100).toFixed(2)),
        extra: 0.2,
        total: i.total,
        total_individual: confirmadas?.total ?? 0,
      };
    });
  const pieFormatArray = (arr1: formatArray, arr2: formatArray) =>
    arr1.map<{ id: string; name: string; data: BarCharObj[] }>((i) => {
      const confirmadas = arr2?.find((c) => (c.usuario ? c.usuario === i.usuario : c.cc === i.cc));

      const alcance = i.total > 0 ? (confirmadas?.total ?? 0) / i.total : 0;
      const alcanceRounded = Number(alcance.toFixed(4));

      return {
        id: String(i.cc ?? i.usuario),
        name: i.nombres ?? "",
        data: [
          {
            name: "Alcance",
            value: alcanceRounded,
            fill: color(0),
            valor: (alcanceRounded * 100).toFixed(2),
            total: i.total,
            total_individual: confirmadas?.total ?? 0,
          },
          {
            name: "Diferencial",
            value: 1 - alcanceRounded,
            fill: color(5),
            valor: ((1 - alcanceRounded) * 100).toFixed(2),
          },
        ],
      };
    });

  const hrpp = barFormatArray(
    (data?.global_by_user ?? []) as formatArray,
    (data?.confirmadas_by_user ?? []) as formatArray,
  );
  const hrse_terrestre = barFormatArray(
    (data?.tipo_transporte_terrestre ?? []) as formatArray,
    (data?.confirmadas_tipo_transporte_terrestre ?? []) as formatArray,
  );
  const hrse_aereo = barFormatArray(
    (data?.tipo_transporte_aereo ?? []) as formatArray,
    (data?.confirmadas_tipo_transporte_aereo ?? []) as formatArray,
  );
  const hrse_maritimo = barFormatArray(
    (data?.tipo_transporte_maritimo ?? []) as formatArray,
    (data?.confirmadas_tipo_transporte_maritimo ?? []) as formatArray,
  );
  const hrse_cc = pieFormatArray(
    (data?.cc ?? []) as formatArray,
    (data?.confirmadas_cc ?? []) as formatArray,
  );

  const generarPdf = React.useCallback(() => {
    if (generandoPdf) return;
    setErrorPreparacionPdf(null);
    try {
      if (!data) throw new Error("Espera a que termine la consulta antes de descargar.");
      const seccionBarras = (
        titulo: string,
        elemento: HTMLDivElement | null,
        filas: BarCharObj[],
      ): BloquePdf[] => [
        { tipo: "titulo", texto: titulo },
        {
          tipo: "fila",
          columnas: [
            {
              tipo: "tabla",
              datos: filas.length
                ? filas.map((fila) => ({
                    Nombre: { dato: fila.name, alignFormat: { horizontal: "left" } },
                    Generadas: {
                      dato: Number(fila.total ?? 0),
                      alignFormat: { horizontal: "center" },
                    },
                    Confirmadas: {
                      dato: Number(fila.total_individual ?? 0),
                      alignFormat: { horizontal: "center" },
                    },
                    Alcance: {
                      dato: `${Number(fila.valor ?? 0).toFixed(2)}%`,
                      alignFormat: { horizontal: "right" },
                    },
                    Objetivo: {
                      dato: `${(objetivo * 100).toFixed(2)}%`,
                      alignFormat: { horizontal: "right" },
                    },
                  }))
                : [{ "": "Sin datos" }],
            },
            [
              { tipo: "grafica", elemento },
              {
                tipo: "leyenda",
                entradas: [
                  { texto: "Alcance", color: color(0) },
                  { texto: `Objetivo: ${(objetivo * 100).toFixed(2)}%`, color: "#dc2626" },
                ],
              },
            ],
          ],
        },
      ];
      generar({
        titulo: "Hit Rate",
        archivo: `hit-rate-${format(new Date(), "ddMMyyyyhhmmss")}.pdf`,
        horizontal: true,
        header: {
          Período: `${format(filtros.fecha_inicio, "dd-MM-yyyy")} al ${format(filtros.fecha_fin, "dd-MM-yyyy")}`,
          Empresa: filtros.cod_empresa?.nombre,
          "Centro de Costo": filtros.cod_cc?.nombre,
          ...(filtros.cod_usuario ? { Usuario: filtros.cod_usuario?.label } : {}),
          ...(filtros.cod_tipo_pago ? { "Tipo de pago": filtros.cod_tipo_pago?.label } : {}),
        },
        // El orden y el diseño de este reporte se cambian solamente aquí.
        contenido: [
          ...seccionBarras("HRpp", hrpp_ref.current, hrpp),
          ...seccionBarras("HRse Aereo", hrse_aereo_ref.current, hrse_aereo),
          { tipo: "pagina" },
          ...seccionBarras("HRse Terrestre", hrse_terrestre_ref.current, hrse_terrestre),
          ...seccionBarras("HRse Maritimo", hrse_maritimo_ref.current, hrse_maritimo),
          { tipo: "pagina" },
          ...hrse_cc.flatMap((item): BloquePdf[] => [
            { tipo: "titulo", texto: `HR ${item.name}` },
            {
              tipo: "fila",
              columnas: [
                {
                  tipo: "tabla",
                  datos: item.data
                    .filter((fila) => fila.name === "Alcance")
                    .map((fila) => ({
                      Nombre: { dato: fila.name, alignFormat: { horizontal: "left" } },
                      Generadas: {
                        dato: Number(fila.total ?? 0),
                        alignFormat: { horizontal: "center" },
                      },
                      Confirmadas: {
                        dato: Number(fila.total_individual ?? 0),
                        alignFormat: { horizontal: "center" },
                      },
                      Alcance: {
                        dato: `${Number(fila.valor ?? 0).toFixed(2)}%`,
                        alignFormat: { horizontal: "right" },
                      },
                      Direfencial: {
                        dato: `${(100 - Number(fila.valor ?? 0)).toFixed(2)}%`,
                        alignFormat: { horizontal: "right" },
                      },
                    })),
                },
                [
                  { tipo: "grafica", elemento: pieRefs.current[item.id] ?? null },
                  {
                    tipo: "leyenda",
                    entradas: item.data.map((fila) => ({
                      texto: fila.name,
                      color: fila.fill ?? color(0),
                    })),
                  },
                ],
              ],
            },
          ]),
        ],
      });
    } catch (causa) {
      // También informa errores previos al hook: fechas, encabezado o construcción del contenido.
      const mensaje = causa instanceof Error ? causa.message : "No se pudo preparar el PDF.";
      setErrorPreparacionPdf(mensaje);
      onErrorPdf?.(mensaje);
      onGenerandoPdf?.(false);
    }
  }, [
    filtros,
    data,
    generandoPdf,
    hrpp,
    hrse_aereo,
    hrse_terrestre,
    hrse_maritimo,
    hrse_cc,
    generar,
    onErrorPdf,
    onGenerandoPdf,
  ]);

  React.useEffect(() => {
    const a = { filtros, reconsultar };
    if (!a) return;
    refetch();
  }, [refetch, filtros, reconsultar]);

  React.useEffect(() => {
    if (descargar === ultimaDescarga.current || !data) return;
    ultimaDescarga.current = descargar;
    generarPdf();
  }, [descargar, data, generarPdf]);

  if (isLoading) return tipo === "descarga" ? null : <Loader />;

  if (error) return tipo === "descarga" ? null : <div>Error</div>;

  // La instancia de descarga solo monta las gráficas necesarias para capturar el PDF.
  if (tipo === "descarga")
    return (
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-100000px",
          top: 0,
          width: "1200px",
          pointerEvents: "none",
        }}
      >
        <SimpleBarChart
          titulo="HRpp"
          objetivo={objetivo}
          data={hrpp}
          ref={hrpp_ref}
          isAnimationActive={false}
        />
        <SimpleBarChart
          titulo="HRse Aereo"
          objetivo={objetivo}
          data={hrse_aereo}
          ref={hrse_aereo_ref}
          isAnimationActive={false}
        />
        <SimpleBarChart
          titulo="HRse Terrestre"
          objetivo={objetivo}
          data={hrse_terrestre}
          ref={hrse_terrestre_ref}
          isAnimationActive={false}
        />
        <SimpleBarChart
          titulo="HRse Maritimo"
          objetivo={objetivo}
          data={hrse_maritimo}
          ref={hrse_maritimo_ref}
          isAnimationActive={false}
        />
        {hrse_cc.map((item) => (
          <SimplePieChart
            key={item.id}
            titulo={`HR ${item.name}`}
            data={item.data}
            isAnimationActive={false}
            ref={(element) => {
              pieRefs.current[item.id] = element;
            }}
          />
        ))}
      </div>
    );

  return (
    <div className="flex flex-col gap-4 bg-background w-full">
      {errorPreparacionPdf || errorPdf ? (
        <p role="alert" className="text-sm text-destructive">
          {errorPreparacionPdf ?? errorPdf}
        </p>
      ) : null}

      <div className={clase}>
        {tipo.split("-")[0] === "tablas" && (
          <div className={cn("w-full")}>
            <GenerarTabla objetivo={objetivo * 100} data={hrpp} />
            <GenerarTabla
              visible={tipoTransporte === "TERRESTRE"}
              objetivo={objetivo * 100}
              data={hrse_terrestre}
            />
            <GenerarTabla
              visible={tipoTransporte === "AEREO"}
              objetivo={objetivo * 100}
              data={hrse_aereo}
            />
            <GenerarTabla
              visible={tipoTransporte === "MARITIMO"}
              objetivo={objetivo * 100}
              data={hrse_maritimo}
            />
            {hrse_cc.map((i) => (
              <div className="flex flex-col" key={i.id}>
                <GenerarTabla
                  diferencial
                  data={i.data
                    .filter((i) => i.name === "Alcance")
                    .map((a) => ({ ...a, name: i.name }))}
                />
              </div>
            ))}
          </div>
        )}
        {tipo.split("-")[0] === "grafica" && (
          <div className={cn("w-full")}>
            {tipo.split("-")[1] === "usuario" && (
              <>
                <SimpleBarChart
                  titulo="HRpp"
                  objetivo={objetivo}
                  data={hrpp}
                  ref={hrpp_ref}
                  isAnimationActive={!generandoPdf}
                />
                <GenerarTabla objetivo={objetivo * 100} data={hrpp} />
              </>
            )}
            {tipo.split("-")[1] === "transporte" && (
              <>
                <SimpleBarChart
                  visible={tipoTransporte === "TERRESTRE"}
                  titulo="HRse Terrestre"
                  objetivo={objetivo}
                  data={hrse_terrestre}
                  ref={hrse_terrestre_ref}
                  isAnimationActive={!generandoPdf}
                />
                <GenerarTabla
                  visible={tipoTransporte === "TERRESTRE"}
                  objetivo={objetivo * 100}
                  data={hrse_terrestre}
                />
              </>
            )}
            {tipo.split("-")[1] === "transporte" && (
              <>
                <SimpleBarChart
                  visible={tipoTransporte === "AEREO"}
                  titulo="HRse Aereo"
                  objetivo={objetivo}
                  data={hrse_aereo}
                  ref={hrse_aereo_ref}
                  isAnimationActive={!generandoPdf}
                />
                <GenerarTabla
                  visible={tipoTransporte === "AEREO"}
                  objetivo={objetivo * 100}
                  data={hrse_aereo}
                />
              </>
            )}
            {tipo.split("-")[1] === "transporte" && (
              <>
                <SimpleBarChart
                  visible={tipoTransporte === "MARITIMO"}
                  titulo="HRse Maritimo"
                  objetivo={objetivo}
                  data={hrse_maritimo}
                  ref={hrse_maritimo_ref}
                  isAnimationActive={!generandoPdf}
                />
                <GenerarTabla
                  visible={tipoTransporte === "MARITIMO"}
                  objetivo={objetivo * 100}
                  data={hrse_maritimo}
                />
              </>
            )}
            {tipo.split("-")[1] === "otros" &&
              hrse_cc.map((i) => (
                <div className="mb-5 w-full grid grid-cols-2" key={i.id}>
                  <GenerarTabla
                    diferencial
                    data={i.data
                      .filter((i) => i.name === "Alcance")
                      .map((a) => ({ ...a, name: i.name }))}
                  />
                  <SimplePieChart
                    titulo={`HR ${i.name}`}
                    data={i.data}
                    isAnimationActive={!generandoPdf}
                    ref={(element) => {
                      pieRefs.current[i.id] = element;
                    }}
                  />
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

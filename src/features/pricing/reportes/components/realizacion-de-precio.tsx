"use client";

import { format } from "date-fns";
import React from "react";
import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from "recharts";
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
import { useRealizacionDePrecio } from "../api/realizacion-de-precio";
import { usePdfReporte } from "../hooks/use-pdf-reporte";
import type { Filtros } from "../lib/filtros-types";

const COLORES = ["#2563eb", "#16a34a", "#ea580c", "#9333ea", "#0891b2", "#dc2626"];
const color = (indice: number) => COLORES[indice % COLORES.length] ?? "#2563eb";
const clase = "bg-card border rounded-md p-2";
const formatNumber = (valor: number, decimal: number) => valor.toFixed(decimal);

type BarCharObj = {
  seccion: string;
  [nombre: string]: string | number;
};

function GenerarTabla({ data, visible = true }: { data: BarCharObj[]; visible?: boolean }) {
  const columnas = [
    {
      accessorKey: "name",
      header: "Nombre",
    },
    ...data.map(({ seccion }) => ({
      accessorKey: seccion,
      header: seccion,
    })),
  ];

  const datosTabla = Object.values(
    data.reduce<Record<string, Record<string, string | number>>>(
      (acc, { seccion, ...usuarios }: BarCharObj) => {
        Object.entries(usuarios).forEach(([nombre, total]) => {
          acc[nombre] ??= { name: nombre };
          acc[nombre][seccion] = total;
        });

        return acc;
      },
      {},
    ),
  );

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
      <Table>
        <TableHeader className="rounded-lg bg-transparent">
          <TableRow className="rounded-lg bg-transparent">
            {columnas.map((columna) => (
              <TableHead key={columna.accessorKey}>{columna.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {datosTabla.map((fila) => (
            <TableRow key={fila.name}>
              {columnas.map((columna) => {
                const valor = fila[columna.accessorKey];
                const numero =
                  columna.accessorKey === "name" || valor === undefined ? null : Number(valor);

                return (
                  <TableCell
                    key={columna.accessorKey}
                    className={columna.accessorKey !== "name" ? "text-right" : ""}
                  >
                    {columna.accessorKey === "name" ? (
                      valor
                    ) : numero !== null ? (
                      <pre>{(numero * 100).toFixed(2)}%</pre>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

const SimpleBarChart = ({
  data,
  titulo,
  ref,
  isAnimationActive = true,
  visible = true,
  maxHeight = "20rem",
  maxWidth = "50rem",
}: {
  data: BarCharObj[];
  clave?: string;
  isAnimationActive?: boolean;
  objetivo?: number;
  titulo: string;
  ref?: React.Ref<HTMLDivElement>;
  visible?: boolean;
  maxHeight?: number | string;
  maxWidth?: number | string;
}) => {
  const nombres = [
    ...new Set(data.flatMap((grupo) => Object.keys(grupo).filter((clave) => clave !== "seccion"))),
  ];

  const ticks = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];

  return (
    <div
      style={{
        textAlign: "center",
        width: "100%",
        aspectRatio: 1.618,
        maxHeight,
        maxWidth,
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
        style={{ width: "100%", maxHeight, maxWidth, aspectRatio: 1.618 }}
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
        <XAxis
          dataKey="seccion"
          interval={0}
          angle={-45}
          textAnchor="end"
          tick={{ fontSize: 11 }}
        />
        <Legend />
        <Tooltip formatter={(value) => `${(Number(value ?? 0) * 100).toFixed(2)}%`} />
        {nombres.map((nombre, indice) => (
          <Bar
            key={nombre}
            yAxisId="left"
            dataKey={nombre}
            name={nombre}
            radius={[5, 5, 0, 0]}
            fill={`${color(indice)}DA`}
            maxBarSize={50}
            isAnimationActive={isAnimationActive}
            minPointSize={0.5}
          />
        ))}
      </BarChart>
    </div>
  );
};

function RealizacionDePrecio({
  filtros,
  reconsultar,
  descargar = 0,
  onErrorPdf,
  onGenerandoPdf,
  tipo,
}: {
  filtros: Filtros;
  tipo: string;
  reconsultar: number;
  descargar?: number;
  onErrorPdf?: (mensaje: string | null) => void;
  onGenerandoPdf?: (generando: boolean) => void;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const ultimaDescarga = React.useRef(descargar);

  const {
    generar,
    generando: generandoPdf,
    error: errorPdf,
  } = usePdfReporte({ onError: onErrorPdf, onGenerando: onGenerandoPdf });

  const { data, isLoading, error, refetch } = useRealizacionDePrecio(filtros);

  const totalesPorUsuario = new Map(
    (data?.global_by_user ?? []).map((item) => [item.usuario, Number(item.total)]),
  );

  const grupos = {
    RdPs: data?.by_user_alto ?? [],
    RdPd: data?.by_user_bajo ?? [],
    RdPp: data?.by_user_original ?? [],
  };

  const resultado = Object.entries(grupos).map(([tipo, registros]) => ({
    [tipo]: registros.map((item) => {
      const totalUsuario = totalesPorUsuario.get(item.usuario) ?? 0;
      const total = totalUsuario > 0 ? Number(item.total) / totalUsuario : 0;

      return {
        name: `${item.nombres ?? ""} ${item.apellidos ?? ""}`.trim(),
        total: formatNumber(total, 4),
        resto: formatNumber(1 - total, 4),
      };
    }),
  }));

  const datosFormateados: BarCharObj[] = resultado.flatMap((grupo) =>
    Object.entries(grupo).map(([seccion, usuarios]) => ({
      seccion,
      ...Object.fromEntries(usuarios.map(({ name, total }) => [name, total])),
    })),
  );

  const generarPdf = React.useCallback(() => {
    if (generandoPdf) return;
    if (!data) {
      onErrorPdf?.("Espera a que termine la consulta antes de descargar.");
      return;
    }
    const nombres = [
      ...new Set(datosFormateados.flatMap(({ seccion, ...usuarios }) => Object.keys(usuarios))),
    ];
    generar({
      titulo: "Realizacion de Precio (RdP)",
      archivo: `realizacion-de-precio-${format(new Date(), "ddMMyyyyhhmmss")}.pdf`,
      horizontal: true,
      header: {
        Período: `${format(filtros.fecha_inicio, "dd-MM-yyyy")} al ${format(filtros.fecha_fin, "dd-MM-yyyy")}`,
        Empresa: filtros.cod_empresa?.nombre,
        "Centro de Costo": filtros.cod_cc?.nombre,
        ...(filtros.cod_usuario ? { Usuario: filtros.cod_usuario?.label } : {}),
        ...(filtros.cod_tipo_pago ? { "Tipo de pago": filtros.cod_tipo_pago?.label } : {}),
      },
      // Tabla, gráfica y leyenda ocupan el ancho útil. Mueve los bloques para cambiar el orden.
      contenido: [
        {
          tipo: "tabla",
          columnas: ["Nombre", ...datosFormateados.map(({ seccion }) => seccion)],
          filas: nombres.map((nombre) => [
            nombre,
            ...datosFormateados.map((fila) =>
              fila[nombre] !== undefined ? `${(Number(fila[nombre]) * 100).toFixed(2)}%` : "-",
            ),
          ]),
        },
        { tipo: "pagina" },
        { tipo: "grafica", elemento: ref.current },
        {
          tipo: "leyenda",
          entradas: nombres.map((nombre, indice) => ({ texto: nombre, color: color(indice) })),
        },
      ],
    });
  }, [filtros, data, datosFormateados, generandoPdf, onErrorPdf, generar]);

  React.useEffect(() => {
    const a = { reconsultar, filtros };
    if (!a) return;
    refetch();
  }, [reconsultar, filtros, refetch]);

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
        <SimpleBarChart data={datosFormateados} titulo="" ref={ref} isAnimationActive={false} />
      </div>
    );

  return (
    <div className="flex flex-1 flex-col bg-background">
      {errorPdf ? (
        <p role="alert" className="text-sm text-destructive">
          {errorPdf}
        </p>
      ) : null}
      {/* Igual que Hit Rate: la vista de tablas mantiene la gráfica montada para exportar el PDF. */}

      <div className="flex flex-1 flex-col bg-background gap-5">
        {tipo === "tablas" && (
          <div className={cn(clase, "flex size-full")}>
            <GenerarTabla data={datosFormateados} />
          </div>
        )}
        {tipo.split("-")[0] === "grafica" && (
          <div className={cn(clase, "flex size-full")}>
            {tipo.split("-")[1] === "usuario" && (
              <SimpleBarChart
                data={datosFormateados}
                titulo=""
                ref={ref}
                isAnimationActive={!generandoPdf}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default RealizacionDePrecio;

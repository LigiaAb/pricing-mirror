"use client";

import { format } from "date-fns";
import { Eye, EyeOff } from "lucide-react";
import { useMemo, useState } from "react";
import { DataTable } from "@/shared/components/data-table/data-table";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import type { ColumnDef } from "@/shared/lib/tanstack-table";
import { type FilaIcc, type ParamsReporteIcc, useReporteIcc } from "../api/reporte-icc";
import {
  calcularIcc,
  esAnulada,
  esFinalizada,
  type ResumenIcc,
  TIPOS_ICC,
  type TipoIcc,
} from "../lib/reporte-icc";

const formatoPorcentaje = (valor: number | null) => (valor == null ? "—" : `${valor.toFixed(2)}%`);

function formatoFecha(valor: string): string {
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? valor : format(fecha, "dd/MM/yyyy HH:mm");
}

/**
 * Reporte ICC (Índice de Cumplimiento Comercial) de llamadas y visitas (#194): por persona,
 * programadas (sin anuladas), realizadas (finalizadas), pendientes y ICC %, también por tipo.
 * Al elegir una persona se ve el detalle de sus actividades. Los filtros los pone
 * `ReportesCrmClient`; `params = null` hasta que se pulsa Filtrar.
 */
export function ReporteIcc({ params }: Readonly<{ params: ParamsReporteIcc | null }>) {
  const [usuarioDetalle, setUsuarioDetalle] = useState<string | null>(null);
  const consulta = useReporteIcc(params ?? { fecha_inicio: "", fecha_fin: "" }, params !== null);

  const filas = consulta.data;
  const resumen = useMemo(() => calcularIcc(filas ?? []), [filas]);
  const detalle = useMemo(
    () =>
      usuarioDetalle == null
        ? []
        : (filas ?? [])
            .filter((fila) => String(fila.usuario) === usuarioDetalle)
            .sort((a, b) => a.fecha_programacion.localeCompare(b.fecha_programacion)),
    [filas, usuarioDetalle],
  );
  const personaDetalle = resumen.personas.find((persona) => persona.usuario === usuarioDetalle);
  const columnasResumen = useMemo(
    () =>
      crearColumnasResumen(usuarioDetalle, (usuario) =>
        setUsuarioDetalle((actual) => (actual === usuario ? null : usuario)),
      ),
    [usuarioDetalle],
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
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Indicador titulo="ICC" valor={formatoPorcentaje(resumen.total.icc)} destacado />
        <Indicador titulo="Programadas" valor={resumen.total.programadas} />
        <Indicador titulo="Realizadas" valor={resumen.total.realizadas} />
        <Indicador titulo="Pendientes" valor={resumen.total.pendientes} />
        <Indicador titulo="Anuladas (no cuentan)" valor={resumen.total.anuladas} />
      </div>

      <p className="text-xs text-muted-foreground">
        ICC = realizadas (finalizadas) ÷ programadas (actividades con fecha programada en el rango,
        sin anuladas). Elija una persona para ver sus actividades.
      </p>

      <DataTable
        columns={columnasResumen}
        data={resumen.personas}
        searchKeys={["nombre"]}
        searchPlaceholder="Buscar usuario…"
        numericColumns={COLUMNAS_NUMERICAS_RESUMEN}
        emptyMessage="No hay llamadas ni visitas programadas en el rango."
        footer={resumen.personas.length > 0 && <TotalIcc total={resumen.total} />}
      />

      {personaDetalle && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Actividades de {personaDetalle.nombre} ({detalle.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={COLUMNAS_DETALLE}
              data={detalle}
              searchKeys={["cliente", "asunto"]}
              searchPlaceholder="Buscar actividad…"
              numericColumns={["actividad"]}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Indicador({
  titulo,
  valor,
  destacado = false,
}: Readonly<{ titulo: string; valor: string | number; destacado?: boolean }>) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{titulo}</p>
        <p className={destacado ? "text-2xl font-bold text-primary" : "text-2xl font-semibold"}>
          {valor}
        </p>
      </CardContent>
    </Card>
  );
}

function cuentaComo(fila: FilaIcc): string {
  if (esAnulada(fila)) return "No cuenta";
  return esFinalizada(fila) ? "Realizada" : "Pendiente";
}

const columnaConteo = (
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

const columnasTipo = (tipo: TipoIcc, nombre: string): ColumnDef<ResumenIcc>[] => [
  columnaConteo(`${tipo}_programadas`, `${nombre} prog.`, (r) => r.porTipo[tipo].programadas),
  columnaConteo(`${tipo}_realizadas`, `${nombre} real.`, (r) => r.porTipo[tipo].realizadas),
  columnaConteo(`${tipo}_icc`, `ICC ${nombre.toLowerCase()}`, (r) => r.porTipo[tipo].icc, true),
];

const COLUMNAS_NUMERICAS_RESUMEN = [
  ...TIPOS_ICC.flatMap((tipo) => [`${tipo}_programadas`, `${tipo}_realizadas`, `${tipo}_icc`]),
  "programadas",
  "realizadas",
  "pendientes",
  "anuladas",
  "icc",
];

function crearColumnasResumen(
  usuarioDetalle: string | null,
  alternarDetalle: (usuario: string | null) => void,
): ColumnDef<ResumenIcc>[] {
  return [
    { accessorKey: "nombre", header: "Usuario" },
    ...columnasTipo("LLAMADA", "Llamadas"),
    ...columnasTipo("VISITA", "Visitas"),
    columnaConteo("programadas", "Programadas", (r) => r.programadas),
    columnaConteo("realizadas", "Realizadas", (r) => r.realizadas),
    columnaConteo("pendientes", "Pendientes", (r) => r.pendientes),
    columnaConteo("anuladas", "Anuladas", (r) => r.anuladas),
    columnaConteo("icc", "ICC", (r) => r.icc, true),
    {
      id: "acciones",
      header: "",
      enableSorting: false,
      cell: ({ row }) => {
        const abierto = row.original.usuario === usuarioDetalle;
        return (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={`${abierto ? "Ocultar" : "Ver"} actividades de ${row.original.nombre}`}
            onClick={() => alternarDetalle(row.original.usuario)}
          >
            {abierto ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            {abierto ? "Ocultar" : "Actividades"}
          </Button>
        );
      },
    },
  ];
}

const COLUMNAS_DETALLE: ColumnDef<FilaIcc>[] = [
  { accessorKey: "actividad", header: "Actividad" },
  {
    accessorKey: "fecha_programacion",
    header: "Fecha programada",
    cell: ({ row }) => formatoFecha(row.original.fecha_programacion),
  },
  { accessorKey: "tipo", header: "Tipo" },
  { accessorKey: "cliente", header: "Cliente" },
  { accessorKey: "asunto", header: "Asunto" },
  { accessorKey: "estado", header: "Estado" },
  { id: "cuenta_como", header: "Cuenta como", accessorFn: cuentaComo },
];

/** Fila de total debajo de la tabla (el DataTable no tiene pie por columnas). */
function TotalIcc({ total }: Readonly<{ total: ResumenIcc }>) {
  const porTipo = TIPOS_ICC.map((tipo) => {
    const conteo = total.porTipo[tipo];
    const nombre = tipo === "LLAMADA" ? "Llamadas" : "Visitas";
    return `${nombre}: ${conteo.realizadas}/${conteo.programadas} (${formatoPorcentaje(conteo.icc)})`;
  });
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-1 border-t bg-muted/50 px-4 py-2 text-sm font-semibold">
      <span>TOTAL</span>
      {porTipo.map((texto) => (
        <span key={texto}>{texto}</span>
      ))}
      <span>
        Total: {total.realizadas}/{total.programadas} · pendientes {total.pendientes} · anuladas{" "}
        {total.anuladas} · ICC {formatoPorcentaje(total.icc)}
      </span>
    </div>
  );
}

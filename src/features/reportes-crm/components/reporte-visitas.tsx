"use client";

import { format, parseISO } from "date-fns";
import { FileSpreadsheet, FileText } from "lucide-react";
import { useMemo } from "react";
import type { EmpleadoUsuario } from "@/features/catalogos";
import { DataTable } from "@/shared/components/data-table/data-table";
import { Button } from "@/shared/components/ui/button";
import { formatearFechaHora } from "@/shared/lib/date";
import { exportarExcel } from "@/shared/lib/excel";
import type { ColumnDef } from "@/shared/lib/tanstack-table";
import type { ActividadReporte } from "../api/actividades-reporte";
import { filasExcelActividades } from "../lib/actividades-excel";
import { actividadResultado, numeroResultado } from "../lib/actividades-vista";
import {
  type AgenteCalendario,
  generarPdfCalendarioActividades,
} from "../lib/pdf-calendario-actividades";

/** Reporte 2 (planificación): columnas del legacy `tabla_actividades_reporte`. */
function columnasActividades(asesores: Map<string, string>): ColumnDef<ActividadReporte>[] {
  return [
    { accessorKey: "nom_tipo", header: "Tipo" },
    {
      id: "asesor",
      header: "Asesor",
      accessorFn: (actividad) => asesores.get(String(actividad.cod_asesor ?? "")) ?? "",
    },
    { accessorKey: "nombre_cliente", header: "Cliente" },
    {
      accessorKey: "fecha_creada",
      header: "Fecha de programación",
      cell: ({ getValue }) => formatearFechaHora(getValue<string>()),
    },
    {
      accessorKey: "fecha_programada",
      header: "Fecha de ejecución",
      cell: ({ getValue }) => formatearFechaHora(getValue<string>()),
    },
    { accessorKey: "objetivo_actividad_desc", header: "Objetivo" },
  ];
}

/** Reporte 1 (histórico): columnas del legacy `tabla_actividades_reporte_2`, con el resultado desglosado. */
function columnasHistorico(asesores: Map<string, string>): ColumnDef<ActividadReporte>[] {
  return [
    { accessorKey: "cod_actividad", header: "Código" },
    { accessorKey: "nom_tipo", header: "Tipo" },
    {
      id: "asesor",
      header: "Asesor",
      accessorFn: (actividad) => asesores.get(String(actividad.cod_asesor ?? "")) ?? "",
    },
    { accessorKey: "nombre_cliente", header: "Cliente" },
    { accessorKey: "estado_desc", header: "Estado" },
    {
      accessorKey: "fecha_creada",
      header: "Fecha de programación",
      cell: ({ getValue }) => formatearFechaHora(getValue<string>()),
    },
    {
      accessorKey: "fecha_programada",
      header: "Fecha de ejecución",
      cell: ({ getValue }) => formatearFechaHora(getValue<string>()),
    },
    { accessorKey: "objetivo_actividad_desc", header: "Objetivo" },
    {
      id: "resultado_numero",
      header: "No. Resultado",
      accessorFn: numeroResultado,
    },
    {
      id: "resultado_tipo",
      header: "Tipo de Resultado",
      accessorFn: (actividad) => actividadResultado(actividad).NOM_TIPO ?? "",
    },
    {
      id: "resultado_comentarios",
      header: "Comentarios",
      accessorFn: (actividad) => actividadResultado(actividad).DESCRIPCION ?? "",
    },
    {
      id: "resultado_fecha",
      header: "Fecha de reprogramación",
      accessorFn: (actividad) => actividadResultado(actividad).FECHA_PROGRAMADA ?? "",
      cell: ({ getValue }) => {
        const valor = getValue<string>();
        return valor ? formatearFechaHora(valor) : "";
      },
    },
  ];
}

/** Reportes 1, 2 y 3: visitas histórico/planificación (Excel) y calendario de actividades (PDF). */
export function ReporteActividades({
  filas,
  cargando,
  pdf,
  historico,
  agente,
  inicio,
  fin,
  empleados,
  empresa,
  centroCosto,
  estado,
  tipos,
}: Readonly<{
  filas: ActividadReporte[];
  cargando: boolean;
  pdf: boolean;
  historico: boolean;
  agente: AgenteCalendario;
  inicio: string;
  fin: string;
  empresa: string;
  centroCosto: string;
  estado: string;
  tipos: string[];
  empleados: EmpleadoUsuario[];
}>) {
  const columnas = useMemo(() => {
    const asesores = new Map(
      empleados.map((empleado) => [String(empleado.codUsuario), empleado.nombreCompleto]),
    );
    return historico ? columnasHistorico(asesores) : columnasActividades(asesores);
  }, [historico, empleados]);
  const exportar = async () => {
    // Copia: `filas` puede ser el arreglo de la caché de React Query.
    const ordenadas = [...filas].sort((a, b) => Number(a.cod_actividad) - Number(b.cod_actividad));
    const nombreReporte = historico
      ? "Reporte Historico de actividades"
      : "Planificacion de actividades";

    const encabezados: { [key: string]: string } = { "Generado el": new Date().toLocaleString() };

    if (empresa) encabezados["Empresa:"] = empresa;
    if (centroCosto) encabezados["Centro de Costo:"] = centroCosto;
    if (agente) encabezados["Empleado:"] = agente?.nombre;
    if (estado) encabezados["Estado:"] = estado;
    if (inicio) encabezados["Fecha inicio:"] = format(parseISO(inicio), "dd/MM/yyyy");
    if (fin) encabezados["Fecha fin:"] = format(parseISO(fin), "dd/MM/yyyy");
    if (tipos.length) encabezados["Tipo de actividad:"] = tipos.join(", ");

    const datosExcel = filasExcelActividades(ordenadas, historico, empleados);

    await exportarExcel({
      nombreArchivo: `${nombreReporte} - ERPWEB - ${format(new Date(), "yyyy_MM_dd_HH_mm_ss")}.xlsx`,
      titulo: historico ? "Reporte de visitas histórico" : "Reporte de visitas",
      encabezado: encabezados,
      hojas: [
        {
          // Excel admite 31 caracteres en el nombre de la hoja.
          nombre: nombreReporte.slice(0, 31),
          mostrarCuadricula: true,
          autoFiltro: true,
          columnaInicio: 2,
          filaInicio: 1,
          columnas: datosExcel.columnas,
          filas: datosExcel.filas,
        },
      ],
    });
  };
  const generarPdf = async () => {
    const blob = await generarPdfCalendarioActividades(filas, {
      agente,
      fechaInicio: inicio,
      fechaFin: fin,
    });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };
  return (
    <div className="space-y-3">
      {cargando ? (
        <p>Cargando…</p>
      ) : (
        <DataTable
          columns={columnas}
          data={filas}
          searchKeys={["nombre_cliente"]}
          searchPlaceholder="Buscar actividad…"
          extraActions={
            pdf ? (
              <Button
                variant="outline"
                size="sm"
                onClick={generarPdf}
                disabled={!filas.length}
                aria-label="Generar PDF"
                title="Generar PDF"
              >
                <FileText className="h-4 w-4 text-destructive" />
                PDF
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={exportar}
                disabled={!filas.length}
                aria-label="Exportar Excel"
                title="Exportar Excel"
              >
                <FileSpreadsheet className="h-4 w-4 text-green-600" />
                Excel
              </Button>
            )
          }
        />
      )}
    </div>
  );
}

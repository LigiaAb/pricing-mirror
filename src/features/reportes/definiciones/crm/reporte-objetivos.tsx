import React from "react";
import {
  type ObjetivoReporte,
  objetivoReporteSchema,
} from "@/features/reportes-crm/api/objetivos-reporte";
import { ReporteObjetivos } from "@/features/reportes-crm/components/reporte-objetivos-empleado";
import { cumpleMeta, etiquetaPeriodo } from "@/features/reportes-crm/lib/objetivos-reporte-vista";
import { http } from "@/shared/api/client";
import { parseEnvelope } from "@/shared/api/envelope";
import { formatearFecha } from "@/shared/lib/date";
import {
  type ContenidoReporteProps,
  definirReporte,
  type ParamsReporte,
} from "../../lib/definir-reporte";
import { filtroTipo } from "../../lib/filtros";

/**
 * OBJETIVOS DE ACTIVIDADES
 *
 * Igual al reporte "Objetivos de actividades" de Reportes CRM: `reporte-objetivos` con empresa,
 * CC, tipo de asignación (obligatorio) y fechas (obligatorias). La sección "Reporte" es la misma
 * vista de CRM (`ReporteObjetivos`: tabla por objetivo con sus periodos y el modal de
 * actividades). Para "Personaliza tu reporte", cada fila es un objetivo × empleado × periodo.
 */

interface Fila {
  /** Posición del objetivo en la respuesta, para rearmar la lista de la vista de CRM. */
  indiceObjetivo: number;
  objetivo: ObjetivoReporte;
  empleado: string;
  numero: number;
  fecha_inicial: string;
  fecha_final: string;
  realizadas: number;
}

async function consultar(params: ParamsReporte): Promise<Fila[]> {
  // Mismos parámetros que Reportes CRM.
  const respuesta = await http.get<unknown>("/api/appweb/reporte-objetivos", {
    params: {
      cod_emp: params.cod_empresa ?? "",
      cod_cc: params.cod_cc ?? "",
      cod_tipo_asignacion: params.cod_tipo_asignacion ?? "",
      fecha_inicial: params.fecha_inicio ?? "",
      fecha_final: params.fecha_fin ?? "",
    },
  });
  const objetivos = parseEnvelope(respuesta, objetivoReporteSchema, "reporte-objetivos");
  return objetivos.flatMap((objetivo, indiceObjetivo) =>
    objetivo.empleados.flatMap((empleado) =>
      empleado.datos.map((periodo) => ({
        indiceObjetivo,
        objetivo,
        empleado: empleado.nombre,
        numero: periodo.numero,
        fecha_inicial: periodo.fecha_inicial,
        fecha_final: periodo.fecha_final,
        realizadas: periodo.actividades.length,
      })),
    ),
  );
}

/** Sección "Reporte": la vista de Reportes CRM con los objetivos consultados. */
function ContenidoObjetivos({ filas }: ContenidoReporteProps<Fila>) {
  const objetivos = React.useMemo(() => {
    const porIndice = new Map<number, ObjetivoReporte>();
    for (const fila of filas) {
      if (!porIndice.has(fila.indiceObjetivo)) porIndice.set(fila.indiceObjetivo, fila.objetivo);
    }
    return [...porIndice.entries()].sort(([a], [b]) => a - b).map(([, objetivo]) => objetivo);
  }, [filas]);
  return <ReporteObjetivos datos={objetivos} grafica={false} />;
}

export const reporteObjetivos = definirReporte<Fila>({
  nomenclatura: "CRM-OA-04",
  descripcion: "Cumplimiento de objetivos por empleado y periodo",
  fechas: "requeridas",
  filtros: [
    {
      ...filtroTipo("ASIGNACION_ENTIDAD", "cod_tipo_asignacion", "Tipo de asignación"),
      requerido: true,
    },
  ],
  consultar,
  // Como en Reportes CRM: sin descargas propias (solo el Excel agrupado).
  Contenido: ContenidoObjetivos,
  agrupacion: { filas: ["objetivo", "empleado"] },
  columnas: [
    {
      id: "objetivo",
      label: "Objetivo",
      valor: (f) => f.objetivo.descripcion,
      agrupable: true,
      buscable: true,
    },
    {
      id: "tipo",
      label: "Tipo de actividad",
      valor: (f) => f.objetivo.tipo_descripcion,
      agrupable: true,
    },
    {
      id: "periodicidad",
      label: "Periodicidad",
      valor: (f) => f.objetivo.periodicidad_descripcion,
      agrupable: true,
    },
    {
      id: "empleado",
      label: "Empleado",
      valor: (f) => f.empleado,
      agrupable: true,
      buscable: true,
    },
    {
      id: "periodo",
      label: "Periodo",
      valor: (f) => etiquetaPeriodo(f.objetivo.periodicidad_unidad, f.numero),
      agrupable: true,
    },
    { id: "desde", label: "Desde", valor: (f) => formatearFecha(f.fecha_inicial) },
    { id: "hasta", label: "Hasta", valor: (f) => formatearFecha(f.fecha_final) },
    { id: "meta", label: "Meta", valor: (f) => f.objetivo.cantidad, sumable: true },
    { id: "realizadas", label: "Realizadas", valor: (f) => f.realizadas, sumable: true },
    {
      id: "cumple",
      label: "Cumple",
      valor: (f) => (cumpleMeta(f.realizadas, f.objetivo.cantidad) ? "SÍ" : "NO"),
      agrupable: true,
    },
  ],
});

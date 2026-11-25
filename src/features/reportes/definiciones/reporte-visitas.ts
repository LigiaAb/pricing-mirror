import { formatearFechaHora } from "@/shared/lib/date";
import { definirReporte } from "../lib/definir-reporte";
import { filtroEstado, filtroTipo, filtroUsuario } from "../lib/filtros";
import {
  consultar,
  excelActividades,
  type Fila,
  TIPOS_ACTIVIDAD,
} from "./reporte-visitas-historico";

/**
 * REPORTE DE VISITAS (planificación de actividades del CRM)
 *
 * Igual al "Reporte de visitas" de Reportes CRM (legacy `tabla_actividades_reporte`): la
 * misma consulta y los mismos filtros que el histórico, sin estado ni resultado en las
 * columnas, y su Excel "Planificacion de actividades".
 */
export const reporteVisitas = definirReporte<Fila>({
  nomenclatura: "CRM-RV-02",
  descripcion: "Actividades planificadas del CRM",
  fechas: "opcionales",
  filtros: [
    filtroUsuario("Asesor", "cod_asesor"),
    filtroEstado("ACTIVIDAD", "cod_estado"),
    {
      ...filtroTipo("ACTIVIDAD", "cod_tipo", "Tipo de actividad", TIPOS_ACTIVIDAD),
      multiple: true,
    },
  ],
  consultar,
  // Como en Reportes CRM: solo Excel (sin PDF).
  descargas: { excel: (descarga) => excelActividades(false, descarga) },
  agrupacion: { filas: ["asesor"], columna: "tipo" },
  columnas: [
    { id: "tipo", label: "Tipo", valor: (f) => f.nom_tipo, agrupable: true },
    { id: "asesor", label: "Asesor", valor: (f) => f.asesor, agrupable: true },
    {
      id: "cliente",
      label: "Cliente",
      valor: (f) => f.nombre_cliente,
      agrupable: true,
      buscable: true,
    },
    {
      id: "fecha_programacion",
      label: "Fecha de programación",
      valor: (f) => formatearFechaHora(f.fecha_creada),
    },
    {
      id: "fecha_ejecucion",
      label: "Fecha de ejecución",
      valor: (f) => formatearFechaHora(f.fecha_programada),
    },
    { id: "objetivo", label: "Objetivo", valor: (f) => f.objetivo_actividad_desc, agrupable: true },
  ],
});

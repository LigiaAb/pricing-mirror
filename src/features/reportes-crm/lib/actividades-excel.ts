import { format } from "date-fns";
import type { EmpleadoUsuario } from "@/features/catalogos";
import type { CeldaExcel } from "@/shared/lib/excel";
import type { ActividadReporte } from "../api/actividades-reporte";

type columnas = {
  name: string;
  label: string;
  campo: string;
  filtrarSiMultiplesValores?: boolean;
  color?: boolean;
  [key: string]: unknown;
};

const columnas_historico: columnas[] = [
  { name: "CODIGO", label: "CODIGO DE ACTIVIDAD", campo: "cod_actividad" },
  { name: "TIPO", label: "TIPO", campo: "nom_tipo", filtrarSiMultiplesValores: true },
  { name: "ASESOR", label: "ASESOR", campo: "asesor", filtrarSiMultiplesValores: true },
  { name: "CLIENTE", label: "CLIENTE", campo: "nombre_cliente" },
  { name: "ESTADO", label: "ESTADO", campo: "estado_desc", color: true },
  { name: "FECHA DE PROGRAMACION", label: "FECHA DE PROGRAMACION", campo: "fecha_creada_locale" },
  { name: "FECHA DE EJECUCION", label: "FECHA DE EJECUCION", campo: "fecha_programada_locale" },
  { name: "OBJETIVO", label: "OBJETIVO", campo: "objetivo_actividad_desc" },
  { name: "NO RESULTADO", label: "NO RESULTADO", campo: "resultado_cod_actividad" },
  { name: "TIPO RESULTADO", label: "TIPO RESULTADO", campo: "resultado_nom_tipo" },
  { name: "COMENTARIOS", label: "COMENTARIOS", campo: "resultado_descripcion" },
  {
    name: "FECHA REPROGRAMACION",
    label: "FECHA REPROGRAMACION",
    campo: "resultado_fecha_programada_locale",
  },
];
const columnas: columnas[] = [
  { name: "TIPO", label: "TIPO", campo: "nom_tipo", filtrarSiMultiplesValores: true },
  { name: "ASESOR", label: "ASESOR", campo: "asesor", filtrarSiMultiplesValores: true },
  { name: "CLIENTE", label: "CLIENTE", campo: "nombre_cliente" },
  { name: "FECHA DE PROGRAMACION", label: "FECHA DE PROGRAMACION", campo: "fecha_creada_locale" },
  { name: "FECHA DE EJECUCION", label: "FECHA DE EJECUCION", campo: "fecha_programada_locale" },
  { name: "OBJETIVO", label: "OBJETIVO", campo: "objetivo_actividad_desc" },
];

export const COLUMNAS_VISITAS = columnas.map((i) => i.label);
export const COLUMNAS_HISTORICO = columnas_historico.map((i) => i.label);

const formatearCelda = (
  actividad: ActividadReporte,
  empleados: EmpleadoUsuario[],
): ActividadReporte => {
  const actividad_base = actividad;

  const empleado = empleados?.find((empleado) => empleado.codUsuario === actividad_base.cod_asesor);

  const resultado = JSON.parse(actividad_base.resultado || "[]")[0] || {};

  const dato = {
    ...actividad_base,
    asesor: empleado?.nombreCompleto ?? actividad_base.asesor ?? null,
    fecha_creada_locale: actividad_base.fecha_creada
      ? format(new Date(actividad_base.fecha_creada), "dd/MM/yyyy")
      : null,
    fecha_programada_locale: actividad_base.fecha_programada
      ? format(new Date(actividad_base.fecha_programada), "dd/MM/yyyy")
      : null,
    resultado_cod_actividad: resultado?.COD_ACTIVIDAD || null,
    resultado_nom_tipo: resultado?.NOM_TIPO || null,
    resultado_descripcion: resultado?.DESCRIPCION || null,
    resultado_fecha_programada_locale: resultado?.FECHA_PROGRAMADA
      ? format(new Date(resultado?.FECHA_PROGRAMADA), "dd/MM/yyyy")
      : null,
  };

  return dato;
};

const ROJO_EN_PROCESO_VENCIDO = "FFB30000";
const DIAS_LIMITE_EN_PROCESO = 7;

export function filasExcelActividades(
  actividades: ActividadReporte[],
  historico: boolean,
  empleados: EmpleadoUsuario[],
): { columnas: string[]; filas: CeldaExcel[][] } {
  const normalizarValor = (valor: unknown): string | number | boolean | Date | null => {
    if (valor === null || valor === undefined) return null;

    if (
      typeof valor === "string" ||
      typeof valor === "number" ||
      typeof valor === "boolean" ||
      valor instanceof Date
    ) {
      return valor;
    }

    return String(valor);
  };

  const actividadesFormateadas = actividades.map((actividad) =>
    formatearCelda(actividad, empleados),
  );

  const definiciones = historico ? columnas_historico : columnas;

  const columnasVisibles = definiciones.filter((columna) => {
    if (!columna.filtrarSiMultiplesValores) return true;

    const valores = new Set(
      actividadesFormateadas.map((actividad) => normalizarValor(actividad[columna.campo])),
    );

    return valores.size > 1;
  });

  const filas: CeldaExcel[][] = actividadesFormateadas.map((actividad) =>
    columnasVisibles.map(({ campo, color }): CeldaExcel => {
      const dato = normalizarValor(actividad[campo]);
      if (!color) return dato;
      return {
        dato,
        ...(dato === "EN PROCESO" ? { fontColor: ROJO_EN_PROCESO_VENCIDO } : {}),
      };
    }),
  );

  return {
    columnas: columnasVisibles.map(({ label }) => label),
    filas,
  };
}

/**
 * Regla del legacy (HeadersReporteActividades `fontColorFn`): el estado se pinta de rojo si
 * sigue "EN PROCESO" y ya pasó más de una semana desde la fecha de programación.
 */
export function colorEstadoActividad(
  estado: CeldaExcel,
  fechaProgramada: CeldaExcel,
  ahora = new Date(),
): string | undefined {
  if (estado !== "EN PROCESO" || typeof fechaProgramada !== "string" || !fechaProgramada) {
    return undefined;
  }
  const fecha = new Date(fechaProgramada);
  if (Number.isNaN(fecha.getTime())) return undefined;
  const limite = new Date(fecha);
  limite.setDate(limite.getDate() + DIAS_LIMITE_EN_PROCESO);
  return ahora > limite ? ROJO_EN_PROCESO_VENCIDO : undefined;
}

/** `colorCelda` de `exportarExcel` para las plantillas de visitas: solo colorea "Estado". */
export function colorCeldaActividades() {
  const indiceEstado = columnas_historico.findIndex(({ color }) => color);
  const indiceProgramada = columnas_historico.findIndex(({ color }) => color);
  return (valor: CeldaExcel, indiceColumna: number, fila: CeldaExcel[]) =>
    indiceColumna === indiceEstado
      ? colorEstadoActividad(valor, fila[indiceProgramada])
      : undefined;
}

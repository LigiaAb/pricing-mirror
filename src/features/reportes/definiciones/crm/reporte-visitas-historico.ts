import { format, parseISO } from "date-fns";
import { z } from "zod";
import { empleadosUsuarios } from "@/features/catalogos";
import { http } from "@/shared/api/client";
import { parseEnvelope } from "@/shared/api/envelope";
import { formatearFechaHora } from "@/shared/lib/date";
import { type CeldaExcel, exportarExcel } from "@/shared/lib/excel";
import { asText } from "@/shared/lib/text";
import { zIdSafe } from "@/shared/lib/zod-scalars";
import { useAuthStore } from "@/shared/stores/auth-store";
import {
  type DescargaReporte,
  definirReporte,
  type ParamsReporte,
} from "../../lib/definir-reporte";
import { filtroEstado, filtroTipo, filtroUsuario } from "../../lib/filtros";

/**
 * REPORTE DE VISITAS — HISTÓRICO (historial de actividades del CRM)
 *
 * Igual al "Reporte de visitas — histórico" de Reportes CRM (legacy
 * `tabla_actividades_reporte_2`): `lista-actividades2` filtra por empresa, CC, asesor y
 * estado; las fechas (por fecha programada, día local) y el tipo se filtran aquí, como en
 * CRM, porque el API no los aplica.
 */

const texto = z
  .string()
  .nullable()
  .optional()
  .transform((v) => v ?? "");

const actividadSchema = z.looseObject({
  cod_actividad: zIdSafe,
  fecha_creada: texto,
  fecha_programada: texto,
  cod_tipo: zIdSafe.optional(),
  nom_tipo: texto,
  estado_desc: texto,
  cod_asesor: zIdSafe.optional(),
  nombre_cliente: texto,
  objetivo_actividad_desc: texto,
  resultado: texto,
});

/** Primer resultado de la actividad (`resultado` viaja como JSON serializado). */
interface Resultado {
  COD_ACTIVIDAD?: string | number;
  NOM_TIPO?: string;
  DESCRIPCION?: string;
  FECHA_PROGRAMADA?: string;
}

export type Fila = z.infer<typeof actividadSchema> & { asesor: string; res: Resultado | null };

/** Tipos de actividad que ofrecía el reporte en el legacy. */
export const TIPOS_ACTIVIDAD = [
  "CORREO",
  "LLAMADA",
  "VISITA",
  "SEGUIMIENTO COTIZACION",
  "SEGUIMIENTO CTS",
] as const;

function primerResultado(json: string): Resultado | null {
  if (!json) return null;
  try {
    const lista: unknown = JSON.parse(json);
    return Array.isArray(lista) ? ((lista[0] as Resultado | undefined) ?? {}) : {};
  } catch {
    return {};
  }
}

/** Legacy: cada fecha filtra sola y se compara por día local con la fecha programada. */
function enRango(fecha: string, inicio: string | undefined, fin: string | undefined) {
  if (!inicio && !fin) return true;
  const valor = new Date(fecha).getTime();
  if (!Number.isFinite(valor)) return false;
  const desde = inicio ? new Date(`${inicio}T00:00:00`).getTime() : Number.NEGATIVE_INFINITY;
  const hasta = fin ? new Date(`${fin}T23:59:59.999`).getTime() : Number.POSITIVE_INFINITY;
  return valor >= desde && valor <= hasta;
}

export async function consultar(params: ParamsReporte): Promise<Fila[]> {
  const { cod_empresa, cod_cc, cod_asesor, cod_estado } = params;
  const consulta = Object.fromEntries(
    Object.entries({ cod_empresa, cod_cc, cod_asesor, cod_estado }).filter(([, v]) => v),
  );
  const [actividades, empleados] = await Promise.all([
    http
      .get<unknown>("/api/appweb/lista-actividades2", { params: consulta })
      .then((r) => parseEnvelope(r, actividadSchema, "lista-actividades2")),
    empleadosUsuarios.fetchLista({}),
  ]);
  // Nombre del asesor: primer registro de cada usuario en el catálogo de empleados.
  const asesores = new Map<string, string>();
  for (const e of empleados) {
    const clave = String(e.codUsuario);
    if (!asesores.has(clave)) asesores.set(clave, e.nombreCompleto);
  }
  return (
    actividades
      .filter((a) => enRango(a.fecha_programada, params.fecha_inicio, params.fecha_fin))
      // Tipo: selección múltiple, como en CRM ("7,8" = cualquiera de los dos).
      .filter(
        (a) => !params.cod_tipo || params.cod_tipo.split(",").includes(String(a.cod_tipo ?? "")),
      )
      .sort((a, b) => Number(a.cod_actividad) - Number(b.cod_actividad))
      .map((a) => ({
        ...a,
        asesor: asesores.get(String(a.cod_asesor ?? "")) ?? "",
        res: primerResultado(a.resultado),
      }))
  );
}

// ── Excel del reporte: el mismo de Reportes CRM (`ReporteActividades`) ──

/**
 * Columnas del legacy (`columnas_historico` de `reportes-crm/lib/actividades-excel.ts`). El
 * "Reporte de visitas" (planificación) usa solo las de `COLUMNAS_PLANIFICACION`.
 */
const COLUMNAS_EXCEL: {
  label: string;
  valor: (f: Fila) => string | number | null;
  /** Se oculta si todas las filas tienen el mismo valor. */
  filtrarSiMultiplesValores?: boolean;
  /** Estado en rojo si sigue EN PROCESO más de 7 días. */
  color?: boolean;
}[] = [
  { label: "CODIGO DE ACTIVIDAD", valor: (f) => f.cod_actividad },
  { label: "TIPO", valor: (f) => f.nom_tipo, filtrarSiMultiplesValores: true },
  { label: "ASESOR", valor: (f) => f.asesor || null, filtrarSiMultiplesValores: true },
  { label: "CLIENTE", valor: (f) => f.nombre_cliente },
  { label: "ESTADO", valor: (f) => f.estado_desc, color: true },
  { label: "FECHA DE PROGRAMACION", valor: (f) => fechaDia(f.fecha_creada) },
  { label: "FECHA DE EJECUCION", valor: (f) => fechaDia(f.fecha_programada) },
  { label: "OBJETIVO", valor: (f) => f.objetivo_actividad_desc },
  {
    label: "NO RESULTADO",
    // Legacy: con resultado sin código, "Resultado final".
    valor: (f) => f.res?.COD_ACTIVIDAD || (f.res?.NOM_TIPO ? "Resultado final" : null),
  },
  { label: "TIPO RESULTADO", valor: (f) => f.res?.NOM_TIPO || null },
  { label: "COMENTARIOS", valor: (f) => f.res?.DESCRIPCION || null },
  { label: "FECHA REPROGRAMACION", valor: (f) => fechaDia(f.res?.FECHA_PROGRAMADA) },
];

/** Fecha en `dd/MM/yyyy` (día local), o null. */
function fechaDia(fecha: string | undefined): string | null {
  return fecha ? format(new Date(fecha), "dd/MM/yyyy") : null;
}

/** Columnas del Excel del "Reporte de visitas" (legacy `columnas`), en el mismo orden. */
const COLUMNAS_PLANIFICACION = new Set([
  "TIPO",
  "ASESOR",
  "CLIENTE",
  "FECHA DE PROGRAMACION",
  "FECHA DE EJECUCION",
  "OBJETIVO",
]);

const ROJO_EN_PROCESO_VENCIDO = "FFB30000";
const DIAS_LIMITE_EN_PROCESO = 7;

/** Legacy: rojo si sigue "EN PROCESO" y pasaron más de 7 días desde el día de programación. */
function colorEstado(
  estado: string | number | null,
  fechaProgramacion: string,
): string | undefined {
  if (estado !== "EN PROCESO" || !fechaProgramacion) return undefined;
  const limite = new Date(fechaProgramacion);
  if (Number.isNaN(limite.getTime())) return undefined;
  limite.setHours(0, 0, 0, 0);
  limite.setDate(limite.getDate() + DIAS_LIMITE_EN_PROCESO);
  return new Date() > limite ? ROJO_EN_PROCESO_VENCIDO : undefined;
}

/** Nombre del usuario de la sesión (el legacy lo pone como "Empleado" si no se elige asesor). */
function usuarioSesion(): string {
  const usuario = useAuthStore.getState().user;
  const nombre = [usuario?.nom_empleado, usuario?.apellido_emp]
    .map((parte) => asText(parte))
    .filter(Boolean)
    .join(" ");
  return nombre || asText(usuario?.nombre_usuario) || asText(usuario?.email);
}

/** Excel de actividades de Reportes CRM: histórico o, con `historico: false`, planificación. */
export async function excelActividades(
  historico: boolean,
  { filas, encabezado, params }: DescargaReporte<Fila>,
) {
  const nombreReporte = historico
    ? "Reporte Historico de actividades"
    : "Planificacion de actividades";
  const encabezados: Record<string, string> = { "Generado el": new Date().toLocaleString() };
  if (encabezado.Empresa) encabezados["Empresa:"] = encabezado.Empresa;
  if (encabezado["Centro de costo"])
    encabezados["Centro de Costo:"] = encabezado["Centro de costo"];
  encabezados["Empleado:"] = encabezado.Asesor || usuarioSesion();
  if (encabezado.Estado) encabezados["Estado:"] = encabezado.Estado;
  if (params.fecha_inicio)
    encabezados["Fecha inicio:"] = format(parseISO(params.fecha_inicio), "dd/MM/yyyy");
  if (params.fecha_fin)
    encabezados["Fecha fin:"] = format(parseISO(params.fecha_fin), "dd/MM/yyyy");
  if (encabezado["Tipo de actividad"])
    encabezados["Tipo de actividad:"] = encabezado["Tipo de actividad"];

  const visibles = COLUMNAS_EXCEL.filter(
    (c) =>
      (historico || COLUMNAS_PLANIFICACION.has(c.label)) &&
      (!c.filtrarSiMultiplesValores || new Set(filas.map(c.valor)).size > 1),
  );

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
        columnas: visibles.map((c) => c.label),
        filas: filas.map((f) =>
          visibles.map(({ valor, color }): CeldaExcel => {
            const dato = valor(f);
            if (!color) return dato;
            const fontColor = colorEstado(dato, f.fecha_creada);
            return { dato, ...(fontColor ? { fontColor } : {}) };
          }),
        ),
      },
    ],
  });
}

export const reporteVisitasHistorico = definirReporte<Fila>({
  nomenclatura: "CRM-RVH-01",
  descripcion: "Actividades del CRM con su resultado",
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
  descargas: { excel: (descarga) => excelActividades(true, descarga) },
  agrupacion: { filas: ["asesor"], columna: "tipo" },
  columnas: [
    { id: "codigo", label: "Código", valor: (f) => f.cod_actividad },
    { id: "tipo", label: "Tipo", valor: (f) => f.nom_tipo, agrupable: true },
    { id: "asesor", label: "Asesor", valor: (f) => f.asesor, agrupable: true },
    {
      id: "cliente",
      label: "Cliente",
      valor: (f) => f.nombre_cliente,
      agrupable: true,
      buscable: true,
    },
    { id: "estado", label: "Estado", valor: (f) => f.estado_desc, agrupable: true },
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
    {
      id: "resultado_numero",
      label: "No. Resultado",
      // Legacy: con resultado sin código, "Resultado Final".
      valor: (f) => (f.res ? String(f.res.COD_ACTIVIDAD ?? "") || "Resultado Final" : ""),
    },
    {
      id: "resultado_tipo",
      label: "Tipo de Resultado",
      valor: (f) => f.res?.NOM_TIPO ?? "",
      agrupable: true,
    },
    { id: "comentarios", label: "Comentarios", valor: (f) => f.res?.DESCRIPCION ?? "" },
    {
      id: "fecha_reprogramacion",
      label: "Fecha de reprogramación",
      valor: (f) => (f.res?.FECHA_PROGRAMADA ? formatearFechaHora(f.res.FECHA_PROGRAMADA) : ""),
    },
  ],
});

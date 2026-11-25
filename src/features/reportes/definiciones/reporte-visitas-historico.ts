import { z } from "zod";
import { empleadosUsuarios } from "@/features/catalogos";
import { http } from "@/shared/api/client";
import { parseEnvelope } from "@/shared/api/envelope";
import { formatearFechaHora } from "@/shared/lib/date";
import { zIdSafe } from "@/shared/lib/zod-scalars";
import { definirReporte, type ParamsReporte } from "../lib/definir-reporte";
import { filtroCentroCosto, filtroEstado, filtroTipo, filtroUsuario } from "../lib/filtros";

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

type Fila = z.infer<typeof actividadSchema> & { asesor: string; res: Resultado | null };

/** Tipos de actividad que ofrecía el reporte en el legacy. */
const TIPOS_ACTIVIDAD = [
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

async function consultar(params: ParamsReporte): Promise<Fila[]> {
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
  return actividades
    .filter((a) => enRango(a.fecha_programada, params.fecha_inicio, params.fecha_fin))
    .filter((a) => !params.cod_tipo || String(a.cod_tipo ?? "") === params.cod_tipo)
    .sort((a, b) => Number(a.cod_actividad) - Number(b.cod_actividad))
    .map((a) => ({
      ...a,
      asesor: asesores.get(String(a.cod_asesor ?? "")) ?? "",
      res: primerResultado(a.resultado),
    }));
}

export const reporteVisitasHistorico = definirReporte<Fila>({
  nomenclatura: "REPORTE_VISITAS_HISTORICO",
  descripcion: "Actividades del CRM con su resultado",
  fechas: "opcionales",
  filtros: [
    filtroCentroCosto("Centro de costo", ["cod_asesor"]),
    filtroUsuario("Asesor", "cod_asesor"),
    filtroEstado("ACTIVIDAD", "cod_estado"),
    filtroTipo("ACTIVIDAD", "cod_tipo", "Tipo de actividad", TIPOS_ACTIVIDAD),
  ],
  consultar,
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

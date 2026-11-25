import { empleadosUsuarios } from "@/features/catalogos";
import {
  type ActividadReporte,
  actividadReporteSchema,
} from "@/features/reportes-crm/api/actividades-reporte";
import { actividadesEnRango } from "@/features/reportes-crm/lib/actividades-vista";
import {
  type AgenteCalendario,
  generarPdfCalendarioActividades,
} from "@/features/reportes-crm/lib/pdf-calendario-actividades";
import { http } from "@/shared/api/client";
import { parseEnvelope } from "@/shared/api/envelope";
import { formatearFechaHora } from "@/shared/lib/date";
import { asText } from "@/shared/lib/text";
import { useAuthStore } from "@/shared/stores/auth-store";
import { type DescargaReporte, definirReporte, type ParamsReporte } from "../lib/definir-reporte";

/**
 * ACTIVIDADES (calendario de seguimientos del CRM)
 *
 * Igual al reporte "Actividades" de Reportes CRM: las actividades del usuario de la sesión
 * (`lista-actividades2` con `cod_asesor`), fechas opcionales filtradas aquí por día local
 * (el API no las aplica) y el PDF "Calendario de Seguimientos de actividades" de CRM. Sin
 * empresa ni CC (como en CRM).
 */

type Fila = ActividadReporte & { asesor: string };

async function consultar(params: ParamsReporte): Promise<Fila[]> {
  const usuario = asText(useAuthStore.getState().user?.cod_usuario);
  if (!usuario) return [];
  const [actividades, empleados] = await Promise.all([
    http
      .get<unknown>("/api/appweb/lista-actividades2", { params: { cod_asesor: usuario } })
      .then((r) => parseEnvelope(r, actividadReporteSchema, "lista-actividades2")),
    empleadosUsuarios.fetchLista({}),
  ]);
  // Como la tabla de CRM: nombre del asesor por código de usuario.
  const asesores = new Map(empleados.map((e) => [String(e.codUsuario), e.nombreCompleto]));
  return actividadesEnRango(actividades, params.fecha_inicio ?? "", params.fecha_fin ?? "").map(
    (a) => ({ ...a, asesor: asesores.get(String(a.cod_asesor ?? "")) ?? "" }),
  );
}

/** Usuario de la sesión, que encabeza cada página del calendario (como en CRM). */
function agenteSesion(): AgenteCalendario {
  const usuario = useAuthStore.getState().user;
  const nombre = [usuario?.nom_empleado, usuario?.apellido_emp]
    .map((parte) => asText(parte))
    .filter(Boolean)
    .join(" ");
  return {
    nombre: nombre || asText(usuario?.nombre_usuario) || asText(usuario?.email),
    correo: asText(usuario?.usuario) || asText(usuario?.email),
  };
}

/** PDF de CRM: calendario por día y hora, abierto en otra pestaña. */
async function pdfCalendario({ filas, params }: DescargaReporte<Fila>) {
  const blob = await generarPdfCalendarioActividades([...filas], {
    agente: agenteSesion(),
    fechaInicio: params.fecha_inicio ?? "",
    fechaFin: params.fecha_fin ?? "",
  });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export const reporteActividades = definirReporte<Fila>({
  nomenclatura: "REP_ACTIVIDADES",
  descripcion: "Calendario de seguimientos del usuario",
  fechas: "opcionales",
  empresaCentroCosto: false,
  consultar,
  // Como en Reportes CRM: solo PDF (sin Excel).
  descargas: { pdf: pdfCalendario },
  agrupacion: { filas: ["tipo"] },
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

import { format, getISOWeek, getISOWeekYear } from "date-fns";
import { type Actividad, actividades } from "@/features/actividades/api/actividades";
import { empleadosUsuarios, puestos } from "@/features/catalogos";
import {
  type ObjetivoReporte,
  objetivoReporteSchema,
} from "@/features/reportes-crm/api/objetivos-reporte";
import { ReporteObjetivos } from "@/features/reportes-crm/components/reporte-objetivos-empleado";
import { http } from "@/shared/api/client";
import { parseEnvelope } from "@/shared/api/envelope";
import { formatearFechaHora } from "@/shared/lib/date";
import { asText } from "@/shared/lib/text";
import { useAuthStore } from "@/shared/stores/auth-store";
import {
  type ContenidoReporteProps,
  definirReporte,
  type ParamsReporte,
} from "../../lib/definir-reporte";
import { filtroUsuario } from "../../lib/filtros";

/**
 * GRÁFICAS DE OBJETIVOS DE SEMANA ACTUAL
 *
 * Igual al reporte de Reportes CRM: objetivos de la semana actual del asesor (el elegido o el
 * usuario de la sesión) con el tipo de asignación de su puesto, y sus actividades del año para
 * la serie semanal. La sección "Reporte" es la misma vista de CRM (`ReporteObjetivos` con
 * `grafica`: serie por semana ISO y medidores). Cada fila del resumen es una actividad del asesor.
 */

type Fila = Actividad;

/** Objetivos de la última consulta (por parámetros), para los medidores de la vista. */
const objetivosConsultados = new Map<string, ObjetivoReporte[]>();
const claveConsulta = (params: ParamsReporte) => JSON.stringify(params);

/** Lunes a domingo de la semana actual, en día local (como Reportes CRM). */
function rangoSemanaActual() {
  const hoy = new Date();
  const dia = hoy.getDay() || 7;
  const inicio = new Date(hoy);
  inicio.setDate(hoy.getDate() - dia + 1);
  const fin = new Date(inicio);
  fin.setDate(inicio.getDate() + 6);
  return { inicio: format(inicio, "yyyy-MM-dd"), fin: format(fin, "yyyy-MM-dd") };
}

/**
 * Tipo de asignación del asesor, como en CRM: el del empleado (en el CC de la consulta) o el de
 * su puesto (`cod_tipo_asignacion` vive en el puesto); si no hay, "1".
 */
async function tipoAsignacionDe(codUsuario: string, codCc: string): Promise<string> {
  const [empleados, listaPuestos] = await Promise.all([
    empleadosUsuarios.fetchLista({}),
    puestos.fetchLista({}),
  ]);
  const asesores = new Map(
    empleados.filter((e) => String(e.codCc) === codCc).map((e) => [e.codUsuario, e]),
  );
  const empleado = [...asesores.values()].find((e) => String(e.codUsuario) === codUsuario);
  const puesto = listaPuestos.find((p) => String(p.codPuesto) === String(empleado?.codPuesto));
  return asText(empleado?.codTipoAsignacion) || asText(puesto?.codTipoAsignacion) || "1";
}

async function consultar(params: ParamsReporte): Promise<Fila[]> {
  const codUsuario = params.cod_usuario || asText(useAuthStore.getState().user?.cod_usuario) || "";
  const codCc = params.cod_cc ?? "";
  const semana = rangoSemanaActual();
  const [objetivos, filas] = await Promise.all([
    tipoAsignacionDe(codUsuario, codCc)
      .then((codTipoAsignacion) =>
        http.get<unknown>("/api/appweb/reporte-objetivos", {
          params: {
            cod_emp: params.cod_empresa ?? "",
            cod_cc: codCc,
            cod_usuario: codUsuario,
            cod_tipo_asignacion: codTipoAsignacion,
            fecha_inicial: semana.inicio,
            fecha_final: semana.fin,
          },
        }),
      )
      .then((r) => parseEnvelope(r, objetivoReporteSchema, "reporte-objetivos")),
    actividades.fetchLista({ cod_asesor: codUsuario }),
  ]);
  objetivosConsultados.clear();
  objetivosConsultados.set(claveConsulta(params), objetivos);
  return filas;
}

/** Sección "Reporte": las gráficas de Reportes CRM (serie semanal y medidores). */
function ContenidoGraficas({ filas, params }: ContenidoReporteProps<Fila>) {
  return (
    <ReporteObjetivos
      actividadesGrafica={[...filas]}
      datos={objetivosConsultados.get(claveConsulta(params)) ?? []}
      grafica
    />
  );
}

const fecha = (f: Fila) => new Date(f.fecha_programada);

export const reporteGraficasObjetivos = definirReporte<Fila>({
  nomenclatura: "CRM-GOSA-05",
  descripcion: "Actividad por semana ISO y avance de los objetivos de la semana",
  fechas: "ninguna",
  filtros: [filtroUsuario("Asesor", "cod_usuario")],
  consultar,
  // Como en Reportes CRM: sin descargas propias (solo el Excel agrupado).
  Contenido: ContenidoGraficas,
  agrupacion: { filas: ["semana"], columna: "tipo" },
  columnas: [
    { id: "codigo", label: "Código", valor: (f) => f.cod_actividad },
    { id: "tipo", label: "Tipo", valor: (f) => f.nom_tipo, agrupable: true },
    {
      id: "cliente",
      label: "Cliente",
      valor: (f) => f.nombre_cliente,
      agrupable: true,
      buscable: true,
    },
    { id: "estado", label: "Estado", valor: (f) => f.estado_desc, agrupable: true },
    {
      id: "fecha_programada",
      label: "Fecha programada",
      valor: (f) => formatearFechaHora(f.fecha_programada),
    },
    {
      id: "anio",
      label: "Año ISO",
      valor: (f) => (Number.isNaN(fecha(f).getTime()) ? null : String(getISOWeekYear(fecha(f)))),
      agrupable: true,
    },
    {
      id: "semana",
      label: "Semana ISO",
      valor: (f) =>
        Number.isNaN(fecha(f).getTime())
          ? null
          : `${getISOWeekYear(fecha(f))}-S${String(getISOWeek(fecha(f))).padStart(2, "0")}`,
      agrupable: true,
    },
  ],
});

import { z } from "zod";
import { http } from "@/shared/api/client";
import { parseEnvelope } from "@/shared/api/envelope";
import { zId } from "@/shared/lib/zod-scalars";
import { VistaIcc } from "../../contenido/crm/icc";
import { calcularIcc } from "../../lib/crm/reporte-icc";
import { definirReporte, type ParamsReporte, porcentaje } from "../../lib/definir-reporte";
import { filtroUsuario } from "../../lib/filtros";

const texto = z
  .string()
  .nullable()
  .optional()
  .transform((value) => value ?? "");
const bandera = z.coerce.number().catch(0);
const formatoPorcentaje = (valor: number | null) => (valor == null ? "—" : `${valor.toFixed(2)}%`);

/**
 * ICC (Índice de Cumplimiento Comercial, #194). `report_icc` devuelve cada actividad (llamada o
 * visita) ya clasificada por el backend (banderas 0/1); `consultar` las suma por persona
 * (`calcularIcc`) y la vista (`VistaIcc`) dibuja la gráfica, la tabla con TOTAL y el PDF.
 */
const filaConsultaSchema = z.looseObject({
  actividad: zId,
  asunto: texto,
  fecha_creacion: texto,
  fecha_programacion: texto,
  tipo: texto,
  usuario: zId,
  nombre: texto,
  nombres: texto,
  apellidos: texto,
  cod_empresa: zId.nullable().optional(),
  cc: zId.nullable().optional(),
  cc_nombre: texto,
  cod_cliente: zId.nullable().optional(),
  cliente: texto,
  cod_estado: zId.nullable().optional(),
  estado: texto,
  con_resultado: bandera,
  finalizada: bandera,
  // Clasificación hecha en el backend (definiciones de #194; ver docs/backend/report-icc.js).
  en_total: bandera,
  programada: bandera,
  programada_realizada: bandera,
  no_programada: bandera,
  no_programada_realizada: bandera,
  sin_resultado: bandera,
  vencida: bandera,
});

/** Una fila de la tabla (por persona o TOTAL). Las claves son los `id` de las columnas. */
const filaResumenSchema = z.looseObject({
  nombre: texto,
  visitas_programadas: bandera,
  visitas_realizadas: bandera,
  icca: bandera.nullable(),
  llamadas_programadas: bandera,
  llamadas_realizadas: bandera,
  iccp: bandera.nullable(),
  visitas_no_programadas_realizadas: bandera,
  visitas_total: bandera,
  iccc: bandera.nullable(),
  sin_resultado: bandera,
  vencidas: bandera,
});

export type FilaIcc = z.infer<typeof filaConsultaSchema>;
export type ResumenIcc = z.infer<typeof filaResumenSchema>;
type Fila = z.infer<typeof filaResumenSchema>;

async function consultar(params: ParamsReporte): Promise<Fila[]> {
  const filas = parseEnvelope(
    await http.get<unknown>("/api/appweb/report-icc", { params }),
    filaConsultaSchema,
    "report-icc",
  );
  return calcularIcc(filas).personas;
}

export const reporteIndiceDeCumplimiento = definirReporte<Fila>({
  nomenclatura: "CRM-ICC-07",
  descripcion: "Reporte ICC",
  fechas: "requeridas",
  filtros: [filtroUsuario("Usuario", "cod_usuario")],
  consultar,
  Contenido: VistaIcc,
  descargas: { pdf: "contenido" },
  columnas: [
    { id: "nombre", label: "Persona", valor: (f) => f.nombre, agrupable: true, buscable: true },
    {
      id: "visitas_programadas",
      label: "Visitas prog.",
      valor: (f) => f.visitas_programadas,
      sumable: true,
    },
    {
      id: "visitas_realizadas",
      label: "Visitas real.",
      valor: (f) => f.visitas_realizadas,
      sumable: true,
    },
    // ICCa, ICCp e ICCc: en el Resumen agrupado se calculan con las sumas de cada grupo.
    {
      id: "icca",
      label: "ICCa",
      valor: (f) => formatoPorcentaje(f.icca),
      calculada: (s) => porcentaje(s.visitas_realizadas, s.visitas_programadas),
    },
    {
      id: "llamadas_programadas",
      label: "Llamadas prog.",
      valor: (f) => f.llamadas_programadas,
      sumable: true,
    },
    {
      id: "llamadas_realizadas",
      label: "Llamadas real.",
      valor: (f) => f.llamadas_realizadas,
      sumable: true,
    },
    {
      id: "iccp",
      label: "ICCp",
      valor: (f) => formatoPorcentaje(f.iccp),
      calculada: (s) => porcentaje(s.llamadas_realizadas, s.llamadas_programadas),
    },
    {
      id: "visitas_no_programadas_realizadas",
      label: "Visitas no prog. real.",
      valor: (f) => f.visitas_no_programadas_realizadas,
      sumable: true,
    },
    { id: "visitas_total", label: "Total visitas", valor: (f) => f.visitas_total, sumable: true },
    {
      id: "iccc",
      label: "ICCc",
      valor: (f) => formatoPorcentaje(f.iccc),
      calculada: (s) => porcentaje(s.visitas_no_programadas_realizadas, s.visitas_total),
    },
    {
      id: "sin_resultado",
      label: "Citas sin resultado",
      valor: (f) => f.sin_resultado,
      sumable: true,
    },
    { id: "vencidas", label: "Vencidas", valor: (f) => f.vencidas, sumable: true },
  ],
  agrupacion: { filas: ["nombre"] },
});

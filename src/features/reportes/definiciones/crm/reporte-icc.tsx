import React from "react";
import { z } from "zod";
import { tipos } from "@/features/catalogos";
import { http } from "@/shared/api/client";
import { parseEnvelope } from "@/shared/api/envelope";
import type { ComboboxOption } from "@/shared/components/ui/combobox";
import { zId } from "@/shared/lib/zod-scalars";
import { VistaIcc } from "../../contenido/crm/icc";
import { calcularIcc } from "../../lib/crm/reporte-icc";
import {
  type ContenidoReporteProps,
  definirReporte,
  type FiltroReporte,
  type ParamsReporte,
} from "../../lib/definir-reporte";
import { filtroUsuario } from "../../lib/filtros";

const texto = z
  .string()
  .nullable()
  .optional()
  .transform((value) => value ?? "");
const bandera = z.coerce.number().catch(0);
const formatoPorcentaje = (valor: number | null) => (valor == null ? "—" : `${valor.toFixed(2)}%`);

/**
 * PLANTILLA — REPORTE PERSONALIZADO (funciones propias)
 * Cada pieza propia es una función de ESTE archivo y se conecta en su propiedad de la
 * definición (al final, marcadas ← 1 … ← 5). Lo que no se conecta usa lo de siempre.
 *
 * 1. Copiar este archivo a definiciones/<modulo>/reporte-<nombre>.tsx
 * 2. Cambiar las líneas marcadas con  // CAMBIAR
 * 3. Para cada pieza  OPCIONAL  que no se necesite: borrar su función Y su línea ← N
 *    Los imports que queden sin usar los quita: pnpm exec biome check --write --unsafe <archivo>
 * 4. Registrarlo en definiciones/<modulo>/index.ts (ver GUIA.md, paso 4)
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

// La fila puede llevar campos que no vienen del endpoint (aquí `usuario`, lo agrega la pieza 1).
export type FilaIcc = z.infer<typeof filaConsultaSchema>;
export type ResumenIcc = z.infer<typeof filaResumenSchema>;
type Fila = z.infer<typeof filaResumenSchema>;

// ── 1. OPCIONAL — Consulta propia (← 1) ──
// Para juntar varias consultas o agregar campos. Sin esto: consultar: consultarApi(...).
async function consultar(params: ParamsReporte): Promise<Fila[]> {
  const [filas /* empleados */] = await Promise.all([
    http
      .get<unknown>("/api/appweb/report-icc", { params }) // CAMBIAR: endpoint (y params si hace falta)
      .then((respuesta) => parseEnvelope(respuesta, filaConsultaSchema, "report-icc")),
    // empleadosUsuarios.fetchLista({}), // CAMBIAR: otra consulta o catálogo
  ]);
  // const nombres = new Map(empleados.map((e) => [String(e.codUsuario), e.nombreCompleto]));
  // return filas.map((f) => ({ ...f, usuario: nombres.get(String(f.cod_usuario)) ?? "" }));
  const listaConFormato = calcularIcc(filas);
  return listaConFormato?.personas ?? [];
  // return filas;
}

// ── 2. OPCIONAL — Filtro propio (← 2) ──
// Para un filtro que no está en los atajos de lib/filtros.ts.
const filtroPropio: FiltroReporte = {
  id: "cod_tipo", // CAMBIAR: nombre del parámetro que recibe la consulta
  label: "Tipo", // CAMBIAR
  multiple: true, // OPCIONAL: varios valores ("7,8")
  useOpciones: () => {
    const { data, isLoading } = tipos.useLista({ tipo_tabla: "CAMBIAR" }); // CAMBIAR: catálogo
    const opciones = React.useMemo<ComboboxOption[]>(
      () => (data ?? []).map((t) => ({ value: String(t.codTipo), label: t.nomTipo })), // CAMBIAR
      [data],
    );
    return { opciones, cargando: isLoading };
  },
};

// ── 3. OPCIONAL — Vista propia (← 3) ──
// En lugar de la tabla (aquí: un texto arriba y la tabla de siempre abajo).
function ContenidoHitRate(props: ContenidoReporteProps<Fila>) {
  return <VistaIcc {...props} />;
}

// ── La definición: aquí se conecta cada pieza ──
export const reporteIndiceDeCumplimiento = definirReporte<Fila>({
  // CAMBIAR: nombre de la constante
  nomenclatura: "CRM-ICC-07", // CAMBIAR
  descripcion: "Reporte ICC", // CAMBIAR
  fechas: "requeridas", // CAMBIAR  // porque dice cambiar?, si es por defecto no deberia decir CAMBIAR  porque indica que fijo hay que cambiarlo
  filtros: [filtroUsuario("Usuario", "cod_usuario"), filtroPropio], // ← 2
  consultar, // ← 1  (sin pieza 1: consultar: consultarApi("/api/appweb/…", filaSchema))
  Contenido: ContenidoHitRate, // ← 3  (sin pieza 3: borrar la línea)
  descargas: { pdf: "contenido" }, // ← 4 y ← 5  (o excel: true / pdf: true)
  columnas: [
    { id: "nombre", label: "Persona", valor: (f) => f.nombre, agrupable: true, buscable: true },
    {
      id: "visitas_programadas",
      label: "Visitas prog.",
      valor: (f) => f.visitas_programadas,
      agrupable: true,
    },
    {
      id: "visitas_realizadas",
      label: "Visitas real.",
      valor: (f) => f.visitas_realizadas,
      sumable: true,
    },
    { id: "icca", label: "ICCa", valor: (f) => formatoPorcentaje(f.icca), sumable: true },
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
    { id: "iccp", label: "ICCp", valor: (f) => formatoPorcentaje(f.iccp), sumable: true },
    {
      id: "visitas_no_programadas_realizadas",
      label: "Visitas no prog. real.",
      valor: (f) => f.visitas_no_programadas_realizadas,
      sumable: true,
    },
    { id: "visitas_total", label: "Total visitas", valor: (f) => f.visitas_total, sumable: true },
    { id: "iccc", label: "ICCc", valor: (f) => formatoPorcentaje(f.iccc), sumable: true },
    {
      id: "sin_resultado",
      label: "Citas sin resultado",
      valor: (f) => f.sin_resultado,
      sumable: true,
    },
    { id: "vencidas", label: "vencidas", valor: (f) => f.vencidas, sumable: true },
  ],
  agrupacion: { filas: ["nombre"] }, // CAMBIAR u OPCIONAL: agrupación inicial (ids de columnas)
});

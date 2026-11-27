import { z } from "zod";
import { consultarApi } from "../../api/consultar-api";
import { definirReporte } from "../../lib/definir-reporte";
import { filtroUsuario } from "../../lib/filtros";

/**
 * PLANTILLA — REPORTE BÁSICO
 * Para un endpoint que responde la lista de filas y recibe los parámetros con los nombres de la
 * pantalla: fecha_inicio, fecha_fin, cod_empresa, cod_cc y el id de cada filtro.
 *
 * 1. Copiar este archivo a definiciones/<modulo>/reporte-<nombre>.ts
 * 2. Cambiar las líneas marcadas con  // CAMBIAR
 * 3. Registrarlo en definiciones/<modulo>/index.ts (ver GUIA.md, paso 4)
 */

// Una fila tal como la devuelve el endpoint: nombres EXACTOS del JSON, solo los que se usan.
const filaSchema = z.looseObject({
  campo_texto: z.string().nullable().catch(""), // CAMBIAR: nombre EXACTO del campo en el JSON del endpoint (texto)
  campo_numero: z.coerce.number().catch(0), // CAMBIAR: nombre EXACTO del campo en el JSON del endpoint (número)
});
type Fila = z.infer<typeof filaSchema>;

export const reporteCambiar = definirReporte<Fila>({
  // CAMBIAR: nombre de la constante (ej. reporteVentasCliente)
  nomenclatura: "MOD-XX-01", // CAMBIAR: NOMENCLATURA del TIPO del reporte (TIPO_TABLA = 'REPORTE'), ej. "PRI-HR-01"
  descripcion: "Subtítulo de la sección Reporte", // CAMBIAR: texto bajo el título de la sección Reporte
  fechas: "requeridas", // CAMBIAR: "requeridas" | "opcionales" | "ninguna"
  filtros: [
    // CAMBIAR: atajos de lib/filtros.ts (sin empresa ni CC); 2º argumento = nombre del parámetro que espera el endpoint
    filtroUsuario("Usuario", "cod_usuario"),
  ],
  consultar: consultarApi("/api/appweb/CAMBIAR", filaSchema), // CAMBIAR: ruta del endpoint después de /api/appweb/ (ej. "report-icc")
  columnas: [
    // CAMBIAR: una línea por columna. id = único, label = encabezado, valor = campo de la fila;
    // agrupable / sumable / buscable: ver GUIA.md (F)
    { id: "texto", label: "Texto", valor: (f) => f.campo_texto, agrupable: true, buscable: true },
    { id: "numero", label: "Número", valor: (f) => f.campo_numero, sumable: true },
  ],
  agrupacion: { filas: ["texto"] }, // CAMBIAR u OPCIONAL: agrupación inicial (ids de columnas)
  descargas: { excel: true }, // OPCIONAL: excel: true y/o pdf: true (el detalle con las columnas); sin esto, ninguna
});

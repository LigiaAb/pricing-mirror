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
 * 3. Registrarlo en definiciones/<modulo>/index.ts (ver GUIA.md, paso 3)
 */

// Una fila tal como la devuelve el endpoint: nombres EXACTOS del JSON, solo los que se usan.
const filaSchema = z.looseObject({
  campo_texto: z.string().nullable().catch(""), // CAMBIAR: campos de texto
  campo_numero: z.coerce.number().catch(0), // CAMBIAR: campos numéricos
});
type Fila = z.infer<typeof filaSchema>;

export const reporteCambiar = definirReporte<Fila>({
  // CAMBIAR: nombre de la constante (ej. reporteVentasCliente)
  nomenclatura: "MOD-XX-01", // CAMBIAR: la NOMENCLATURA del TIPO
  descripcion: "Subtítulo de la sección Reporte", // CAMBIAR
  fechas: "requeridas", // CAMBIAR: "requeridas" | "opcionales" | "ninguna"
  filtros: [
    filtroUsuario("Usuario", "cod_usuario"), // CAMBIAR: filtros del reporte (sin empresa ni CC)
  ],
  consultar: consultarApi("/api/appweb/CAMBIAR", filaSchema), // CAMBIAR: endpoint
  columnas: [
    // CAMBIAR: una línea por columna de la tabla
    { id: "texto", label: "Texto", valor: (f) => f.campo_texto, agrupable: true, buscable: true },
    { id: "numero", label: "Número", valor: (f) => f.campo_numero, sumable: true },
  ],
  agrupacion: { filas: ["texto"] }, // CAMBIAR u OPCIONAL: agrupación inicial (ids de columnas)
  descargas: { excel: true }, // OPCIONAL: Excel y/o PDF del detalle (pdf: true)
});

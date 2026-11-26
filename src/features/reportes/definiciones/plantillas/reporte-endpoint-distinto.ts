import { z } from "zod";
import { consultarApi } from "../../api/consultar-api";
import { definirReporte, fechaEnRango } from "../../lib/definir-reporte";
import { filtroUsuario } from "../../lib/filtros";

/**
 * PLANTILLA — ENDPOINT DISTINTO (sin funciones propias)
 * Para un endpoint que trae la lista en otra propiedad, espera otros nombres de parámetros,
 * necesita un parámetro fijo o no filtra algo (ej. fechas). Todo se configura en las opciones de
 * consultarApi; las que no hagan falta se borran.
 *
 * 1. Copiar este archivo a definiciones/<modulo>/reporte-<nombre>.ts
 * 2. Cambiar las líneas marcadas con  // CAMBIAR  y borrar las  // OPCIONAL  que no se usen
 * 3. Registrarlo en definiciones/<modulo>/index.ts (ver GUIA.md, paso 4)
 */

const filaSchema = z.looseObject({
  campo_texto: z.string().nullable().catch(""), // CAMBIAR: nombre EXACTO del campo en el JSON del endpoint (texto)
  campo_numero: z.coerce.number().catch(0), // CAMBIAR: nombre EXACTO del campo en el JSON del endpoint (número)
  // CAMBIAR: nombre EXACTO del campo en el JSON del endpoint (fecha, si se filtra por fecha aquí)
  campo_fecha: z.string().nullable().catch(""),
});
type Fila = z.infer<typeof filaSchema>;

export const reporteCambiar = definirReporte<Fila>({
  // CAMBIAR: nombre de la constante
  nomenclatura: "MOD-XX-01", // CAMBIAR: NOMENCLATURA del TIPO del reporte (TIPO_TABLA = 'REPORTE'), ej. "PRI-HR-01"
  descripcion: "Subtítulo de la sección Reporte", // CAMBIAR: texto bajo el título de la sección Reporte
  fechas: "requeridas", // CAMBIAR: "requeridas" | "opcionales" | "ninguna"
  // CAMBIAR: atajos de lib/filtros.ts (sin empresa ni CC); 2º argumento = nombre del parámetro que espera el endpoint
  filtros: [filtroUsuario("Usuario", "cod_usuario")],
  // CAMBIAR: ruta del endpoint después de /api/appweb/ (ej. "report-icc")
  consultar: consultarApi("/api/appweb/CAMBIAR", filaSchema, {
    // OPCIONAL: la lista no viene en data, sino en data.<propiedad>
    lista: "detalle", // CAMBIAR: nombre de la propiedad donde viene la lista
    // OPCIONAL: parámetros fijos que siempre se mandan
    params: { tipo: "CAMBIAR" }, // CAMBIAR: nombre del parámetro: valor fijo
    // OPCIONAL: el endpoint espera otros nombres (nombre de la pantalla: nombre del endpoint)
    nombres: { cod_empresa: "cod_emp", fecha_inicio: "fecha_inicial", fecha_fin: "fecha_final" },
    // OPCIONAL: lo que el endpoint no filtra se filtra aquí (true = la fila se queda)
    filtrar: (f, params) => fechaEnRango(f.campo_fecha, params),
  }),
  columnas: [
    // CAMBIAR: una línea por columna. id = único, label = encabezado, valor = campo de la fila;
    // agrupable / sumable / buscable: ver GUIA.md (F)
    { id: "texto", label: "Texto", valor: (f) => f.campo_texto, agrupable: true, buscable: true },
    { id: "numero", label: "Número", valor: (f) => f.campo_numero, sumable: true },
    { id: "fecha", label: "Fecha", valor: (f) => f.campo_fecha },
  ],
  agrupacion: { filas: ["texto"] }, // CAMBIAR u OPCIONAL: agrupación inicial (ids de columnas)
  descargas: { excel: true }, // OPCIONAL: excel: true y/o pdf: true (el detalle con las columnas); sin esto, ninguna
});

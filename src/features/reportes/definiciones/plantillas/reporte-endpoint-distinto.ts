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
 * 3. Registrarlo en definiciones/<modulo>/index.ts (ver GUIA.md, paso 3)
 */

const filaSchema = z.looseObject({
  campo_texto: z.string().nullable().catch(""), // CAMBIAR: campos de texto
  campo_numero: z.coerce.number().catch(0), // CAMBIAR: campos numéricos
  campo_fecha: z.string().nullable().catch(""), // CAMBIAR: fecha (si se filtra por fecha aquí)
});
type Fila = z.infer<typeof filaSchema>;

export const reporteCambiar = definirReporte<Fila>({
  // CAMBIAR: nombre de la constante
  nomenclatura: "MOD-XX-01", // CAMBIAR
  descripcion: "Subtítulo de la sección Reporte", // CAMBIAR
  fechas: "requeridas", // CAMBIAR
  filtros: [filtroUsuario("Usuario", "cod_usuario")], // CAMBIAR
  consultar: consultarApi("/api/appweb/CAMBIAR", filaSchema, {
    // OPCIONAL: la lista no viene en data, sino en data.<propiedad>
    lista: "detalle",
    // OPCIONAL: parámetros fijos que siempre se mandan
    params: { tipo: "CAMBIAR" },
    // OPCIONAL: el endpoint espera otros nombres (nombre de la pantalla: nombre del endpoint)
    nombres: { cod_empresa: "cod_emp", fecha_inicio: "fecha_inicial", fecha_fin: "fecha_final" },
    // OPCIONAL: lo que el endpoint no filtra se filtra aquí (true = la fila se queda)
    filtrar: (f, params) => fechaEnRango(f.campo_fecha, params),
  }),
  columnas: [
    // CAMBIAR
    { id: "texto", label: "Texto", valor: (f) => f.campo_texto, agrupable: true, buscable: true },
    { id: "numero", label: "Número", valor: (f) => f.campo_numero, sumable: true },
    { id: "fecha", label: "Fecha", valor: (f) => f.campo_fecha },
  ],
  agrupacion: { filas: ["texto"] }, // CAMBIAR u OPCIONAL: agrupación inicial (ids de columnas)
  descargas: { excel: true }, // OPCIONAL
});

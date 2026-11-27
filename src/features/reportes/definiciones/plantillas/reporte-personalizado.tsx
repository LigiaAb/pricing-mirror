import React from "react";
import { z } from "zod";
import { empleadosUsuarios, tipos } from "@/features/catalogos";
import { http } from "@/shared/api/client";
import { parseEnvelope } from "@/shared/api/envelope";
import type { ComboboxOption } from "@/shared/components/ui/combobox";
import { type CeldaExcel, exportarExcel } from "@/shared/lib/excel";
import { TablaReporte } from "../../components/contenido-reporte";
import {
  type ContenidoReporteProps,
  type DescargaReporte,
  definirReporte,
  type FiltroReporte,
  type ParamsReporte,
} from "../../lib/definir-reporte";
import { descargarPdf, nombreArchivo } from "../../lib/exportar";
import { filtroUsuario } from "../../lib/filtros";

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

const filaSchema = z.looseObject({
  campo_texto: z.string().nullable().catch(""), // CAMBIAR: nombre EXACTO del campo en el JSON del endpoint (texto)
  campo_numero: z.coerce.number().catch(0), // CAMBIAR: nombre EXACTO del campo en el JSON del endpoint (número)
  cod_usuario: z.coerce.number().catch(0), // CAMBIAR: código para buscar el nombre (pieza 1)
});
// La fila puede llevar campos que no vienen del endpoint (aquí `usuario`, lo agrega la pieza 1).
type Fila = z.infer<typeof filaSchema> & { usuario: string };

// ── 1. OPCIONAL — Consulta propia (← 1) ──
// Para juntar varias consultas o agregar campos. Sin esto: consultar: consultarApi(...).
async function consultar(params: ParamsReporte): Promise<Fila[]> {
  const [filas, empleados] = await Promise.all([
    http
      // CAMBIAR: ruta del endpoint después de /api/appweb/ (ej. "report-icc"); { params } manda los de la pantalla tal cual
      .get<unknown>("/api/appweb/CAMBIAR", { params })
      // CAMBIAR: nombre del endpoint (ej. "report-icc"); sale en el error si las filas no cumplen filaSchema
      .then((respuesta) => parseEnvelope(respuesta, filaSchema, "CAMBIAR")),
    empleadosUsuarios.fetchLista({}), // CAMBIAR: otra consulta o catálogo
  ]);
  const nombres = new Map(empleados.map((e) => [String(e.codUsuario), e.nombreCompleto]));
  return filas.map((f) => ({ ...f, usuario: nombres.get(String(f.cod_usuario)) ?? "" }));
}

// ── 2. OPCIONAL — Filtro propio (← 2) ──
// Para un filtro que no está en los atajos de lib/filtros.ts.
const filtroPropio: FiltroReporte = {
  id: "cod_tipo", // CAMBIAR: nombre del parámetro que recibe la consulta
  label: "Tipo", // CAMBIAR: texto del filtro en pantalla y en el encabezado del PDF/Excel
  multiple: true, // OPCIONAL: varios valores ("7,8")
  useOpciones: () => {
    // CAMBIAR: TIPO_TABLA del catálogo TIPO (ej. "PAGO"), u otro catálogo
    const { data, isLoading } = tipos.useLista({ tipo_tabla: "CAMBIAR" });
    const opciones = React.useMemo<ComboboxOption[]>(
      // CAMBIAR: value = lo que recibe la consulta, label = lo que se ve
      () => (data ?? []).map((t) => ({ value: String(t.codTipo), label: t.nomTipo })),
      [data],
    );
    return { opciones, cargando: isLoading };
  },
};

// ── 3. OPCIONAL — Vista propia (← 3) ──
// En lugar de la tabla (aquí: un texto arriba y la tabla de siempre abajo).
function VistaPropia(props: ContenidoReporteProps<Fila>) {
  return (
    <div className="space-y-3">
      {/* CAMBIAR: lo que va arriba de la tabla (texto, gráfica, tarjetas) */}
      <p className="text-sm">{props.filas.length} registros</p>
      <TablaReporte {...props} />
    </div>
  );
}

// ── 4. OPCIONAL — Excel propio (← 4) ──
// Sin esto: excel: true (el detalle con las columnas) o ninguno.
async function excelPropio({ filas, titulo, encabezado }: DescargaReporte<Fila>) {
  await exportarExcel({
    nombreArchivo: `${nombreArchivo(titulo)}.xlsx`,
    titulo,
    encabezado,
    hojas: [
      {
        nombre: titulo.slice(0, 31),
        mostrarCuadricula: true,
        autoFiltro: true,
        columnas: ["Texto", "Usuario", "Número"], // CAMBIAR: encabezados de las columnas del Excel
        filas: filas.map((f): CeldaExcel[] => [
          f.campo_texto, // CAMBIAR: una celda por columna, en el mismo orden
          f.usuario,
          // Celda con color: { dato, fontColor } (color ARGB)
          f.campo_numero < 0 ? { dato: f.campo_numero, fontColor: "FFB30000" } : f.campo_numero,
        ]),
      },
    ],
  });
}

// ── 5. OPCIONAL — PDF propio (← 5) ──
// Con el formato de Reportes de pricing. Sin esto: pdf: true (el detalle) o ninguno.
function pdfPropio({ filas, titulo, encabezado }: DescargaReporte<Fila>) {
  return descargarPdf({
    titulo,
    header: encabezado,
    horizontal: true,
    contenido: [
      // CAMBIAR: bloques en el orden en que se imprimen (tipos: ver DOCUMENTACION.md, PDF propio)
      { tipo: "titulo", texto: "Resumen" },
      { tipo: "texto", texto: `${filas.length} registros` }, // CAMBIAR: texto
      {
        tipo: "tabla",
        columnas: ["Texto", "Usuario", "Número"], // CAMBIAR: encabezados
        filas: filas.map((f) => [f.campo_texto, f.usuario, f.campo_numero]), // CAMBIAR: una celda por columna, en el mismo orden
      },
    ],
  });
}

// ── La definición: aquí se conecta cada pieza ──
export const reporteCambiar = definirReporte<Fila>({
  // CAMBIAR: nombre de la constante
  nomenclatura: "MOD-XX-01", // CAMBIAR: NOMENCLATURA del TIPO del reporte (TIPO_TABLA = 'REPORTE'), ej. "PRI-HR-01"
  descripcion: "Subtítulo de la sección Reporte", // CAMBIAR: texto bajo el título de la sección Reporte
  fechas: "requeridas", // CAMBIAR: "requeridas" | "opcionales" | "ninguna"
  // CAMBIAR: atajos de lib/filtros.ts (sin empresa ni CC); 2º argumento = nombre del parámetro que espera el endpoint
  filtros: [filtroUsuario("Usuario", "cod_usuario"), filtroPropio], // ← 2
  consultar, // ← 1  (sin pieza 1: consultar: consultarApi("/api/appweb/CAMBIAR", filaSchema))
  Contenido: VistaPropia, // ← 3  (sin pieza 3: borrar la línea)
  descargas: { excel: excelPropio, pdf: pdfPropio }, // ← 4 y ← 5  (o excel: true / pdf: true)
  columnas: [
    // CAMBIAR: una línea por columna. id = único, label = encabezado, valor = campo de la fila;
    // agrupable / sumable / buscable: ver GUIA.md (F)
    { id: "texto", label: "Texto", valor: (f) => f.campo_texto, agrupable: true, buscable: true },
    { id: "usuario", label: "Usuario", valor: (f) => f.usuario, agrupable: true },
    { id: "numero", label: "Número", valor: (f) => f.campo_numero, sumable: true },
  ],
  agrupacion: { filas: ["texto"] }, // CAMBIAR u OPCIONAL: agrupación inicial (ids de columnas)
});

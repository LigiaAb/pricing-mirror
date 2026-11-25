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
 *    Los imports que queden sin usar los quita: npx biome check --write --unsafe <archivo>
 * 4. Registrarlo en definiciones/<modulo>/index.ts (ver GUIA.md, paso 3)
 */

const filaSchema = z.looseObject({
  campo_texto: z.string().nullable().catch(""), // CAMBIAR
  campo_numero: z.coerce.number().catch(0), // CAMBIAR
  cod_usuario: z.coerce.number().catch(0), // CAMBIAR: código para buscar el nombre (pieza 1)
});
// La fila puede llevar campos que no vienen del endpoint (aquí `usuario`, lo agrega la pieza 1).
type Fila = z.infer<typeof filaSchema> & { usuario: string };

// ── 1. OPCIONAL — Consulta propia (← 1) ──
// Para juntar varias consultas o agregar campos. Sin esto: consultar: consultarApi(...).
async function consultar(params: ParamsReporte): Promise<Fila[]> {
  const [filas, empleados] = await Promise.all([
    http
      .get<unknown>("/api/appweb/CAMBIAR", { params }) // CAMBIAR: endpoint (y params si hace falta)
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
function VistaPropia(props: ContenidoReporteProps<Fila>) {
  return (
    <div className="space-y-3">
      <p className="text-sm">{props.filas.length} registros</p> {/* CAMBIAR */}
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
        columnas: ["Texto", "Usuario", "Número"], // CAMBIAR
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
      { tipo: "titulo", texto: "Resumen" }, // CAMBIAR: bloques en el orden en que se imprimen
      { tipo: "texto", texto: `${filas.length} registros` },
      {
        tipo: "tabla",
        columnas: ["Texto", "Usuario", "Número"],
        filas: filas.map((f) => [f.campo_texto, f.usuario, f.campo_numero]),
      },
    ],
  });
}

// ── La definición: aquí se conecta cada pieza ──
export const reporteCambiar = definirReporte<Fila>({
  // CAMBIAR: nombre de la constante
  nomenclatura: "MOD-XX-01", // CAMBIAR
  descripcion: "Subtítulo de la sección Reporte", // CAMBIAR
  fechas: "requeridas", // CAMBIAR
  filtros: [filtroUsuario("Usuario", "cod_usuario"), filtroPropio], // ← 2
  consultar, // ← 1  (sin pieza 1: consultar: consultarApi("/api/appweb/…", filaSchema))
  Contenido: VistaPropia, // ← 3  (sin pieza 3: borrar la línea)
  descargas: { excel: excelPropio, pdf: pdfPropio }, // ← 4 y ← 5  (o excel: true / pdf: true)
  columnas: [
    // CAMBIAR
    { id: "texto", label: "Texto", valor: (f) => f.campo_texto, agrupable: true, buscable: true },
    { id: "usuario", label: "Usuario", valor: (f) => f.usuario, agrupable: true },
    { id: "numero", label: "Número", valor: (f) => f.campo_numero, sumable: true },
  ],
});

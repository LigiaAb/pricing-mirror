/**
 * TABLA DINÁMICA DE KPI (Hit Rate y Realización de Precio)
 *
 * Arma el árbol que dibuja `TablaDouble` a partir del detalle de `report_kpi_cotizaciones`
 * (una fila por cotización): filas agrupadas por los niveles que elige el usuario y columnas
 * por un campo (o ninguna). Los porcentajes se calculan en cada nivel con sus propios
 * conteos; nunca se suman.
 *
 * Cada cotización aporta por separado:
 *  - "realizada" con los datos de su creación (año/mes de la primera versión);
 *  - "cerrada" con los datos de su aprobación (año/mes de aprobación).
 * Así, por año o mes, una cotización creada en junio y aprobada en julio suma la
 * realizada en junio y la cerrada en julio, igual que report_hit_rate.
 * Realización de Precio no usa la aprobación: todo va con la creación de la versión activa,
 * igual que report_realizacion_de_precio.
 */

import type { ColumnaTabla, TreeNode } from "@/features/pricing/shared";
import type { FilaKpi, ReporteKpi } from "../api/kpi-cotizaciones";

export type CampoKpi = { campo: string; etiqueta: string };

type Momento = "creacion" | "aprobacion";

const SIN_DATO = "SIN DATO";

const textoONulo = (valor: string | null | undefined) => {
  const limpio = valor?.trim();
  return limpio ? limpio : SIN_DATO;
};

/** Fecha "2026-07-15T…" → "2026-07" o "2026". */
const parteFecha = (fecha: string | null | undefined, largo: 4 | 7) =>
  fecha && fecha.length >= largo ? fecha.slice(0, largo) : SIN_DATO;

/**
 * Origen o destino. Con un servicio seleccionado: "CÓDIGO - NOMBRE" del punto de enlace o de
 * la ciudad (terrestre); sin servicio, el país, para que se puedan juntar transportes distintos.
 */
const lugar = (fila: FilaKpi, extremo: "origen" | "destino", porTransporte: boolean): string => {
  const pais = fila[`${extremo}_pais`];
  if (!porTransporte) return textoONulo(pais);
  const nombre = textoONulo(fila[extremo]);
  const codigo = fila[`${extremo}_codigo`]?.trim();
  return codigo && nombre !== SIN_DATO ? `${codigo} - ${nombre}` : nombre;
};

const LECTORES: Record<
  string,
  (fila: FilaKpi, momento: Momento, porTransporte: boolean) => string
> = {
  usuario: (fila) => {
    const nombre = textoONulo(`${fila.nombres ?? ""} ${fila.apellidos ?? ""}`);
    return nombre === SIN_DATO ? `USUARIO ${fila.usuario}` : nombre;
  },
  cc_nombre: (fila) => textoONulo(fila.cc_nombre),
  transporte: (fila) => textoONulo(fila.transporte),
  cliente: (fila) => textoONulo(fila.cliente),
  tipo_pago: (fila) => textoONulo(fila.tipo_pago),
  estado: (fila) => textoONulo(fila.estado),
  cotizacion: (fila) => `COTIZACIÓN ${fila.cotizacion}`,
  origen: (fila, _momento, porTransporte) => lugar(fila, "origen", porTransporte),
  destino: (fila, _momento, porTransporte) => lugar(fila, "destino", porTransporte),
  carrier: (fila) => textoONulo(fila.carrier),
  anio: (fila, momento) =>
    parteFecha(momento === "creacion" ? fila.fecha_creacion : fila.fecha_aprobacion, 4),
  mes: (fila, momento) =>
    parteFecha(momento === "creacion" ? fila.fecha_creacion : fila.fecha_aprobacion, 7),
};

/** Campos que se pueden usar como niveles de filas. "Departamento" = centro de costo. */
export const CAMPOS_NIVELES_KPI: CampoKpi[] = [
  { campo: "usuario", etiqueta: "Usuario" },
  { campo: "cc_nombre", etiqueta: "Departamento (centro de costo)" },
  { campo: "transporte", etiqueta: "Servicio (transporte)" },
  { campo: "cliente", etiqueta: "Cliente" },
  { campo: "tipo_pago", etiqueta: "Tipo de pago" },
  { campo: "estado", etiqueta: "Estado" },
  { campo: "origen", etiqueta: "Origen" },
  { campo: "destino", etiqueta: "Destino" },
  { campo: "carrier", etiqueta: "Carrier" },
  { campo: "anio", etiqueta: "Año" },
  { campo: "mes", etiqueta: "Mes" },
  /** Último nivel recomendado: una fila por cotización. */
  { campo: "cotizacion", etiqueta: "Cotización" },
];

export const NIVELES_DEFECTO_KPI: CampoKpi[] = [{ campo: "usuario", etiqueta: "Usuario" }];

/** Campo de columnas; "" = sin columnas (solo el total). */
export const CAMPOS_COLUMNA_KPI: CampoKpi[] = [
  { campo: "", etiqueta: "Ninguna (solo total)" },
  { campo: "anio", etiqueta: "Año" },
  { campo: "mes", etiqueta: "Mes" },
  { campo: "transporte", etiqueta: "Servicio (transporte)" },
  { campo: "cc_nombre", etiqueta: "Departamento (centro de costo)" },
  { campo: "tipo_pago", etiqueta: "Tipo de pago" },
  { campo: "estado", etiqueta: "Estado" },
  { campo: "origen", etiqueta: "Origen" },
  { campo: "destino", etiqueta: "Destino" },
  { campo: "carrier", etiqueta: "Carrier" },
];

/** `porTransporte`: hay un servicio seleccionado (cambia el detalle de origen y destino). */
export function valorCampoKpi(
  fila: FilaKpi,
  campo: string,
  momento: Momento,
  porTransporte = false,
): string {
  return LECTORES[campo]?.(fila, momento, porTransporte) ?? SIN_DATO;
}

type Conteo = {
  realizadas: number;
  cerradas: number;
  sobreTarifa: number;
  spot: number;
  tarifaPublicada: number;
};

const conteoVacio = (): Conteo => ({
  realizadas: 0,
  cerradas: 0,
  sobreTarifa: 0,
  spot: 0,
  tarifaPublicada: 0,
});

/** Porcentaje con 2 decimales; "" si no hay realizadas (no se puede dividir). */
const porcentaje = (parte: number, total: number): number | "" =>
  total > 0 ? Math.round((parte / total) * 10000) / 100 : "";

type Medida = { key: string; etiqueta: string; valor: (c: Conteo) => number | "" };

export const MEDIDAS_KPI: Record<ReporteKpi, Medida[]> = {
  hit_rate: [
    { key: "realizadas", etiqueta: "Realizadas", valor: (c) => c.realizadas },
    { key: "cerradas", etiqueta: "Cerradas", valor: (c) => c.cerradas },
    { key: "hr", etiqueta: "HR %", valor: (c) => porcentaje(c.cerradas, c.realizadas) },
  ],
  realizacion_de_precio: [
    { key: "realizadas", etiqueta: "Realizadas", valor: (c) => c.realizadas },
    { key: "sobre", etiqueta: "Sobre tarifa", valor: (c) => c.sobreTarifa },
    { key: "sobre_pct", etiqueta: "RdPs %", valor: (c) => porcentaje(c.sobreTarifa, c.realizadas) },
    { key: "spot", etiqueta: "Spot", valor: (c) => c.spot },
    { key: "spot_pct", etiqueta: "RdPd %", valor: (c) => porcentaje(c.spot, c.realizadas) },
    { key: "publicada", etiqueta: "Tarifa publicada", valor: (c) => c.tarifaPublicada },
    {
      key: "publicada_pct",
      etiqueta: "RdPp %",
      valor: (c) => porcentaje(c.tarifaPublicada, c.realizadas),
    },
  ],
};

/** Grupo de columnas del total (siempre al final). */
const CLAVE_TOTAL = "__total__";

type Aporte = { momento: Momento; sumar: (c: Conteo) => void };

/** Lo que aporta una cotización: su realizada y/o su cerrada (con el grupo de precio). */
function aportesDeFila(fila: FilaKpi, reporte: ReporteKpi): Aporte[] {
  const aportes: Aporte[] = [];
  if (fila.realizada === 1) {
    aportes.push({
      momento: "creacion",
      sumar: (c) => {
        c.realizadas += 1;
      },
    });
  }
  if (fila.cerrada === 1) {
    aportes.push({
      momento: reporte === "realizacion_de_precio" ? "creacion" : "aprobacion",
      sumar: (c) => {
        c.cerradas += 1;
        // Como report_realizacion_de_precio: una cotización puede sumar en Spot y en sobre tarifa
        c.sobreTarifa += fila.spot_alto;
        c.spot += fila.spot_bajo;
        c.tarifaPublicada += fila.sin_spot;
      },
    });
  }
  return aportes;
}

type NodoConteo = {
  id: string;
  label: string;
  /** Solo en los nodos del nivel "Cotización": su número (abre la ficha). */
  cotizacion?: number | undefined;
  conteos: Map<string, Conteo>;
  hijos: Map<string, NodoConteo>;
};

const nuevoNodo = (id: string, label: string): NodoConteo => ({
  id,
  label,
  conteos: new Map(),
  hijos: new Map(),
});

function sumarEn(nodo: NodoConteo, columna: string, aporte: Aporte) {
  for (const clave of columna === CLAVE_TOTAL ? [CLAVE_TOTAL] : [columna, CLAVE_TOTAL]) {
    const conteo = nodo.conteos.get(clave) ?? conteoVacio();
    aporte.sumar(conteo);
    nodo.conteos.set(clave, conteo);
  }
}

export type TablaKpi = {
  /** Un nodo raíz "TOTAL GENERAL" con los niveles debajo. */
  data: TreeNode[];
  columnas: ColumnaTabla[];
};

/**
 * Árbol + columnas para `TablaDouble`.
 * Columnas: por cada valor del campo de columna, las medidas del reporte; al final, el total.
 */
export function construirTablaKpi(
  filas: FilaKpi[],
  reporte: ReporteKpi,
  niveles: CampoKpi[],
  campoColumna: string,
  porTransporte = false,
): TablaKpi {
  const raiz = nuevoNodo("total", "TOTAL GENERAL");
  const valoresColumna = new Set<string>();

  for (const fila of filas) {
    for (const aporte of aportesDeFila(fila, reporte)) {
      const columna = campoColumna
        ? valorCampoKpi(fila, campoColumna, aporte.momento, porTransporte)
        : CLAVE_TOTAL;
      if (columna !== CLAVE_TOTAL) valoresColumna.add(columna);

      let nodo = raiz;
      sumarEn(nodo, columna, aporte);
      for (const nivel of niveles) {
        const valor = valorCampoKpi(fila, nivel.campo, aporte.momento, porTransporte);
        let hijo = nodo.hijos.get(valor);
        if (!hijo) {
          hijo = nuevoNodo(`${nodo.id}|${nivel.campo}:${valor}`, valor);
          if (nivel.campo === "cotizacion") hijo.cotizacion = Number(fila.cotizacion);
          nodo.hijos.set(valor, hijo);
        }
        nodo = hijo;
        sumarEn(nodo, columna, aporte);
      }
    }
  }

  const medidas = MEDIDAS_KPI[reporte];
  const grupos = [...[...valoresColumna].sort(), CLAVE_TOTAL];
  const etiquetaCampo =
    CAMPOS_COLUMNA_KPI.find((c) => c.campo === campoColumna)?.etiqueta ?? campoColumna;

  const columnas: ColumnaTabla[] = grupos.flatMap((grupo) =>
    medidas.map((medida) => ({
      key: `${grupo}__${medida.key}`,
      label:
        grupo === CLAVE_TOTAL
          ? campoColumna
            ? `Total · ${medida.etiqueta}`
            : medida.etiqueta
          : `${etiquetaCampo} ${grupo} · ${medida.etiqueta}`,
      entero: true,
      excluirTotal: true,
    })),
  );

  const aTreeNode = (nodo: NodoConteo): TreeNode => {
    const values: Record<string, number | string> = {};
    for (const grupo of grupos) {
      const conteo = nodo.conteos.get(grupo) ?? conteoVacio();
      for (const medida of medidas) values[`${grupo}__${medida.key}`] = medida.valor(conteo);
    }
    return {
      id: nodo.id,
      label: nodo.label,
      ...(nodo.cotizacion == null ? {} : { cotizacion: nodo.cotizacion }),
      values,
      children: [...nodo.hijos.values()]
        .sort((a, b) => a.label.localeCompare(b.label))
        .map(aTreeNode),
    };
  };

  return { data: filas.length ? [aTreeNode(raiz)] : [], columnas };
}

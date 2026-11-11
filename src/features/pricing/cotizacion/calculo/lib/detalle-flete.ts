/* ==========================================================================
 * DETALLE DEL FLETE SEGÚN EL TIPO DE TRANSPORTE
 *
 * Único lugar donde se arma el texto de detalle de los rubros de flete
 * (el que se ve en Due Carrier / Totales y se guarda con la versión).
 * Lo usan el flete normal (procesar-rubros-calculados.ts) y el flete Spot
 * (carrier-flete.ts).
 *
 * Formato estándar:
 *   CW: 120 / $2.50 Por KILO      ← con tarifa por unidad
 *   CW: 120 / Tarifa $ 350        ← cuando la tarifa es un monto fijo (mínimo)
 *
 * Un transporte con `null` (o que no esté en la tabla) NO lleva detalle de flete.
 *
 * ¿Cómo cambio el texto de un transporte?
 *   - Si solo cambian las palabras: edita `etiqueta` y `unidadTarifa`
 *     en DETALLE_FLETE_POR_TRANSPORTE.
 *   - Si necesita un formato distinto: escribe la función `textoEspecial`
 *     (ver el ejemplo comentado en MARÍTIMO). Recibe todos los datos,
 *     incluido si es flete normal o Spot.
 * ========================================================================== */

import { TIPO_TRANSPORTE } from "./constantes";
import type { Id } from "./tipos";

/** Datos con los que se arma el texto del detalle. */
export type DatosDetalleFlete = {
  /** "normal" = flete del cálculo; "spot" = tarifa Spot ingresada por el usuario. */
  tipo: "normal" | "spot";

  /** Valor que va antes de la "/" (hoy, el CW calculado). */
  valorCw?: unknown;

  /** Símbolo de la moneda de venta ("Q", "$"...). */
  simbolo: string;

  /** Tarifa por unidad (rate). */
  rate?: unknown;

  /**
   * Monto fijo cuando la tarifa no es por unidad (rate = 0).
   * Flete normal: la venta del método. Spot: el valor Spot ingresado.
   */
  minimo?: unknown;
};

type ConfigDetalleFlete = {
  /** Texto antes de los dos puntos (tipo_desc). */
  etiqueta: string;

  /** Unidad de la tarifa por unidad ("Por KILO"). */
  unidadTarifa: string;

  /**
   * Opcional. Si existe, reemplaza el formato estándar.
   * Devuelve solo la descripción (lo que va después de "ETIQUETA: ").
   */
  textoEspecial?: (datos: DatosDetalleFlete) => string;
};

/* ==========================================================================
 * CONFIGURACIÓN POR TIPO DE TRANSPORTE
 * ========================================================================== */

const DETALLE_AEREO: ConfigDetalleFlete = {
  etiqueta: "CW",
  unidadTarifa: "Por KILO",
};

export const DETALLE_FLETE_POR_TRANSPORTE: Record<number, ConfigDetalleFlete | null> = {
  [TIPO_TRANSPORTE.AEREO]: DETALLE_AEREO,

  [TIPO_TRANSPORTE.MARITIMO]: null /* {
    // TODO: pendiente de definir por el departamento. Mientras tanto, igual que aéreo.
    etiqueta: "CW",
    unidadTarifa: "Por KILO",

    // Ejemplo de texto especial (descomentar y ajustar cuando esté definido):
    // textoEspecial: ({ tipo, valorCw, simbolo, rate, minimo }) =>
    //   tipo === "spot"
    //     ? `${valorCw ?? ""} CBM / Spot ${simbolo} ${minimo ?? rate ?? ""}`
    //     : `${valorCw ?? ""} CBM / ${simbolo}${rate ?? ""} Por CBM`,
  } */,

  [TIPO_TRANSPORTE.TERRESTRE]: null /* {
    // TODO: pendiente de definir por el departamento. Mientras tanto, igual que aéreo.
    etiqueta: "CW",
    unidadTarifa: "Por KILO",
  } */,
};

/** Configuración para un transporte; `null` si ese transporte no lleva detalle de flete. */
export function obtenerConfigDetalleFlete(
  codTipoTransporte?: Id | null,
): ConfigDetalleFlete | null {
  return DETALLE_FLETE_POR_TRANSPORTE[Number(codTipoTransporte)] ?? null;
}

/* ==========================================================================
 * CONSTRUCCIÓN DEL DETALLE
 * ========================================================================== */

function tieneValor(value: unknown) {
  return value != null && String(value).trim() !== "";
}

/** `true` si el detalle ya es el detalle de flete de ese transporte (para no duplicarlo). */
export function esDetalleFlete(
  detalle: { tipo_desc?: unknown } | null | undefined,
  codTipoTransporte?: Id | null,
) {
  const config = obtenerConfigDetalleFlete(codTipoTransporte);

  // Sin configuración no hay detalle de flete que reconocer.
  if (!config) return false;

  return (
    String(detalle?.tipo_desc ?? "")
      .trim()
      .toUpperCase() === config.etiqueta.trim().toUpperCase()
  );
}

/** `true` si hay datos suficientes para armar el detalle (tarifa por unidad o monto fijo). */
export function puedeConstruirDetalleFlete(datos: Pick<DatosDetalleFlete, "rate" | "minimo">) {
  return tieneValor(datos.rate) || tieneValor(datos.minimo);
}

/**
 * Detalle de flete listo para agregar a `metodo.detalles`.
 * `custom: true` lo marca como generado aquí (no viene de la tarifa).
 * Devuelve `null` si el transporte no lleva detalle: en ese caso no se agrega nada.
 */
export function construirDetalleFlete(
  codTipoTransporte: Id | null | undefined,
  datos: DatosDetalleFlete,
) {
  const config = obtenerConfigDetalleFlete(codTipoTransporte);

  if (!config) return null;

  const descripcion = config.textoEspecial
    ? config.textoEspecial(datos)
    : `${datos.valorCw ?? ""} / ${
        tieneValor(datos.minimo)
          ? `Tarifa ${datos.simbolo} ${datos.minimo}`
          : `${datos.simbolo}${String(datos.rate ?? "")} ${config.unidadTarifa}`
      }`;

  return {
    tipo_desc: config.etiqueta,
    tarifadetalle_descripcion: descripcion,
    tarifadetalle_valor: "",
    custom: true,
  };
}

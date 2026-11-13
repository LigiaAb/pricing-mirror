import { TIPO_TRANSPORTE } from "./constantes";

/* ==========================================================================
 * TEXTOS DE LA CALCULADORA POR TIPO DE TRANSPORTE
 *
 * ETIQUETAS_BASE aplica a todos. Si un transporte necesita un texto propio,
 * se agrega SOLO ese texto en ETIQUETAS_POR_TRANSPORTE; lo demás se hereda.
 *
 *   [TIPO_TRANSPORTE.MARITIMO]: { volumen: "CBM", tipoVolumen: "CBM" },
 * ========================================================================== */

export type EtiquetasCalculadora = {
  titulo: string;
  volumen: string;
  peso: string;
  cw: string;
  /** Texto cuando el CW sale del volumétrico. */
  tipoVolumen: string;
  /** Texto cuando el CW sale del peso real. */
  tipoPeso: string;
  /** Texto cuando aún no hay peso ni volumen. */
  sinCalculo: string;
};

const ETIQUETAS_BASE: EtiquetasCalculadora = {
  titulo: "Calculadora de volumen y peso",
  volumen: "Kilos volumétricos",
  peso: "Kilos",
  cw: "CW",
  tipoVolumen: "KILOS VOLUMETRICOS",
  tipoPeso: "KILOGRAMOS",
  sinCalculo: "AUN NO SE HA CALCULADO",
};

/** Solo los textos que cambian respecto a ETIQUETAS_BASE. Hoy ninguno. */
const ETIQUETAS_POR_TRANSPORTE: Partial<Record<number, Partial<EtiquetasCalculadora>>> = {
  [TIPO_TRANSPORTE.AEREO]: {},
  [TIPO_TRANSPORTE.MARITIMO]: {},
  [TIPO_TRANSPORTE.TERRESTRE]: {},
};

export function obtenerEtiquetasCalculadora(
  codTipoTransporte?: string | number | null,
): EtiquetasCalculadora {
  const propias =
    codTipoTransporte == null ? undefined : ETIQUETAS_POR_TRANSPORTE[Number(codTipoTransporte)];

  return propias ? { ...ETIQUETAS_BASE, ...propias } : ETIQUETAS_BASE;
}

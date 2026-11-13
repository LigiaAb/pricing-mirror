export type EtiquetasCalculadora = {
  volumen: string;
  peso: string;
  cw: string;
  tipoVolumen: string;
  tipoPeso: string;
};

const ETIQUETAS_POR_TRANSPORTE: Record<number, EtiquetasCalculadora> = {
  49: {
    volumen: "Kilos volumétricos",
    peso: "Kilos",
    cw: "CW",
    tipoVolumen: "KILOS VOLUMETRICOS",
    tipoPeso: "KILOGRAMOS",
  },
  50: {
    volumen: "Kilos volumétricos",
    peso: "Kilos",
    cw: "CW",
    tipoVolumen: "KILOS VOLUMETRICOS",
    tipoPeso: "KILOGRAMOS",
  },
  51: {
    volumen: "Kilos volumétricos",
    peso: "Kilos",
    cw: "CW",
    tipoVolumen: "KILOS VOLUMETRICOS",
    tipoPeso: "KILOGRAMOS",
  },
};

const ETIQUETAS_DEFAULT: EtiquetasCalculadora = {
  volumen: "Kilos volumétricos",
  peso: "Kilos",
  cw: "CW",
  tipoVolumen: "KILOS VOLUMETRICOS",
  tipoPeso: "KILOGRAMOS",
};

export function obtenerEtiquetasCalculadora(
  codTipoTransporte?: string | number | null,
): EtiquetasCalculadora {
  return ETIQUETAS_POR_TRANSPORTE[Number(codTipoTransporte)] ?? ETIQUETAS_DEFAULT;
}

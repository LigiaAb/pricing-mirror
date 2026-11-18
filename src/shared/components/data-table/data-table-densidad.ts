/**
 * Densidad de fila de la data-table.
 *
 * Las tres alturas salen del rediseño (hoja "Anatomía"): 30 / 44 / 56 px reales.
 * Ojo con las utilidades relativas: `html` está a 14px, así que `h-12` son 42px
 * y `text-sm` 12.25px — por eso aquí las medidas van en px explícitos.
 */
export type DensidadTabla = "compacta" | "comoda" | "amplia";

interface EscalaDensidad {
  /** Altura de la celda de cuerpo. */
  readonly fila: string;
  /** Tipografía de la celda de cuerpo. */
  readonly texto: string;
  /** Altura estimada por fila para el virtualizador. */
  readonly alturaEstimada: number;
}

export const DENSIDADES: Readonly<Record<DensidadTabla, EscalaDensidad>> = {
  compacta: {
    fila: "h-[30px]",
    texto: "text-[13px] leading-[18px]",
    alturaEstimada: 30,
  },
  comoda: {
    fila: "h-[44px]",
    texto: "text-[14px] leading-[20px]",
    alturaEstimada: 44,
  },
  amplia: {
    fila: "h-[56px]",
    texto: "text-[14px] leading-[20px]",
    alturaEstimada: 56,
  },
};

export const DENSIDAD_POR_DEFECTO: DensidadTabla = "comoda";

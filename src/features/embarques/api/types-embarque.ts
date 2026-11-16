/**
 * Tipos para el módulo de Embarques
 */

/** Valores para la calculadora de cargas */
export interface CalculadoraCargasValues {
  cantidad: number;
  volumenTotal: number;
  pesoTotal: number;
  largo: string;
  alto: string;
  ancho: string;
}

/** Resultado calculado de la calculadora de cargas */
export interface CalculadoraCargasResult {
  pesoTotal: number;
  volumenTotal: number;
  cantidad: number;
  largo: number | undefined;
  alto: number | undefined;
  ancho: number | undefined;
}

/** Props para la calculadora de cargas */
export interface CalculadoraCargasProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onApply: (values: CalculadoraCargasResult) => void;
  readonly initialValues?: Partial<CalculadoraCargasValues>;
}

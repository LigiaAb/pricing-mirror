import type { TarifaCobertura } from "../../../api/tarifa-cobertura";
import type { MonedaOpcion } from "../../../hooks/use-opciones-tarifa";

export type MonedaCoberturaOption = MonedaOpcion;

export type FilaCobertura = Partial<TarifaCobertura> & {
  moneda_costo?: MonedaCoberturaOption | null;
  moneda_venta?: MonedaCoberturaOption | null;
};

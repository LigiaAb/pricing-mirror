import type { TarifaCostoPorcentajeje } from "../../../api/tarifa-costo-porcentaje";
import type { MonedaOpcion, RubroOpcion } from "../../../hooks/use-opciones-tarifa";

export type MonedaPorcentajeOption = MonedaOpcion;

export type RubroPorcentajeOption = RubroOpcion;

export type FilaPorcentaje = Partial<TarifaCostoPorcentajeje> & {
  moneda_costo?: MonedaPorcentajeOption | null;
  moneda_venta?: MonedaPorcentajeOption | null;
  rubro?: RubroPorcentajeOption | null;
};

import type { TarifaPorcentaje } from "../../../api/tarifa-porcentaje";
import type { MonedaOpcion, RubroOpcion } from "../../../hooks/use-opciones-tarifa";

export type MonedaPorcentajeOption = MonedaOpcion;

export type RubroPorcentajeOption = RubroOpcion;

export type FilaPorcentaje = Partial<TarifaPorcentaje> & {
  moneda_costo?: MonedaPorcentajeOption | null;
  moneda_venta?: MonedaPorcentajeOption | null;
  rubro?: RubroPorcentajeOption | null;
};

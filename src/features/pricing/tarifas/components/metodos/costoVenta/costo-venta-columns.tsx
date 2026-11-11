import type { TarifaCostoVenta } from "../../../api/tarifa-costoventa";
import type { MonedaOpcion } from "../../../hooks/use-opciones-tarifa";

export type MonedaCostoVentaOption = MonedaOpcion;

export type FilaCostoVenta = Partial<TarifaCostoVenta> & {
  moneda_costo?: MonedaCostoVentaOption | null;
  moneda_venta?: MonedaCostoVentaOption | null;
};

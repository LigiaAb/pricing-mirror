import { registro } from "./utils";
import { TIPO_METODO } from "./constantes";
type Registro = Record<string, unknown>;

export function esMetodoCostoPorcentaje(item: Registro): boolean {
  const servicio = registro(item.servicio);
  const metodoServicio = registro(servicio.metodo);
  const codTipo =
    metodoServicio.cod_tipo_metodo ?? servicio.cod_tipo_metodo ?? item.cod_tipo_metodo;
  return Number(codTipo) === TIPO_METODO.COSTO_PORCENTAJE;
}

export function calcularVentaCostoPorcentaje(item: Registro, valorCosto: string | number) {
  const servicio = registro(item.servicio);
  const metodo = registro(servicio.metodo ?? item.metodo);
  const costo = Number(valorCosto);
  const minimo = Number(metodo.minimo_venta ?? 0);
  const tipo = metodo.es_porcentaje;
  const esPorcentaje =
    tipo === true ||
    tipo === 1 ||
    (typeof tipo === "string" && ["1", "true"].includes(tipo.trim().toLowerCase()));
  // Tarifas guarda el porcentaje en enteros (25.26 = 25.26 %) → factor 0.2526.
  // Si es valor fijo se usa tal cual.
  const valorTarifa = Number(metodo.porcentaje_venta ?? 0);
  const factor = esPorcentaje ? valorTarifa / 100 : valorTarifa;

  if (!Number.isFinite(costo) || !Number.isFinite(factor) || !Number.isFinite(minimo)) {
    return { costo: 0, venta: 0 };
  }

  const valorCalculado = esPorcentaje ? costo + costo * factor : costo + factor;
  return { costo, venta: Math.max(valorCalculado, minimo) };
}

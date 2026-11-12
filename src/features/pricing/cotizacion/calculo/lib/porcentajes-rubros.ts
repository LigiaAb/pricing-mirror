/* ==========================================================================
 * MÉTODO PORCENTAJE (rubro cuyo importe es un % de OTRO rubro)
 *
 * La tarifa "Porcentaje" trae `cod_rubro` (rubro base), `porcentaje_costo`,
 * `porcentaje_venta` y mínimos. El backend devuelve el método sin calcular, así
 * que el importe se calcula aquí sobre los rubros aplicados a la cotización
 * (Due Carrier + flete, Due Agent seleccionados, Carrier basado en Agent y
 * Scalling). Se conecta en hooks/use-porcentajes-rubros.ts.
 *
 * No confundir con COSTO_PORCENTAJE (lib/rubros-manuales.ts), donde el usuario
 * escribe el costo y la venta se calcula con un % sobre ese costo.
 * ========================================================================== */

import { TIPO_CALCULO } from "./constantes";
import { esMetodoCostoPorcentaje } from "./rubros-manuales";
import type { Registro } from "./tipos";
import { numero, registro } from "./utils";

function obtenerMetodo(item: Registro): Registro {
  const servicio = registro(item.servicio);
  return registro(servicio.metodo ?? item.metodo ?? servicio.porcentaje ?? item.porcentaje);
}

/**
 * Rubro con método Porcentaje: tiene rubro base y algún porcentaje.
 * Cobertura de mercadería y Costo por porcentaje también traen
 * `porcentaje_venta` (y cobertura puede traer `cod_rubro`), por eso se excluyen.
 */
export function esMetodoPorcentajeRubro(item: Registro): boolean {
  const servicio = registro(item.servicio);
  const metodo = obtenerMetodo(item);

  if (metodo.cod_rubro == null || String(metodo.cod_rubro).trim() === "") return false;
  if (metodo.porcentaje_costo == null && metodo.porcentaje_venta == null) return false;
  if (esMetodoCostoPorcentaje(item) || metodo.es_porcentaje != null) return false;
  if (servicio.cobertura != null || item.cobertura != null) return false;

  const codTipoCalculo =
    metodo.cod_tipo_calculo ?? servicio.cod_tipo_calculo ?? item.cod_tipo_calculo;
  return Number(codTipoCalculo) !== TIPO_CALCULO.COBERTURA_MERCADERIA;
}

/**
 * Calcula costo/venta de los rubros con método Porcentaje.
 *
 * - Tarifas guarda el porcentaje en enteros (15 = 15 %) → factor 0.15.
 * - `metodo.cod_rubro` identifica el rubro base, no el rubro de esta fila. Si hay
 *   varios rubros base con ese código, se suman.
 * - Costo y venta respetan su mínimo (`minimo_costo` / `minimo_venta`).
 * - `bases`: rubros aplicados a la cotización que pueden servir de base
 *   (pueden ser de otra sección; si una base también es Porcentaje, se resuelve
 *   primero).
 * - Los rubros que no son Porcentaje se devuelven sin cambios (misma referencia).
 */
export function calcularPorcentajesRubros<T extends Registro>(
  rubros: T[],
  bases: Registro[] = rubros,
): T[] {
  const calculados = new Map<Registro, Registro>();
  const pendientes = new Set<Registro>();

  function resolver(item: Registro): Registro {
    const previo = calculados.get(item);
    if (previo) return previo;

    if (!esMetodoPorcentajeRubro(item)) return item;

    // Una referencia circular no aporta importes como base de cálculo.
    if (pendientes.has(item)) return {};
    pendientes.add(item);

    const metodo = obtenerMetodo(item);
    const referencia = String(metodo.cod_rubro);
    const rubrosBase = bases.filter(
      (base) => base !== item && String(base.cod_rubro) === referencia,
    );
    let costoBase = 0;
    let ventaBase = 0;
    for (const base of rubrosBase) {
      const resultado = resolver(base);
      const metodoBase = obtenerMetodo(resultado);
      costoBase += numero(metodoBase.costo ?? resultado.costo);
      ventaBase += numero(metodoBase.venta ?? resultado.venta);
    }

    const costoCalculado = (costoBase * numero(metodo.porcentaje_costo)) / 100;
    const ventaCalculada = (ventaBase * numero(metodo.porcentaje_venta)) / 100;
    const costo = Math.max(costoCalculado, numero(metodo.minimo_costo));
    const venta = Math.max(ventaCalculada, numero(metodo.minimo_venta));
    const metodoCalculado = { ...metodo, costo, venta };
    const resultado = {
      ...item,
      costo,
      venta,
      metodo: metodoCalculado,
      servicio: { ...registro(item.servicio), metodo: metodoCalculado },
    };
    pendientes.delete(item);
    calculados.set(item, resultado);
    return resultado;
  }

  return rubros.map((item) => resolver(item) as T);
}

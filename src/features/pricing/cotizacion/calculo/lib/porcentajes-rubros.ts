/*
 * ⚠️ PENDIENTE DE CONECTAR (revisado 2026-11-11)
 *
 * `calcularPorcentajesRubros` no se usa en ningún archivo. Su lógica (rubro cuyo
 * costo/venta es un % de OTRO rubro de la cotización, `metodo.cod_rubro`, con
 * mínimos) no está implementada en otro lugar del frontend: hoy
 * `procesar-rubros-calculados.ts` solo copia `servicio.porcentaje` a `metodo` y
 * se usa el costo/venta tal como llega del backend.
 *
 * Si el backend ya devuelve el importe calculado, este archivo se puede borrar.
 * Si no, debe aplicarse sobre los rubros seleccionados (Due Agent + Due Carrier
 * + flete) antes de calcular totales (hooks/use-totales-rubros.ts).
 */
import { numero, registro } from "./utils";

type Registro = Record<string, unknown>;

function obtenerMetodo(item: Registro): Registro {
  const servicio = registro(item.servicio);
  return registro(servicio.metodo ?? item.metodo ?? servicio.porcentaje ?? item.porcentaje);
}

/**
 * Los factores porcentaje_costo/porcentaje_venta ya vienen en 0.xx.
 * metodo.cod_rubro identifica el rubro base, no el rubro de esta fila.
 * Las bases son únicamente los rubros aplicados a la cotización.
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

    const metodo = obtenerMetodo(item);
    const esPorcentaje =
      metodo.cod_rubro != null &&
      (metodo.porcentaje_costo != null || metodo.porcentaje_venta != null);
    if (!esPorcentaje) return item;

    // Una referencia circular no aporta importes como base de cálculo.
    if (pendientes.has(item)) return {};
    pendientes.add(item);

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

    const costoCalculado = costoBase * numero(metodo.porcentaje_costo);
    const ventaCalculada = ventaBase * numero(metodo.porcentaje_venta);
    // El mínimo aplica únicamente a venta; costo conserva su cálculo.
    const costo = Math.max(costoCalculado, numero(metodo.minimo_costo ?? 0));
    const venta = Math.max(ventaCalculada, numero(metodo.minimo_venta ?? 0));
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

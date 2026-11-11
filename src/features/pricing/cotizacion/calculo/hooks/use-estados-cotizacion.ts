import { useMemo } from "react";
import { estados as catalogoEstados } from "@/features/catalogos";
import { estadosCalculoFaltantes, resolverEstadosCalculo } from "../lib/versiones";

/**
 * Estados del catálogo que usa el cálculo de cotizaciones.
 *
 * `estados` es `null` mientras el catálogo carga o si le falta alguno de los
 * estados requeridos (ver `faltantes`). Por eso CalculoCotizacionContainer
 * valida esto ANTES de montar el cálculo.
 */
export function useEstadosCotizacion() {
  // Usa la consulta de catálogos existente. La tabla toma los nombres del catálogo y Cálculo toma los códigos requeridos.
  const { data: catalogo, isLoading } = catalogoEstados.useLista();
  const estados = useMemo(() => resolverEstadosCalculo(catalogo), [catalogo]);
  const faltantes = useMemo(() => estadosCalculoFaltantes(catalogo), [catalogo]);

  return { estados, catalogo, isLoading, faltantes };
}

/**
 * Igual que `useEstadosCotizacion`, pero con `estados` garantizado (nunca `null`).
 *
 * Usar SOLO en componentes que se montan dentro de CalculoCotizacionContainer,
 * que no renderiza el cálculo hasta que todos los estados existen.
 */
export function useEstadosCalculo() {
  const { estados, catalogo } = useEstadosCotizacion();

  if (!estados) {
    throw new Error(
      "useEstadosCalculo: faltan estados del catálogo. Este componente debe montarse dentro de CalculoCotizacionContainer.",
    );
  }

  return { estados, catalogo };
}

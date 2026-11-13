import {
  convertirPesoAKg,
  convertirVolumetrico,
  type DimensionCalculo,
  UNIDAD_DEFAULT,
  type Unidad,
} from "@/features/pricing/shared";

import type { Id } from "./tipos";
import { numero } from "./utils";

/* ==========================================================================
 * DIMENSIONES DE COTIZACIÓN (adaptador BD <-> calculadora)
 *
 * Lo único de la calculadora que es propio de cotizaciones: leer las filas
 * guardadas (columnas cotdetdim_*) y convertirlas a `DimensionCalculo`.
 * Los cálculos viven en pricing/shared/calculadora-embarque/lib/calculos.ts.
 * ========================================================================== */

/**
 * Migra mapDimensionesApiToCalcItems del componente legado.
 *
 * IMPORTANTE:
 * No recalculamos aquí pesoTotalKg ni volumenTotalKg.
 *
 * La calculadora los vuelve a obtener usando las unidades
 * cuando procesa las filas.
 */
export function reconstruirDimensiones({
  dimensiones,
  unidadesMedida,
  unidadesPeso,
  codTipoTransporte,
}: {
  dimensiones: Array<Record<string, unknown>>;

  unidadesMedida: Unidad[];

  unidadesPeso: Unidad[];

  codTipoTransporte?: Id | null;
}): DimensionCalculo[] {
  /*
   * El guardado sin medidas representa los totales directos con una fila:
   * cantidad 1, largo = volumétrico, ancho/alto 1, unidades 165/162.
   * No es una medida física. Los totales globales se recuperan desde
   * dimensionesIniciales en useCriteriosCotizacion para las entradas directas.
   */
  const primera = dimensiones[0];
  if (
    dimensiones.length === 1 &&
    primera != null &&
    numero(primera.cotdetdim_cantidad) === 1 &&
    numero(primera.cotdetdim_ancho) === 1 &&
    numero(primera.cotdetdim_alto) === 1 &&
    Number(primera.cotdetdim_unidad_medida) === UNIDAD_DEFAULT.MEDIDA &&
    Number(primera.cotdetdim_unidad_peso) === UNIDAD_DEFAULT.PESO &&
    primera.total_volumen != null &&
    Math.ceil(numero(primera.cotdetdim_largo)) === numero(primera.total_volumen) &&
    (numero(primera.total_volumen) > 0 || numero(primera.total_peso) > 0)
  ) {
    return [];
  }

  return dimensiones.map((dimension, index) => {
    const codMedida =
      dimension.cotdetdim_unidad_medida != null ? String(dimension.cotdetdim_unidad_medida) : null;

    const codPeso =
      dimension.cotdetdim_unidad_peso != null ? String(dimension.cotdetdim_unidad_peso) : null;

    const cantidad = numero(dimension.cotdetdim_cantidad);

    const largo = numero(dimension.cotdetdim_largo);

    const ancho = numero(dimension.cotdetdim_ancho);

    const alto = numero(dimension.cotdetdim_alto);

    /*
     * Se conserva tal cual el comportamiento actual.
     */
    // Sin unidad de peso, este campo contiene volumétrico, no peso real.
    const pesoUnitario = codPeso ? numero(dimension.cotdetdim_peso_unitario) : 0;

    const volumenUnitario = largo * ancho * alto;

    const volumenTotal = volumenUnitario * cantidad;

    const pesoTotal = pesoUnitario * cantidad;

    const unidadMedida = codMedida
      ? (unidadesMedida.find((unidad) => String(unidad.value) === codMedida) ?? null)
      : null;

    const unidadPeso = codPeso
      ? (unidadesPeso.find((unidad) => String(unidad.value) === codPeso) ?? null)
      : null;

    return {
      ...dimension,

      id: (dimension.cod_cotdetdim as Id | undefined) ?? index + 1,

      cantidad,

      largo,

      ancho,

      alto,

      pesoUnitario,

      formulaVolumen: `${largo || 0}x${ancho || 0}x${alto || 0}`,

      volumenUnitario,

      volumenTotal,

      /*
       * Estos dos se recalculan usando
       * unidades reales para mantener
       * el comportamiento de la calculadora.
       */
      volumenTotalKg:
        convertirVolumetrico(volumenUnitario, unidadMedida?.tipo_desc, codTipoTransporte) *
        cantidad,

      pesoTotal,

      pesoTotalKg:
        convertirPesoAKg(
          pesoUnitario,

          unidadPeso?.tipo_desc,
        ) * cantidad,

      unidadMedida,

      unidadPeso,
    };
  });
}

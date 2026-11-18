import type { Id, RubroTotal } from "./tipos";

/* ==========================================================================
 * IVA / FLETE SPOT
 * ========================================================================== */

function esRubroIva(item: RubroTotal, codRubroIVA?: Id | null) {
  const nombre = String(item.nombre ?? item.gruporubro_nombre ?? "")
    .trim()
    .toUpperCase();

  return (
    (codRubroIVA != null && String(item.cod_rubro) === String(codRubroIVA)) || nombre === "IVA"
  );
}

export function separarRubrosParaTotales({
  rubros,
  codRubroIVA,
}: {
  rubros: RubroTotal[];
  codRubroIVA?: Id | null;
}) {
  const tieneTarifaSpot = rubros.some((item) => item.es_tarifa_spot === true);

  /*
   * Comportamiento actual:
   *
   * - los no-flete siempre permanecen.
   * - si existe SPOT:
   *      de los fletes únicamente queda el SPOT.
   * - si no existe SPOT:
   *      permanecen los fletes normales.
   */
  const rubrosAplicables = rubros.filter(
    (item) => !item.es_flete || (tieneTarifaSpot ? item.es_tarifa_spot : item.es_flete),
  );

  return {
    tieneTarifaSpot,

    rubrosIvaEnCalculo: rubrosAplicables.filter((item) => esRubroIva(item, codRubroIVA)),

    rubrosSinIva: rubrosAplicables.filter((item) => !esRubroIva(item, codRubroIVA)),
  };
}

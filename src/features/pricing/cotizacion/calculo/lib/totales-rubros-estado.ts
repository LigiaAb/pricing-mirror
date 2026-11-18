import { esNombre } from "@/features/pricing/shared";
import { construirAgrupacionAutomatica } from "./agrupacion-rubros";
import { NOMBRE_RUBRO, TIPO_PAGO } from "./constantes";
import type { Id } from "./tipos";
import { getLetraTipoPago, getMetodo } from "./totales-rubros-helpers";
import type {
  GruposPorRubro,
  NombresGrupo,
  RubroTotal,
  TipoPagoPorRubro,
} from "./totales-rubros-tipos";

/* ==========================================================================
 * IVA / FLETE SPOT
 * ========================================================================== */

function esRubroIva(item: RubroTotal, codRubroIVA?: Id | null) {
  return (
    (codRubroIVA != null && String(item.cod_rubro) === String(codRubroIVA)) ||
    esNombre(item.nombre ?? item.gruporubro_nombre, NOMBRE_RUBRO.IVA)
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
/* ==========================================================================
 * AGRUPACIÓN GUARDADA
 * ========================================================================== */

export function construirAgrupacionDesdeDetalle(rubros: RubroTotal[]) {
  const gruposIngresados: GruposPorRubro = {};

  const nombres: NombresGrupo = {};

  const idPorNombre = new Map<string, number>();

  let siguienteId = 1;

  for (const item of rubros) {
    const nombre = String(item.gruporubro_nombre ?? "").trim();

    if (!nombre) {
      continue;
    }

    if (item.value == null || item.value === "") {
      continue;
    }

    if (!idPorNombre.has(nombre)) {
      idPorNombre.set(nombre, siguienteId);

      nombres[String(siguienteId)] = nombre;

      siguienteId += 1;
    }

    const idDeGrupo = idPorNombre.get(nombre);

    if (idDeGrupo == null) {
      continue;
    }

    gruposIngresados[String(item.value)] = {
      idDeGrupo,
      nombre,
    };
  }

  return {
    gruposIngresados,
    nombres,
  };
}

/* ==========================================================================
 * LISTA NORMALIZADA
 * ========================================================================== */

export function construirListaElementos({
  rubros,
  codTipoPago,
}: {
  rubros: RubroTotal[];
  codTipoPago?: Id | null;
}) {
  const letraTipoPagoDefault = getLetraTipoPago(codTipoPago);

  return (
    rubros
      .map((item) => ({
        ...item,

        cod_tipo_pago: codTipoPago ?? null,

        letra_tipo_pago: letraTipoPagoDefault,

        idDeGrupo: 0,
      }))

      /*
       * Los rubros pueden traer el método en dos formas válidas:
       *
       * - item.metodo
       * - item.servicio.metodo
       *
       * Due Agent (incluyendo ABIERTOS y COBERTURA) actualiza la segunda.
       * Usar únicamente item.metodo hacía que esos rubros desaparecieran
       * de la lista de Totales aunque tuvieran venta calculada.
       */
      .filter((item) => {
        const venta = getMetodo(item)?.venta;

        return venta != null && Number(venta) !== 0;
      })
  );
}
/* ==========================================================================
 * ESTADO INICIAL DE AGRUPACIÓN
 * ========================================================================== */

export function construirEstadoInicialTotales({
  rubrosSinIva,
  codTipoPago,
  codCc,
  codTipoTransporte,
}: {
  rubrosSinIva: RubroTotal[];

  codTipoPago?: Id | null;

  codCc?: Id | null;

  codTipoTransporte?: Id | null;
}) {
  const letraTipoPagoDefault = getLetraTipoPago(codTipoPago);

  const agrupacionAutomatica = construirAgrupacionAutomatica(rubrosSinIva, {
    codCc: codCc ?? null,
    codTipoTransporte: codTipoTransporte ?? null,
  });

  const agrupacionGuardada = construirAgrupacionDesdeDetalle(rubrosSinIva);

  /*
   * Igual al legado:
   *
   * lo guardado en detalle gana
   * sobre la agrupación automática.
   */
  const gruposIngresadosSegunRubro: GruposPorRubro = {
    ...agrupacionAutomatica.gruposIngresados,
    ...agrupacionGuardada.gruposIngresados,
  };

  const nombresGrupo: NombresGrupo = {
    ...agrupacionAutomatica.nombres,
    ...agrupacionGuardada.nombres,
  };

  const tipoPagoSeleccionado: TipoPagoPorRubro = {};

  for (const item of rubrosSinIva) {
    if (item?.value == null || item.value === "") {
      continue;
    }

    const key = String(item.value);

    if (Number(codTipoPago) === TIPO_PAGO.TODOS) {
      tipoPagoSeleccionado[key] = item.cod_tipo_pago
        ? getLetraTipoPago(item.cod_tipo_pago)
        : letraTipoPagoDefault;
    } else {
      tipoPagoSeleccionado[key] = letraTipoPagoDefault;
    }
  }

  return {
    letraTipoPagoDefault,

    gruposIngresadosSegunRubro,

    nombresGrupo,

    tipoPagoSeleccionado,
  };
}
/* ==========================================================================
 * SUGERENCIA DE NOMBRE DE GRUPO
 * ========================================================================== */

export function construirSugerenciasNombreGrupo({
  listaElementos,
  gruposIngresadosSegunRubro,
}: {
  listaElementos: RubroTotal[];

  gruposIngresadosSegunRubro: GruposPorRubro;
}) {
  const resultado: Record<
    string,
    {
      count: number;
      sugerido: string;
    }
  > = {};

  for (const item of listaElementos) {
    const rubroId = String(item.value ?? "");

    const idDeGrupo = gruposIngresadosSegunRubro[rubroId]?.idDeGrupo;

    if (!idDeGrupo) {
      continue;
    }

    const key = String(idDeGrupo);

    const nombreServicio = item.servicio?.nombre ?? "";

    if (!resultado[key]) {
      resultado[key] = {
        count: 1,

        sugerido: nombreServicio,
      };

      continue;
    }

    resultado[key].count += 1;

    /*
     * Si hay más de un servicio,
     * deja de sugerir nombre.
     */
    resultado[key].sugerido = "";
  }

  return resultado;
}

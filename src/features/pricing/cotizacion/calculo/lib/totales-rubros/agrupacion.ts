import { construirAgrupacionAutomatica } from "../agrupacion-rubros";
import { TIPO_PAGO } from "../constantes";
import { getLetraTipoPago, getMetodo } from "./metodo-tipo-pago";
import type {
  ElementoAgrupado,
  GruposPorRubro,
  Id,
  NombresGrupo,
  RubroTotal,
  TipoPagoPorRubro,
} from "./tipos";

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
/* ==========================================================================
 * ELEMENTOS AGRUPADOS PARA MOSTRAR
 * ========================================================================== */

export function construirElementosAgrupados({
  listaElementos,
  gruposIngresadosSegunRubro,
  tipoPagoSeleccionado,
  letraTipoPagoDefault,
}: {
  listaElementos: RubroTotal[];

  gruposIngresadosSegunRubro: GruposPorRubro;

  tipoPagoSeleccionado: TipoPagoPorRubro;

  letraTipoPagoDefault: "P" | "C";
}): ElementoAgrupado[] {
  const salida: ElementoAgrupado[] = [];

  const gruposMap = new Map<string, ElementoAgrupado>();

  for (const item of listaElementos) {
    const rubroId = String(item.value ?? "");

    const metodo = getMetodo(item);

    const codMoneda = metodo?.cod_moneda_venta ?? "SIN_MONEDA";

    const venta = Number(metodo?.venta ?? 0);

    const idDeGrupo = gruposIngresadosSegunRubro[rubroId]?.idDeGrupo;

    /*
     * Sin grupo:
     * permanece como rubro normal.
     */
    if (!idDeGrupo) {
      salida.push({
        ...item,
        __tipo: "ITEM",
      });

      continue;
    }

    const tipoPago = tipoPagoSeleccionado[rubroId] ?? item.letra_tipo_pago ?? letraTipoPagoDefault;

    /*
     * No mezclar:
     *
     * grupo + moneda + P/C
     */
    const key = `${idDeGrupo}__${codMoneda}__${tipoPago}`;

    const existente = gruposMap.get(key);

    if (!existente) {
      gruposMap.set(key, {
        value: `GRUPO_${key}`,

        __tipo: "GRUPO",

        __idDeGrupo: idDeGrupo,

        __codMoneda: codMoneda,

        letra_tipo_pago: tipoPago,

        metodo: {
          ...(metodo ?? {}),

          cod_moneda_venta: codMoneda,

          venta,

          detalles: [...(metodo?.detalles ?? [])],
        },
      });

      continue;
    }

    const metodoGrupo = getMetodo(existente);

    if (!metodoGrupo) {
      continue;
    }

    metodoGrupo.venta = Number(metodoGrupo.venta ?? 0) + venta;

    metodoGrupo.detalles = [...(metodoGrupo.detalles ?? []), ...(metodo?.detalles ?? [])];
  }

  /*
   * Igual al legado:
   * grupos primero,
   * rubros sueltos después.
   */
  return [...Array.from(gruposMap.values()), ...salida];
}

import type { MetodoCalculo, RubroCalculo, ServicioCalculo } from "../api/calculo-cotizacion";
import type { CatalogoTipo, MonedaFlete } from "./carrier-flete";
import { esClasificacionDueAgent, esClasificacionDueCarrier } from "./clasificacion-rubros";
import { RUBRO } from "./constantes";
import { construirDetalleFlete, esDetalleFlete, puedeConstruirDetalleFlete } from "./detalle-flete";
import type { Id, ServicioCatalogo } from "./tipos";
import { getSimboloMoneda } from "./utils";

function esNoNulo<T>(value: T | null): value is T {
  return value != null;
}

type ServicioProcesable = ServicioCalculo & {
  cobertura?: MetodoCalculo | null;

  porcentaje?: MetodoCalculo | null;

  porcentaje_cotizacion?: MetodoCalculo | null;

  categoria_transporte?: Id | null;

  cod_categoria_transporte?: Id | null;
};

export type RubroProcesado = Omit<RubroCalculo, "servicios"> & {
  value: string;

  cod_servicio?: Id | null | undefined;

  servicio: ServicioProcesable;

  servicios?: undefined;
};

/* ==========================================================================
 * NORMALIZACIÓN
 * ========================================================================== */

function normalizarServicio(servicio: ServicioProcesable): ServicioProcesable {
  return {
    ...servicio,

    /*
     * Es exactamente la normalización
     * que hacía filtrarServicios:
     *
     * metodo
     * cobertura
     * porcentaje
     */
    metodo:
      servicio.metodo ??
      servicio.cobertura ??
      servicio.porcentaje ??
      servicio.porcentaje_cotizacion ??
      {},
  };
}

function crearIndiceServicios(servicios: ServicioCatalogo[]) {
  return new Map(servicios.map((servicio) => [String(servicio.cod_servicio), servicio]));
}

function aplanarRubros(rubros: RubroCalculo[]): RubroProcesado[] {
  return rubros.flatMap((rubro) =>
    (rubro.servicios ?? []).map((servicioBase) => {
      const servicio = normalizarServicio(servicioBase as ServicioProcesable);

      return {
        value: `${rubro.cod_rubro}-${servicio.cod_servicio}`,

        ...rubro,
        ...servicio,

        servicios: undefined,
        servicio,
      };
    }),
  );
}

/* ==========================================================================
 * CLASIFICACIÓN
 * ========================================================================== */

function obtenerClasificacionServicio({
  servicio,
  serviciosCatalogo,
}: {
  servicio: ServicioProcesable;

  serviciosCatalogo: Map<string, ServicioCatalogo>;
}) {
  const servicioCatalogo = serviciosCatalogo.get(String(servicio.cod_servicio));

  /*
   * Regla EXACTA del Grid actual:
   *
   * servicio.clasificacion
   * ??
   * servicioCatalogo.clasificacion
   * ??
   * null
   */
  return servicio.clasificacion ?? servicioCatalogo?.clasificacion ?? null;
}

function filtrarPorClasificacion({
  rubros,
  serviciosCatalogo,
  tipo,
}: {
  rubros: RubroCalculo[];

  serviciosCatalogo: Map<string, ServicioCatalogo>;

  tipo: "DUE_AGENT" | "DUE_CARRIER";
}): RubroCalculo[] {
  return rubros
    .map((rubro) => {
      const servicios = (rubro.servicios ?? [])
        .map((servicio) => normalizarServicio(servicio as ServicioProcesable))
        .filter((servicio) => {
          const clasificacion = obtenerClasificacionServicio({
            servicio,
            serviciosCatalogo,
          });

          return tipo === "DUE_AGENT"
            ? esClasificacionDueAgent(clasificacion)
            : esClasificacionDueCarrier(clasificacion);
        });

      if (!servicios.length) {
        return null;
      }

      return {
        ...rubro,
        servicios,
      };
    })
    .filter(esNoNulo);
}
/* ==========================================================================
 * FILTRAR POR ENTIDAD
 * ========================================================================== */

function filtrarPorEntidad({
  rubros,
  entidadId,
}: {
  rubros: RubroCalculo[];
  entidadId: Id;
}): RubroCalculo[] {
  return rubros
    .map((rubro) => {
      const servicios = (rubro.servicios ?? [])
        .map((servicio) => normalizarServicio(servicio as ServicioProcesable))
        .filter((servicio) => String(servicio.entidad_id) === String(entidadId));

      if (!servicios.length) {
        return null;
      }

      return {
        ...rubro,
        servicios,
      };
    })
    .filter(esNoNulo);
}

/* ==========================================================================
 * CATEGORÍA DE TRANSPORTE
 * ========================================================================== */

function filtrarPorCategoria({
  rubros,
  categoriaSeleccionada,
  categorias,
}: {
  rubros: RubroCalculo[];

  categoriaSeleccionada?: string | null;

  categorias: CatalogoTipo[];
}): RubroCalculo[] {
  if (!categoriaSeleccionada) {
    return rubros;
  }

  return rubros
    .map((rubro) => {
      /*
       * El flete NO se filtra
       * aquí por categoría.
       */
      if (rubro.es_flete) {
        return rubro;
      }

      const servicios = (rubro.servicios ?? []).filter((servicioBase) => {
        const servicio = servicioBase as ServicioProcesable;

        /*
         * Se conserva el comportamiento
         * literal del efecto D.
         */
        const codCategoria = Number(
          servicio.categoria_transporte ?? servicio.metodo?.categoria_transporte ?? "",
        );

        const categoria = categorias.find(
          (item) => Number(item.value ?? item.cod_tipo) === codCategoria,
        );

        const label = categoria?.label;

        /*
         * Regla actual:
         *
         * si el servicio no tiene
         * categoría reconocible,
         * se deja pasar.
         */
        if (!label) {
          return true;
        }

        return label === categoriaSeleccionada;
      });

      if (!servicios.length) {
        return null;
      }

      return {
        ...rubro,
        servicios,
      };
    })
    .filter(esNoNulo);
}
function agregarDetalleFlete({
  servicio,
  esFlete,
  valorCw,
  monedas,
  codTipoTransporte,
}: {
  servicio: ServicioProcesable;

  esFlete: boolean;

  valorCw?: unknown;

  monedas: MonedaFlete[];

  codTipoTransporte?: Id | null | undefined;
}) {
  if (!esFlete) {
    return servicio;
  }

  const metodo = servicio.metodo ?? {};

  const detalles = Array.isArray(metodo.detalles) ? metodo.detalles : [];

  // Si la tarifa ya trae el detalle de flete, no se duplica.
  if (detalles.some((detalle) => esDetalleFlete(detalle, codTipoTransporte))) {
    return servicio;
  }

  const rate = metodo.rate_venta ?? null;

  // rate = 0 → la tarifa es un monto fijo: se muestra la venta del método.
  const minimo = Number(rate) === 0 ? metodo.venta : undefined;

  if (!puedeConstruirDetalleFlete({ rate, minimo })) {
    return servicio;
  }

  const detalleFlete = construirDetalleFlete(codTipoTransporte, {
    tipo: "normal",
    valorCw,
    simbolo: getSimboloMoneda(monedas, metodo.cod_moneda_venta),
    rate,
    minimo,
  });

  // Este tipo de transporte no lleva detalle de flete.
  if (!detalleFlete) {
    return servicio;
  }

  return {
    ...servicio,

    metodo: {
      ...metodo,

      detalles: [...detalles, detalleFlete],
    },
  };
}
function procesarDueCarrier({
  rubros,
  codRubroFleteSeleccionado,
  codServicioFleteSeleccionado,
  valorCw,
  monedas,
  codTipoTransporte,
}: {
  rubros: RubroCalculo[];

  codRubroFleteSeleccionado?: Id | null;

  codServicioFleteSeleccionado?: Id | null;

  valorCw?: unknown;

  monedas: MonedaFlete[];

  codTipoTransporte?: Id | null | undefined;
}): RubroProcesado[] {
  return rubros.flatMap((rubro) => {
    const esFlete = rubro.es_flete === true;

    /*
     * De todos los rubros de flete
     * queda únicamente el rubro
     * seleccionado.
     */
    if (esFlete && String(rubro.cod_rubro) !== String(codRubroFleteSeleccionado)) {
      return [];
    }

    const servicios = (rubro.servicios ?? []).filter((servicio) => {
      if (!esFlete) {
        return true;
      }

      /*
       * Y dentro de ese rubro
       * solo queda el servicio
       * de flete seleccionado.
       */
      return String(servicio.cod_servicio) === String(codServicioFleteSeleccionado);
    });

    return servicios.map((servicioBase) => {
      const servicio = agregarDetalleFlete({
        servicio: normalizarServicio(servicioBase as ServicioProcesable),

        esFlete,

        valorCw,

        monedas,

        codTipoTransporte,
      });

      return {
        value: `${rubro.cod_rubro}-${servicio.cod_servicio}`,

        ...rubro,

        ...servicio,

        servicios: undefined,

        servicio,
      };
    });
  });
}
export function procesarRubrosCalculados({
  rubros,
  entidadSeleccionadaId,
  categoriaSeleccionada,
  codRubroFleteSeleccionado,
  codServicioFleteSeleccionado,
  valorCw,
  categorias,
  monedas,
  serviciosCatalogo,
  codTipoTransporte,
}: {
  rubros: RubroCalculo[];

  entidadSeleccionadaId?: Id | null;

  categoriaSeleccionada?: string | null;

  codRubroFleteSeleccionado?: Id | null;

  codServicioFleteSeleccionado?: Id | null;

  valorCw?: unknown;

  categorias: CatalogoTipo[];

  monedas: MonedaFlete[];

  serviciosCatalogo: ServicioCatalogo[];

  /** Define el texto del detalle de flete (ver lib/detalle-flete.ts). */
  codTipoTransporte?: Id | null | undefined;
}) {
  if (entidadSeleccionadaId == null || !rubros.length) {
    return {
      rubrosDueCarrier: [] as RubroProcesado[],

      rubrosDueAgent: [] as RubroProcesado[],

      rubrosScalling: [] as RubroProcesado[],
    };
  }

  const idxServicios = crearIndiceServicios(serviciosCatalogo);

  /*
   * ==========================================
   * DUE CARRIER
   * ==========================================
   */

  let carrier = filtrarPorEntidad({
    rubros,
    entidadId: entidadSeleccionadaId,
  });

  carrier = filtrarPorCategoria({
    rubros: carrier,

    categoriaSeleccionada: categoriaSeleccionada ?? null,

    categorias,
  });

  carrier = filtrarPorClasificacion({
    rubros: carrier,

    serviciosCatalogo: idxServicios,

    tipo: "DUE_CARRIER",
  });

  const carrierProcesado = procesarDueCarrier({
    rubros: carrier,

    codRubroFleteSeleccionado: codRubroFleteSeleccionado ?? null,

    codServicioFleteSeleccionado: codServicioFleteSeleccionado ?? null,

    valorCw,

    monedas,

    codTipoTransporte,
  });

  /*
   * ==========================================
   * DUE AGENT
   * ==========================================
   *
   * IMPORTANTE:
   *
   * Due Agent NO se filtra por Carrier.
   *
   * El Grid actual lo toma directamente
   * de valoresCalculados.data.
   */
  const rubrosDueAgent = aplanarRubros(
    filtrarPorClasificacion({
      rubros,
      serviciosCatalogo: idxServicios,
      tipo: "DUE_AGENT",
    }),
  );

  /*
   * ==========================================
   * SCALLING
   * ==========================================
   *
   * El Grid considera Scalling como parte
   * de Due Carrier y lo separa por rubro 134.
   */
  const rubrosScalling = carrierProcesado.filter(
    (item) => Number(item.cod_rubro) === RUBRO.SCALLING,
  );

  const rubrosDueCarrier = carrierProcesado.filter(
    (item) => Number(item.cod_rubro) !== RUBRO.SCALLING,
  );

  return {
    rubrosDueCarrier,
    rubrosDueAgent,
    rubrosScalling,
  };
}

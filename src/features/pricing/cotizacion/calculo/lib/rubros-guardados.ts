import { esRubroDueAgent, esRubroDueCarrier } from "./clasificacion-rubros";
import { RUBRO } from "./constantes";
import type { EntidadCatalogo, Id, MonedaCatalogo, RubroCatalogo, ServicioCatalogo } from "./tipos";

export type RubroGuardado = {
  cod_detallerubro?: Id | null;

  cod_rubro?: Id | null;
  cod_servicio?: Id | null;

  entidad_id?: Id | null;
  cod_entidad?: Id | null;

  nombre_rubro?: string | null;
  nombre_servicio?: string | null;

  siglas_servicio?: string | null;

  clasificacion?: Id | null;
  servicio_clasificacion?: Id | null;

  cod_tipo_pago?: Id | null;

  gruporubro_nombre?: string | null;

  venta?: string | number | null;
  venta_rubro?: string | number | null;
  precio_venta?: string | number | null;

  costo?: string | number | null;
  costo_rubro?: string | number | null;
  precio_costo?: string | number | null;

  porcentaje?: string | number | null;
  metodo_porcentaje?: string | number | null;

  cod_moneda_venta?: Id | null;
  metodo_cod_moneda_venta?: Id | null;

  cod_moneda_costo?: Id | null;
  metodo_cod_moneda_costo?: Id | null;

  detalle?: unknown;
  detalles?: unknown;

  metodo_detalle?: unknown;
  metodo_detalles?: unknown;

  [key: string]: unknown;
};

export type RubroGuardadoProcesado = {
  value: string;

  cod_detallerubro?: Id | null;

  cod_rubro?: Id | null;

  nombre_rubro: string;

  cod_tipo_pago?: Id | null;

  gruporubro_nombre: string;

  clasificacion?: Id | null;
  servicio_clasificacion?: Id | null;

  cod_servicio?: Id | null;

  /*
   * El adaptador legado hacía `...servicio` en la raíz.
   * Estos campos se conservan porque varios consumidores
   * todavía leen la forma aplanada.
   */
  nombre: string;
  siglas: string;

  entidad_id?: Id | null;
  entidad_nombre?: string | null;

  metodo: {
    venta: string | number;

    costo: string | number;

    porcentaje?: string | number | null;

    cod_moneda_venta?: Id | null;

    cod_moneda_costo?: Id | null;

    moneda_venta?: string | null;

    moneda_costo?: string | null;

    detalles: Array<Record<string, unknown>>;
  };

  servicio: {
    cod_servicio?: Id | null;

    nombre: string;

    siglas: string;

    /*
     * En lectura dejamos ya resuelta
     * la misma clasificación que usa
     * el cálculo vivo.
     */
    clasificacion?: Id | null;

    servicio_clasificacion?: Id | null;

    entidad_id?: Id | null;

    entidad_nombre?: string | null;

    metodo: {
      venta: string | number;

      costo: string | number;

      porcentaje?: string | number | null;

      cod_moneda_venta?: Id | null;

      cod_moneda_costo?: Id | null;

      moneda_venta?: string | null;

      moneda_costo?: string | null;

      detalles: Array<Record<string, unknown>>;
    };
  };
};

/* ============================================================
 * DETALLES
 * ============================================================ */

function parseTextoDetalle(texto: unknown) {
  return String(texto ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const index = part.indexOf(":");

      if (index === -1) {
        return {
          tarifadetalle_descripcion: part,
        };
      }

      const tipo = part.slice(0, index).trim();

      const descripcion = part.slice(index + 1).trim();

      return {
        ...(tipo
          ? {
              tipo_desc: tipo,
            }
          : {}),

        ...(descripcion
          ? {
              tarifadetalle_descripcion: descripcion,
            }
          : {}),

        custom: true,
      };
    });
}

function normalizarDetalle(item: unknown): Array<Record<string, unknown>> {
  if (item == null) {
    return [];
  }

  if (typeof item === "string" || typeof item === "number") {
    return parseTextoDetalle(item);
  }

  if (typeof item !== "object") {
    return [];
  }

  const detalle = item as Record<string, unknown>;

  if (detalle.tipo_desc || detalle.tarifadetalle_descripcion || detalle.tarifadetalle_valor) {
    return [detalle];
  }

  const texto = detalle.detalle ?? detalle.descripcion ?? detalle.valor;

  return texto ? parseTextoDetalle(texto) : [];
}

export function unirDetallesGuardados(...fuentes: unknown[]) {
  const normalizados = fuentes.flatMap((fuente) => {
    if (Array.isArray(fuente)) {
      return fuente.flatMap(normalizarDetalle);
    }

    return normalizarDetalle(fuente);
  });

  const vistos = new Set<string>();

  return normalizados.filter((item) => {
    const key = JSON.stringify(item);

    if (vistos.has(key)) {
      return false;
    }

    vistos.add(key);

    return true;
  });
}
/* ============================================================
 * NORMALIZACIÓN
 * ============================================================ */

export function normalizarRubrosGuardados({
  rubros,
  rubrosCatalogo,
  serviciosCatalogo,
  monedas,
  entidades,
}: {
  rubros: RubroGuardado[];

  rubrosCatalogo: RubroCatalogo[];

  serviciosCatalogo: ServicioCatalogo[];

  monedas: MonedaCatalogo[];

  entidades: EntidadCatalogo[];
}): RubroGuardadoProcesado[] {
  const idxRubros = new Map(rubrosCatalogo.map((item) => [String(item.cod_rubro), item]));

  const idxServicios = new Map(serviciosCatalogo.map((item) => [String(item.cod_servicio), item]));

  const idxMonedas = new Map(monedas.map((item) => [String(item.cod_moneda), item]));

  const idxEntidades = new Map(
    entidades.map((item) => [String(item.entidad_id ?? item.cod_entidad), item]),
  );

  const agrupados = new Map<string, RubroGuardadoProcesado>();

  for (const item of rubros) {
    const codRubro = item.cod_rubro;

    const rubroCatalogo = idxRubros.get(String(codRubro));

    const nombreRubro =
      item.nombre_rubro ?? rubroCatalogo?.nombre_rubro ?? rubroCatalogo?.nombre ?? "";

    const codServicio = item.cod_servicio;

    const servicioCatalogo = idxServicios.get(String(codServicio));

    const nombreServicio =
      item.nombre_servicio ?? servicioCatalogo?.nombre_servicio ?? servicioCatalogo?.nombre ?? "";

    const siglas = item.siglas_servicio ?? servicioCatalogo?.siglas ?? "";

    const entidadId = item.entidad_id ?? item.cod_entidad ?? null;

    const entidad = entidadId == null ? null : idxEntidades.get(String(entidadId));

    const entidadNombre =
      (item.entidad_nombre as string | undefined) ??
      entidad?.entidad_nombre ??
      entidad?.razon_social ??
      entidad?.nombre ??
      null;

    const codMonedaVenta = item.cod_moneda_venta ?? item.metodo_cod_moneda_venta ?? null;

    const codMonedaCosto = item.cod_moneda_costo ?? item.metodo_cod_moneda_costo ?? null;

    const monedaVenta = codMonedaVenta == null ? null : idxMonedas.get(String(codMonedaVenta));

    const monedaCosto = codMonedaCosto == null ? null : idxMonedas.get(String(codMonedaCosto));

    /*
     * Esta es la unificación importante:
     *
     * primero clasificación guardada,
     * luego catálogo del servicio.
     */
    const clasificacion = item.clasificacion ?? servicioCatalogo?.clasificacion ?? null;

    const servicioClasificacion =
      item.servicio_clasificacion ?? servicioCatalogo?.servicio_clasificacion ?? null;

    const servicio = {
      cod_servicio: codServicio ?? null,

      nombre: nombreServicio,

      siglas,

      clasificacion,

      servicio_clasificacion: servicioClasificacion,

      entidad_id: entidadId,

      entidad_nombre: entidadNombre,

      metodo: {
        venta: item.venta ?? item.venta_rubro ?? item.precio_venta ?? 0,

        costo: item.costo ?? item.costo_rubro ?? item.precio_costo ?? 0,

        porcentaje: item.porcentaje ?? item.metodo_porcentaje ?? null,

        cod_moneda_venta: codMonedaVenta,

        cod_moneda_costo: codMonedaCosto,

        moneda_venta:
          monedaVenta?.SIMBOLO_MONEDA ??
          monedaVenta?.simbolo_moneda ??
          monedaVenta?.simbolo ??
          monedaVenta?.nombre ??
          null,

        moneda_costo:
          monedaCosto?.SIMBOLO_MONEDA ??
          monedaCosto?.simbolo_moneda ??
          monedaCosto?.simbolo ??
          monedaCosto?.nombre ??
          null,

        detalles: unirDetallesGuardados(
          item.detalles,

          item.metodo_detalle,

          item.metodo_detalles,

          typeof item.detalle === "string" ? item.detalle.trim() : item.detalle,
        ),
      },
    };

    const key = `${item.cod_detallerubro ?? ""}-${codRubro}-${codServicio}-${entidadId ?? ""}`;

    agrupados.set(key, {
      value: `${codRubro}-${codServicio}-${entidadId ?? "NA"}-${item.cod_detallerubro ?? "NA"}`,

      cod_detallerubro: item.cod_detallerubro ?? null,

      cod_rubro: codRubro ?? null,

      nombre_rubro: nombreRubro,

      cod_tipo_pago: item.cod_tipo_pago ?? null,

      gruporubro_nombre: item.gruporubro_nombre ?? "",

      /*
       * El legado conserva dos formas simultáneas:
       *
       * - servicio anidado
       * - sus campos principales a nivel raíz
       *
       * DueCarrier, totales y otros consumidores todavía
       * pueden leer esa forma aplanada.
       */
      servicio,

      ...servicio,
    });
  }

  return Array.from(agrupados.values());
}
export function separarRubrosGuardados(rubrosGuardados: RubroGuardadoProcesado[]) {
  /*
   * El IVA guardado no tiene servicio ni clasificación; por la regla
   * "clasificación null => Due Carrier" terminaba listado como rubro de
   * Due Carrier. No pertenece a ninguna sección: Totales lo calcula
   * sobre la base PREPAID, igual que en el cálculo vivo.
   */
  const rubros = rubrosGuardados.filter((item) => Number(item.cod_rubro) !== RUBRO.IVA);

  const rubrosDueAgent = rubros.filter(esRubroDueAgent);

  const dueCarrier = rubros.filter(esRubroDueCarrier);

  return {
    rubrosDueAgent,

    rubrosDueCarrier: dueCarrier.filter((item) => Number(item.cod_rubro) !== RUBRO.SCALLING),

    rubrosScalling: dueCarrier.filter((item) => Number(item.cod_rubro) === RUBRO.SCALLING),
  };
}

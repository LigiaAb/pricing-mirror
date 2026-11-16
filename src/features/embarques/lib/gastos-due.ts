import type { Servicio } from "@/features/catalogos";
import { DUE_AGENT_ENTIDAD_ID, type Rubro, type RubroServicio } from "@/features/gastos";
import { asNumber, asText } from "@/shared/lib/text";

export const DEFAULT_LIMIT = 100;
export const SEARCH_LIMIT = 200;
export const MIN_SEARCH_LENGTH = 2;

export const firstDefined = (...values: unknown[]) =>
  values.find((v) => v !== undefined && v !== null && v !== "");

export const toNumberOrFallback = (
  value: unknown,
  fallback: number | null = null,
): number | null => {
  if (value === undefined || value === null || value === "") return fallback;
  const n = Number(value);
  return Number.isNaN(n) ? fallback : n;
};

export const formatVentaDisplay = (value: unknown): string => {
  const n = toNumberOrFallback(value, null);
  if (n === null) {
    return value == null || value === "" ? "" : asText(value);
  }
  return `$ ${n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export interface ServiceOption {
  key: string;
  codServicio: number | null;
  codRubro: number | null;
  nombre: string;
  siglas: string;
  venta: unknown;
  metodoDes: string;
  codTipoCalculo: number | null;
  entidadId: number;
  rubroNombre: string;
  codClasificacionCarga: string | null;
  rubroData: Rubro | null;
  servicioData: RubroServicio | Record<string, unknown> | null;
  metodoData: Record<string, unknown> | null;
  searchText: string;
}

export interface ContextoTarifa {
  codEmpresa: unknown;
  codCc: unknown;
  codTipoServicio: unknown;
  codTipoTransporte: unknown;
}

/**
 * Opciones de servicio DUE AGENT: primero los servicios de la tarifa
 * calculada; si la tarifa no trae servicios, cae al catálogo filtrado por
 * entidad DUE AGENT y contexto (empresa/cc/tipo servicio/transporte).
 */
export const buildDueAgentServiceOptions = (
  tarifaRubros: Rubro[],
  servicios: Servicio[],
  ctx: ContextoTarifa,
): ServiceOption[] => {
  const result: ServiceOption[] = [];
  const seen = new Set<string>();
  let hasTarifaServices = false;

  const matchesContext = (currentValue: unknown, expectedValue: unknown) => {
    if (expectedValue == null || expectedValue === "") return true;
    if (currentValue == null || currentValue === "") return true;
    return asText(currentValue) === asText(expectedValue);
  };

  const pushOption = (opt: Omit<ServiceOption, "searchText" | "key">) => {
    const key = asText(opt.codServicio);
    const normalizedNombre = asText(opt.nombre).trim();
    if (!key || !normalizedNombre || seen.has(key)) return;
    seen.add(key);
    result.push({
      ...opt,
      key,
      nombre: normalizedNombre,
      searchText: [opt.nombre, opt.siglas, opt.metodoDes, opt.rubroNombre]
        .filter(Boolean)
        .join(" ")
        .toLowerCase(),
    });
  };

  tarifaRubros.forEach((rubro) => {
    const serviciosRubro = rubro.servicios ?? [];
    if (!Array.isArray(serviciosRubro) || serviciosRubro.length === 0) return;
    hasTarifaServices = true;

    const rubroNombre = rubro.nombreRubro ?? "Servicios";
    const codRubro = rubro.codRubro ?? null;

    serviciosRubro.forEach((srv) => {
      const metodo = srv.metodo ?? {};
      const metodoVenta = metodo.VENTA ?? metodo.venta ?? "";
      const metodoDescripcion = asText(metodo.tipo_tarifa_desc ?? metodo.tipo_metodo_desc);

      pushOption({
        codServicio: srv.codServicio ?? null,
        codRubro: srv.codRubro ?? codRubro ?? null,
        nombre: srv.nombre ?? "",
        siglas: srv.siglas ?? "",
        venta: metodoVenta,
        metodoDes: asText(metodoDescripcion),
        codTipoCalculo: asNumber(srv.codTipoCalculo ?? metodo.cod_tipo_metodo) || null,
        entidadId:
          toNumberOrFallback(srv.entidadId, Number(DUE_AGENT_ENTIDAD_ID)) ??
          Number(DUE_AGENT_ENTIDAD_ID),
        rubroNombre: rubroNombre,
        codClasificacionCarga: asText(srv.codClasificacionCarga) || null,
        rubroData: rubro,
        servicioData: srv,
        metodoData: metodo,
      });
    });
  });

  if (!hasTarifaServices) {
    servicios.forEach((servicio) => {
      const entidadId = servicio.entidad_id;
      const servicioClasificacion = asText(servicio.clasificacion ?? "").toUpperCase();

      if (asText(entidadId) !== DUE_AGENT_ENTIDAD_ID && servicioClasificacion !== "DUE AGENT")
        return;
      if (!matchesContext(servicio.cod_empresa, ctx.codEmpresa)) return;
      if (!matchesContext(servicio.cod_cc, ctx.codCc)) return;
      if (!matchesContext(servicio.cod_tipo_servicio, ctx.codTipoServicio)) return;
      if (!matchesContext(servicio.cod_tipo_transporte, ctx.codTipoTransporte)) return;

      pushOption({
        codServicio: servicio.value,
        codRubro: asNumber(servicio.cod_rubro) || null,
        nombre: servicio.label,
        siglas: servicio.siglas,
        venta: "",
        metodoDes: "",
        codTipoCalculo: asNumber(servicio.cod_tipo_calculo) || null,
        entidadId:
          toNumberOrFallback(entidadId, Number(DUE_AGENT_ENTIDAD_ID)) ??
          Number(DUE_AGENT_ENTIDAD_ID),
        rubroNombre: asText(servicio.clasificacion) || "Servicios",
        codClasificacionCarga: asText(servicio.cod_clasificacion_carga) || null,
        rubroData: {
          COD_RUBRO: asNumber(servicio.cod_rubro),
          nombreRubro: asText(servicio.clasificacion) || "Servicios",
        } as Rubro,
        servicioData: servicio,
        metodoData: (servicio.metodo as Record<string, unknown>) ?? null,
      });
    });
  }

  return result.sort((a, b) => {
    const groupCompare = asText(a.rubroNombre).localeCompare(asText(b.rubroNombre), "es", {
      sensitivity: "base",
    });
    if (groupCompare !== 0) return groupCompare;
    return asText(a.nombre).localeCompare(asText(b.nombre), "es", { sensitivity: "base" });
  });
};

export interface GastoMapeado extends Record<string, unknown> {
  embGastoId: number;
  gruporubroNombre: string;
  costoRubro: number;
  ventaRubro: number;
  codMonedaVenta: number;
  codTipoPago: number;
  entidadId: number;
  servicioSiglas: string | null;
  entidad_nombre: string | undefined;
  moneda_costo_nombre: string | number | undefined;
  moneda_venta_nombre: string | number | undefined;
  servicio_nombre: string;
  servicio_siglas: string;
  tipo_pago_label: string | number;
}

/** Item de TablaDue a partir de un gasto ya enriquecido. */
export const mapGastoToDueItem = (item: GastoMapeado) => ({
  key: String(item.embGastoId),
  nombre: item.gruporubroNombre ?? item.servicio_nombre ?? item.entidad_nombre,
  nombreProveedor: item.servicio_siglas || item.entidad_nombre || "",
  monedaSimbolo: asText(item.moneda_venta_nombre),
  codMoneda: asText(item.codMonedaVenta),
  costo: item.costoRubro,
  valor: item.ventaRubro,
  cod_tipo_pago: item.codTipoPago,
  tipo_pago_label: String(item.tipo_pago_label),
  detalles: [] as never[],
});

/** Texto auxiliar del autocomplete según término y total de opciones. */
export const buildHelperText = (searchTerm: string, options: ServiceOption[]): string => {
  const term = searchTerm.trim();
  if (term && term.length < MIN_SEARCH_LENGTH) {
    return `Escribe al menos ${MIN_SEARCH_LENGTH} caracteres para buscar`;
  }
  if (term) {
    const visibleCount = options.filter((o) => o.searchText.includes(term.toLowerCase())).length;
    const total = options.length;
    const isTruncated = visibleCount > total;
    return isTruncated
      ? `${visibleCount} de ${total} coincidencias`
      : `${visibleCount} coincidencias`;
  }
  return `${Math.min(options.length, DEFAULT_LIMIT)} de ${options.length} servicios`;
};

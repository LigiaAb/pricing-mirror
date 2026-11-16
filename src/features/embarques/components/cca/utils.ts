import {
  computeCW as computeCargaChargeable,
  computePesoVolumetrico,
  getFactorCmPorUnidadMedida,
  type UnidadMedidaCatalogo,
} from "@/features/embarques/lib/cargas-calculos";
import type { CoordinacionGasto } from "@/features/gastos";
import { asNumber, asText, safeString } from "@/shared/lib/text";

/**
 * Peso volumétrico IATA de la carga: dimensiones convertidas a cm con
 * `factorCm` (plan §7.D.4) y (L × A × H) / 6000 con redondeo IATA.
 */
export function computeVolumenTotal(carga: {
  cantidad: number;
  largo: number;
  ancho: number;
  alto: number;
  factorCm?: number;
}): number {
  return computePesoVolumetrico(carga);
}

/**
 * Calcula el peso cargable (chargeable weight): redondeo IATA de peso y
 * volumétrico, y se queda con el mayor.
 */
export function computeCW(params: { pesoTotal: number; volumenTotal: number }): number {
  return computeCargaChargeable({
    pesoTotal: params.pesoTotal,
    pesoVolumetrico: params.volumenTotal,
  });
}

export const PAYMENT_CONFIG = [
  { key: "prepaid", codTipo: 128, label: "PREPAID" },
  { key: "collect", codTipo: 127, label: "COLLECT" },
];

export const PAYMENT_OPTIONS = PAYMENT_CONFIG.map(({ codTipo, label }) => ({
  value: codTipo,
  label,
}));

export function firstDefined<T>(...values: (T | undefined | null | "")[]): T | undefined {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return undefined;
}

export function toNumberOrNull(value: unknown): number | null {
  if (value === "" || value === null || value === undefined) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function toIntegerOrNull(value: unknown): number | null {
  const parsed = toNumberOrNull(value);
  if (parsed === null) {
    return null;
  }
  return Math.max(0, Math.trunc(parsed));
}

export function roundNumber(value: unknown, decimals = 3): number | null {
  const parsed = toNumberOrNull(value);
  if (parsed === null) {
    return null;
  }
  return Number(parsed.toFixed(decimals));
}

export function toDisplayValue(
  value: unknown,
  { blankIfZero = false }: { blankIfZero?: boolean } = {},
): string {
  const rounded = roundNumber(value);
  if (rounded === null) {
    return "";
  }
  if (blankIfZero && Math.abs(rounded) < 0.0001) {
    return "";
  }
  return String(rounded);
}

export function numbersEqual(left: unknown, right: unknown, epsilon = 0.0001): boolean {
  const normalizedLeft = toNumberOrNull(left);
  const normalizedRight = toNumberOrNull(right);
  if (normalizedLeft === null && normalizedRight === null) {
    return true;
  }
  if (normalizedLeft === null || normalizedRight === null) {
    return false;
  }
  return Math.abs(normalizedLeft - normalizedRight) < epsilon;
}

export function normalizeDecimalInput(value: string): string {
  if (value === "") {
    return "";
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? String(roundNumber(parsed)) : "";
}

export function normalizeIntegerInput(value: string): string {
  if (value === "") {
    return "";
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return "";
  }
  return String(Math.max(0, Math.trunc(parsed)));
}

export function cloneRows<T extends Record<string, unknown>>(rows: T[] = []): T[] {
  return rows.map((row) => ({ ...row }));
}

export function getPaymentLabel(codTipo: unknown): string {
  return PAYMENT_CONFIG.find((config) => config.codTipo === Number(codTipo))?.label ?? "Sin tipo";
}

export function getRowByPayment<T extends { codTipoPago?: unknown }>(
  rows: T[],
  codTipo: unknown,
): T | undefined {
  return rows.find((row) => Number(row.codTipoPago) === Number(codTipo));
}

export function sumField(rows: Record<string, unknown>[], field: string): number {
  return roundNumber(rows.reduce((sum, row) => sum + (toNumberOrNull(row[field]) ?? 0), 0)) ?? 0;
}

export function sumByPayment(
  rows: Record<string, unknown>[],
  codTipo: unknown,
  field: string,
): number {
  return (
    roundNumber(
      rows
        .filter((row) => Number(row.codTipoPago) === Number(codTipo))
        .reduce((sum, row) => sum + (toNumberOrNull(row[field]) ?? 0), 0),
    ) ?? 0
  );
}

export interface CargaRow {
  key: string;
  descripcion: string;
  bultos: number | string;
  alto: number | string;
  ancho: number | string;
  largo: number | string;
  peso: number | string;
  pesoVolumetrico: number | string;
  cw: number | string;
  [key: string]: unknown;
}

export function normalizeCargaRow(
  cargaInput: unknown,
  index: number,
  unidadesMedida: UnidadMedidaCatalogo[] = [],
): CargaRow {
  const carga = (cargaInput ?? {}) as Record<string, unknown>;
  const bultos = toIntegerOrNull(
    firstDefined(carga.bultos, carga.BULTOS, carga.cantidad, carga.CANTIDAD),
  );
  const alto = roundNumber(firstDefined(carga.alto, carga.ALTO, carga.alto_cm));
  const ancho = roundNumber(firstDefined(carga.ancho, carga.ANCHO, carga.ancho_cm));
  const largo = roundNumber(firstDefined(carga.largo, carga.LARGO, carga.largo_cm));
  const peso = roundNumber(firstDefined(carga.peso, carga.PESO, carga.pesoTotal, carga.PESO_TOTAL));
  const providedVolumetrico = roundNumber(
    firstDefined(carga.volumenTotal, carga.volumen, carga.metrosCubicos, carga.METROS_CUBICOS),
  );
  const factorCm = getFactorCmPorUnidadMedida(
    firstDefined(
      carga.unidadMedida,
      carga.tipoUnidadMedidaId,
      carga.tipo_id_unidad_medida,
      carga.TIPO_ID_UNIDAD_MEDIDA,
    ),
    unidadesMedida,
  );
  const computedVolumetrico = computeVolumenTotal({
    cantidad: bultos ?? 0,
    largo: largo ?? 0,
    ancho: ancho ?? 0,
    alto: alto ?? 0,
    factorCm,
  });
  const pesoVolumetrico =
    providedVolumetrico ??
    (computedVolumetrico > 0 ? (roundNumber(computedVolumetrico) ?? "") : "");
  const providedCw = roundNumber(firstDefined(carga.cw, carga.CW));
  const computedCw = computeCW({
    pesoTotal: peso ?? 0,
    volumenTotal: pesoVolumetrico === "" ? 0 : Number(pesoVolumetrico),
  });

  return {
    key: String(
      firstDefined(carga.embCargaId, carga.EMB_CARGA_ID, carga.id, carga.ID, `carga-${index}`),
    ),
    descripcion: String(
      firstDefined(
        carga.descripcionCarga,
        carga.DESCRIPCION_CARGA,
        carga.descripcion,
        carga.DESCRIPCION,
        "",
      ),
    ),
    bultos: bultos ?? "",
    alto: alto ?? "",
    ancho: ancho ?? "",
    largo: largo ?? "",
    peso: peso ?? "",
    pesoVolumetrico: pesoVolumetrico,
    cw: providedCw ?? (computedCw > 0 ? (roundNumber(computedCw) ?? "") : ""),
  };
}

export interface CargaDraft extends CargaRow {
  [key: string]: unknown;
}

export function deriveCargaDraft(
  row: CargaDraft,
  unidadesMedida: UnidadMedidaCatalogo[] = [],
): CargaDraft {
  const factorCm = getFactorCmPorUnidadMedida(
    firstDefined(
      row.unidadMedida,
      row.tipoUnidadMedidaId,
      row.tipo_id_unidad_medida,
      row.TIPO_ID_UNIDAD_MEDIDA,
    ),
    unidadesMedida,
  );
  const pesoVolumetrico = computeVolumenTotal({
    cantidad: asNumber(row.bultos) || 0,
    largo: asNumber(row.largo) || 0,
    ancho: asNumber(row.ancho) || 0,
    alto: asNumber(row.alto) || 0,
    factorCm,
  });

  const cw = computeCW({
    pesoTotal: asNumber(row.peso) || 0,
    volumenTotal: pesoVolumetrico || 0,
  });

  const roundedVol = roundNumber(pesoVolumetrico);
  const roundedCw = roundNumber(cw);
  return {
    ...row,
    pesoVolumetrico: roundedVol !== null && pesoVolumetrico > 0 ? roundedVol : "",
    cw: roundedCw !== null && cw > 0 ? roundedCw : "",
  };
}

export interface GastoRow {
  key: string;
  codRubro: number | null;
  codTipoPago: number | null;
  entidadId: number | null;
  gruporubroNombre: string;
  servicioSiglas: string;
  rawRateCosto: number | null;
  rateCosto: number | string;
  rateVenta: number | string;
  costoRubro: number | string;
  ventaRubro: number | string;
  [key: string]: unknown;
}

export function normalizeGastoRow(gasto: CoordinacionGasto, index: number): GastoRow {
  const item = gasto as unknown as Record<string, unknown>;
  return {
    key: safeString(
      firstDefined(item.embGastoId, item.EMB_GASTO_ID, item.emb_gasto_id, item.id, item.ID),
      `gasto-${index}`,
    ),
    codRubro: toNumberOrNull(firstDefined(item.codRubro, item.COD_RUBRO, item.cod_rubro)),
    codTipoPago: toNumberOrNull(
      firstDefined(item.codTipoPago, item.COD_TIPO_PAGO, item.cod_tipo_pago),
    ),
    entidadId: toNumberOrNull(
      firstDefined(item.entidadId, item.ENTIDAD_ID, item.entidad_id, item.codigo_entidad),
    ),
    gruporubroNombre: String(
      firstDefined(
        item.gruporubroNombre,
        item.GRUPORUBRO_NOMBRE,
        item.gruporubro_nombre,
        item.servicio_nombre,
        item.SERVICIO_NOMBRE,
        item.nombre,
        item.NOMBRE,
        "",
      ),
    ),
    servicioSiglas: String(
      firstDefined(item.servicioSiglas, item.SERVICIO_SIGLAS, item.servicio_siglas, ""),
    ),
    rawRateCosto: toNumberOrNull(firstDefined(item.rateCosto, item.RATE_COSTO, item.rate_costo)),
    rateCosto:
      roundNumber(
        firstDefined(
          item.rateCosto,
          item.RATE_COSTO,
          item.rate_costo,
          item.costoRubro,
          item.COSTO_RUBRO,
          item.costo_rubro,
        ),
      ) ?? "",
    rateVenta:
      roundNumber(
        firstDefined(
          item.rateVenta,
          item.RATE_VENTA,
          item.rate_venta,
          item.ventaRubro,
          item.VENTA_RUBRO,
          item.venta_rubro,
        ),
      ) ?? "",
    costoRubro:
      roundNumber(
        firstDefined(
          item.costoRubro,
          item.COSTO_RUBRO,
          item.costo_rubro,
          item.rateCosto,
          item.RATE_COSTO,
          item.rate_costo,
        ),
      ) ?? "",
    ventaRubro:
      roundNumber(
        firstDefined(
          item.ventaRubro,
          item.VENTA_RUBRO,
          item.venta_rubro,
          item.rateVenta,
          item.RATE_VENTA,
          item.rate_venta,
        ),
      ) ?? "",
  };
}

export function resolveEmbarqueId(
  embarqueData: Record<string, unknown> = {},
  embarqueId: string | number | null = null,
): string | number | null {
  const found = firstDefined<string | number>(
    typeof embarqueId === "string" || typeof embarqueId === "number" ? embarqueId : "",
    asText(embarqueData?.embarqueId),
    asText(embarqueData?.embarque_id),
    asText(embarqueData?.id),
  );
  return found ?? null;
}

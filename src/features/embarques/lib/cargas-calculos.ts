import type { CoordinacionCarga } from "@/features/coordinaciones";
import { safeString } from "@/shared/lib/text";

export const EMPTY_ROW: Record<string, unknown> = {
  rubroId: "",
  paisOrigenId: "",
  descripcion: "",
  valor: "",
  partidaArancelaria: "",
  regimenAduanal: "",
  tipoEmbalaje: "",
  cantidad: "",
  pesoTotal: "",
  volumenTotal: "",
  largo: "",
  alto: "",
  ancho: "",
  unidadMedida: "",
  unidadPeso: "",
};

export function toNumber(val: unknown): number {
  if (val === null || val === undefined || val === "") return 0;
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

/** Trunca (no redondea) la cantidad de bultos a entero (paridad `modalCargas.jsx:normalizeCantidad`). */
export function normalizarCantidadCarga(valor: unknown): number {
  if (valor === "" || valor === null || valor === undefined) return 0;
  const num = Number(valor);
  return Number.isFinite(num) ? Math.trunc(num) : 0;
}

/**
 * Agrupa los dígitos de la partida arancelaria en pares separados por punto
 * (paridad `modalCargas.jsx:formatPartidaArancelaria`), p. ej. "1234567890" →
 * "12.34.56.78.90". Descarta cualquier carácter no numérico.
 */
export function formatPartidaArancelaria(val: unknown): string {
  const digits = String(val ?? "")
    .replace(/\D/g, "")
    .slice(0, 20);
  const pairs: string[] = [];
  for (let i = 0; i < digits.length; i += 2) pairs.push(digits.slice(i, i + 2));
  return pairs.join(".");
}

export function iataRoundKg(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.ceil(value);
}

/**
 * Factor de conversión a cm para las unidades de medida del catálogo
 * `lista-relacion-tipo?tipo_tabla=coordinacion_carga&cod_tipo_padre=296`
 * (METROS, PIES, PULGADAS, CENTIMETROS). La fórmula volumétrica IATA
 * (L × A × H) / 6000 exige dimensiones en cm.
 */
const FACTORES_CM_POR_UNIDAD: Record<string, number> = {
  METROS: 100,
  METRO: 100,
  MTS: 100,
  PIES: 30.48,
  PIE: 30.48,
  FEET: 30.48,
  FT: 30.48,
  PULGADAS: 2.54,
  PULGADA: 2.54,
  INCH: 2.54,
  INCHES: 2.54,
  IN: 2.54,
  CENTIMETROS: 1,
  CENTIMETRO: 1,
  CM: 1,
};

/** Item de catálogo de unidad de medida (privado crudo o público mapeado). */
export interface UnidadMedidaCatalogo {
  codTipo?: string | number | undefined;
  cod_tipo?: string | number | undefined;
  value?: string | number | undefined;
  label?: string | undefined;
  tipo_desc?: string | undefined;
}

function factorPorLabel(label: unknown): number | undefined {
  return FACTORES_CM_POR_UNIDAD[
    String(label ?? "")
      .toUpperCase()
      .trim()
  ];
}

/**
 * Resuelve el factor de conversión a cm desde el valor guardado en la carga
 * (el `cod_tipo` del registro de lista-relacion-tipo — NO `cod_relacion_tipo`,
 * por eso el match prioriza codTipo/cod_tipo) y la lista de unidades. Si el
 * caller ya conoce el factor puede pasarlo vía `factorCm`. Default: 1 (cm)
 * para cargas sin unidad.
 */
export function getFactorCmPorUnidadMedida(
  unidadMedida: unknown,
  unidadesMedida: UnidadMedidaCatalogo[] = [],
  factorCm: unknown = null,
): number {
  const factorDirecto = Number(factorCm);
  if (factorCm != null && factorCm !== "" && Number.isFinite(factorDirecto) && factorDirecto > 0) {
    return factorDirecto;
  }
  if (unidadMedida === null || unidadMedida === undefined || unidadMedida === "") return 1;

  if (typeof unidadMedida === "object") {
    const label = (unidadMedida as UnidadMedidaCatalogo).label;
    return factorPorLabel(label) ?? 1;
  }

  const found = (unidadesMedida || []).find(
    (u) => String(u?.codTipo ?? u?.cod_tipo ?? u?.value) === String(unidadMedida),
  );
  if (found) {
    const factor = factorPorLabel(found.label ?? found.tipo_desc);
    if (factor !== undefined) return factor;
  }

  return factorPorLabel(unidadMedida) ?? 1;
}

export function computePesoVolumetrico(params: {
  cantidad: number;
  alto: number;
  ancho: number;
  largo: number;
  factorCm?: number;
}): number {
  const { cantidad, alto, ancho, largo } = params;
  if (cantidad <= 0 || alto <= 0 || ancho <= 0 || largo <= 0) return 0;
  const factor =
    Number.isFinite(params.factorCm) && (params.factorCm as number) > 0
      ? (params.factorCm as number)
      : 1;
  // IATA requiere cm: si la carga trae otra unidad (m, pies, pulgadas) las
  // dimensiones se convierten con el factor antes de (L × A × H) / 6000.
  const volumetricoPorUnidad = (alto * factor * (ancho * factor) * (largo * factor)) / 6000;
  return iataRoundKg(volumetricoPorUnidad * cantidad);
}

/**
 * Peso volumétrico de una carga que llegó sin `volumenTotal` calculado y
 * nunca fue editada (paridad `CargasPublicas.jsx:computeVolumenFromDims`).
 * A diferencia de `computePesoVolumetrico` (usada al editar, que redondea
 * hacia arriba con la regla IATA), este fallback conserva 3 decimales sin
 * redondear — mismo matiz que el propio legacy, que usa una fórmula distinta
 * sólo para este caso.
 */
export function computeVolumenFallbackSinEditar(params: {
  cantidad: number;
  alto: number;
  ancho: number;
  largo: number;
  factorCm?: number;
}): number {
  const { cantidad, alto, ancho, largo } = params;
  if (cantidad <= 0 || alto <= 0 || ancho <= 0 || largo <= 0) return 0;
  const factor =
    Number.isFinite(params.factorCm) && (params.factorCm as number) > 0
      ? (params.factorCm as number)
      : 1;
  const volumetricoPorUnidad = (alto * factor * (ancho * factor) * (largo * factor)) / 6000;
  return Number((volumetricoPorUnidad * cantidad).toFixed(3));
}

export function computeCW(params: { pesoTotal: number; pesoVolumetrico: number }): number {
  const { pesoTotal, pesoVolumetrico } = params;
  const pesoIata = iataRoundKg(pesoTotal);
  const volIata = iataRoundKg(pesoVolumetrico);
  if (pesoIata <= 0 && volIata <= 0) return 0;
  return Number(Math.max(pesoIata, volIata).toFixed(3));
}

/** CW de una carga del servidor (peso vs volumétrico de sus dimensiones). */
export function computeCargaCW(
  carga: CoordinacionCarga,
  unidadesMedida: UnidadMedidaCatalogo[] = [],
): number {
  const factorCm = getFactorCmPorUnidadMedida(carga.tipoUnidadMedidaId, unidadesMedida);
  const pesoVolumetrico = computePesoVolumetrico({
    cantidad: toNumber(carga.bultos),
    alto: toNumber(carga.alto),
    ancho: toNumber(carga.ancho),
    largo: toNumber(carga.largo),
    factorCm,
  });
  return computeCW({ pesoTotal: toNumber(carga.peso), pesoVolumetrico });
}

export function cargaTieneFaltantes(carga: CoordinacionCarga): boolean {
  const check = (v: unknown) => {
    if (v === null || v === undefined) return true;
    if (typeof v === "string" && v.trim() === "") return true;
    if (typeof v === "number" && v === 0) return true;
    return false;
  };
  const val = (k: keyof CoordinacionCarga) => carga[k];
  return (
    check(val("bultos")) ||
    check(val("peso")) ||
    check(val("descripcionCarga")) ||
    check(val("valor")) ||
    check(val("partidaArancelaria")) ||
    check(val("regimenAduanal"))
  );
}

export interface DimensionesCarga {
  pesoVolumetrico: number;
  cw: number;
  metrosCubicos: number;
  tipoEmbalajeLabel: string;
}

/** Derivados de las dimensiones del formulario (peso volumétrico, CW, m³). */
export function computeDimensiones(
  formData: Record<string, unknown>,
  tipoEmbalajeLabel: string,
  factorCm = 1,
): DimensionesCarga {
  const pesoTotal = toNumber(formData.pesoTotal);
  const cantidad = toNumber(formData.cantidad);
  const largo = toNumber(formData.largo);
  const alto = toNumber(formData.alto);
  const ancho = toNumber(formData.ancho);
  const pesoVolumetrico = computePesoVolumetrico({ cantidad, alto, ancho, largo, factorCm });
  const cw = computeCW({ pesoTotal, pesoVolumetrico });
  // Paridad legacy (plan §7.D.4): metros_cubicos asume cm y NO aplica factorCm
  // — incoherencia del legacy pendiente de confirmar con negocio.
  const metrosCubicos =
    cantidad > 0 && largo > 0 && alto > 0 && ancho > 0
      ? (cantidad * largo * alto * ancho) / 1_000_000
      : 0;
  return { pesoVolumetrico, cw, metrosCubicos, tipoEmbalajeLabel };
}

/** Form state a partir de una carga existente (modo edición). */
export function cargaToFormData(carga: CoordinacionCarga): Record<string, unknown> {
  return {
    rubroId: carga.rubroId ?? "",
    paisOrigenId: carga.paisOrigenId ?? "",
    descripcion: carga.descripcionCarga ?? carga.descripcion_carga ?? "",
    valor: carga.valor ?? "",
    partidaArancelaria: carga.partidaArancelaria ?? "",
    regimenAduanal: carga.regimenAduanal ?? "",
    tipoEmbalaje: safeString(carga.codTipoEmbalaje ?? carga.cod_tipo_embalaje),
    cantidad: carga.bultos ?? "",
    pesoTotal: carga.peso ?? "",
    volumenTotal: carga.volumen ?? "",
    largo: carga.largo ?? "",
    alto: carga.alto ?? "",
    ancho: carga.ancho ?? "",
    unidadMedida: carga.tipoUnidadMedidaId ?? "",
    unidadPeso: "",
  };
}

/** Payload de insertar/actualizar carga a partir del form y sus derivados. */
export function buildCargaPayload(
  embarqueId: string | number,
  formData: Record<string, unknown>,
  dimensiones: DimensionesCarga,
): Record<string, unknown> {
  const unidadMedidaVal = formData.unidadMedida ? Number(formData.unidadMedida) : null;
  return {
    embarque_id: Number(embarqueId),
    rubro_id: formData.rubroId ? Number(formData.rubroId) : null,
    descripcion_carga: formData.descripcion,
    bultos: toNumber(formData.cantidad),
    cod_tipo_unidad_medidad: unidadMedidaVal,
    tipo_id_unidad_medida: unidadMedidaVal,
    peso: toNumber(formData.pesoTotal),
    cw: dimensiones.cw || null,
    char_w: dimensiones.cw || null,
    volumen: toNumber(formData.volumenTotal),
    metros_cubicos: dimensiones.metrosCubicos || null,
    largo: formData.largo ? Number(formData.largo) : null,
    alto: formData.alto ? Number(formData.alto) : null,
    ancho: formData.ancho ? Number(formData.ancho) : null,
    valor: toNumber(formData.valor),
    estado_cod: 1,
    cod_pais_origen_carga: formData.paisOrigenId ? Number(formData.paisOrigenId) : null,
    partida_arancelaria: formData.partidaArancelaria,
    regimen_aduanal: formData.regimenAduanal,
    cod_tipo_embalaje: formData.tipoEmbalaje ? Number(formData.tipoEmbalaje) : null,
    tipo_embalaje: dimensiones.tipoEmbalajeLabel || null,
    definitivo_general: "n",
  };
}

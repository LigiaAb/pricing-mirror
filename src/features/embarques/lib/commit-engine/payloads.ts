/**
 * Constructores de payloads/JSON del motor "Crear Coordinación": la fila de
 * carga hacia insertar/actualizar-coordinacion-carga, los overrides de la
 * coordinación derivados de Detalles y la carta final sincronizada tras el
 * commit. Lógica pura (tests en payloads.test.ts).
 */

import { CLASIFICACION_CARGA_PELIGROSA } from "@/features/embarques/lib/constantes";
import { parseJsonOpcionales, resolveCatalogValue, toNum } from "./helpers";
import type { CommitCatalogos, JsonRecord, OpcionCatalogo } from "./tipos";

/**
 * Payload de insertar/actualizar-coordinacion-carga desde una fila de la carta.
 * La unidad de medida viaja como `cod_tipo_unidad_medidad` + `tipo_id_unidad_medida`
 * (sic, con el typo del backend) desde `unidadPeso` con fallback a `unidadMedida`
 * (§7.D.4). ⚠️ Paridad con el legacy: `metros_cubicos` asume dimensiones en cm
 * (l·a·an/1e6) sin aplicar factorCm — incoherencia anotada en §4.A.3 del plan.
 */
export function buildCargaPayload(
  fila: JsonRecord,
  embarqueIdNum: number | null,
  tiposEmbalajeCatalog: OpcionCatalogo[] = [],
): JsonRecord {
  const cantidad = Number.parseInt(String(fila.cantidad ?? ""), 10) || 0;
  const pesoTotal = Number(fila.pesoTotal ?? 0);
  const volumenTotal = Number(fila.volumenTotal ?? 0);
  const largo = Number.parseFloat(String(fila.largo ?? 0)) || 0;
  const alto = Number.parseFloat(String(fila.alto ?? 0)) || 0;
  const ancho = Number.parseFloat(String(fila.ancho ?? 0)) || 0;
  const volumenMetrosCubicos =
    largo > 0 && alto > 0 && ancho > 0
      ? Number.parseFloat(((largo * alto * ancho) / 1_000_000).toFixed(6))
      : 0;
  const unidadPesoId =
    fila.unidadPeso === null || fila.unidadPeso === undefined ? "" : String(fila.unidadPeso);
  const codTipoUnidadMedida = unidadPesoId
    ? Number.parseInt(unidadPesoId, 10) || 0
    : Number(fila.unidadMedida ?? 0) || 0;
  const cwValue =
    fila.cw !== undefined && fila.cw !== null && String(fila.cw).trim() !== ""
      ? Number(fila.cw)
      : pesoTotal;
  const tipoEmbalajeRaw = fila.tipoEmbalaje ?? "";
  const tipoEmbalajeLabel = (() => {
    if (tipoEmbalajeRaw === "" || tipoEmbalajeRaw == null) return "";
    const found = tiposEmbalajeCatalog.find(
      (t) => String(t.value ?? t.codTipo ?? t.cod_tipo ?? "") === String(tipoEmbalajeRaw),
    );
    return found
      ? String(found.label ?? found.nomTipo ?? found.nom_tipo ?? tipoEmbalajeRaw)
      : String(tipoEmbalajeRaw);
  })();

  return {
    embarque_id: embarqueIdNum,
    rubro_id: fila.rubroId || null,
    bultos: cantidad,
    cod_tipo_unidad_medidad: codTipoUnidadMedida,
    tipo_id_unidad_medida: codTipoUnidadMedida,
    peso: pesoTotal,
    cw: cwValue,
    char_w: cwValue,
    volumen: volumenTotal,
    metros_cubicos: volumenMetrosCubicos,
    largo,
    alto,
    ancho,
    valor: Number(fila.valor) || 0,
    estado_cod: 1,
    descripcion_carga: fila.descripcion || "",
    cod_pais_origen_carga: fila.paisOrigenId || "",
    partida_arancelaria: String(fila.partidaArancelaria ?? "").replaceAll(".", ""),
    regimen_aduanal: fila.regimenAduanal ?? "",
    cod_tipo_embalaje:
      tipoEmbalajeRaw !== "" && tipoEmbalajeRaw != null ? Number(tipoEmbalajeRaw) || null : null,
    tipo_embalaje: tipoEmbalajeLabel,
    definitivo_general: String(fila.definitivoGeneral ?? "N").toLowerCase() === "s" ? "s" : "n",
  };
}

/**
 * Overrides de la coordinación derivados de `carta_facturacion.detalles`:
 * labels resueltos contra catálogos, peligrosidad a booleano +
 * cargaValiosa/coberturaSeguro en json_datos_opcionales y documentosCropa a
 * json_documentos.
 */
export function construirDetallesOverrides(
  detalles: JsonRecord | null | undefined,
  catalogos: CommitCatalogos,
  embarqueData: JsonRecord | null | undefined,
  cropaDocKeys: string[],
): JsonRecord {
  if (!detalles) return {};
  const overrides: JsonRecord = {};

  if (detalles.tipoPago !== undefined) {
    overrides.cod_tipo_pago = resolveCatalogValue(detalles.tipoPago, catalogos.tiposPagoCatalog);
  }
  if (detalles.tipoCarga !== undefined) {
    overrides.cod_tipo_carga = resolveCatalogValue(detalles.tipoCarga, catalogos.tiposCargaCatalog);
  }
  if (detalles.servicio !== undefined) {
    overrides.cod_servicio = resolveCatalogValue(detalles.servicio, catalogos.tiposServicioCatalog);
  }
  if (detalles.incoterm !== undefined) {
    overrides.incoterm_id = toNum(detalles.incoterm);
  }
  if (detalles.clasificacionCarga !== undefined) {
    overrides.cod_clasificacion_carga = toNum(detalles.clasificacionCarga);
  }
  if (detalles.instruccionesManejo !== undefined) {
    overrides.observacion = detalles.instruccionesManejo || "";
  }
  if (Array.isArray(detalles.peligrosidad)) {
    const peligrosidad = detalles.peligrosidad as unknown[];
    // "Carga Peligrosa" (checkbox "S") ya no existe en CTS: el criterio se
    // movió a clasificacionCarga (ver detalles-publica-model.ts).
    overrides.peligrosidad = Number(detalles.clasificacionCarga) === CLASIFICACION_CARGA_PELIGROSA;
    overrides.json_datos_opcionales = {
      ...parseJsonOpcionales(embarqueData),
      cargaValiosa: peligrosidad.includes("V"),
      coberturaSeguro: peligrosidad.includes("C"),
    };
  }
  if (Array.isArray(detalles.documentosCropa)) {
    const seleccion = (detalles.documentosCropa as unknown[]).map(String);
    const documentosCropaMap = cropaDocKeys.reduce<Record<string, boolean>>((acc, key) => {
      acc[key] = seleccion.includes(String(key));
      return acc;
    }, {});
    overrides.json_documentos = JSON.stringify(documentosCropaMap);
  }

  return overrides;
}

/**
 * `jsonCartaCliente` es un snapshot capturado al abrir el modal — puede quedar
 * desactualizado respecto al entidad_id que esta misma corrida acaba de
 * crear/actualizar. Si se persiste tal cual como el nuevo `json_data`, un
 * reintento posterior vuelve a leer el entidad_id VIEJO y reprocesa esa entidad
 * abandonada (p.ej. "Direccion no localizada, verificar"). Se sobreescriben los
 * campos de entidad con los que la corrida realmente aplicó (coordOverrides)
 * para que la carta persistida no quede desfasada — clave para que los
 * reintentos sean idempotentes.
 */
export function sincronizarCartaConOverrides(
  jsonCartaCliente: JsonRecord,
  coordOverrides: JsonRecord,
): JsonRecord {
  const lcFinal = {
    ...((jsonCartaCliente["lista-coordinacion"] as JsonRecord | undefined) || {}),
  };
  if (coordOverrides.cod_entidad_shipper != null) {
    lcFinal.entidad_id_shipper = coordOverrides.cod_entidad_shipper;
    lcFinal.carta_shipper = {
      ...((lcFinal.carta_shipper as JsonRecord | undefined) || {}),
      entidad_id: coordOverrides.cod_entidad_shipper,
    };
  }
  if (coordOverrides.cod_entidad_consignatario != null) {
    lcFinal.entidad_id_consignatario = coordOverrides.cod_entidad_consignatario;
    lcFinal.carta_consignatario = {
      ...((lcFinal.carta_consignatario as JsonRecord | undefined) || {}),
      entidad_id: coordOverrides.cod_entidad_consignatario,
    };
  }
  return { ...jsonCartaCliente, "lista-coordinacion": lcFinal };
}

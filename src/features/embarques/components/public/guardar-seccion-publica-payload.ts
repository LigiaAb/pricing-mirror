/**
 * Construcción pura del payload `{json_data, json_data_usuario}` para
 * `useGuardarSeccionPublica`: separado del hook para mantenerlo bajo el
 * límite de tamaño de archivo y para poder testear la lógica de armado sin
 * mockear React Query.
 */

import {
  buildCartaJson,
  buildEntidadRelacionadaSlim,
  buildFacturacionMods,
  extraerCamposModificados,
} from "@/features/carta-instrucciones";
import { normalizarCargasParaGuardado } from "@/features/embarques/lib/cargas-pdf";
import { unionModificados } from "./secciones/validation";

type JsonRecord = Record<string, unknown>;

/**
 * Array slim `recuperar-datos-entidad-relacionada`: entidad_id + campos que
 * el cliente cambió respecto al maestro. Una entidad recién creada vía
 * "Crear Entidad" no trae entidad_id — se envía igual para que el backend la
 * cree al procesar actualizar-json-link.
 */
function buildEntidadRelacionada(
  shipperValues: JsonRecord,
  consignatarioValues: JsonRecord,
  allEntidadesActual: JsonRecord[],
  industriaLabel: (value: unknown) => string | null | undefined,
): JsonRecord[] {
  const entidadRelacionada: JsonRecord[] = [];
  const pushSlim = (formVals: JsonRecord) => {
    const eid = formVals?.entidad_id;
    const esNueva = (eid == null || eid === "") && Boolean(formVals?.entidad_nombre);
    if (eid == null || eid === "") {
      if (!esNueva) return;
    } else if (entidadRelacionada.some((x) => String(x.entidad_id) === String(eid))) {
      return;
    }
    const raw = esNueva
      ? null
      : allEntidadesActual.find((e) => String(e.entidad_id) === String(eid));
    const slim = buildEntidadRelacionadaSlim(raw, formVals, { industriaLabel });
    if (slim) entidadRelacionada.push(slim);
  };
  pushSlim(shipperValues);
  pushSlim(consignatarioValues);
  return entidadRelacionada;
}

export interface GuardarSeccionValores {
  jsonCartaCliente: JsonRecord | null;
  cartaListaCoordinacionGuardada: JsonRecord;
  cargas: JsonRecord[];
  fechasMovOriginales: JsonRecord[];
  shipperValues: JsonRecord;
  consignatarioValues: JsonRecord;
  facturacionValues: { cliente?: JsonRecord; detalles?: JsonRecord };
  fechasValues: JsonRecord;
  notificacionesValues: JsonRecord;
  cargasPublicasValues: JsonRecord[];
  documentosCropa: Record<string, boolean>;
  entidadIdShipperCoord: unknown;
  entidadIdConsignatarioCoord: unknown;
  allEntidades: JsonRecord[];
}

export function buildGuardarSeccionPayload(
  valores: GuardarSeccionValores,
  overrideCargas: JsonRecord[] | undefined,
  industriaLabel: (value: unknown) => string | null | undefined,
) {
  const {
    jsonCartaCliente,
    cartaListaCoordinacionGuardada,
    cargas,
    fechasMovOriginales,
    shipperValues,
    consignatarioValues,
    facturacionValues,
    fechasValues,
    notificacionesValues,
    cargasPublicasValues,
    documentosCropa,
    entidadIdShipperCoord,
    entidadIdConsignatarioCoord,
    allEntidades,
  } = valores;

  const cargasBase = (() => {
    if (cargasPublicasValues.length > 0) return cargasPublicasValues;
    const saved = jsonCartaCliente?.["lista-coordinacion-carga"];
    if (Array.isArray(saved) && saved.length > 0) return saved as JsonRecord[];
    return cargas;
  })();

  const cargasChanged = overrideCargas !== undefined || cargasPublicasValues.length > 0;
  // G2: normaliza largo/ancho/alto (7 variantes de clave posibles según la
  // fuente) antes de guardar, para que la sección Producto y el PDF lean
  // siempre la misma dimensión sin importar de dónde vino la fila.
  const cargasToSend = normalizarCargasParaGuardado(overrideCargas ?? cargasBase);

  // En público las fechas de recolección pertenecen al shipper: se unen a
  // sus _modificados para viajar dentro de carta_shipper y como carta_fechas.
  const shipperCamposUnidos = {
    ...shipperValues,
    ...fechasValues,
    _modificados: unionModificados(
      Array.isArray(shipperValues?._modificados) ? (shipperValues._modificados as string[]) : [],
      Array.isArray(fechasValues?._modificados) ? (fechasValues._modificados as string[]) : [],
    ),
  };
  const shipperMods = extraerCamposModificados(shipperCamposUnidos);
  const consignatarioMods = extraerCamposModificados(consignatarioValues);
  const facturacionMods = buildFacturacionMods(
    extraerCamposModificados(facturacionValues?.cliente ?? {}),
    extraerCamposModificados(facturacionValues?.detalles ?? {}),
  );
  const notificacionesMods =
    Object.keys(notificacionesValues).length > 0 ? notificacionesValues : null;
  const fechasMods = fechasValues?.fecha_recoleccion
    ? { fecha_recoleccion: fechasValues.fecha_recoleccion }
    : null;
  const cropaChanged = Object.values(documentosCropa).some(Boolean);
  const documentosMods = cropaChanged ? { cropa: documentosCropa } : null;

  return buildCartaJson({
    originals: {
      // La carta ya fusionada (no el resumen crudo) como base de "lo ya
      // guardado": preserva las secciones guardadas previamente al guardar
      // solo la actual.
      listaCoordinacion: cartaListaCoordinacionGuardada,
      cargas,
      fechasMov:
        (jsonCartaCliente?.["lista-coordinacion-fecha-mov"] as JsonRecord[] | undefined) ??
        fechasMovOriginales,
    },
    secciones: {
      shipperMods,
      consignatarioMods,
      facturacionMods,
      notificacionesMods,
      fechasMods,
      documentosMods,
      cargas: cargasToSend,
      cargasChanged,
    },
    entidades: {
      shipper: {
        selected: shipperValues?.entidad_id,
        original: entidadIdShipperCoord,
        explicito:
          Array.isArray(shipperValues?._modificados) &&
          (shipperValues._modificados as string[]).includes("entidad_id"),
      },
      consignatario: {
        selected: consignatarioValues?.entidad_id,
        original: entidadIdConsignatarioCoord,
        explicito:
          Array.isArray(consignatarioValues?._modificados) &&
          (consignatarioValues._modificados as string[]).includes("entidad_id"),
      },
    },
    entidadRelacionada: buildEntidadRelacionada(
      shipperValues,
      consignatarioValues,
      allEntidades,
      industriaLabel,
    ),
  });
}

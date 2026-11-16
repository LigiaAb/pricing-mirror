/**
 * Upserts de los sub-registros de una entidad (dirección, contacto,
 * identificación) para el motor "Crear Coordinación". La decisión
 * insertar-* vs actualizar-* la da la EXISTENCIA REAL del registro traído del
 * backend (id presente), nunca el estado de la carta.
 */

import { assertOk, toNum } from "./helpers";
import type { CommitApi, CommitEntidadParams, JsonRecord } from "./tipos";

export async function postChecked(
  api: CommitApi,
  url: string,
  body: JsonRecord,
  accion: string,
): Promise<JsonRecord> {
  const response = await api.post(url, body);
  assertOk(response, accion);
  return (response ?? {}) as JsonRecord;
}

/** Decide el endpoint por la EXISTENCIA REAL del sub-registro (id presente). */
async function upsertByExistence(
  api: CommitApi,
  {
    existing,
    idKey,
    payload,
    insertUrl,
    updateUrl,
    accion,
  }: {
    existing: JsonRecord | null;
    idKey: string;
    payload: JsonRecord;
    insertUrl: string;
    updateUrl: string;
    accion: string;
  },
): Promise<JsonRecord> {
  if (existing?.[idKey]) {
    return postChecked(
      api,
      updateUrl,
      { ...payload, [idKey]: Number(existing[idKey]) },
      `actualizar ${accion}`,
    );
  }
  return postChecked(api, insertUrl, payload, `insertar ${accion}`);
}

export async function upsertDireccion(
  api: CommitApi,
  params: CommitEntidadParams,
  entidadId: number,
  direcciones: JsonRecord[],
): Promise<void> {
  const mods = params.mods;
  // El subtipo (145 recolección, 12/11 fiscal/facturación) viene en `cod_tipo`
  // de cada registro; se elige el candidato que exista (o el primero).
  const addressCodTipo =
    params.addressCodTipoCandidates.find((cod) =>
      direcciones.some((d) => Number(d.cod_tipo) === cod),
    ) || params.addressCodTipoCandidates[0];
  const existing = direcciones.find((d) => Number(d.cod_tipo) === addressCodTipo) || null;
  await upsertByExistence(api, {
    existing,
    idKey: "entidaddireccion_id",
    payload: {
      entidad_id: entidadId,
      cod_tipo: existing?.cod_tipo || addressCodTipo,
      entidaddireccion_direccion:
        mods.direccion_recoleccion ?? existing?.entidaddireccion_direccion ?? "",
      entidaddireccion_zona: existing?.entidaddireccion_zona || "",
      entidaddireccion_km: existing?.entidaddireccion_km || null,
      cod_pais: toNum(mods.direccion_recoleccion_pais ?? existing?.cod_pais),
      cod_depto: toNum(mods.direccion_recoleccion_depto ?? existing?.cod_depto),
      cod_muni: toNum(mods.direccion_recoleccion_muni ?? existing?.cod_muni),
      cod_estado: 1,
    },
    insertUrl: "/api/appweb/insertar-entidad-direccion",
    updateUrl: "/api/appweb/actualizar-entidad-direccion",
    accion: "la dirección",
  });
}

export async function upsertContacto(
  api: CommitApi,
  params: CommitEntidadParams,
  entidadId: number,
  contactos: JsonRecord[],
  writeContact: boolean,
): Promise<number | null> {
  const mods = params.mods;
  const savedContactoId = mods.entidadcontacto_id ? Number(mods.entidadcontacto_id) : null;
  const existingContacto =
    (savedContactoId && contactos.find((c) => Number(c.entidadcontacto_id) === savedContactoId)) ||
    contactos[0] ||
    null;
  let contactoId = existingContacto?.entidadcontacto_id
    ? Number(existingContacto.entidadcontacto_id)
    : savedContactoId;

  if (!writeContact) return contactoId;

  const tiposExistentes = Array.isArray(existingContacto?.data_entidad_contacto_tipo)
    ? (existingContacto.data_entidad_contacto_tipo as JsonRecord[]).map((t) => t.cod_tipo)
    : [];
  const res = await upsertByExistence(api, {
    existing: existingContacto,
    idKey: "entidadcontacto_id",
    payload: {
      entidad_id: entidadId,
      cod_estado: 1,
      entidadcontacto_nombre:
        mods.entidad_contacto_nombre ?? existingContacto?.entidadcontacto_nombre ?? "",
      entidadcontacto_email:
        mods.entidad_contacto_email ?? existingContacto?.entidadcontacto_email ?? "",
      entidadcontacto_telefono:
        mods.entidad_contacto_telefono ?? existingContacto?.entidadcontacto_telefono ?? "",
      lista_cod_tipo: mods._contacto_tipo_list ?? tiposExistentes,
      cod_emp: params.empresaId,
      cod_cc: params.centroCostoId,
    },
    insertUrl: "/api/appweb/insertar-entidad-contacto",
    updateUrl: "/api/appweb/actualizar-entidad-contacto",
    accion: "el contacto",
  });
  const resInner = (res.data ?? {}) as JsonRecord;
  if (existingContacto?.entidadcontacto_id) {
    contactoId = Number(existingContacto.entidadcontacto_id);
  } else if (resInner.entidadcontacto_id) {
    contactoId = Number(resInner.entidadcontacto_id);
  }
  return contactoId;
}

export async function upsertIdentificacion(
  api: CommitApi,
  params: CommitEntidadParams,
  entidadId: number,
  identificaciones: JsonRecord[],
): Promise<void> {
  const mods = params.mods;
  const existing = identificaciones[0] || null;
  await upsertByExistence(api, {
    existing,
    idKey: "entidadidentificacion_id",
    payload: {
      entidad_id: entidadId,
      cod_identificacion: params.nitCodIdentificacion,
      // sic: el backend espera la clave con typo (sin la N final).
      entidadidentificacio_numero: mods.entidad_nit ?? existing?.entidadidentificacion_numero ?? "",
      cod_estado: existing?.cod_estado ?? 1,
      entidadidentificacion_fecha_inicio: existing?.entidadidentificacion_fecha_inicio || null,
      entidadidentificacion_fecha_fin: existing?.entidadidentificacion_fecha_fin || null,
      entidadidentificacion_ruta: existing?.entidadidentificacion_ruta || null,
    },
    insertUrl: "/api/appweb/insertar-entidad-identificacion",
    updateUrl: "/api/appweb/actualizar-entidad-identificacion",
    accion: "la identificación",
  });
}

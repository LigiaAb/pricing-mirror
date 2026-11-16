/**
 * Aplica a sus endpoints reales la entidad + dirección + contacto +
 * identificación de un rol (shipper/consignatario/cliente).
 *
 * La decisión insertar-* vs actualizar-* NO depende del estado de la carta ni
 * de `_modificados`, sino de la EXISTENCIA REAL verificada contra el backend:
 *   - Entidad: `resolveEntidadExistente` decide si existe (→ actualizar-entidad)
 *     o es nueva (→ insertar-entidad + relación con el cliente).
 *   - Cada sub-registro: se trae del backend y el upsert decide por el id del
 *     registro (existe → actualizar-, no existe → insertar-).
 *
 * `_modificados` / la presencia de datos solo deciden SI se escribe (para no
 * pisar datos no tocados de una entidad existente), nunca QUÉ endpoint se usa.
 * Regla por sub-registro: entidad nueva → se escribe lo que traiga datos;
 * existente → solo lo marcado en `_modificados`.
 */

import { REL_ENTIDAD_CLIENTE } from "../constantes";
import {
  fetchEntidadContactos,
  fetchEntidadDirecciones,
  fetchEntidadIdentificaciones,
  fetchEntidadInfo,
  resolveEntidadExistente,
} from "./entidad-lookup";
import { toNum } from "./helpers";
import {
  postChecked,
  upsertContacto,
  upsertDireccion,
  upsertIdentificacion,
} from "./sub-registros";
import type { CommitApi, CommitEntidadParams, JsonRecord, ResultadoCommitEntidad } from "./tipos";

export type { CommitEntidadParams } from "./tipos";

interface EscrituraSubRegistros {
  writeAddress: boolean;
  writeContact: boolean;
  writeIdent: boolean;
  touchesInfo: boolean;
}

function decidirEscrituras(mods: JsonRecord, isNew: boolean): EscrituraSubRegistros {
  const modificados = new Set(
    Array.isArray(mods._modificados) ? (mods._modificados as string[]) : [],
  );
  const infoFields = [
    "entidad_nombre",
    "entidad_pais",
    "direccion_recoleccion_ciudad",
    "entidad_industria",
  ];
  const addressFields = [
    "direccion_recoleccion",
    "direccion_recoleccion_pais",
    "direccion_recoleccion_depto",
    "direccion_recoleccion_muni",
  ];
  const contactFields = [
    "entidad_contacto_nombre",
    "entidad_contacto_email",
    "entidad_contacto_telefono",
    "_contacto_tipo_list",
  ];

  const hasAddressData = Boolean(
    mods.direccion_recoleccion ||
      mods.direccion_recoleccion_pais ||
      mods.direccion_recoleccion_muni,
  );
  const hasContactData = Boolean(
    mods.entidad_contacto_nombre || mods.entidad_contacto_email || mods.entidad_contacto_telefono,
  );
  const hasIdentData = Boolean(mods.entidad_nit);

  return {
    touchesInfo: infoFields.some((f) => modificados.has(f)),
    writeAddress: isNew ? hasAddressData : addressFields.some((f) => modificados.has(f)),
    writeContact: isNew ? hasContactData : contactFields.some((f) => modificados.has(f)),
    writeIdent: isNew ? hasIdentData : modificados.has("entidad_nit"),
  };
}

async function crearEntidadNueva(
  api: CommitApi,
  params: CommitEntidadParams,
  nombre: string,
): Promise<number | null> {
  const mods = params.mods;
  const insertResp = await postChecked(
    api,
    "/api/appweb/insertar-entidad",
    {
      entidad_nombre: nombre,
      cod_pais: toNum(mods.entidad_pais),
      cod_ciudad: toNum(mods.direccion_recoleccion_ciudad),
      cod_industria: toNum(mods.entidad_industria),
      limite_credito: 0,
      cod_moneda: null,
      credito_utilizado: 0,
      cod_estado: 1,
      cod_tipo: params.entidadTipo,
    },
    "crear la entidad",
  );
  const inner = (insertResp.data ?? {}) as JsonRecord;
  const entidadId = toNum(inner.entidad_id ?? insertResp.entidad_id);
  if (!entidadId) return null;

  // Relación con el cliente para que la entidad aparezca en las consultas de
  // entidades-relacionadas.
  if (params.entidadIdCliente) {
    await postChecked(
      api,
      "/api/appweb/insertar-entidad-relacion",
      {
        cod_estado: 1,
        cod_tipo: REL_ENTIDAD_CLIENTE,
        entidad_id_1: toNum(params.entidadIdCliente),
        entidad_id_2: entidadId,
      },
      "relacionar la entidad con el cliente",
    );
  }
  return entidadId;
}

async function actualizarInfoEntidad(
  api: CommitApi,
  params: CommitEntidadParams,
  entidadId: number,
  entidadInfo: JsonRecord | null,
): Promise<void> {
  const mods = params.mods;
  const info = entidadInfo ?? (await fetchEntidadInfo(api, entidadId, params.tipoEntidadFiltro));
  await postChecked(
    api,
    "/api/appweb/actualizar-entidad",
    {
      entidad_id: entidadId,
      entidad_nombre: mods.entidad_nombre ?? info?.entidad_nombre ?? "",
      cod_pais: toNum(mods.entidad_pais ?? info?.cod_pais),
      cod_ciudad: toNum(mods.direccion_recoleccion_ciudad ?? info?.cod_ciudad),
      cod_industria: toNum(mods.entidad_industria ?? info?.cod_industria),
      cod_estado: info?.cod_estado || 1,
    },
    "actualizar la entidad",
  );
}

/** Devuelve { entidadId, contactoId } para reportarlos a la coordinación. */
export async function commitEntidad(
  deps: {
    api: CommitApi;
    fetchEntidadesRelacionadas(params: JsonRecord): Promise<{ data: JsonRecord[] }>;
  },
  params: CommitEntidadParams,
): Promise<ResultadoCommitEntidad> {
  const { api } = deps;
  const mods = params.mods || {};
  const nombre = String(mods.entidad_nombre ?? params.nombreFallback ?? "");

  const resuelta = await resolveEntidadExistente(deps, {
    // `mods.entidad_id` (carta_${rol}.entidad_id) es la selección real del
    // formulario; candidato adicional por si no llegó a persistirse en la
    // coordinación.
    candidateId: params.candidateEntidadId ?? mods.entidad_id,
    verify: params.verifyExistence ?? true,
    nombre,
    aliases: params.aliases,
    tipoEntidadFiltro: params.tipoEntidadFiltro,
    tipoEntidadNombre: params.tipoEntidadNombre,
    entidadIdCliente: params.entidadIdCliente,
    clienteNombre: params.clienteNombre,
  });

  let entidadId = resuelta.entidadId;
  const isNew = !resuelta.exists;

  if (isNew) {
    if (!(params.allowCreate ?? true)) return { entidadId: null, contactoId: null };
    // Sin nombre no hay entidad que crear (campo requerido del formulario).
    if (!nombre) return { entidadId: null, contactoId: null };
    entidadId = await crearEntidadNueva(api, params, nombre);
  }

  const numEntidadId = toNum(entidadId);
  if (!numEntidadId) return { entidadId: null, contactoId: null };

  const { writeAddress, writeContact, writeIdent, touchesInfo } = decidirEscrituras(mods, isNew);

  // Para una entidad existente se traen los sub-registros del backend para que
  // el upsert decida insertar-/actualizar-. Para una recién creada las listas
  // quedan vacías → siempre inserta. El contacto de una entidad existente se
  // resuelve SIEMPRE (aunque no cambiara) para reportar contacto_id_*.
  const [direcciones, contactos, identificaciones] = await Promise.all([
    !isNew && writeAddress
      ? fetchEntidadDirecciones(api, { codTipos: [params.entidadTipo], entidadId: numEntidadId })
      : Promise.resolve([] as JsonRecord[]),
    isNew
      ? Promise.resolve([] as JsonRecord[])
      : fetchEntidadContactos(api, { codTipo: params.entidadTipo, entidadId: numEntidadId }),
    !isNew && writeIdent
      ? fetchEntidadIdentificaciones(api, {
          codTipo: params.entidadTipo,
          entidadId: numEntidadId,
          codIdentificacion: params.nitCodIdentificacion,
        })
      : Promise.resolve([] as JsonRecord[]),
  ]);

  // Info de la entidad: solo se actualiza para una existente (la nueva ya
  // insertó nombre/país/ciudad/industria al crearse).
  if (!isNew && touchesInfo) {
    await actualizarInfoEntidad(api, params, numEntidadId, resuelta.entidadInfo);
  }

  if (writeAddress) {
    await upsertDireccion(api, params, numEntidadId, direcciones);
  }

  const contactoId = await upsertContacto(api, params, numEntidadId, contactos, writeContact);

  if (writeIdent) {
    await upsertIdentificacion(api, params, numEntidadId, identificaciones);
  }

  return { entidadId: numEntidadId, contactoId };
}

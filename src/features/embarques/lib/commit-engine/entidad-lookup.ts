/**
 * Resolución de existencia real de entidades y sus sub-registros contra el
 * backend (port de useCommitPendingChanges del legacy). Las claves llegan ya
 * en minúsculas: el núcleo HTTP normaliza el casing del backend una sola vez.
 */

import { unwrapEnvelope } from "@/shared/api/envelope";
import { REL_ENTIDAD_CLIENTE } from "../constantes";
import { normalizeNombreEntidad, toNum } from "./helpers";
import type { CommitApi, JsonRecord } from "./tipos";

/**
 * Solo un registro ACTIVO (cod_estado === 1) puede actualizarse: el backend de
 * actualizar-entidad-{direccion,contacto,identificacion} responde "no
 * localizado" si el id apunta a un registro inactivo. Por eso los sub-registros
 * se filtran a activos; si no hay ninguno activo se INSERTA.
 */
const ACTIVO = 1;
const esActivo = (r: JsonRecord): boolean => Number(r?.cod_estado) === ACTIVO;

export async function fetchEntidadInfo(
  api: CommitApi,
  entidadId: number,
  tipoEntidad: string,
): Promise<JsonRecord | null> {
  const response = await api.get("/api/appweb/lista-entidad", {
    params: { entidad_id: entidadId, tipo_entidad: tipoEntidad },
  });
  const list = unwrapEnvelope<JsonRecord>(response);
  return list[0] || null;
}

/**
 * El parámetro `cod_tipo` de lista-entidad-direccion es el TIPO DE ENTIDAD
 * (155 shipper, 156 consignatario, 3/5 cliente) — igual que en
 * lista-entidad-contacto — y devuelve TODAS las direcciones de la entidad. El
 * subtipo real de cada dirección (145=recolección, 12/11=facturación/fiscal)
 * viene en el campo `cod_tipo` de cada registro; la lógica de upsert filtra
 * por ese subtipo. Consultar aquí por el subtipo devolvía vacío y provocaba
 * direcciones duplicadas en vez de actualizar la existente.
 */
export async function fetchEntidadDirecciones(
  api: CommitApi,
  { codTipos, entidadId }: { codTipos: number[]; entidadId: number },
): Promise<JsonRecord[]> {
  const listas = await Promise.all(
    codTipos.map((cod_tipo) =>
      api
        .get("/api/appweb/lista-entidad-direccion", {
          params: { cod_tipo, entidad_id: entidadId },
        })
        .then((r) => unwrapEnvelope<JsonRecord>(r)),
    ),
  );
  return listas.flat().filter(esActivo);
}

export async function fetchEntidadContactos(
  api: CommitApi,
  { codTipo, entidadId }: { codTipo: number; entidadId: number },
): Promise<JsonRecord[]> {
  const response = await api.get("/api/appweb/lista-entidad-contacto", {
    params: { cod_tipo: codTipo, entidad_id: entidadId },
  });
  return unwrapEnvelope<JsonRecord>(response).filter(esActivo);
}

export async function fetchEntidadIdentificaciones(
  api: CommitApi,
  {
    codTipo,
    entidadId,
    codIdentificacion,
  }: { codTipo: number; entidadId: number; codIdentificacion: number },
): Promise<JsonRecord[]> {
  const response = await api.get("/api/appweb/lista-entidad-identificacion", {
    params: { cod_tipo: codTipo, entidad_id: entidadId, cod_identificacion: codIdentificacion },
  });
  return unwrapEnvelope<JsonRecord>(response).filter(esActivo);
}

/**
 * Busca, entre las entidades YA relacionadas al cliente (cod_tipo 300), una que
 * coincida por nombre con la que se está por crear. Sin esto, un reintento de
 * "Crear Coordinación" (p.ej. porque un paso posterior falló antes de
 * sincronizar el entidad_id de vuelta a la carta) volvía a llamar
 * insertar-entidad con el mismo nombre y el backend rechazaba el duplicado.
 */
export function matchEntidadRelacionadaPorNombre(
  lista: JsonRecord[],
  nombre: unknown,
  aliases: ReadonlySet<string>,
): number | null {
  const nombreNorm = normalizeNombreEntidad(nombre);
  if (!nombreNorm) return null;
  const match = lista.find((raw) => {
    const clasificacion = normalizeNombreEntidad(raw.entidad_clasificacion);
    const tipoRelacion = normalizeNombreEntidad(raw.descripcion_tipo_relacion);
    const perteneceRol = clasificacion ? aliases.has(clasificacion) : aliases.has(tipoRelacion);
    if (!perteneceRol) return false;
    return normalizeNombreEntidad(raw.entidad_nombre) === nombreNorm;
  });
  return match ? toNum(match.entidad_id) : null;
}

/**
 * Entre las coincidencias exactas por nombre dentro del tipo del rol, se
 * prefieren los registros activos y, entre ellos, el de menor id para que la
 * elección sea determinista.
 */
export function elegirEntidadPorNombre(lista: JsonRecord[], nombre: unknown): number | null {
  const nombreNorm = normalizeNombreEntidad(nombre);
  if (!nombreNorm) return null;
  const coincidencias = lista.filter(
    (raw) => normalizeNombreEntidad(raw.entidad_nombre) === nombreNorm,
  );
  if (coincidencias.length === 0) return null;

  const activas = coincidencias.filter(
    (raw) => raw.cod_estado == null || Number(raw.cod_estado) === ACTIVO,
  );
  const pool = activas.length ? activas : coincidencias;

  return (
    pool
      .map((raw) => toNum(raw.entidad_id))
      .filter((id): id is number => id != null)
      .sort((a, b) => a - b)[0] ?? null
  );
}

/**
 * Última red de seguridad antes de insertar: busca una entidad EXISTENTE por
 * nombre exacto dentro del tipo del rol, aunque NO esté relacionada al cliente.
 * Cubre el caso real en que el asesor usa "NUEVO" y teclea el nombre de una
 * entidad que ya existe en el sistema: sin esto, insertar-entidad devolvía
 * "[1047]: Ya existe una entidad con esos datos, verifique". Reutilizar el id
 * existente convierte la operación en actualizar-entidad.
 */
export async function buscarEntidadPorNombreEnTipo(
  api: CommitApi,
  { tipoEntidadNombre, nombre }: { tipoEntidadNombre: string; nombre: unknown },
): Promise<number | null> {
  if (!tipoEntidadNombre || !normalizeNombreEntidad(nombre)) return null;
  const response = await api.get("/api/appweb/lista-entidad", {
    params: { tipo_entidad: tipoEntidadNombre },
  });
  return elegirEntidadPorNombre(unwrapEnvelope<JsonRecord>(response), nombre);
}

export interface ResolverEntidadParams {
  candidateId: unknown;
  verify: boolean;
  nombre: string;
  aliases?: ReadonlySet<string> | undefined;
  tipoEntidadFiltro: string;
  tipoEntidadNombre?: string | undefined;
  entidadIdCliente: unknown;
  clienteNombre?: string | undefined;
}

export interface EntidadResuelta {
  entidadId: number | null;
  exists: boolean;
  entidadInfo: JsonRecord | null;
}

/**
 * Resuelve, contra el backend, si la entidad de un rol YA existe o es nueva.
 * ÚNICA fuente de verdad para decidir insertar-entidad vs actualizar-entidad
 * (y, en cascada, para los sub-registros): NO se confía en el estado de la
 * carta. Orden:
 *   1. Id candidato verificado con lista-entidad → existe (se reutiliza la info).
 *   2. El nombre coincide con el cliente → se reutiliza el entidad_id del
 *      cliente (el shipper puede SER el propio cliente; crear duplicaría).
 *   3. Match por nombre entre relacionadas al cliente (reintento de una corrida
 *      previa que creó la entidad sin sincronizar la carta).
 *   4. Match global por nombre dentro del tipo del rol.
 *   5. Candidato sin verificar y sin match → se CONSERVA como existente (no se
 *      puede confirmar que NO exista, y crear duplicaría).
 *   6. Sin id y sin match → entidad NUEVA.
 * `verify: false` (cliente/facturación) da por existente el candidato sin
 * consultar.
 */
async function buscarPorNombre(
  deps: {
    api: CommitApi;
    fetchEntidadesRelacionadas(params: JsonRecord): Promise<{ data: JsonRecord[] }>;
  },
  { nombre, aliases, tipoEntidadNombre, entidadIdCliente, clienteNombre }: ResolverEntidadParams,
): Promise<number | null> {
  if (!nombre) return null;

  if (
    entidadIdCliente &&
    clienteNombre &&
    normalizeNombreEntidad(nombre) === normalizeNombreEntidad(clienteNombre)
  ) {
    return toNum(entidadIdCliente);
  }

  if (aliases && entidadIdCliente) {
    const { data: relacionadas } = await deps.fetchEntidadesRelacionadas({
      entidad_id: entidadIdCliente,
      cod_tipo: REL_ENTIDAD_CLIENTE,
      cod_estado: 1,
    });
    const found = matchEntidadRelacionadaPorNombre(relacionadas ?? [], nombre, aliases);
    if (found) return found;
  }

  if (tipoEntidadNombre) {
    return buscarEntidadPorNombreEnTipo(deps.api, { tipoEntidadNombre, nombre });
  }
  return null;
}

export async function resolveEntidadExistente(
  deps: {
    api: CommitApi;
    fetchEntidadesRelacionadas(params: JsonRecord): Promise<{ data: JsonRecord[] }>;
  },
  params: ResolverEntidadParams,
): Promise<EntidadResuelta> {
  const num = toNum(params.candidateId);

  if (num) {
    if (!params.verify) return { entidadId: num, exists: true, entidadInfo: null };
    const info = await fetchEntidadInfo(deps.api, num, params.tipoEntidadFiltro);
    if (info) return { entidadId: num, exists: true, entidadInfo: info };
  }

  const porNombre = await buscarPorNombre(deps, params);
  if (porNombre) return { entidadId: porNombre, exists: true, entidadInfo: null };

  if (num) return { entidadId: num, exists: true, entidadInfo: null };
  return { entidadId: null, exists: false, entidadInfo: null };
}

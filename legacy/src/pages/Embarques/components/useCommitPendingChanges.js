import { useCallback } from "react";
import { api } from "@/hooks/Bpm/utils/api";
import {
  useFetchEntidades,
  useUpdateCoordinacion,
  useInsertarEntidadDireccion,
  useActualizarEntidadDireccion,
  useInsertarEntidadContacto,
  useActualizarEntidadContacto,
  useInsertarEntidadIdentificacion,
  useActualizarEntidadIdentificacion,
  useInsertarEntidadRelacion,
  useInsertarCoordinacionCarga,
  useActualizarCoordinacionCarga,
  useCreateCoordinacionFechaMov,
  useUpdateCoordinacionFechaMov,
  extractResponseData,
} from "@/hooks/Bpm";
import { buildCoordPayload, getEmbarqueId } from "./secciones/payloadUtils";
import { CROPA_DOCS } from "./secciones/detalles";

// Subtipo de dirección "recolección" usado por shipper/consignatario.
const ADDRESS_COD_TIPO_RECOLECCION = 145;
// id_tipo_fecha de "FECHA DE RECOLECCION" en coordinacion-fecha-mov (mismo que secciones/fechas.jsx).
const RECOLECCION_TIPO_FECHA_ID = 266;

const ROLE_ENTIDAD_TIPO = { shipper: 155, consignatario: 156 };
const ROLE_NIT_COD_IDENTIFICACION = { shipper: 46, consignatario: 49 };
// cod_tipo de la relación entidad-cliente ⇆ shipper/consignatario (mismo que usa
// handleEntidadCreada en entidadPublicFormSection para relacionar la entidad nueva).
const REL_ENTIDAD_CLIENTE_COD_TIPO = 300;
const ROLE_COORD_FIELDS = {
  shipper: { entidadField: "cod_entidad_shipper", contactoField: "contacto_id_shipper" },
  consignatario: { entidadField: "cod_entidad_consignatario", contactoField: "contacto_id_consignatario" },
};
// Nombre a usar al crear una entidad NUEVA cuando `carta_${role}.entidad_nombre`
// no viajó en los mods. Réplica del fallback de nombre que usa el formulario
// (construirEntidadesPublicas): para el shipper el campo Nombre se pre-rellena
// con el nombre del cliente (lc.entidad_nombre/lc.cliente), así que si el asesor
// no lo edita nunca entra en `_modificados` — sin este fallback la entidad
// quedaba sin nombre y no se creaba. El consignatario no hereda ese pre-relleno.
const ROLE_NOMBRE_FALLBACK = {
  shipper: (lc) =>
    lc?.entidad_nombre ?? lc?.cliente ?? lc?.entidadShipperNombre ?? lc?.nombreExp ?? "",
  consignatario: (lc) => lc?.entidadConsignatarioNombre ?? "",
};

// La sección de Facturación (FacturacionPublica) guarda los cambios del cliente
// con nombres de campo propios (camelCase) distintos a los canónicos que espera
// commitEntidad (los mismos de shipper/consignatario). Sin esta
// traducción, `_modificados` nunca coincide con infoFields/contactFields/… y la
// entidad de facturación no se actualiza (Ciudad, Email, Nombre, NIT, etc.).
const FACTURACION_FIELD_MAP = {
  cliente: "entidad_nombre",
  entidadPais: "entidad_pais",
  entidadCiudad: "direccion_recoleccion_ciudad",
  entidadIndustria: "entidad_industria",
  direccionFiscal: "direccion_recoleccion",
  direccionFiscalPais: "direccion_recoleccion_pais",
  direccionFiscalDepto: "direccion_recoleccion_depto",
  direccionFiscalMuni: "direccion_recoleccion_muni",
  clienteContacto: "entidad_contacto_nombre",
  clienteContactoEmail: "entidad_contacto_email",
  clienteContactoTelefono: "entidad_contacto_telefono",
  numero: "entidad_nit",
};

// Traduce el objeto `carta_facturacion.cliente` al shape canónico (valores +
// _modificados) que consume commitEntidad. Las claves sin mapeo
// (_contacto_tipo_list, entidadcontacto_id, entidad_id) pasan tal cual.
const mapFacturacionMods = (cliente) => {
  if (!cliente || typeof cliente !== "object") return null;
  const mapped = {};
  for (const [key, value] of Object.entries(cliente)) {
    if (key === "_modificados") continue;
    mapped[FACTURACION_FIELD_MAP[key] ?? key] = value;
  }
  const modificados = Array.isArray(cliente._modificados) ? cliente._modificados : [];
  mapped._modificados = modificados.map((m) => FACTURACION_FIELD_MAP[m] ?? m);
  return mapped;
};

const toNum = (v) => (v === undefined || v === null || v === "" ? null : Number(v));

// El interceptor de axios (hooks/Bpm/utils/api.js) NO rechaza la promesa cuando
// el backend responde con `success: false` (solo lo hace para códigos muy
// puntuales) — la respuesta se resuelve igual, así que un `await` normal no
// detecta el fallo. Sin esta verificación explícita, un POST que falla a mitad
// de "Crear Coordinación" (p.ej. insertar-entidad-direccion) se trataba como
// exitoso y la cadena de pasos seguía, dejando la coordinación a medio armar.
// El body real de éxito/error va en `result.data` (el wrapper HTTP es
// `{status, message, data: {success, mensaje, ...}}`); revisar `result.success`
// directamente siempre da `undefined` y nunca detecta un fallo.
function assertOk(result, accion) {
  const payload = result?.data ?? result;
  if (payload && payload.success === false) {
    throw new Error(payload.mensaje || `No se pudo ${accion}.`);
  }
  return result;
}

async function postChecked(url, body, accion) {
  const { data } = await api.post(url, body);
  assertOk(data, accion);
  return data;
}

// Normaliza para comparar nombres de entidad sin importar acentos/mayúsculas.
const normalizeNombreEntidad = (v) =>
  String(v || "").normalize("NFD").replaceAll(/[̀-ͯ]/g, "").trim().toUpperCase();

const ROLE_ALIASES = {
  shipper: new Set(["SHIPPER", "CONSIGNOR", "REMITENTE", "EXPORTADOR", "CLIENTE"]),
  consignatario: new Set(["CONSIGNATARIO", "CONSIGNEE", "DESTINATARIO"]),
};

// Busca, entre las entidades YA relacionadas al cliente (cod_tipo 300), una que
// coincida por nombre con la que se está por crear. Sin esto, un reintento de
// "Crear Coordinación" (p.ej. porque un paso posterior — cargas, fechas —
// falló la primera vez, antes de sincronizar el entidad_id de vuelta a la
// carta) volvía a llamar insertar-entidad con el mismo nombre y el backend
// rechazaba la entidad duplicada.
async function buscarEntidadRelacionadaPorNombre({ entidadIdCliente, nombre, aliases }) {
  const nombreNorm = normalizeNombreEntidad(nombre);
  if (!entidadIdCliente || !nombreNorm) return null;

  const response = await api.get("/api/appweb/recuperar-datos-entidad-relacionada", {
    params: { entidad_id: entidadIdCliente, cod_tipo: 300, cod_estado: 1 },
  });
  const lista = extractResponseData(response);

  const match = lista.find((raw) => {
    const clasificacion = normalizeNombreEntidad(raw.entidad_clasificacion ?? raw.ENTIDAD_CLASIFICACION);
    const tipoRelacion = normalizeNombreEntidad(raw.descripcion_tipo_relacion ?? raw.DESCRIPCION_TIPO_RELACION);
    const perteneceRol = clasificacion ? aliases.has(clasificacion) : aliases.has(tipoRelacion);
    if (!perteneceRol) return false;
    return normalizeNombreEntidad(raw.entidad_nombre ?? raw.ENTIDAD_NOMBRE) === nombreNorm;
  });

  return match ? toNum(match.entidad_id ?? match.ENTIDAD_ID) : null;
}

// tipo_entidad (texto) que espera `lista-entidad` para cada rol; se usa en la
// búsqueda global por nombre (ver buscarEntidadPorNombreEnTipo).
const ROLE_TIPO_ENTIDAD_NOMBRE = { shipper: "SHIPPER", consignatario: "CONSIGNATARIO" };

// Última red de seguridad antes de insertar: busca una entidad EXISTENTE por
// nombre exacto dentro del tipo del rol (lista-entidad?tipo_entidad=SHIPPER/
// CONSIGNATARIO), aunque NO esté relacionada al cliente. Cubre el caso real en
// que el asesor usa "NUEVO" y teclea el nombre de una entidad que ya existe en
// el sistema (p.ej. "Farma Consignatario 1"): sin esto se llamaba insertar-entidad
// y el backend rechazaba el duplicado ("[1047]: Ya existe una entidad con esos
// datos, verifique"). Reutilizar el id existente convierte la operación en
// actualizar-entidad, que es lo correcto. Se prefieren los registros activos y,
// entre ellos, el de menor id para que la elección sea determinista.
async function buscarEntidadPorNombreEnTipo({ tipoEntidadNombre, nombre }) {
  const nombreNorm = normalizeNombreEntidad(nombre);
  if (!tipoEntidadNombre || !nombreNorm) return null;

  const response = await api.get("/api/appweb/lista-entidad", {
    params: { tipo_entidad: tipoEntidadNombre },
  });
  const lista = extractResponseData(response);

  const coincidencias = lista.filter(
    (raw) => normalizeNombreEntidad(raw.entidad_nombre ?? raw.ENTIDAD_NOMBRE) === nombreNorm,
  );
  if (coincidencias.length === 0) return null;

  const estado = (raw) => raw.cod_estado ?? raw.COD_ESTADO;
  const activas = coincidencias.filter((raw) => estado(raw) == null || Number(estado(raw)) === ACTIVO);
  const pool = activas.length ? activas : coincidencias;

  return pool
    .map((raw) => toNum(raw.entidad_id ?? raw.ENTIDAD_ID))
    .filter((id) => id != null)
    .sort((a, b) => a - b)[0] ?? null;
}

async function fetchEntidadInfo(entidadId, tipoEntidad) {
  const response = await api.get("/api/appweb/lista-entidad", {
    params: { entidad_id: entidadId, tipo_entidad: tipoEntidad },
  });
  const list = extractResponseData(response);
  return list[0] || null;
}

// El parámetro `cod_tipo` de lista-entidad-direccion es el TIPO DE ENTIDAD
// (155 shipper, 156 consignatario, 3/5 cliente) — igual que en lista-entidad-contacto —
// y devuelve TODAS las direcciones de la entidad. El subtipo real de cada dirección
// (145=recolección, 12/11=facturación/fiscal, etc.) viene en el campo `cod_tipo` de
// cada registro; la lógica de `existing` filtra por ese subtipo. Consultar aquí por el
// subtipo (145/12/11) devolvía vacío y provocaba que se insertara una dirección
// duplicada en vez de actualizar la existente.
// lista-entidad-direccion puede devolver los campos en minúsculas o MAYÚSCULAS
// (ENTIDADDIRECCION_ID, COD_TIPO, …). Se normalizan aquí para que la lógica de
// `existing` (match por cod_tipo y decisión actualizar/insertar por
// entidaddireccion_id) funcione sin depender del casing del backend. Sin esto,
// una dirección YA existente no se encontraba y se insertaba una duplicada en
// vez de actualizarla.
const normalizeDireccion = (d) => ({
  ...d,
  entidaddireccion_id: d.entidaddireccion_id ?? d.ENTIDADDIRECCION_ID,
  cod_tipo: d.cod_tipo ?? d.COD_TIPO,
  entidaddireccion_direccion: d.entidaddireccion_direccion ?? d.ENTIDADDIRECCION_DIRECCION,
  entidaddireccion_zona: d.entidaddireccion_zona ?? d.ENTIDADDIRECCION_ZONA,
  entidaddireccion_km: d.entidaddireccion_km ?? d.ENTIDADDIRECCION_KM,
  cod_pais: d.cod_pais ?? d.COD_PAIS,
  cod_depto: d.cod_depto ?? d.COD_DEPTO,
  cod_muni: d.cod_muni ?? d.COD_MUNI,
  cod_estado: d.cod_estado ?? d.COD_ESTADO,
});

// lista-entidad-contacto / lista-entidad-identificacion también devuelven los
// campos en MAYÚSCULAS (COD_ESTADO, ENTIDADCONTACTO_ID, ENTIDADIDENTIFICACIO_NUMERO,
// …). Se normalizan igual que la dirección para que el match por id y el filtro
// por cod_estado no dependan del casing del backend.
const normalizeContacto = (c) => ({
  ...c,
  entidadcontacto_id: c.entidadcontacto_id ?? c.ENTIDADCONTACTO_ID,
  entidadcontacto_nombre: c.entidadcontacto_nombre ?? c.ENTIDADCONTACTO_NOMBRE,
  entidadcontacto_email: c.entidadcontacto_email ?? c.ENTIDADCONTACTO_EMAIL,
  entidadcontacto_telefono: c.entidadcontacto_telefono ?? c.ENTIDADCONTACTO_TELEFONO,
  data_entidad_contacto_tipo: c.data_entidad_contacto_tipo ?? c.DATA_ENTIDAD_CONTACTO_TIPO,
  cod_estado: c.cod_estado ?? c.COD_ESTADO,
});

const normalizeIdentificacion = (i) => ({
  ...i,
  entidadidentificacion_id: i.entidadidentificacion_id ?? i.ENTIDADIDENTIFICACION_ID,
  // El backend usa la clave con typo `ENTIDADIDENTIFICACIO_NUMERO` (sin la N);
  // se acepta esa y las variantes con N por si acaso.
  entidadidentificacion_numero:
    i.entidadidentificacion_numero ?? i.entidadidentificacio_numero ?? i.ENTIDADIDENTIFICACIO_NUMERO ?? i.ENTIDADIDENTIFICACION_NUMERO,
  entidadidentificacion_fecha_inicio: i.entidadidentificacion_fecha_inicio ?? i.ENTIDADIDENTIFICACION_FECHA_INICIO,
  entidadidentificacion_fecha_fin: i.entidadidentificacion_fecha_fin ?? i.ENTIDADIDENTIFICACION_FECHA_FIN,
  entidadidentificacion_ruta: i.entidadidentificacion_ruta ?? i.ENTIDADIDENTIFICACION_RUTA,
  cod_estado: i.cod_estado ?? i.COD_ESTADO,
});

// Solo un registro ACTIVO (cod_estado === 1) puede actualizarse: el backend de
// actualizar-entidad-{direccion,contacto,identificacion} responde "no localizado"
// si el id apunta a un registro inactivo. Por eso, para decidir actualizar-/insertar-,
// se consideran únicamente los registros activos; si no hay ninguno activo se INSERTA.
const ACTIVO = 1;
const esActivo = (r) => Number(r?.cod_estado ?? r?.COD_ESTADO) === ACTIVO;

async function fetchEntidadDirecciones({ cod_tipos, entidad_id }) {
  const codigos = Array.isArray(cod_tipos) ? cod_tipos : [cod_tipos];
  const listas = await Promise.all(
    codigos.map((cod_tipo) =>
      api
        .get("/api/appweb/lista-entidad-direccion", { params: { cod_tipo, entidad_id } })
        .then(extractResponseData),
    ),
  );
  return listas.flat().map(normalizeDireccion).filter(esActivo);
}

async function fetchEntidadContactos({ cod_tipo, entidad_id }) {
  const response = await api.get("/api/appweb/lista-entidad-contacto", { params: { cod_tipo, entidad_id } });
  return extractResponseData(response).map(normalizeContacto).filter(esActivo);
}

async function fetchEntidadIdentificaciones({ cod_tipo, entidad_id, cod_identificacion }) {
  const response = await api.get("/api/appweb/lista-entidad-identificacion", {
    params: { cod_tipo, entidad_id, cod_identificacion },
  });
  return extractResponseData(response).map(normalizeIdentificacion).filter(esActivo);
}

// Resuelve, contra el backend, si la entidad de un rol YA existe o es nueva. Esta
// es la ÚNICA fuente de verdad para decidir insertar-entidad vs actualizar-entidad
// (y, en cascada, para los sub-registros): NO se confía en el estado de la carta.
// Orden:
//   1. Si hay un id candidato (de la carta o de la coordinación), se VERIFICA con
//      lista-entidad. Si el backend lo devuelve → existe (y se reutiliza su info
//      para el posible actualizar-entidad, evitando un segundo fetch).
//   2. Si el candidato no verifica (id obsoleto de un intento previo abandonado),
//      se busca por nombre entre las entidades relacionadas al cliente: cubre el
//      reintento donde una corrida anterior ya creó la entidad real pero no
//      sincronizó su id de vuelta a la carta.
//   3. Si el candidato no verifica y tampoco hay match por nombre, se CONSERVA el
//      candidato como existente (no se puede confirmar que NO exista, y crear
//      duplicaría). Sólo un match por nombre reencamina a otra entidad.
//   4. Sin id y sin match por nombre → entidad NUEVA.
// `verify: false` (caso cliente/facturación) da por existente el candidato sin
// consultar, preservando el comportamiento previo de esa sección.
async function resolveEntidadExistente({ candidateId, verify, nombre, aliases, tipoEntidadFiltro, tipoEntidadNombre, entidadIdCliente, clienteNombre }) {
  const num = toNum(candidateId);

  if (num) {
    if (!verify) return { entidadId: num, exists: true, entidadInfo: null };
    const info = await fetchEntidadInfo(num, tipoEntidadFiltro);
    if (info) return { entidadId: num, exists: true, entidadInfo: info };
  }

  // El shipper/consignatario puede SER el propio cliente (el formulario deja
  // seleccionado al cliente por defecto y `ROLE_NOMBRE_FALLBACK` rellena el
  // nombre con el del cliente cuando el asesor no lo edita). En ese caso NO hay
  // un id candidato en la carta ni en la coordinación nueva, pero la entidad ya
  // existe: es la del cliente. Sin este cortocircuito se llamaba insertar-entidad
  // con el nombre del cliente y el backend rechazaba el duplicado
  // ("[1047]: Ya existe una entidad con esos datos, verifique"). Se reutiliza el
  // entidad_id del cliente (→ actualizar-entidad) en vez de crear una duplicada.
  if (nombre && clienteNombre && entidadIdCliente &&
      normalizeNombreEntidad(nombre) === normalizeNombreEntidad(clienteNombre)) {
    return { entidadId: toNum(entidadIdCliente), exists: true, entidadInfo: null };
  }

  if (aliases && nombre) {
    const found = await buscarEntidadRelacionadaPorNombre({ entidadIdCliente, nombre, aliases });
    if (found) return { entidadId: found, exists: true, entidadInfo: null };
  }

  // Antes de dar por NUEVA la entidad, buscarla por nombre exacto dentro del tipo
  // del rol (aunque no esté relacionada al cliente). Cubre el caso en que se usa
  // "NUEVO" con el nombre de una entidad que ya existe globalmente: el backend
  // rechazaría el insertar-entidad como duplicado, así que reutilizamos el id
  // existente (→ actualizar-entidad). El entidad_id resuelto se sincroniza de
  // vuelta a la carta al final de commitPendingChanges, de modo que los reintentos
  // ya lo encuentran como candidato directo.
  if (tipoEntidadNombre && nombre) {
    const foundGlobal = await buscarEntidadPorNombreEnTipo({ tipoEntidadNombre, nombre });
    if (foundGlobal) return { entidadId: foundGlobal, exists: true, entidadInfo: null };
  }

  if (num) return { entidadId: num, exists: true, entidadInfo: null };
  return { entidadId: null, exists: false, entidadInfo: null };
}

// Decide el endpoint por la EXISTENCIA REAL del sub-registro (id presente en el
// registro traído del backend), no por el estado de la carta ni por
// `_modificados`. Con esto, insertar-* / actualizar-* nunca dependen de qué
// sección se tocó: si el registro existe se actualiza, si no se inserta.
async function upsertByExistence({ existing, idKey, payload, insertFn, updateFn }) {
  if (existing && existing[idKey]) {
    return updateFn({ ...payload, [idKey]: Number(existing[idKey]) });
  }
  return insertFn(payload);
}

const parseJsonOpcionales = (embarqueData) => {
  const raw =
    embarqueData?.json_datos_opcionales ??
    embarqueData?.jsonDatosOpcionales ??
    embarqueData?.json_atributos_opcionales ??
    embarqueData?.jsonAtributosOpcionales ??
    null;
  if (!raw) return {};
  try {
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return {};
  }
};

// Resuelve un label guardado en la carta (o un id numérico crudo) contra un catálogo
// {value,label}/{cod_tipo,...}, igual que hace findCatalogLabel en sentido inverso.
const resolveCatalogValue = (rawValue, catalog = []) => {
  if (rawValue === undefined || rawValue === null || rawValue === "") return null;
  const found = (catalog || []).find((opt) => String(opt.label) === String(rawValue));
  if (found) return found.value ?? found.cod_tipo ?? found.cod_relacion_tipo ?? null;
  const asNum = Number(rawValue);
  return Number.isNaN(asNum) ? null : asNum;
};

const buildCargaPayload = (fila, embarqueIdNum, tiposEmbalajeCatalog = []) => {
  const cantidad = Number.parseInt(fila.cantidad, 10) || 0;
  const pesoTotal = Number(fila.pesoTotal ?? 0);
  const volumenTotal = Number(fila.volumenTotal ?? 0);
  const largo = Number.parseFloat(fila.largo ?? 0) || 0;
  const alto = Number.parseFloat(fila.alto ?? 0) || 0;
  const ancho = Number.parseFloat(fila.ancho ?? 0) || 0;
  const volumenMetrosCubicos =
    largo > 0 && alto > 0 && ancho > 0 ? Number.parseFloat(((largo * alto * ancho) / 1000000).toFixed(6)) : 0;
  const unidadPesoIdRaw = fila.unidadPeso ?? "";
  const unidadPesoId = unidadPesoIdRaw === null || unidadPesoIdRaw === undefined ? "" : String(unidadPesoIdRaw);
  const codTipoUnidadMedida = unidadPesoId
    ? Number.parseInt(unidadPesoId, 10) || 0
    : Number(fila.unidadMedida ?? 0) || 0;
  const cwValue =
    fila.cw !== undefined && fila.cw !== null && String(fila.cw).trim() !== "" ? Number(fila.cw) : pesoTotal;
  const tipoEmbalajeRaw = fila.tipoEmbalaje ?? "";
  const tipoEmbalajeLabel = (() => {
    if (tipoEmbalajeRaw === "" || tipoEmbalajeRaw == null) return "";
    const found = tiposEmbalajeCatalog.find(
      (t) => String(t.value ?? t.codTipo ?? t.cod_tipo ?? "") === String(tipoEmbalajeRaw),
    );
    return found ? (found.label ?? found.nomTipo ?? found.nom_tipo ?? String(tipoEmbalajeRaw)) : String(tipoEmbalajeRaw);
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
    cod_tipo_embalaje: tipoEmbalajeRaw !== "" && tipoEmbalajeRaw != null ? Number(tipoEmbalajeRaw) || null : null,
    tipo_embalaje: tipoEmbalajeLabel,
    definitivo_general: String(fila.definitivoGeneral ?? "N").toLowerCase() === "s" ? "s" : "n",
  };
};

/**
 * Hook que expone `commitPendingChanges`: aplica a sus endpoints reales los cambios
 * que el asesor dejó guardados en `json_data_usuario` (carta privada) para cada
 * sección del flujo CTS (Shipper, Consignatario, Producto, Facturación, Detalles,
 * Fechas), antes de asignar el correlativo/guía de la coordinación.
 *
 * Para shipper/consignatario/cliente todo pasa por `commitEntidad`, que decide
 * insertar-* vs actualizar-* por la EXISTENCIA REAL (verificada contra el backend)
 * de la entidad y de cada sub-registro (dirección, contacto, identificación), no
 * por el estado de la carta. Si la entidad no existe la crea y la relaciona con el
 * cliente; si existe, actualiza sólo lo que `_modificados` marca como cambiado.
 */
export function useCommitPendingChanges({
  embarqueData,
  jsonCartaCliente,
  listaCoordinacion,
  fechasMovData,
  catalogos = {},
  cod_usuario,
  entidadIdCliente,
  embarqueId,
  entidadIdShipperCoord,
  entidadIdConsignatarioCoord,
}) {
  const { data: clienteEntidades = [] } = useFetchEntidades(
    { tipo_entidad: "CLIENTE", entidad_id: entidadIdCliente },
    { enabled: Boolean(entidadIdCliente) },
  );

  const { mutateAsync: _actualizarCoordinacion } = useUpdateCoordinacion();
  const { mutateAsync: _insertarDireccion } = useInsertarEntidadDireccion();
  const { mutateAsync: _actualizarDireccion } = useActualizarEntidadDireccion();
  const { mutateAsync: _insertarContacto } = useInsertarEntidadContacto();
  const { mutateAsync: _actualizarContacto } = useActualizarEntidadContacto();
  const { mutateAsync: _insertarIdentificacion } = useInsertarEntidadIdentificacion();
  const { mutateAsync: _actualizarIdentificacion } = useActualizarEntidadIdentificacion();
  const { mutateAsync: _insertarEntidadRelacion } = useInsertarEntidadRelacion();
  const { mutateAsync: _insertarCarga } = useInsertarCoordinacionCarga();
  const { mutateAsync: _actualizarCarga } = useActualizarCoordinacionCarga();
  const { mutateAsync: _crearFecha } = useCreateCoordinacionFechaMov();
  const { mutateAsync: _actualizarFecha } = useUpdateCoordinacionFechaMov();

  // Ver comentario de `assertOk`: las mutaciones de react-query tampoco
  // rechazan la promesa cuando el backend responde `success: false`, así que
  // se envuelven aquí para que cualquier fallo detenga "Crear Coordinación" en
  // vez de seguir con el resto de los pasos como si nada.
  const actualizarCoordinacion = useCallback(
    (payload) => _actualizarCoordinacion(payload).then((r) => assertOk(r, "actualizar la coordinación")),
    [_actualizarCoordinacion],
  );
  const insertarDireccion = useCallback(
    (payload) => _insertarDireccion(payload).then((r) => assertOk(r, "insertar la dirección")),
    [_insertarDireccion],
  );
  const actualizarDireccion = useCallback(
    (payload) => _actualizarDireccion(payload).then((r) => assertOk(r, "actualizar la dirección")),
    [_actualizarDireccion],
  );
  const insertarContacto = useCallback(
    (payload) => _insertarContacto(payload).then((r) => assertOk(r, "insertar el contacto")),
    [_insertarContacto],
  );
  const actualizarContacto = useCallback(
    (payload) => _actualizarContacto(payload).then((r) => assertOk(r, "actualizar el contacto")),
    [_actualizarContacto],
  );
  const insertarIdentificacion = useCallback(
    (payload) => _insertarIdentificacion(payload).then((r) => assertOk(r, "insertar la identificación")),
    [_insertarIdentificacion],
  );
  const actualizarIdentificacion = useCallback(
    (payload) => _actualizarIdentificacion(payload).then((r) => assertOk(r, "actualizar la identificación")),
    [_actualizarIdentificacion],
  );
  const insertarEntidadRelacion = useCallback(
    (payload) => _insertarEntidadRelacion(payload).then((r) => assertOk(r, "relacionar la entidad con el cliente")),
    [_insertarEntidadRelacion],
  );
  const insertarCarga = useCallback(
    (payload) => _insertarCarga(payload).then((r) => assertOk(r, "insertar la carga")),
    [_insertarCarga],
  );
  const actualizarCarga = useCallback(
    (payload) => _actualizarCarga(payload).then((r) => assertOk(r, "actualizar la carga")),
    [_actualizarCarga],
  );
  const crearFecha = useCallback(
    (payload) => _crearFecha(payload).then((r) => assertOk(r, "crear la fecha de recolección")),
    [_crearFecha],
  );
  const actualizarFecha = useCallback(
    (payload) => _actualizarFecha(payload).then((r) => assertOk(r, "actualizar la fecha de recolección")),
    [_actualizarFecha],
  );

  const empresaId =
    embarqueData?.empresa_id ?? embarqueData?.EMPRESA_ID ?? embarqueData?.empresaId ?? embarqueData?.cod_empresa ?? null;
  const centroCostoId =
    embarqueData?.cencos_id ?? embarqueData?.CENCOS_ID ?? embarqueData?.cod_cc ?? embarqueData?.COD_CC ?? null;

  // Aplica a sus endpoints reales la entidad + dirección + contacto +
  // identificación de un rol (shipper/consignatario/cliente).
  //
  // La decisión insertar-* vs actualizar-* NO depende del estado de la carta ni
  // de `_modificados`, sino de la EXISTENCIA REAL verificada contra el backend:
  //   - Entidad: `resolveEntidadExistente` decide si existe (→ actualizar-entidad)
  //     o es nueva (→ insertar-entidad + relacionarla con el cliente).
  //   - Cada sub-registro: se trae del backend y `upsertByExistence` decide por el
  //     id del registro (existe → actualizar-, no existe → insertar-).
  //
  // `_modificados` / la presencia de datos sólo deciden SI se escribe (para no
  // pisar datos no tocados de una entidad existente), nunca QUÉ endpoint se usa.
  // Regla de escritura por sub-registro: entidad nueva → se escribe lo que traiga
  // datos; entidad existente → sólo lo marcado en `_modificados`.
  //
  // Devuelve { entidadId, contactoId } para reportarlos a la coordinación.
  const commitEntidad = useCallback(
    async ({
      mods,
      candidateEntidadId,
      entidadTipo,
      tipoEntidadFiltro,
      nitCodIdentificacion,
      addressCodTipoCandidates,
      nombreFallback = "",
      aliases,
      verifyExistence = true,
      allowCreate = true,
      clienteNombre = "",
      tipoEntidadNombre = "",
    }) => {
      const safeMods = mods || {};
      const modificados = new Set(Array.isArray(safeMods._modificados) ? safeMods._modificados : []);
      const nombre = safeMods.entidad_nombre ?? nombreFallback ?? "";

      let { entidadId, exists, entidadInfo } = await resolveEntidadExistente({
        // `safeMods.entidad_id` (carta_${role}.entidad_id) es la selección real del
        // formulario; se usa como candidato adicional por si no llegó a persistirse
        // en `entidad_id_${role}` de la coordinación.
        candidateId: candidateEntidadId ?? safeMods.entidad_id,
        verify: verifyExistence,
        nombre,
        aliases,
        tipoEntidadFiltro,
        tipoEntidadNombre,
        entidadIdCliente,
        clienteNombre,
      });

      let isNew = false;

      // --- Entidad: insertar (nueva) o actualizar (existente) --------------------
      if (!exists) {
        // No se pudo resolver ninguna entidad existente → hay que crearla.
        if (!allowCreate) return { entidadId: null, contactoId: null };
        // Sin nombre no hay entidad que crear (campo requerido del formulario).
        if (!nombre) return { entidadId: null, contactoId: null };

        const insertResp = await postChecked(
          "api/appweb/insertar-entidad",
          {
            entidad_nombre: nombre,
            cod_pais: toNum(safeMods.entidad_pais),
            cod_ciudad: toNum(safeMods.direccion_recoleccion_ciudad),
            cod_industria: toNum(safeMods.entidad_industria),
            limite_credito: 0,
            cod_moneda: null,
            credito_utilizado: 0,
            cod_estado: 1,
            cod_tipo: entidadTipo,
          },
          "crear la entidad",
        );
        entidadId = toNum(insertResp?.data?.entidad_id ?? insertResp?.entidad_id);
        if (!entidadId) return { entidadId: null, contactoId: null };
        isNew = true;

        // Relación con el cliente de la coordinación para que la entidad quede
        // enlazada (aparezca en las consultas de entidades-relacionadas).
        if (entidadIdCliente) {
          await insertarEntidadRelacion({
            cod_estado: 1,
            cod_tipo: REL_ENTIDAD_CLIENTE_COD_TIPO,
            entidad_id_1: toNum(entidadIdCliente),
            entidad_id_2: entidadId,
          });
        }
      }

      const numEntidadId = toNum(entidadId);
      if (!numEntidadId) return { entidadId: null, contactoId: null };

      const infoFields = ["entidad_nombre", "entidad_pais", "direccion_recoleccion_ciudad", "entidad_industria"];
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
      const identFields = ["entidad_nit"];

      const touchesInfo = infoFields.some((f) => modificados.has(f));
      const touchesAddress = addressFields.some((f) => modificados.has(f));
      const touchesContact = contactFields.some((f) => modificados.has(f));
      const touchesIdent = identFields.some((f) => modificados.has(f));

      const hasAddressData = Boolean(
        safeMods.direccion_recoleccion || safeMods.direccion_recoleccion_pais || safeMods.direccion_recoleccion_muni,
      );
      const hasContactData = Boolean(
        safeMods.entidad_contacto_nombre || safeMods.entidad_contacto_email || safeMods.entidad_contacto_telefono,
      );
      const hasIdentData = Boolean(safeMods.entidad_nit);

      // Entidad nueva → se escribe lo que traiga datos; existente → sólo lo tocado.
      const writeAddress = isNew ? hasAddressData : touchesAddress;
      const writeContact = isNew ? hasContactData : touchesContact;
      const writeIdent = isNew ? hasIdentData : touchesIdent;

      // Para una entidad existente se traen los sub-registros del backend para que
      // `upsertByExistence` decida insertar-/actualizar-. Para una entidad recién
      // creada (isNew) las listas quedan vacías → siempre inserta. El contacto de
      // una entidad existente se resuelve SIEMPRE (aunque no cambiara) para poder
      // reportar contacto_id_* a la coordinación.
      const [direcciones, contactos, identificaciones] = await Promise.all([
        !isNew && writeAddress
          ? fetchEntidadDirecciones({ cod_tipos: [entidadTipo], entidad_id: numEntidadId })
          : Promise.resolve([]),
        !isNew ? fetchEntidadContactos({ cod_tipo: entidadTipo, entidad_id: numEntidadId }) : Promise.resolve([]),
        !isNew && writeIdent
          ? fetchEntidadIdentificaciones({ cod_tipo: entidadTipo, entidad_id: numEntidadId, cod_identificacion: nitCodIdentificacion })
          : Promise.resolve([]),
      ]);

      // Info de la entidad: sólo se actualiza para una entidad existente (la nueva
      // ya insertó nombre/país/ciudad/industria arriba). Reutiliza la info traída
      // por la verificación de existencia si la hay; si no, la trae ahora.
      if (!isNew && touchesInfo) {
        const info = entidadInfo ?? (await fetchEntidadInfo(numEntidadId, tipoEntidadFiltro));
        await postChecked(
          "api/appweb/actualizar-entidad",
          {
            entidad_id: numEntidadId,
            entidad_nombre: safeMods.entidad_nombre ?? info?.entidad_nombre ?? "",
            cod_pais: toNum(safeMods.entidad_pais ?? info?.cod_pais),
            cod_ciudad: toNum(safeMods.direccion_recoleccion_ciudad ?? info?.cod_ciudad),
            cod_industria: toNum(safeMods.entidad_industria ?? info?.cod_industria),
            cod_estado: info?.cod_estado || 1,
          },
          "actualizar la entidad",
        );
      }

      if (writeAddress) {
        // El subtipo de dirección (145 recolección, 12/11 fiscal/facturación) viene
        // en el campo `cod_tipo` de cada registro; se elige el candidato que exista
        // (o el primero) y se hace upsert por el id del registro encontrado.
        const addressCodTipo =
          addressCodTipoCandidates.find((cod) => direcciones.some((d) => Number(d.cod_tipo) === cod)) ||
          addressCodTipoCandidates[0];
        const existing = direcciones.find((d) => Number(d.cod_tipo) === addressCodTipo) || null;
        await upsertByExistence({
          existing,
          idKey: "entidaddireccion_id",
          payload: {
            entidad_id: numEntidadId,
            cod_tipo: existing?.cod_tipo || addressCodTipo,
            entidaddireccion_direccion: safeMods.direccion_recoleccion ?? existing?.entidaddireccion_direccion ?? "",
            entidaddireccion_zona: existing?.entidaddireccion_zona || "",
            entidaddireccion_km: existing?.entidaddireccion_km || null,
            cod_pais: toNum(safeMods.direccion_recoleccion_pais ?? existing?.cod_pais),
            cod_depto: toNum(safeMods.direccion_recoleccion_depto ?? existing?.cod_depto),
            cod_muni: toNum(safeMods.direccion_recoleccion_muni ?? existing?.cod_muni),
            cod_estado: 1,
          },
          insertFn: insertarDireccion,
          updateFn: actualizarDireccion,
        });
      }

      const savedContactoId = safeMods?.entidadcontacto_id ? Number(safeMods.entidadcontacto_id) : null;
      const existingContacto =
        (savedContactoId && contactos.find((c) => Number(c.entidadcontacto_id) === savedContactoId)) ||
        contactos[0] ||
        null;
      let contactoId = existingContacto?.entidadcontacto_id ? Number(existingContacto.entidadcontacto_id) : savedContactoId;

      if (writeContact) {
        const res = await upsertByExistence({
          existing: existingContacto,
          idKey: "entidadcontacto_id",
          payload: {
            entidad_id: numEntidadId,
            cod_estado: 1,
            entidadcontacto_nombre: safeMods.entidad_contacto_nombre ?? existingContacto?.entidadcontacto_nombre ?? "",
            entidadcontacto_email: safeMods.entidad_contacto_email ?? existingContacto?.entidadcontacto_email ?? "",
            entidadcontacto_telefono: safeMods.entidad_contacto_telefono ?? existingContacto?.entidadcontacto_telefono ?? "",
            lista_cod_tipo:
              safeMods._contacto_tipo_list ??
              (Array.isArray(existingContacto?.data_entidad_contacto_tipo)
                ? existingContacto.data_entidad_contacto_tipo.map((t) => t.cod_tipo)
                : []) ??
              [],
            cod_emp: toNum(empresaId),
            cod_cc: toNum(centroCostoId),
          },
          insertFn: insertarContacto,
          updateFn: actualizarContacto,
        });
        contactoId = existingContacto?.entidadcontacto_id
          ? Number(existingContacto.entidadcontacto_id)
          : res?.data?.entidadcontacto_id
            ? Number(res.data.entidadcontacto_id)
            : contactoId;
      }

      if (writeIdent) {
        const existing = identificaciones[0] || null;
        await upsertByExistence({
          existing,
          idKey: "entidadidentificacion_id",
          payload: {
            entidad_id: numEntidadId,
            cod_identificacion: nitCodIdentificacion,
            entidadidentificacio_numero: safeMods.entidad_nit ?? existing?.entidadidentificacion_numero ?? "",
            cod_estado: existing?.cod_estado ?? 1,
            entidadidentificacion_fecha_inicio: existing?.entidadidentificacion_fecha_inicio || null,
            entidadidentificacion_fecha_fin: existing?.entidadidentificacion_fecha_fin || null,
            entidadidentificacion_ruta: existing?.entidadidentificacion_ruta || null,
          },
          insertFn: insertarIdentificacion,
          updateFn: actualizarIdentificacion,
        });
      }

      return { entidadId: numEntidadId, contactoId };
    },
    [
      entidadIdCliente,
      insertarEntidadRelacion,
      actualizarDireccion,
      insertarDireccion,
      actualizarContacto,
      insertarContacto,
      actualizarIdentificacion,
      insertarIdentificacion,
      empresaId,
      centroCostoId,
    ],
  );

  const commitPendingChanges = useCallback(async () => {
    const embarqueIdNum = getEmbarqueId(embarqueData, embarqueId);
    const lc = listaCoordinacion || {};
    const coordOverrides = {};

    // Nombre del cliente de la coordinación: se usa para detectar cuándo el
    // shipper/consignatario ES el propio cliente y así reutilizar su entidad_id
    // en vez de insertar una entidad duplicada (ver resolveEntidadExistente).
    const clienteNombre =
      clienteEntidades?.[0]?.entidad_nombre ??
      clienteEntidades?.[0]?.ENTIDAD_NOMBRE ??
      lc?.entidad_nombre ??
      lc?.cliente ??
      "";

    // --- Shipper / Consignatario -------------------------------------------------
    for (const role of ["shipper", "consignatario"]) {
      const mods = lc?.[`carta_${role}`];
      // El id de la carta puede venir vacío aunque la coordinación YA tenga una
      // entidad asignada (p.ej. un intento previo de "Crear Coordinación" que
      // creó la entidad pero no la sincronizó de vuelta a la carta). Se toma
      // también el id real de la coordinación (embarqueData) para no volver a
      // crear/duplicar la misma entidad en un reintento. `commitEntidad` verifica
      // este id candidato contra el backend y, si no existe, busca por nombre
      // entre las relacionadas antes de decidir crear.
      const entidadIdCarta = role === "shipper" ? lc.entidad_id_shipper : lc.entidad_id_consignatario;
      const entidadIdCoord =
        role === "shipper"
          ? embarqueData?.entidad_id_shipper ?? embarqueData?.entidadIdShipper
          : embarqueData?.entidad_id_consignatario ?? embarqueData?.entidadIdConsignatario;
      // Última red: el id que el formulario (page.jsx) ya muestra preseleccionado
      // (p.ej. la propia entidad del cliente, o el primer shipper/consignatario
      // relacionado) cuando ni la carta ni la coordinación todavía tienen
      // entidad_id_shipper/consignatario guardado — pasa exactamente por esta
      // situación una coordinación nueva donde el cliente nunca tocó el selector
      // porque ya venía "válido" con ese default. Sin este fallback el rol se
      // omitía por completo (ver `continue` de abajo) y "Crear Coordinación"
      // nunca asignaba el shipper que el formulario mostraba como elegido.
      const entidadIdPreseleccionado = role === "shipper" ? entidadIdShipperCoord : entidadIdConsignatarioCoord;
      const candidateEntidadId = entidadIdCarta ?? entidadIdCoord ?? entidadIdPreseleccionado;

      // Sin id candidato y sin datos capturados no hay nada que procesar del rol.
      if (!candidateEntidadId && !mods) continue;

      const { entidadId, contactoId } = await commitEntidad({
        mods: mods || {},
        candidateEntidadId,
        entidadTipo: ROLE_ENTIDAD_TIPO[role],
        tipoEntidadFiltro: role,
        nitCodIdentificacion: ROLE_NIT_COD_IDENTIFICACION[role],
        addressCodTipoCandidates: [ADDRESS_COD_TIPO_RECOLECCION],
        nombreFallback: ROLE_NOMBRE_FALLBACK[role](lc),
        aliases: ROLE_ALIASES[role],
        verifyExistence: true,
        allowCreate: true,
        clienteNombre,
        tipoEntidadNombre: ROLE_TIPO_ENTIDAD_NOMBRE[role],
      });

      if (entidadId) {
        coordOverrides[ROLE_COORD_FIELDS[role].entidadField] = entidadId;
        if (contactoId) coordOverrides[ROLE_COORD_FIELDS[role].contactoField] = contactoId;
      }
    }

    // --- Facturación (cliente) ----------------------------------------------------
    // Se ejecuta siempre que haya entidadIdCliente (no solo cuando carta_facturacion.cliente
    // existe), para poder reportar contacto_id_cliente aunque nada se haya modificado.
    const facturacionCliente = lc?.carta_facturacion?.cliente;
    if (entidadIdCliente) {
      const esPreCliente = clienteEntidades.length === 0;
      const codTipoCliente = clienteEntidades?.[0]?.cod_tipo ?? (esPreCliente ? 5 : 3);
      const { contactoId } = await commitEntidad({
        mods: mapFacturacionMods(facturacionCliente) || {},
        candidateEntidadId: entidadIdCliente,
        entidadTipo: codTipoCliente,
        tipoEntidadFiltro: "CLIENTE",
        nitCodIdentificacion: 3,
        addressCodTipoCandidates: [12, 11],
        // El cliente de la coordinación siempre existe: no se verifica ni se crea.
        verifyExistence: false,
        allowCreate: false,
      });
      if (contactoId) coordOverrides.contacto_id_cliente = contactoId;
    }

    // --- Detalles ------------------------------------------------------------------
    const detalles = lc?.carta_facturacion?.detalles;
    if (detalles) {
      if (detalles.tipoPago !== undefined) {
        coordOverrides.cod_tipo_pago = resolveCatalogValue(detalles.tipoPago, catalogos.tiposPagoCatalog);
      }
      if (detalles.tipoCarga !== undefined) {
        coordOverrides.cod_tipo_carga = resolveCatalogValue(detalles.tipoCarga, catalogos.tiposCargaCatalog);
      }
      if (detalles.servicio !== undefined) {
        coordOverrides.cod_servicio = resolveCatalogValue(detalles.servicio, catalogos.tiposServicioCatalog);
      }
      if (detalles.incoterm !== undefined) {
        coordOverrides.incoterm_id = toNum(detalles.incoterm);
      }
      if (detalles.instruccionesManejo !== undefined) {
        coordOverrides.observacion = detalles.instruccionesManejo || "";
      }
      if (Array.isArray(detalles.peligrosidad)) {
        coordOverrides.peligrosidad = detalles.peligrosidad.includes("S");
        coordOverrides.json_datos_opcionales = {
          ...parseJsonOpcionales(embarqueData),
          cargaValiosa: detalles.peligrosidad.includes("V"),
          coberturaSeguro: detalles.peligrosidad.includes("C"),
        };
      }
      if (Array.isArray(detalles.documentosCropa)) {
        const documentosCropaMap = CROPA_DOCS.reduce((acc, { key }) => {
          acc[key] = detalles.documentosCropa.includes(String(key));
          return acc;
        }, {});
        coordOverrides.json_documentos = JSON.stringify(documentosCropaMap);
      }
    }

    // --- Producto / Cargas ----------------------------------------------------------
    const cargasCarta = jsonCartaCliente?.["lista-coordinacion-carga"];
    if (Array.isArray(cargasCarta) && cargasCarta.length > 0) {
      for (const fila of cargasCarta) {
        const payload = buildCargaPayload(fila, embarqueIdNum, catalogos.tiposEmbalajeCatalog);
        if (fila.embCargaId) {
          await actualizarCarga({ ...payload, emb_carga_id: Number.parseInt(fila.embCargaId, 10) || 0 });
        } else {
          await insertarCarga(payload);
        }
      }
    }

    // --- Fechas -----------------------------------------------------------------------
    const fechaRecoleccion = lc?.carta_fechas?.fecha_recoleccion;
    if (fechaRecoleccion) {
      const existing = (fechasMovData || []).find(
        (f) => Number(f.ID_FECHA_TIPO ?? f.id_fecha_tipo) === RECOLECCION_TIPO_FECHA_ID,
      );
      if (existing) {
        await actualizarFecha({
          id_fecha_reg_embarque: existing.ID_FECHA_REG_EMBARQUE ?? existing.idFechaRegEmbarque,
          embarque_id: embarqueIdNum,
          id_tipo_fecha: RECOLECCION_TIPO_FECHA_ID,
          fecha: fechaRecoleccion,
          observacion: existing.OBSERVACION ?? existing.observacion ?? "",
          estado_cod: "1",
        });
      } else {
        await crearFecha({
          embarque_id: embarqueIdNum,
          id_tipo_fecha: RECOLECCION_TIPO_FECHA_ID,
          fecha: fechaRecoleccion,
          observacion: "",
          estado_cod: "1",
        });
      }
    }

    // --- Coordinación (batch final) ---------------------------------------------------
    if (Object.keys(coordOverrides).length > 0) {
      const finalPayload = buildCoordPayload(embarqueData, coordOverrides, cod_usuario);
      await actualizarCoordinacion(finalPayload);
    }
  }, [
    embarqueData,
    embarqueId,
    listaCoordinacion,
    jsonCartaCliente,
    fechasMovData,
    catalogos,
    cod_usuario,
    entidadIdCliente,
    clienteEntidades,
    commitEntidad,
    actualizarCarga,
    insertarCarga,
    actualizarFecha,
    crearFecha,
    actualizarCoordinacion,
  ]);

  return { commitPendingChanges };
}

import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import api_no_auth_v2 from "../utils/apiPublic";
import useCustomMutation from "../../Fetch/useCustomMutation";
import { CACHE_DYNAMIC } from "../utils";

export const CARTA_INSTRUCCIONES_ESTADOS = Object.freeze([
  "LINK_GENERADO",
  "DOCUMENTO_CARGADO",
  "DOCUMENTO_ACEPTADO",
  "DOCUMENTO_RECHAZADO",
  "COORDINACION_CREADA",
]);

const ENDPOINTS = {
  detalleEstados: "/api/appweb/detalle-estados-carta-instrucciones",
  cambioEstadoPrivado: "/api/appweb/cambio-estado-carta-instrucciones",
  cambioEstadoPublico: "/clientes/api/v2/cambio-estado-carta-instrucciones",
  filaPrivado: "/api/appweb/fila-carta-instrucciones",
  filaPublico: "/clientes/api/v2/fila-carta-instrucciones",
  actualizarJsonPrivado: "/api/appweb/actualizar-json-link",
  actualizarJsonPublico: "/clientes/api/v2/actualizar-json-link",
  generarLinkPrivado: "/api/appweb/genera-link-carta-instrucciones-v2",
};

function esObjetoPlano(valor) {
  return Boolean(valor) && typeof valor === "object" && !Array.isArray(valor);
}

function extraerPrimerObjeto(valor) {
  if (Array.isArray(valor)) {
    return valor.find(esObjetoPlano) ?? null;
  }

  return esObjetoPlano(valor) ? valor : null;
}

function parsearJsonSerializado(valor) {
  if (valor == null || valor === "") {
    return null;
  }

  if (esObjetoPlano(valor) || Array.isArray(valor)) {
    return valor;
  }

  if (typeof valor !== "string") {
    return null;
  }

  let actual = valor.trim();

  if (!actual) {
    return null;
  }

  for (let intento = 0; intento < 3; intento += 1) {
    try {
      const parseado = JSON.parse(actual);

      if (typeof parseado === "string") {
        actual = parseado.trim();
        continue;
      }

      return parseado;
    } catch {
      return null;
    }
  }

  return null;
}

function validarNumero(nombre, valor, { requerido = true } = {}) {
  if (valor === undefined || valor === null || valor === "") {
    if (!requerido) return undefined;
    throw new Error(`'${nombre}' es obligatorio`);
  }

  const numero = Number(valor);

  if (!Number.isInteger(numero) || numero < 0 || numero > 999999) {
    throw new Error(`'${nombre}' inválido: debe ser un número entero de 1 a 6 dígitos`);
  }

  return numero;
}

function validarJsonData(json_data) {
  if (json_data === undefined || json_data === null || json_data === "") {
    throw new Error("'json_data' es obligatorio");
  }

  if (typeof json_data === "string") {
    const trimmed = json_data.trim();

    if (!trimmed) {
      throw new Error("'json_data' es obligatorio");
    }

    try {
      JSON.parse(trimmed);
    } catch {
      throw new Error("'json_data' debe ser un JSON válido");
    }

    return trimmed;
  }

  if (typeof json_data !== "object") {
    throw new TypeError("'json_data' debe ser un objeto o JSON serializado válido");
  }

  return json_data;
}

function validarJsonDataUsuario(json_data_usuario) {
  if (json_data_usuario === undefined) {
    return undefined;
  }

  if (json_data_usuario === null) {
    return null;
  }

  if (typeof json_data_usuario !== "string" && typeof json_data_usuario !== "object") {
    throw new TypeError("'json_data_usuario' debe ser un objeto, string JSON o null");
  }

  return json_data_usuario;
}

export function esEstadoCartaInstruccionesValido(estado) {
  return CARTA_INSTRUCCIONES_ESTADOS.includes(String(estado || "").trim());
}

export function validarPayloadCambioEstadoCartaInstrucciones(payload = {}, { publico = false } = {}) {
  const cod_cotizacion_cabecera = validarNumero("cod_cotizacion_cabecera", payload.cod_cotizacion_cabecera);
  const desc_estado = String(payload.desc_estado || "").trim();

  if (!desc_estado) {
    throw new Error("'desc_estado' es obligatorio");
  }

  if (!esEstadoCartaInstruccionesValido(desc_estado)) {
    throw new Error(`'desc_estado' inválido: debe ser uno de ${CARTA_INSTRUCCIONES_ESTADOS.join(", ")}`);
  }

  const body = {
    cod_cotizacion_cabecera,
    desc_estado,
  };

  const cod_link_publico = validarNumero("cod_link_publico", payload.cod_link_publico, {
    requerido: !publico,
  });

  if (cod_link_publico !== undefined) {
    body.cod_link_publico = cod_link_publico;
  }

  return body;
}

export function validarPayloadFilaCartaInstrucciones(payload = {}) {
  return {
    cod_cotizacion_cabecera: validarNumero("cod_cotizacion_cabecera", payload.cod_cotizacion_cabecera),
    cod_modulo: validarNumero("cod_modulo", payload.cod_modulo),
    cod_cc: validarNumero("cod_cc", payload.cod_cc),
    cod_empresa: validarNumero("cod_empresa", payload.cod_empresa),
  };
}

export function validarPayloadActualizarJsonCartaInstrucciones(payload = {}, { publico = false } = {}) {
  const body = {
    json_data: validarJsonData(payload.json_data),
  };

  const json_data_usuario = validarJsonDataUsuario(payload.json_data_usuario);

  if (json_data_usuario !== undefined) {
    body.json_data_usuario = json_data_usuario;
  }

  // `cod_link_publico` puede apuntar a un link_id distinto al que el backend
  // realmente usa para resolver la fila (visto en producción: un guardado con
  // cod_link_publico=25 terminó escribiendo sobre link_id=18, y el cambio
  // nunca se reflejaba). Un guardado SIN cod_link_publico sí persiste
  // correctamente porque el backend resuelve la fila con cod_cotizacion_cabecera
  // (ya viaja embebido en json_data). Por eso nunca se exige aquí, en ningún
  // modo — si el caller no lo tiene o no confía en él, puede omitirlo.
  const cod_link_publico = validarNumero("cod_link_publico", payload.cod_link_publico, {
    requerido: false,
  });

  if (cod_link_publico !== undefined) {
    body.cod_link_publico = cod_link_publico;
  }

  const cod_cotizacion_cabecera = validarNumero("cod_cotizacion_cabecera", payload.cod_cotizacion_cabecera, {
    requerido: false,
  });

  if (cod_cotizacion_cabecera !== undefined) {
    body.cod_cotizacion_cabecera = cod_cotizacion_cabecera;
  }

  const cod_estado = validarNumero("cod_estado", payload.cod_estado, {
    requerido: false,
  });

  if (cod_estado !== undefined) {
    body.cod_estado = cod_estado;
  }

  return body;
}

export function validarPayloadGenerarLinkCartaInstrucciones(payload = {}) {
  const endpoint_front = String(payload.endpoint_front || "").trim();
  const url_front = String(payload.url_front || "").trim();

  if (!endpoint_front) {
    throw new Error("'endpoint_front' es obligatorio");
  }
  if (!url_front) {
    throw new Error("'url_front' es obligatorio");
  }

  const body = {
    entidad_id: validarNumero("entidad_id", payload.entidad_id),
    cod_cotizacion_cabecera: validarNumero("cod_cotizacion_cabecera", payload.cod_cotizacion_cabecera),
    embarque_id: validarNumero("embarque_id", payload.embarque_id),
    cod_modulo: validarNumero("cod_modulo", payload.cod_modulo),
    cod_cc: validarNumero("cod_cc", payload.cod_cc),
    cod_empresa: validarNumero("cod_empresa", payload.cod_empresa),
    endpoint_front,
    url_front,
    json_data: validarJsonData(payload.json_data),
  };

  const json_data_usuario = validarJsonDataUsuario(payload.json_data_usuario);

  if (json_data_usuario !== undefined) {
    body.json_data_usuario = json_data_usuario;
  }

  if (payload.enviar_notificacion !== undefined) {
    body.enviar_notificacion = Boolean(payload.enviar_notificacion);
  }

  return body;
}

export function extraerFilaCartaInstrucciones(response = {}) {
  const candidatos = [
    response?.data?.data,
    response?.data?.fila,
    response?.data?.row,
    response?.data?.resultado,
    response?.data,
    response?.fila,
    response?.row,
    response?.resultado,
    response,
  ];

  for (const candidato of candidatos) {
    const fila = extraerPrimerObjeto(candidato);

    if (fila) {
      return fila;
    }
  }

  return null;
}

function normalizarPropiedadConsign(json) {
  if (
    json.secciones?.entidades &&
    Object.hasOwn(json.secciones.entidades, "consign")
  ) {
    json.secciones.entidades.consignatario = json.secciones.entidades.consign;
    delete json.secciones.entidades.consign;
  }
}

function mergearFormatoAnterior(jsonUsuario, lc) {
  for (const [key, value] of Object.entries(jsonUsuario)) {
    if (key.startsWith("carta_")) lc[key] = value;
  }
}

function mergearFormatoNuevo(nuevoJsonData, json, lc) {
  const lcCambios = nuevoJsonData["lista-coordinacion"];
  if (lcCambios && typeof lcCambios === "object" && !Array.isArray(lcCambios)) {
    Object.assign(lc, lcCambios);
  }
  const cargasCambios = nuevoJsonData["lista-coordinacion-carga"];
  if (Array.isArray(cargasCambios)) {
    json["lista-coordinacion-carga"] = cargasCambios;
  }
  const fechasCambios = nuevoJsonData["lista-coordinacion-fecha-mov"];
  if (Array.isArray(fechasCambios)) {
    json["lista-coordinacion-fecha-mov"] = fechasCambios;
  }
}

function mergearJsonDataUsuario(fila, json) {
  const rawUsuario = fila?.json_data_usuario ?? fila?.JSON_DATA_USUARIO ?? fila?.jsonDataUsuario;
  const jsonUsuario = parsearJsonSerializado(rawUsuario);
  if (jsonUsuario && typeof jsonUsuario === "object" && !Array.isArray(jsonUsuario)) {
    const lc = json["lista-coordinacion"];
    if (lc && typeof lc === "object" && !Array.isArray(lc)) {
      mergearFormatoAnterior(jsonUsuario, lc);
      // buildCartaJson (cartaModel.js) escribe json_data_usuario con
      // "lista-coordinacion"/"lista-coordinacion-carga"/... directamente en la
      // raíz del objeto (no anidados bajo un `json_data` interno). Sin este
      // merge directo, cambios recién guardados (p.ej. entidad_id_shipper al
      // vincular un Shipper/Consignatario nuevo) nunca se reflejaban al
      // recargar: quedaban solo en json_data_usuario, que este merge ignoraba.
      mergearFormatoNuevo(jsonUsuario, json, lc);
      const nuevoJsonData = jsonUsuario.json_data;
      if (nuevoJsonData && typeof nuevoJsonData === "object" && !Array.isArray(nuevoJsonData)) {
        mergearFormatoNuevo(nuevoJsonData, json, lc);
      }
      const entidadRelacionada = jsonUsuario["recuperar-datos-entidad-relacionada"];
      if (entidadRelacionada != null) {
        json["recuperar-datos-entidad-relacionada"] = entidadRelacionada;
      }
    }
  }
}

export function extraerJsonCartaInstrucciones(response = {}) {
  const fila = extraerFilaCartaInstrucciones(response);

  if (!fila) {
    return null;
  }

  const candidatos = [
    fila?.json_data,
    fila?.JSON_DATA,
    fila?.jsonData,
    fila?.data?.json_data,
    fila?.data?.JSON_DATA,
    // el backend puede devolver el JSON serializado directamente en data.data
    fila?.data,
  ];

  for (const candidato of candidatos) {
    const json = parsearJsonSerializado(candidato);

    if (json) {
      normalizarPropiedadConsign(json);
      mergearJsonDataUsuario(fila, json);
      return json;
    }
  }

  return null;
}

export async function cambiarEstadoCartaInstruccionesPrivado(payload) {
  const body = validarPayloadCambioEstadoCartaInstrucciones(payload, { publico: false });
  const response = await api.post(ENDPOINTS.cambioEstadoPrivado, body);
  return response?.data;
}

export async function cambiarEstadoCartaInstruccionesPublico(payload) {
  const { token_interaccion, version_app, ...rest } = payload || {};
  const body = validarPayloadCambioEstadoCartaInstrucciones(rest, { publico: true });
  const response = await api_no_auth_v2.post(ENDPOINTS.cambioEstadoPublico, body);
  return response?.data;
}

export async function recuperarFilaCartaInstruccionesPrivado(payload) {
  const body = validarPayloadFilaCartaInstrucciones(payload);
  const response = await api.post(ENDPOINTS.filaPrivado, body);
  return response?.data;
}

export async function recuperarFilaCartaInstruccionesPublico(payload) {
  const { token_interaccion, version_app, ...rest } = payload || {};
  const body = validarPayloadFilaCartaInstrucciones(rest);
  const response = await api_no_auth_v2.post(ENDPOINTS.filaPublico, body);
  return response?.data;
}

export async function actualizarJsonCartaInstruccionesPrivado(payload) {
  const body = validarPayloadActualizarJsonCartaInstrucciones(payload, { publico: false });
  const response = await api.post(ENDPOINTS.actualizarJsonPrivado, body);
  return response?.data;
}

export async function actualizarJsonCartaInstruccionesPublico(payload) {
  const { token_interaccion, version_app, ...rest } = payload || {};
  const body = validarPayloadActualizarJsonCartaInstrucciones(rest, { publico: true });
  const response = await api_no_auth_v2.post(ENDPOINTS.actualizarJsonPublico, body);
  return response?.data;
}

export async function generarLinkCartaInstruccionesPrivado(payload) {
  const body = validarPayloadGenerarLinkCartaInstrucciones(payload);
  const response = await api.post(ENDPOINTS.generarLinkPrivado, body);
  return response?.data;
}

export function useDetalleEstadosCartaInstrucciones(params = {}, options = {}) {
  return useQuery({
    queryKey: ["detalle-estados-carta-instrucciones", params],
    queryFn: async () => {
      const response = await api.get(ENDPOINTS.detalleEstados, { params });
      return response?.data?.data ?? response?.data;
    },
    ...CACHE_DYNAMIC,
    ...options,
  });
}

export function useCambioEstadoCartaInstruccionesPrivado(options = {}) {
  return useCustomMutation({
    mutationFn: cambiarEstadoCartaInstruccionesPrivado,
    ...options,
  });
}

export function useCambioEstadoCartaInstruccionesPublico(options = {}) {
  return useCustomMutation({
    mutationFn: cambiarEstadoCartaInstruccionesPublico,
    ...options,
  });
}

export function useFilaCartaInstruccionesPrivado(options = {}) {
  return useCustomMutation({
    mutationFn: recuperarFilaCartaInstruccionesPrivado,
    ...options,
  });
}

export function useFilaCartaInstruccionesPublico(options = {}) {
  return useCustomMutation({
    mutationFn: recuperarFilaCartaInstruccionesPublico,
    ...options,
  });
}

export function useActualizarJsonCartaInstruccionesPrivado(options = {}) {
  return useCustomMutation({
    mutationFn: actualizarJsonCartaInstruccionesPrivado,
    ...options,
  });
}

export function useActualizarJsonCartaInstruccionesPublico(options = {}) {
  return useCustomMutation({
    mutationFn: actualizarJsonCartaInstruccionesPublico,
    ...options,
  });
}

export function useGenerarLinkCartaInstruccionesPrivado(options = {}) {
  return useCustomMutation({
    mutationFn: generarLinkCartaInstruccionesPrivado,
    ...options,
  });
}
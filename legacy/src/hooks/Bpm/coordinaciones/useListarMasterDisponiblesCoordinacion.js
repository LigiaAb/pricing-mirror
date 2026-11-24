import { useQuery } from "@tanstack/react-query";
import { extractFromData, CACHE_DYNAMIC } from "../utils";

const buildUrl = (endpoint, params = {}) => {
  const baseUrl = (import.meta.env.VITE_AXIOS || "").replace(/\/$/, "");
  const endpointPath = endpoint.replace(/^\/+/, "");
  const url = baseUrl
    ? `${baseUrl}/api/appweb/${endpointPath}`
    : `/api/appweb/${endpointPath}`;
  const queryString = new URLSearchParams(params).toString();
  return queryString ? `${url}?${queryString}` : url;
};

const getAuthHeaders = () => {
  const headers = {
    "Content-Type": "application/json",
  };

  const token = localStorage.getItem("token");
  const version = localStorage.getItem("version_app");

  if (token) headers.authorization = token;
  if (version) headers.version_app = version;

  return headers;
};

/**
 * Fetch helper for the `listar-master_disponibles-coordinacion` endpoint.
 *
 * @param {string|number} embarque_id
 * @param {string} [cod_file]
 * @returns {Promise<Array>} lista de masters disponibles (campos tal como vienen)
 */
export const fetchMasterDisponiblesCoordinacion = async (
  embarque_id,
  cod_file,
) => {
  const params = {
    embarque_id,
    EMBARQUE_ID: embarque_id,
  };
  if (cod_file !== undefined && cod_file !== null) {
    params.cod_file = cod_file;
  }

  const url = buildUrl("listar-master_disponibles-coordinacion", params);
  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Error fetching masters disponibles: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // la respuesta viene envuelta como {
  //   status, message, data: { success, cod_mensaje, lista_marter_disponibles }
  // }
  const realData = data?.data && !Array.isArray(data.data)
    ? data.data
    : extractFromData(data);
  return realData.lista_marter_disponibles || [];
};

/**
 * React‑Query hook to retrieve masters disponibles for una coordinación.
 *
 * Se ofrece una API dual igual que otros hooks BPM: puede llamarse con
 * parámetros posicionales (`useListarMasterDisponiblesCoordinacion(id, file)`)
 * o con un objeto `{ embarque_id, cod_file, enabled }`.
 *
 * @param {Object|any} args - embarque_id en modo posicional o
 *   objeto con campos.
 * @param {string} [maybeCodFile] - valor cod_file en modo posicional.
 * @param {Object} options - opciones adicionales de React Query.
 * @returns {UseQueryResult<Array>}
 */
export function useListarMasterDisponiblesCoordinacion(
  args,
  maybeCodFile,
  options = {},
) {
  let embarque_id;
  let cod_file;
  let enabled;

  if (args && typeof args === "object" && !Array.isArray(args)) {
    ({ embarque_id, cod_file, enabled = true } = args);
    enabled = options.enabled ?? enabled;
  } else {
    embarque_id = args;
    cod_file = maybeCodFile;
    // use nullish coalescing to avoid eslint complaining about negated conditions
    enabled = options.enabled ?? true;
  }

  return useQuery({
    queryKey: ["master-disponibles-coordinacion", embarque_id, cod_file],
    queryFn: () =>
      fetchMasterDisponiblesCoordinacion(embarque_id, cod_file),
    enabled: !!embarque_id && !!enabled,
    ...CACHE_DYNAMIC,
    ...options,
  });
}

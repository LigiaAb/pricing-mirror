import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import { extractFromData, CACHE_DYNAMIC } from "../utils";

/**
 * Fetch function for the "listar-coordinacion-gastos" endpoint.
 * Normaliza los parámetros y extrae el array real de la respuesta.
 * Devuelve los objetos crudos sin tratar salvo por la conversión del
 * envoltorio del API (`extractFromData`).
 *
 * @param {string|number} embarque_id
 * @param {string|number} embarque_version
 * @returns {Promise<Array>} listado de gastos (campos tal como vienen del backend)
 */
export const fetchCoordinacionGastos = async (embarque_id, embarque_version) => {
  const params = { embarque_id };
  if (embarque_version !== undefined && embarque_version !== null) {
    params.embarque_version = embarque_version;
  }

  const { data } = await api.get("/api/appweb/listar-coordinacion-gastos", {
    params,
  });

  // "extractFromData" es el helper que descarta el envoltorio { data: { data: [...] }}
  // y devuelve siempre un array para que quien consuma no haga defensas repetidas.
  const realData = extractFromData(data);
  return realData;
};

/**
 * Hook para listar los gastos de una coordinación (embarque).
 * Éste es el equivalente Bpm al hook de la carpeta Fetch. Acepta un objeto
 * con las propiedades en minúsculas para facilitar su uso (igual que el hook
 * de la carpeta Fetch). Además mantiene compatibilidad posicional por si
 * alguien ya lo está usando así.
 *
 * @param {Object|any} args - O bien directamente el `embarque_id` o bien un
 *   objeto `{ embarque_id, embarque_version, enabled }`.
 * @param {string|number} [maybeVersion] - versión cuando se usa llamada posicional.
 * @param {Object} options - Opciones adicionales de React Query (solo para el
 *   modo posicional).
 * @returns {UseQueryResult<Array>} resultado de la query
 */
export function useListarCoordinacionGastos(
  args,
  maybeVersion,
  options = {},
) {
  let embarque_id, embarque_version, enabled;

  if (args && typeof args === "object" && !(Array.isArray(args))) {
    // modo objeto
    ({ embarque_id, embarque_version, enabled = true } = args);
  } else {
    // modo posicional (mantenemos compatibilidad)
    embarque_id = args;
    embarque_version = maybeVersion;
    enabled = options.enabled !== undefined ? options.enabled : true;
  }

  return useQuery({
    queryKey: ["listar-coordinacion-gastos", embarque_id, embarque_version],
    queryFn: () => fetchCoordinacionGastos(embarque_id, embarque_version),
    enabled: !!embarque_id && !!enabled,
    ...CACHE_DYNAMIC,
    ...options,
  });
}

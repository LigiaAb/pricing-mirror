import { useMemo } from "react";
import { useListarCoordinacionGastosCriterio } from "./useListarCoordinacionGastosCriterio";

/**
 * Obtiene el valor de una propiedad con diferentes formatos de clave
 * @private
 */
const getValue = (item, ...keys) => {
  for (const key of keys) {
    if (item?.[key] !== undefined) return item[key];
  }
  return undefined;
};

/**
 * Mapea un array de criterios a un objeto { campo: valor }
 * - Filtra por embarque_id primero (el backend puede devolver datos de otros embarques)
 * - Normaliza los nombres de campo a minúsculas
 * - Permite excluir campos (case-insensitive)
 * - Opcional: filtrar solo la última versión si se solicita
 *
 * @param {Array} criterios - Array de criterios (pueden venir con keys en diferentes formatos)
 * @param {string|number} embarque_id - ID del embarque a filtrar
 * @param {Object} options
 * @param {Array<string>} [options.exclude=[]] - Campos a excluir (por ejemplo ['valor_kilos'])
 * @param {boolean} [options.latestVersion=false] - Si true, se filtran solo los criterios de la última versión
 * @returns {Object} Mapa de { [campoEnMinusculas]: valorString }
 */
export function mapCriteriosConValor(criterios, embarque_id, options = {}) {
  const { exclude = [], latestVersion = false } = options;

  if (!Array.isArray(criterios) || criterios.length === 0 || !embarque_id)
    return {};

  // PASO 1: Filtrar por embarque_id (el backend puede que devolver otros embarques)
  const embarqueIdNum = Number(embarque_id);

  let items = criterios.filter((item) => {
    const itemEmbarqueId = Number(
      getValue(item, "embarqueId", "EMBARQUE_ID", "embarque_id"),
    );
    const matches = itemEmbarqueId === embarqueIdNum;
    return matches;
  });

  if (items.length === 0) return {};

  // PASO 2: Filtrar por última versión si se solicita
  if (latestVersion) {
    const versiones = items
      .map((item) =>
        Number(getValue(item, "embarqueVersion", "EMBARQUE_VERSION")),
      )
      .filter((v) => !Number.isNaN(v));

    if (versiones.length > 0) {
      const maxVersion = Math.max(...versiones);
      items = items.filter(
        (item) =>
          Number(getValue(item, "embarqueVersion", "EMBARQUE_VERSION")) ===
          maxVersion,
      );
    }
  }

  // PASO 3: Crear set de exclusiones normalizadas
  const excludeSet = new Set(
    exclude.map((field) => String(field).toLowerCase()),
  );

  // PASO 4: Reducir a mapa de campo -> valor
  return items.reduce((map, item) => {
    const campo = String(
      getValue(item, "criterioCampo", "CRITERIO_CAMPO", "criterio_campo") || "",
    ).toLowerCase();

    if (!campo || excludeSet.has(campo)) return map;

    map[campo] = String(getValue(item, "valor", "VALOR") ?? "");
    return map;
  }, {});
}

/**
 * Hook que devuelve un mapa de criterios { campo: valor } para un embarque.
 * - Por defecto filtra la última versión y excluye `valor_kilos`.
 * - Acepta opciones para modificar comportamiento.
 *
 * @param {string|number} embarque_id - ID del embarque
 * @param {string|number} embarque_version - Versión del embarque (opcional)
 * @param {Object} options - Opciones de configuración
 * @param {Array<string>} [options.exclude=['valor_kilos']] - Campos a excluir del mapa
 * @param {boolean} [options.latestVersion=true] - Si filtra solo la última versión
 * @param {boolean} [options.enabled=!!embarque_id] - Si la query está habilitada
 * @returns {Object} { data, criteriosData, isLoading, isError, ...rest }
 */
export default function useObtenerCriteriosConValor(
  embarque_id,
  embarque_version,
  options = {},
) {
  const {
    exclude = ["valor_kilos"],
    latestVersion = true,
    enabled = !!embarque_id,
    ...queryOptions
  } = options;

  const queryResult = useListarCoordinacionGastosCriterio(
    embarque_id,
    embarque_version,
    {
      enabled,
      ...queryOptions,
    },
  );

  const { data: criteriosData = [], isLoading, isError, ...rest } = queryResult;

  // Crear clave estable para dependencias de exclude
  const excludeKey = exclude.join("|");

  // Mapear criterios a formato { campo: valor }
  const data = useMemo(
    () =>
      mapCriteriosConValor(criteriosData, embarque_id, {
        exclude,
        latestVersion,
      }),
    [criteriosData, embarque_id, latestVersion, excludeKey],
  );

  return { data, criteriosData, isLoading, isError, ...rest };
}

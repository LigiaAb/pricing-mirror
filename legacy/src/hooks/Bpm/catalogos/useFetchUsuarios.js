import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import { extractResponseData, CACHE_SEMI_STATIC } from "../utils";

/**
 * Hook para obtener lista de usuarios
 * @param {Object} filters - Filtros opcionales
 * @returns {UseQueryResult} Query result con usuarios mapeados
 */
export function useFetchUsuarios(filters = {}) {
  return useQuery({
    queryKey: ["listausuario", filters],
    queryFn: () => fetchUsuarios(filters),
    ...CACHE_SEMI_STATIC,
  });
}

/**
 * Función standalone para obtener usuarios (uso fuera de componentes React)
 * @param {Object} filters - Filtros opcionales
 * @returns {Promise<Array>} Lista de usuarios mapeados
 */
export async function fetchUsuarios(filters = {}) {
  const response = await api.get("/api/appweb/listausuario", {
    params: filters,
  });
  return extractResponseData(response).map((u) => ({
    codUsuario: u.cod_usuario,
    usuario: u.usuario,
    codEstado: u.cod_estado,
    codCambioPass: u.cod_cambio_pass,
    ultimaConexion: u.ultima_conexion,
    json: u.json,
    rutaInicial: u.ruta_inicial,
    codCropa: u.cod_cropa,
    value: u.cod_usuario,
    label: u.usuario,
  }));
}

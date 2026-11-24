import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import { extractResponseData, CACHE_SEMI_STATIC } from "../utils";

/**
 * Hook para obtener lista de usuarios
 * @param {Object} filters - Filtros opcionales
 * @returns {UseQueryResult} Query result con usuarios mapeados
 */
export function useFetchEmpleadoUsuarioPuesto(filters = {}) {
  return useQuery({
    queryKey: ["listausuario", filters],
    queryFn: () => fetchEmpleadoUsuarioPuesto(filters),
    ...CACHE_SEMI_STATIC,
  });
}

/**
 * Función standalone para obtener usuarios (uso fuera de componentes React)
 * @param {Object} filters - Filtros opcionales
 * @returns {Promise<Array>} Lista de usuarios mapeados
 */
export async function fetchEmpleadoUsuarioPuesto(filters = {}) {
  const response = await api.get("/api/appweb/listaemp-usu-puesto", {
    params: filters,
  });
  return extractResponseData(response).map((u) => ({
    codPuesto: u.cod_puesto,
    codEmpleado: u.cod_empleado,
    nomEmpleado: u.nom_empleado,
    apellidoEmp: u.apellido_emp,
    sexoEmp: u.sexo_emp,
    dpiEmp: u.dpi_emp,
    codUsuario: u.cod_usuario,
    usuario: u.usuario,
    codEstado: u.cod_estado,
    estadoDesc: u.estado_desc,
    puestoDesc: u.puesto_desc,
    codEmp: u.cod_emp,
    codCc: u.cod_cc,
    nombreEmp: u.nombre_emp,
    nombreCc: u.nombre_cc,
    usuEmpPueDefault: u.usuemppue_default,

    value: u.cod_usuario,
    label: `${u.nom_empleado} ${u.apellido_emp}`,
  }));
}

import useCustomMutation from "../../Fetch/useCustomMutation";
import { api } from "../../../api";

/**
 * Valida y normaliza el payload para la acción de recalcular embarque.
 *
 * Atributos esperados:
 * - embarque_id (SI)      -> Número (1-6 dígitos)
 * - embarque_version (SI) -> Número (1-6 dígitos)
 * - cod_cc (SI)           -> Número del centro de costo activo
 * - criterios (SI)        -> Objeto (estructura variable)
 * - guardar (SI)          -> Boolean (si se guarda como nueva versión)
 *
 * El backend espera un objeto con todos los criterios que aplican a la versión
 * en curso. El frontend suele obtenerlos mediante la consulta
 * `/api/appweb/listar-coordinacion-gastos-criterio`, que devuelve un array de
 * elementos con forma similar a:
 *
 * ```json
 * [
 *   {
 *     "EMBGASTOCRITERIO_ID": 1037,
 *     "EMBARQUE_ID": 110,
 *     "EMBARQUE_VERSION": 0,
 *     "CRITERIO_ID": 7,
 *     "CRITERIO_CAMPO": "cod_pais_origen",
 *     "VALOR": "1001"
 *   },
 *   {
 *     "EMBGASTOCRITERIO_ID": 1039,
 *     "EMBARQUE_ID": 110,
 *     "EMBARQUE_VERSION": 0,
 *     "CRITERIO_ID": 5,
 *     "CRITERIO_CAMPO": "valor_cw",
 *     "VALOR": "300"
 *   },
 *   {
 *     "EMBGASTOCRITERIO_ID": 1044,
 *     "EMBARQUE_ID": 110,
 *     "EMBARQUE_VERSION": 0,
 *     "CRITERIO_ID": 3,
 *     "CRITERIO_CAMPO": "valor_flete",
 *     "VALOR": "210"
 *   }
 * ]
 * ```
 *
 * El hook `useObtenerCriteriosConValor` transforma ese arreglo en un mapa
 * `{ campo: valor }` y se excluye `valor_kilos` porque éste se calcula
 * independientemente.  A la hora de invocar `recalcular.mutate`, debemos
 * enviar **todos los criterios** (incluso aquellos que no cambiaron) más la
 * nueva clave `valor_cw` con el valor total de peso. Por ejemplo:
 *
 * ```json
 * {
 *   "valor_cw": "42",
 *   "valor_flete": "210",
 *   "cod_pais_origen": "1001",
 *   // ...otros criterios presentes en la versión
 * }
 * ```
 *
 * En resumen, el objeto `criterios` no debe limitarse al campo modificado; debe
 * abarcar la colección completa de criterios del embarque antes de desencadenar
 * el recálculo.
 */
function validatePayload(payload = {}) {
  const { embarque_id, embarque_version, cod_cc, criterios, guardar } = payload;

  if (embarque_id === undefined || embarque_id === null) throw new Error("'embarque_id' es obligatorio");
  const embarqueIdNum = Number(embarque_id);
  if (!Number.isInteger(embarqueIdNum) || embarqueIdNum < 0 || embarqueIdNum > 999999) throw new Error("'embarque_id' inválido: debe ser un número entero de 1 a 6 dígitos");

  if (embarque_version === undefined || embarque_version === null) throw new Error("'embarque_version' es obligatorio");
  const embarqueVersionNum = Number(embarque_version);
  if (!Number.isInteger(embarqueVersionNum) || embarqueVersionNum < 0 || embarqueVersionNum > 999999) throw new Error("'embarque_version' inválido: debe ser un número entero de 1 a 6 dígitos");

  if (criterios === undefined || criterios === null || typeof criterios !== "object") throw new Error("'criterios' es obligatorio y debe ser un objeto");

  if (cod_cc === undefined || cod_cc === null) throw new Error("'cod_cc' es obligatorio");
  const codCcNum = Number(cod_cc);
  if (!Number.isInteger(codCcNum) || codCcNum < 0 || codCcNum > 999999) throw new Error("'cod_cc' inválido: debe ser un número entero de 1 a 6 dígitos");

  if (guardar === undefined || guardar === null || typeof guardar !== "boolean") throw new Error("'guardar' es obligatorio y debe ser booleano");

  return {
    embarque_id: embarqueIdNum,
    embarque_version: embarqueVersionNum,
    cod_cc: codCcNum,
    criterios,
    guardar,
  };
}

/**
 * Llama al endpoint POST /api/appweb/re-calcular-embarque
 * @param {Object} payload
 */
export async function recalcularEmbarque(payload) {
  const body = validatePayload(payload);
  const response = await api.post("/api/appweb/re-calcular-embarque", body);
  return response?.data;
}

/**
 * Hook para usar la mutación de recalcular embarque
 *
 * Ejemplo:
 * const recalcular = useRecalcularEmbarque({
 *   onSuccess: () => { // refrescar / toast },
 * });
 *
 * recalcular.mutate({
 *   embarque_id: 123,
 *   embarque_version: 1,
 *   cod_cc: 16,
 *   criterios: {
 *     valor_cw: "40",
 *     valor_flete: "40",
 *     cod_equipo: "4",
 *     cod_commodity: "4",
 *     valor_dueagent: "40",
 *   },
 *   guardar: true,
 * });
 */
export default function useRecalcularEmbarque(options = {}) {
  return useCustomMutation({
    mutationFn: async (payload) => recalcularEmbarque(payload),
    ...options,
  });
}

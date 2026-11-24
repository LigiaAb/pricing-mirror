import { createCoordinacionMasterMutation } from "./useCorrelativoMasterMutation";

/**
 * Hook para asignar un master a una coordinación.
 *
 * Realiza POST a `/api/appweb/asignar-master-coordinacion`.
 *
 * Comportamiento del backend:
 * - Si se envía `num_guia_master`, asigna ese master (validar que exista antes de llamar).
 * - Si no se envía:
 *   - Si hay masters disponibles en /listar-master_disponibles-coordinacion, toma el primero.
 *   - Si no hay disponibles, crea uno nuevo.
 *
 * @param {Object} options - Opciones adicionales para la mutación (react-query)
 * @returns {UseMutationResult} Resultado de la mutación
 *
 * @payload Atributos:
 * - embarque_id (number)     obligatorio
 * - cod_file (string)        obligatorio
 * - num_guia_master (string) opcional
 */
export const useAsignarMasterCoordinacion = createCoordinacionMasterMutation(
  "/api/appweb/asignar-master-coordinacion",
  ["guias-coordinacion"]
);
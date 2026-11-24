import { createCoordinacionMasterMutation } from "./useCorrelativoMasterMutation";

/**
 * Hook para solicitar al backend que asigne un correlativo de guía según el criterio
 * definido por backend a partir de embarque_id y cod_file.
 *
 * Realiza POST a `/api/appweb/asignar-correlativo-guia-x-criterio`.
 *
 * @param {Object} options - Opciones adicionales para la mutación (react-query)
 * @returns {UseMutationResult} Resultado de la mutación
 *
 * @payload Atributos:
 * - embarque_id (number)          obligatorio, 1-6 dígitos
 * - cod_file (string)             obligatorio, texto libre
 * - num_guia_master (string)      opcional, número de guía master seleccionado por el usuario
 *
 * Ejemplo:
 * const { mutateAsync } = useAssignCorrelativoGuiaXCriterio();
 * await mutateAsync({ embarque_id: 123, cod_file: "F001", num_guia_master: "M123456" });
 */
export const useAssignCorrelativoGuiaXCriterio = createCoordinacionMasterMutation(
  "/api/appweb/asignar-correlativo-guia-x-criterio",
  ["guias-coordinacion"]
);
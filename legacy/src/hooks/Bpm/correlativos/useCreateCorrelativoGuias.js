import useCustomMutation from "../../Fetch/useCustomMutation";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../../../api";
import {
  preparePayloadForCreate,
  processListaGuias,
  processHawbPayload,
  processMawbPayload,
  mergeNumericCorrelativeFields,
} from "./validators";

/**
 * Hook para crear correlativos de guías por criterio (HAWB o MAWB)
 * @param {Object} options - Opciones adicionales para la mutación
 * @returns {UseMutationResult} Mutation hook
 *
 * @payload Campos requeridos según tipo:
 * - Común: { ref_tipo_secuencia, cod_empresa, cod_cc, titulo_guia, correlativo_serie, cod_entidad }
 * - HAWB, MBL, MCP: { correlativo_inicial, correlativo_final }
 * - MAWB, HBL, HCP: { lista_guias }
 * - MCP_POOL
 * - Opcionales: { aplica_replica_anual, cantidad_saltos, fecha_vence}
 */
export function useCreateCorrelativoGuiasXCriterio(options = {}) {
  const queryClient = useQueryClient();

  return useCustomMutation({
    mutationFn: async (payload) => {
      if (!payload || typeof payload !== "object") {
        throw new Error("Payload inválido");
      }

      const payloadToSend = preparePayloadForCreate(payload);

      const {
        ref_tipo_secuencia,
        correlativo_inicial,
        correlativo_final,
        cantidad_saltos,
      } = payload;
      const tipoSecuencia = String(ref_tipo_secuencia).toUpperCase();
      const isHawb = tipoSecuencia === "HAWB";
      const isMawb = tipoSecuencia === "MAWB";

      try {
        const listaGuiasProcesada = processListaGuias(payload.lista_guias);
        if (listaGuiasProcesada) {
          payloadToSend.lista_guias = listaGuiasProcesada;
        } else if (
          Array.isArray(payload.lista_guias) &&
          payload.lista_guias.length > 0
        ) {
          console.warn(
            "useCreateCorrelativoGuiasXCriterio - lista_guias provided but could not be processed:",
            payload.lista_guias
          );
        }
      } catch (e) {
        console.warn(
          "useCreateCorrelativoGuiasXCriterio - processListaGuias failed:",
          e
        );
      }

      if (isHawb) {
        processHawbPayload(
          payloadToSend,
          correlativo_inicial,
          correlativo_final,
          cantidad_saltos,
          tipoSecuencia
        );
      }

      if (isMawb) {
        processMawbPayload(
          payloadToSend,
          payload,
          correlativo_inicial,
          correlativo_final,
          cantidad_saltos,
          tipoSecuencia
        );
      }

      mergeNumericCorrelativeFields(
        payloadToSend,
        correlativo_inicial,
        correlativo_final,
        cantidad_saltos,
        tipoSecuencia
      );

      const response = await api.post(
        "/api/appweb/crear-correlativo-guias-x-criterio",
        payloadToSend
      );

      if (response?.data?.success === false) {
        throw new Error(
          response?.data?.error ||
            response?.data?.message ||
            JSON.stringify(response?.data)
        );
      }

      return response?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["correlativo-guias"] });
    },
    ...options,
  });
}

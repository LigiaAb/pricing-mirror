import { useQueryClient } from "@tanstack/react-query";
import useCustomMutation from "../../Fetch/useCustomMutation";
import { api } from "../../../api";

const validateCoordinacionPayload = (payload) => {
  if (!payload || typeof payload !== "object") {
    throw new Error("Payload inválido");
  }

  const { embarque_id, cod_file } = payload;

  if (embarque_id === undefined || embarque_id === null) {
    throw new Error("embarque_id es obligatorio");
  }
  if (Number.isNaN(Number(embarque_id))) {
    throw new TypeError("embarque_id debe ser numérico");
  }
  if (!cod_file || String(cod_file).trim() === "") {
    throw new Error("cod_file es obligatorio");
  }

  return {
    embarque_id: Number(embarque_id),
    cod_file: String(cod_file).trim(),
  };
};

const handleApiResponse = (response) => {
  // El body real va en `response.data.data` (wrapper HTTP
  // `{status, message, data: {success, mensaje, ...}}`); `response.data.success`
  // siempre es `undefined` y nunca detecta un fallo del backend.
  const payload = response?.data?.data;
  if (payload?.success === false) {
    throw new Error(payload?.mensaje || response?.data?.message || JSON.stringify(response?.data));
  }
  return response?.data;
};

export const createCoordinacionMasterMutation = (endpoint, queryKey) => {
  return (options = {}) => {
    const queryClient = useQueryClient();
    const { onSuccess, ...restOptions } = options;

    return useCustomMutation({
      mutationFn: async (payload) => {
        const requestPayload = validateCoordinacionPayload(payload);

        if (payload.num_guia_master) {
          requestPayload.num_guia_master = String(payload.num_guia_master).trim();
        }

        const response = await api.post(endpoint, requestPayload);
        return handleApiResponse(response);
      },
      ...restOptions,
      onSuccess: async (data, variables, context) => {
        await onSuccess?.(data, variables, context);
        await queryClient.invalidateQueries({ queryKey: queryKey, exact: false });
      },
    });
  };
};
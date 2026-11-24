import { createDataMutationHook } from "../../Fetch/useFunctions";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Hook para insertar una actividad
 * @payload {
 *   asunto: string (Obligatorio),
 *   descripcion: string (Obligatorio),
 *   cod_tipo: number (Obligatorio),
 *   fecha_programada: string (Date, Obligatorio),
 *   cod_cliente: number (Obligatorio),
 *   cod_emp: number (Obligatorio),
 *   cod_cc: number (Obligatorio),
 *   cod_asesor: number (Obligatorio),
 *   contactos: number[] (Arreglo de ids, Obligatorio),
 *   cod_documento: string (Obligatorio) – identificador de referencia, p.ej. "embarque_id"
 *   cod_estado?: number (Opcional, defecto 23)
 * }
 */
export const useInsertarActividad = (params, options = {}) => {
    const queryClient = useQueryClient();

    return createDataMutationHook(
        ["actividad-insertar"],
        "/api/appweb/insertar-actividad",
        (res) => res
    )(params, {
        ...options,
        onSuccess: (...args) => {
            // al crear una actividad refrescamos la lista
            queryClient.invalidateQueries({ queryKey: ["actividades"] });
            if (options.onSuccess) options.onSuccess(...args);
        },
    });
};

/**
 * Hook para actualizar una actividad
 * @payload {
 *   cod_actividad: number (Obligatorio),
 *   asunto: string (Obligatorio),
 *   descripcion: string (Obligatorio),
 *   cod_tipo: number (Obligatorio),
 *   fecha_programada: string (Date, Obligatorio),
 *   cod_cliente: number (Obligatorio),
 *   cod_emp: number (Obligatorio),
 *   cod_cc: number (Obligatorio),
 *   cod_asesor: number (Obligatorio),
 *   cod_estado: number (Obligatorio)
 * }
 */
export const useActualizarActividad = (params, options = {}) => {
    const queryClient = useQueryClient();

    return createDataMutationHook(
        ["actividad-actualizar"],
        "/api/appweb/actualizar-actividad",
        (res) => res
    )(params, {
        ...options,
        onSuccess: (...args) => {
            queryClient.invalidateQueries({ queryKey: ["actividades"] });
            if (options.onSuccess) options.onSuccess(...args);
        },
    });
};

/**
 * Hook para eliminar una actividad
 * @payload {
 *   cod_actividad: number (Obligatorio)
 * }
 */
export const useEliminarActividad = (params, options = {}) => {
    const queryClient = useQueryClient();

    return createDataMutationHook(
        ["actividad-eliminar"],
        "/api/appweb/eliminar-actividad",
        (res) => res
    )(params, {
        ...options,
        onSuccess: (...args) => {
            queryClient.invalidateQueries({ queryKey: ["actividades"] });
            if (options.onSuccess) options.onSuccess(...args);
        },
    });
};

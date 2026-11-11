import {
  mutationOptions,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { z } from "zod";
import { CACHE_DYNAMIC } from "@/shared/api/cache";
import { http } from "@/shared/api/client";
import { parseEnvelope } from "@/shared/api/envelope";
import { zId } from "@/shared/lib/zod-scalars";

export const SERVICIOS_QUERY_KEY = ["tarifas", "servicios"] as const;

const texto = z
  .union([z.string(), z.number()])
  .nullable()
  .optional()
  .transform((valor) => (valor == null ? "" : String(valor)));

export const servicioSchema = z.object({
  cod_servicio: zId,
  nombre: texto.nullable(),
  siglas: texto.nullable(),
  cod_rubro: zId.nullable(),
  cod_tipo_servicio: zId.nullable(),
  cod_tipo_transporte: zId,
  entidad_id: zId.nullable(),
  entidad_nombre: texto,
  cod_empresa: zId.nullable(),
  cod_cc: zId.nullable(),
  cod_tipo_calculo: zId.nullable(),
  cod_tipo_aplicacion: zId.nullable(),
  cod_tipo_carga: zId.nullable(),
  cod_clasificacion_carga: zId.nullable(),
  incoterm_id: zId.nullable(),
  cod_tipo_pago: zId.nullable(),
  cod_estado: zId.nullable(),
  servicio_interno: z.boolean().nullable(),
  clasificacion: zId.nullable(),
  servicio_especial: z.boolean().nullable(),
  categoria_transporte: zId.nullable(),
  obligatorio: z.boolean().nullable(),
  ultima_fecha_modificacion: z.boolean().nullable().optional(),
});

export type Servicio = z.infer<typeof servicioSchema>;

export interface FiltrosServicios {
  codEstado?: string | number;
  codServicio?: string | number;
  entidadId?: string | number;
  codRubro?: string | number;
}

export const serviciosOptions = (filtros: FiltrosServicios = {}) =>
  queryOptions({
    queryKey: [...SERVICIOS_QUERY_KEY, filtros],

    queryFn: async () =>
      parseEnvelope(
        await http.get<unknown>("/api/appweb/lista-servicios", {
          params: {
            cod_estado: filtros.codEstado,
            cod_servicio: filtros.codServicio,
            entidad_id: filtros.entidadId,
            cod_rubro: filtros.codRubro,
          },
        }),
        servicioSchema,
        "lista-servicios",
      ),

    ...CACHE_DYNAMIC,
  });

export function useServicios(filtros: FiltrosServicios = {}) {
  return useQuery(serviciosOptions(filtros));
}

/* ==========================================================================
 * MUTATIONS
 * ========================================================================== */

export type ServicioMutationPayload = Record<string, unknown>;

export type ReplicarServicioPayload = {
  cod_servicio: string | number;
  cod_metodo: string | number;
  fecha_inicial: Date | string;
  fecha_final?: Date | string | null;
};

export type ReplicarServicioResultado = {
  codServicio: string | number;
  codMetodo: string | number;
};

/*
 * El código anterior recibía:
 *
 * response.data.data.success
 * response.data.data.cod_servicio
 *
 * http.post ya devuelve el body HTTP, por lo que aquí esperamos:
 *
 * {
 *   data: {
 *     success: true,
 *     cod_servicio: ...
 *   }
 * }
 */
const insertarServicioResponseSchema = z
  .object({
    data: z
      .object({
        success: z.boolean(),
        cod_servicio: zId,
      })
      .passthrough(),
  })
  .passthrough();

/*
 * INSERTAR
 *
 * IMPORTANTE:
 * este mutation devuelve directamente cod_servicio.
 *
 * Por lo tanto:
 *
 * const codServicio = await insertarServicio.mutateAsync(payload);
 */
export const insertarServicioOptions = () =>
  mutationOptions({
    mutationFn: async (payload: ServicioMutationPayload) => {
      const response = await http.post<unknown>("/api/appweb/insertar-servicio", payload);

      const resultado = insertarServicioResponseSchema.parse(response);

      return resultado.data.cod_servicio;
    },
  });

export function useInsertarServicio() {
  const queryClient = useQueryClient();

  return useMutation({
    ...insertarServicioOptions(),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: SERVICIOS_QUERY_KEY,
      });
    },
  });
}

/*
 * ACTUALIZAR
 */
export const actualizarServicioOptions = () =>
  mutationOptions({
    mutationFn: async (payload: ServicioMutationPayload) => {
      return await http.post<unknown>("/api/appweb/actualizar-servicio", payload);
    },
  });

export function useActualizarServicio() {
  const queryClient = useQueryClient();

  return useMutation({
    ...actualizarServicioOptions(),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: SERVICIOS_QUERY_KEY,
      });
    },
  });
}

const replicarServicioResponseSchema = z
  .object({
    data: z
      .object({
        ids: z.object({
          servicio: zId,
          metodo: zId,
        }),
      })
      .passthrough(),
  })
  .passthrough();

export const replicarServicioOptions = () =>
  mutationOptions({
    mutationFn: async (payload: ReplicarServicioPayload): Promise<ReplicarServicioResultado> => {
      const response = await http.post<unknown>("/api/appweb/replicar-servicio", payload);
      const resultado = replicarServicioResponseSchema.parse(response);

      return {
        codServicio: resultado.data.ids.servicio,
        codMetodo: resultado.data.ids.metodo,
      };
    },
  });

export function useReplicarServicio() {
  const queryClient = useQueryClient();

  return useMutation({
    ...replicarServicioOptions(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: SERVICIOS_QUERY_KEY,
      });
    },
  });
}

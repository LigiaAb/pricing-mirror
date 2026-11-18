import { z } from "zod";

export const apiMutationDataSchema = z.looseObject({
  success: z.boolean(),
  cod_mensaje: z.number().optional(),
  mensaje: z.string().optional(),
  message: z.string().optional(),
  error: z.string().optional(),
  url_cliente: z.string().optional(),
  link: z.string().optional(),
  direccion: z.string().optional(),
});

export const apiMutationResponseSchema = z.object({
  data: apiMutationDataSchema,
});
export interface ApiMutationData {
  success: boolean;
  cod_mensaje?: number;
  mensaje?: string;
  message?: string;
  error?: string;
  url_cliente?: string;
  link?: string;
  direccion?: string;
}

interface ApiResponse<T = ApiMutationData> {
  data: T;
}

export type ApiMutationResponse = ApiResponse<ApiMutationData>;

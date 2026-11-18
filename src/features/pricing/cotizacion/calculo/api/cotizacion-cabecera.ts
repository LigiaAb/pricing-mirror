"use client";

import {
  type MutationMeta,
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

import {
  CAMPOS_FILTRO_API,
  type CotizacionCabeceraPayload,
  cotizacionCabeceraSchema,
  type FiltrosCotizacionesCabecera,
} from "../lib/cabecera";
import type { Id } from "../lib/tipos";

/* ==========================================================================
 * SCHEMAS
 * ========================================================================== */

/*
 * El esquema y los tipos de la cabecera se generan en lib/cabecera.ts
 * (definición única de campos). Se re-exportan aquí por compatibilidad.
 */
export {
  type CotizacionCabecera,
  type CotizacionCabeceraPayload,
  cotizacionCabeceraSchema,
  type FiltrosCotizacionesCabecera,
} from "../lib/cabecera";

const insertarCotizacionCabeceraResponseSchema = z
  .object({
    cod_cotizacion_cabecera: zId,
  })
  .passthrough();

const accionCotizacionResponseSchema = z
  .object({
    success: z.boolean(),
  })
  .passthrough();

/* ==========================================================================
 * HELPERS DE RESPUESTA
 * ========================================================================== */

const objectEnvelopeSchema = z
  .object({
    data: z.unknown(),
  })
  .passthrough();

/**
 * Las consultas de listas usan parseEnvelope.
 *
 * Las mutaciones del legado, en cambio, leen:
 *
 * response.data.data.cod_cotizacion_cabecera
 * response.data.data.success
 *
 * El nuevo http ya devuelve el body, por lo que aquí solamente quitamos
 * el envelope externo y validamos el objeto contenido en `data`.
 */
function parseObjectEnvelope<TSchema extends z.ZodTypeAny>(
  payload: unknown,
  schema: TSchema,
  label: string,
): z.infer<TSchema> {
  const envelope = objectEnvelopeSchema.safeParse(payload);

  const source = envelope.success ? envelope.data.data : payload;

  const parsed = schema.safeParse(source);

  if (!parsed.success) {
    throw new Error(`Respuesta inválida en ${label}: ${parsed.error.message}`);
  }

  return parsed.data;
}

/**
 * Rechazar, validar elegibilidad y confirmar responden `{ success: false }` cuando la
 * acción no se hizo. Se convierte en error para que se notifique (toast de error) y
 * para que el `successMessage` solo se muestre cuando la acción sí se completó.
 */
function exigirSuccess<T extends { success: boolean }>(resultado: T, mensaje: string): T {
  if (resultado.success) {
    return resultado;
  }

  const respuesta = resultado as Record<string, unknown>;
  const delBackend = respuesta.message ?? respuesta.mensaje;

  throw new Error(
    typeof delBackend === "string" && delBackend.trim() !== "" ? delBackend : mensaje,
  );
}

/** Opciones de las mutaciones que se usan con distinto `meta` según la pantalla. */
interface OpcionesMutacion {
  meta?: MutationMeta;
}

/* ==========================================================================
 * QUERY
 * ========================================================================== */

export const COTIZACIONES_CABECERA_QUERY_KEY = ["cotizaciones", "cabecera"] as const;

export const cotizacionesCabeceraOptions = (filtros: FiltrosCotizacionesCabecera = {}) =>
  queryOptions({
    queryKey: [...COTIZACIONES_CABECERA_QUERY_KEY, filtros],

    queryFn: async () =>
      parseEnvelope(
        await http.get<unknown>("/api/appweb/lista-cotizacion-cabecera", {
          // Solo los campos marcados con `filtroApi` en lib/cabecera.ts.
          params: Object.fromEntries(CAMPOS_FILTRO_API.map((cod) => [cod, filtros[cod]])),
        }),
        cotizacionCabeceraSchema,
        "lista-cotizacion-cabecera",
      ),

    ...CACHE_DYNAMIC,
  });

export function useCotizacionesCabecera(filtros: FiltrosCotizacionesCabecera = {}) {
  return useQuery(cotizacionesCabeceraOptions(filtros));
}

/* ==========================================================================
 * INSERTAR
 * ========================================================================== */

export const insertarCotizacionCabeceraOptions = () =>
  mutationOptions({
    mutationFn: async (payload: CotizacionCabeceraPayload) => {
      const response = await http.post<unknown>(
        "/api/appweb/insertar-cotizacion-cabecera",
        payload,
      );

      return parseObjectEnvelope(
        response,
        insertarCotizacionCabeceraResponseSchema,
        "insertar-cotizacion-cabecera",
      );
    },
  });

export function useInsertarCotizacionCabecera() {
  const queryClient = useQueryClient();

  return useMutation({
    ...insertarCotizacionCabeceraOptions(),

    meta: { successMessage: "Cotización creada" },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: COTIZACIONES_CABECERA_QUERY_KEY,
      });
    },
  });
}

/* ==========================================================================
 * ACTUALIZAR
 * ========================================================================== */

export const actualizarCotizacionCabeceraOptions = () =>
  mutationOptions({
    mutationFn: async (payload: CotizacionCabeceraPayload) => {
      if (payload.cod_cotizacion_cabecera == null) {
        throw new Error("cod_cotizacion_cabecera es requerido para actualizar la cotización");
      }

      return http.post<unknown>("/api/appweb/actualizar-cotizacion-cabecera", payload);
    },
  });

/**
 * Por defecto muestra "Cotización actualizada". La reactivación de la cabecera al
 * guardar una versión pasa `{ meta: { silent: true } }`: el cálculo ya muestra su
 * propio aviso si falla y el éxito lo anuncia "Versión guardada".
 */
export function useActualizarCotizacionCabecera({
  meta = { successMessage: "Cotización actualizada" },
}: OpcionesMutacion = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    ...actualizarCotizacionCabeceraOptions(),

    meta,

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: COTIZACIONES_CABECERA_QUERY_KEY,
      });
    },
  });
}

/* ==========================================================================
 * RECHAZAR
 * ========================================================================== */

export const rechazarCotizacionCabeceraOptions = () =>
  mutationOptions({
    mutationFn: async (codCotizacionCabecera: Id) => {
      const response = await http.post<unknown>("/api/appweb/rechazar-cotizacion-cabecera", {
        cod_cotizacion_cabecera: codCotizacionCabecera,
      });

      return exigirSuccess(
        parseObjectEnvelope(
          response,
          accionCotizacionResponseSchema,
          "rechazar-cotizacion-cabecera",
        ),
        "No se pudo rechazar la cotización.",
      );
    },
  });

export function useRechazarCotizacionCabecera() {
  const queryClient = useQueryClient();

  return useMutation({
    ...rechazarCotizacionCabeceraOptions(),

    meta: { successMessage: "Cotización rechazada" },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: COTIZACIONES_CABECERA_QUERY_KEY,
      });
    },
  });
}

/* ==========================================================================
 * ELEGIBILIDAD
 * ========================================================================== */

export const validarElegibilidadCotizacionOptions = () =>
  mutationOptions({
    mutationFn: async (codCotizacionCabecera: Id) => {
      const response = await http.post<unknown>("/api/appweb/validar-elegibilidad-cotizacion", {
        cod_cotizacion_cabecera: codCotizacionCabecera,
      });

      return exigirSuccess(
        parseObjectEnvelope(
          response,
          accionCotizacionResponseSchema,
          "validar-elegibilidad-cotizacion",
        ),
        "La cotización no cumple los requisitos para confirmarse.",
      );
    },
  });

export function useValidarElegibilidadCotizacion() {
  return useMutation(validarElegibilidadCotizacionOptions());
}

/* ==========================================================================
 * CONFIRMAR
 * ========================================================================== */

export const confirmarCotizacionCabeceraOptions = () =>
  mutationOptions({
    mutationFn: async (codCotizacionCabecera: Id) => {
      const response = await http.post<unknown>("/api/appweb/confirmar-cotizacion-cabecera", {
        cod_cotizacion_cabecera: codCotizacionCabecera,
      });

      return exigirSuccess(
        parseObjectEnvelope(
          response,
          accionCotizacionResponseSchema,
          "confirmar-cotizacion-cabecera",
        ),
        "No se pudo confirmar la cotización.",
      );
    },
  });

export function useConfirmarCotizacionCabecera() {
  const queryClient = useQueryClient();

  return useMutation({
    ...confirmarCotizacionCabeceraOptions(),

    meta: { successMessage: "Cotización confirmada" },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: COTIZACIONES_CABECERA_QUERY_KEY,
      });
    },
  });
}

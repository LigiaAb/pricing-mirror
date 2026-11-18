"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  activarCotizacionDetalle,
  cotizacionCabeceraSchema,
  criterioGuardadoSchema,
  listarRubrosVersion,
  recuperarArchivoPdf,
  versionCotizacionSchema,
} from "@/features/pricing/cotizacion/calculo";
import { CACHE_DYNAMIC } from "@/shared/api/cache";
import { http } from "@/shared/api/client";
import { parseEnvelope } from "@/shared/api/envelope";
import { zId } from "@/shared/lib/zod-scalars";

type Id = string | number;

export const tarifaSpotAutorizacionSchema = z
  .object({
    cod_tarifa_spot: zId,
    cod_cotizaciondetalle: zId,
    cod_estado: zId.nullable().optional(),
    cod_usuario_tarifaspot: zId.nullable().optional(),
    cod_usuario_autoriza_tarifaspot: zId.nullable().optional(),
    url_documento: z.string().nullable().optional(),
    venta: z.union([z.string(), z.number()]).nullable().optional(),
    venta_original: z.union([z.string(), z.number()]).nullable().optional(),
    flete: z.union([z.string(), z.number()]).nullable().optional(),
    reason_code: zId.nullable().optional(),
    jusificacion: z.string().nullable().optional(),
  })
  .passthrough();

export type TarifaSpotAutorizacion = z.infer<typeof tarifaSpotAutorizacionSchema>;
export type TarifaSpotFila = TarifaSpotAutorizacion & Record<string, unknown>;

export const AUTORIZACION_SPOT_KEY = ["pricing", "autorizacion-spot"] as const;

async function consultarDatosSpot() {
  const [tarifas, cotizaciones, detalles] = await Promise.all([
    http.get<unknown>("/api/appweb/lista-tarifa-spot"),
    http.get<unknown>("/api/appweb/lista-cotizacion-cabecera"),
    http.get<unknown>("/api/appweb/lista-cotizacion-detalle"),
  ]);

  return {
    tarifas: parseEnvelope(tarifas, tarifaSpotAutorizacionSchema, "lista-tarifa-spot"),
    cotizaciones: parseEnvelope(
      cotizaciones,
      cotizacionCabeceraSchema,
      "lista-cotizacion-cabecera",
    ),
    detalles: parseEnvelope(detalles, versionCotizacionSchema, "lista-cotizacion-detalle"),
  };
}

export function useAutorizacionSpot() {
  return useQuery({
    queryKey: AUTORIZACION_SPOT_KEY,
    queryFn: consultarDatosSpot,
    ...CACHE_DYNAMIC,
  });
}

export async function obtenerCwSpot(codCotizacionCabecera: Id, codCotizacionDetalle: Id) {
  const criterios = parseEnvelope(
    await http.get<unknown>("/api/appweb/lista-cotizacion-detalle-criterio", {
      params: {
        cod_cotizacion_cabecera: codCotizacionCabecera,
        cod_cotizaciondetalle: codCotizacionDetalle,
      },
    }),
    criterioGuardadoSchema,
    "lista-cotizacion-detalle-criterio",
  );
  return criterios.find((item) => String(item.cod_criterio) === "15")?.valor ?? null;
}

/** Valores originales del flete que reemplazó el Spot, leídos del rubro guardado en la versión. */
export type OriginalSpot = {
  /** El flete original era un mínimo (monto fijo, `original_rate_venta` = 0). */
  esMinimo: boolean;
  /** Mínimo original (`original_venta` del rubro SPOT). */
  minimo: number | null;
};

const numeroONull = (value: unknown) =>
  value == null || String(value).trim() === "" || !Number.isFinite(Number(value))
    ? null
    : Number(value);

/**
 * El rubro SPOT de la versión guarda más campos que la tarifa Spot: si el flete usaba
 * mínimo, el monto original va en `original_venta` (la tarifa Spot solo guarda la
 * tarifa por unidad original, que en ese caso es 0). `null` si no se encuentra.
 */
export async function obtenerOriginalSpot(codCotizacionDetalle: Id): Promise<OriginalSpot | null> {
  const rubros = await listarRubrosVersion(codCotizacionDetalle);
  const spot = rubros.find((rubro) => rubro.es_tarifa_spot === true);
  if (!spot) return null;
  const rateOriginal = numeroONull(spot.original_rate_venta);
  return { esMinimo: rateOriginal === 0, minimo: numeroONull(spot.original_venta) };
}

export { recuperarArchivoPdf };

export function useActualizarTarifaSpot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      http.post("/api/appweb/actualizar-tarifa-spot", payload),
    meta: { successMessage: "Tarifa spot rechazada" },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: AUTORIZACION_SPOT_KEY }),
  });
}

export function useAutorizarTarifaSpot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      payload,
      codCotizacionCabecera,
      codCotizacionDetalle,
    }: {
      payload: Record<string, unknown>;
      codCotizacionCabecera: Id;
      codCotizacionDetalle: Id;
    }) => {
      await http.post("/api/appweb/actualizar-tarifa-spot", payload);
      await activarCotizacionDetalle({ codCotizacionCabecera, codCotizacionDetalle });
    },
    meta: { successMessage: "Tarifa spot autorizada" },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: AUTORIZACION_SPOT_KEY }),
  });
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { CACHE_DYNAMIC } from "@/shared/api/cache";
import { http } from "@/shared/api/client";
import { parseEnvelope } from "@/shared/api/envelope";
import { zId } from "@/shared/lib/zod-scalars";
import { cotizacionCabeceraSchema } from "../../cotizacion/calculo/api/cotizacion-cabecera";
import {
  activarCotizacionDetalle,
  recuperarArchivoPdf,
} from "../../cotizacion/calculo/api/cotizacion-detalle";
import {
  criterioGuardadoSchema,
  versionCotizacionSchema,
} from "../../cotizacion/calculo/api/versiones";

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

export { recuperarArchivoPdf };

export function useActualizarTarifaSpot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      http.post("/api/appweb/actualizar-tarifa-spot", payload),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: AUTORIZACION_SPOT_KEY }),
  });
}

export function useCargarArchivoSpot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ codTarifaSpot, archivo }: { codTarifaSpot: Id; archivo: File }) => {
      const formData = new FormData();
      formData.append("cod_tarifa_spot", String(codTarifaSpot));
      formData.append("archivo", archivo);
      return http.post<unknown>("/api/appweb/cargar-archivo-tarifa-spot", formData);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: AUTORIZACION_SPOT_KEY }),
  });
}

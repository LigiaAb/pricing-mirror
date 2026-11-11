import { mutationOptions, queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { CACHE_DYNAMIC } from "@/shared/api/cache";
import { http } from "@/shared/api/client";
import { parseEnvelope } from "@/shared/api/envelope";
import { zId } from "@/shared/lib/zod-scalars";

import type { Id } from "../lib/tipos";

/* ==========================================================================
 * SCHEMAS
 * ========================================================================== */

export const versionCotizacionSchema = z
  .object({
    cod_cotizaciondetalle: zId,

    cod_cotizacion_cabecera: zId.nullable().optional(),

    version: z.union([z.number(), z.string()]).nullable().optional(),

    total: z.union([z.number(), z.string()]).nullable().optional(),

    cod_estado: zId.nullable().optional(),

    cod_usuario: zId.nullable().optional(),

    tipo_transito: z.unknown().nullable().optional(),

    salida: z.unknown().nullable().optional(),

    opcionales: z.unknown().nullable().optional(),

    es_spot: z.boolean().nullable().optional(),
  })
  .passthrough();

export type VersionCotizacion = z.infer<typeof versionCotizacionSchema>;

export const spotVersionSchema = z
  .object({
    cod_estado: zId.nullable().optional(),
  })
  .passthrough();

export type SpotVersion = z.infer<typeof spotVersionSchema>;

export const rubroVersionSchema = z
  .object({
    cod_detallerubro: zId.nullable().optional(),

    cod_rubro: zId.nullable().optional(),

    cod_servicio: zId.nullable().optional(),

    entidad_id: zId.nullable().optional(),

    cod_entidad: zId.nullable().optional(),

    es_flete: z.boolean().nullable().optional(),

    vencida: z.boolean().nullable().optional(),

    clasificacion: zId.nullable().optional(),

    servicio_clasificacion: zId.nullable().optional(),
  })
  .passthrough();

export type RubroVersion = z.infer<typeof rubroVersionSchema>;

export const dimensionVersionSchema = z
  .object({
    cod_cotizaciondetalle: zId.nullable().optional(),
  })
  .passthrough();

export type DimensionVersion = z.infer<typeof dimensionVersionSchema>;

export const legVersionSchema = z
  .object({
    cod_cotizaciondetalle: zId.nullable().optional(),

    cod_tipo_transporte: zId.nullable().optional(),

    cod_puntoenlace_origen: zId.nullable().optional(),

    cod_puntoenlace_destino: zId.nullable().optional(),

    orden: z.coerce.number(),

    rate: z.coerce.number().catch(0),

    costo: z.coerce.number().catch(0),

    entidad_id: zId.nullable().optional(),

    cod_estado: zId.nullable().optional(),
  })
  .passthrough();

export type LegVersion = z.infer<typeof legVersionSchema>;

export const criterioGuardadoSchema = z
  .object({
    cod_criterio: zId,

    valor: z.unknown().nullable().optional(),
  })
  .passthrough();

export type CriterioGuardado = z.infer<typeof criterioGuardadoSchema>;

export const criterioDisponibleSchema = z
  .object({
    cod_criterio: zId,

    cod_tipo_dato: z.union([z.number(), z.string()]),

    campo: z.string(),

    descripcion: z.string(),
  })
  .passthrough();

export type CriterioDisponible = z.infer<typeof criterioDisponibleSchema>;

export const plantillaVersionSchema = z
  .object({
    cod_tarifaplantilla: zId.nullable().optional(),

    carrier_id: zId.nullable().optional(),

    criterios: z.array(criterioDisponibleSchema).optional().catch([]),
  })
  .passthrough();

export type PlantillaVersion = z.infer<typeof plantillaVersionSchema>;

const servicioInternoSchema = z
  .object({
    cod_servicio: zId,
  })
  .passthrough();
export const VERSIONES_QUERY_KEY = ["cotizaciones", "versiones"] as const;

export async function listarVersiones(codCotizacionCabecera: Id) {
  return parseEnvelope(
    await http.get<unknown>("/api/appweb/lista-cotizacion-detalle", {
      params: {
        cod_cotizacion_cabecera: codCotizacionCabecera,
      },
    }),
    versionCotizacionSchema,
    "lista-cotizacion-detalle",
  );
}

export async function obtenerSpotVersion(codCotizacionDetalle: Id) {
  const data = parseEnvelope(
    await http.get<unknown>("/api/appweb/lista-tarifa-spot", {
      params: {
        cod_cotizaciondetalle: codCotizacionDetalle,
      },
    }),
    spotVersionSchema,
    "lista-tarifa-spot",
  );

  return data[0] ?? null;
}

export async function listarVersionesConSpot(codCotizacionCabecera: Id) {
  const versiones = await listarVersiones(codCotizacionCabecera);

  return Promise.all(
    versiones.map(async (version) => {
      if (!version.es_spot) {
        return version;
      }

      const spot = await obtenerSpotVersion(version.cod_cotizaciondetalle);

      return {
        ...version,

        cotizaciondetalle_json: spot,
      };
    }),
  );
}
async function listarRubrosVersion(codCotizacionDetalle: Id) {
  return parseEnvelope(
    await http.get<unknown>("/api/appweb/lista-cotizacion-detalle-rubro", {
      params: {
        cod_cotizaciondetalle: codCotizacionDetalle,
      },
    }),
    rubroVersionSchema,
    "lista-cotizacion-detalle-rubro",
  );
}

async function listarDimensionesVersion(codCotizacionDetalle: Id) {
  return parseEnvelope(
    await http.get<unknown>("/api/appweb/lista-cotizacion-detalle-dimension", {
      params: {
        cod_cotizaciondetalle: codCotizacionDetalle,
      },
    }),
    dimensionVersionSchema,
    "lista-cotizacion-detalle-dimension",
  );
}

async function listarLegsVersion(codCotizacionDetalle: Id) {
  const legs = parseEnvelope(
    await http.get<unknown>("/api/appweb/lista-cotizacion-detalle-legs", {
      params: {
        cod_cotizaciondetalle: codCotizacionDetalle,
      },
    }),
    legVersionSchema,
    "lista-cotizacion-detalle-legs",
  );

  return [...legs].sort((a, b) => a.orden - b.orden);
}

async function listarCriteriosGuardados({
  codCotizacionCabecera,
  codCotizacionDetalle,
}: {
  codCotizacionCabecera: Id;

  codCotizacionDetalle: Id;
}) {
  return parseEnvelope(
    await http.get<unknown>("/api/appweb/lista-cotizacion-detalle-criterio", {
      params: {
        cod_cotizacion_cabecera: codCotizacionCabecera,

        cod_cotizaciondetalle: codCotizacionDetalle,
      },
    }),
    criterioGuardadoSchema,
    "lista-cotizacion-detalle-criterio",
  );
}
async function obtenerPlantilla(filtros: Record<string, unknown>) {
  const data = parseEnvelope(
    await http.get<unknown>("/api/appweb/recupera-datos-plantilla", {
      params: filtros,
    }),
    plantillaVersionSchema,
    "recupera-datos-plantilla",
  );

  return data[0] ?? null;
}

async function listarServiciosInternos(filtros: Record<string, unknown>) {
  return parseEnvelope(
    await http.get<unknown>("/api/appweb/lista-servicios", {
      params: {
        servicio_interno: true,

        cod_estado: 1,

        ...filtros,

        /*
         * En el legado este null
         * va DESPUÉS de filtros,
         * por lo que gana siempre.
         */
        incoterm_id: null,
      },
    }),
    servicioInternoSchema,
    "lista-servicios-internos",
  );
}

async function listarCriteriosServicio(codServicio: Id) {
  return parseEnvelope(
    await http.get<unknown>("/api/appweb/obtener-criterios", {
      params: {
        cod_servicio: codServicio,
      },
    }),
    criterioDisponibleSchema,
    "obtener-criterios",
  );
}
export type CargarVersionParams = {
  codCotizacionCabecera: Id;

  codCotizacionDetalle?: Id | null;

  filtros: Record<string, unknown>;
};

export async function cargarVersion({ codCotizacionCabecera, codCotizacionDetalle, filtros }: CargarVersionParams) {
  const esNueva = codCotizacionDetalle == null || Number(codCotizacionDetalle) === 0;

  /*
   * Todas estas llamadas son
   * independientes.
   */
  const [rubros, dimensiones, legs, criteriosGuardados, plantilla, serviciosInternos] = await Promise.all([
    esNueva ? Promise.resolve([]) : listarRubrosVersion(codCotizacionDetalle),

    esNueva ? Promise.resolve([]) : listarDimensionesVersion(codCotizacionDetalle),

    esNueva ? Promise.resolve([]) : listarLegsVersion(codCotizacionDetalle),

    esNueva
      ? Promise.resolve([])
      : listarCriteriosGuardados({
          codCotizacionCabecera,

          codCotizacionDetalle,
        }),

    obtenerPlantilla(filtros),

    listarServiciosInternos(filtros),
  ]);

  const criteriosInternos = (await Promise.all(serviciosInternos.map((servicio) => listarCriteriosServicio(servicio.cod_servicio)))).flat();

  const criteriosDisponibles = [...(plantilla?.criterios ?? []), ...criteriosInternos];

  return {
    rubros,

    dimensiones,

    legs,

    plantilla,

    criteriosGuardados,

    criteriosDisponibles,
  };
}
export const versionesOptions = (codCotizacionCabecera?: Id | null) =>
  queryOptions({
    queryKey: [...VERSIONES_QUERY_KEY, codCotizacionCabecera],

    queryFn: () => {
      if (codCotizacionCabecera == null) {
        return Promise.resolve([]);
      }

      return listarVersionesConSpot(codCotizacionCabecera);
    },

    enabled: codCotizacionCabecera != null,

    ...CACHE_DYNAMIC,
  });

export function useVersiones(codCotizacionCabecera?: Id | null) {
  return useQuery(versionesOptions(codCotizacionCabecera));
}

export const activarVersionOptions = () =>
  mutationOptions({
    mutationFn: async ({
      codCotizacionCabecera,
      codCotizacionDetalle,
    }: {
      codCotizacionCabecera: Id;

      codCotizacionDetalle: Id;
    }) => {
      await http.post("/api/appweb/activar-cotizacion-detalle", {
        cod_cotizacion_cabecera: codCotizacionCabecera,

        cod_cotizaciondetalle: codCotizacionDetalle,
      });
    },
  });

export function useActivarVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    ...activarVersionOptions(),

    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: [...VERSIONES_QUERY_KEY, variables.codCotizacionCabecera],
      });
    },
  });
}

"use client";

import { mutationOptions, useMutation } from "@tanstack/react-query";

import {
  activarCotizacionDetalle,
  generarPdfCotizacionDetalle,
  insertarCotizacionDetalle,
  insertarCriterioCotizacion,
  insertarDimensionCotizacion,
  insertarLegCotizacion,
  insertarRubroCotizacion,
} from "../api/cotizacion-detalle";

import { cargarArchivoTarifaSpot, insertarTarifaSpot } from "../api/spot";

import {
  agruparRubrosParaGuardar,
  construirCriteriosPayload,
  construirDimensionesPayload,
  construirPayloadVersion,
  construirSpotPayload,
  type DimensionIngresada,
  esSpotMayorAlOriginal,
  obtenerRubroSpot,
  type RubroGuardar,
  requiereDocumentoSpot,
} from "../lib/guardar-version";

import type { Id } from "../lib/tipos";

type Props = {
  codCotizacionCabecera?: Id | null;

  codUsuario?: Id | null;

  versionActual?: Record<string, unknown> | null;

  rubros: RubroGuardar[];

  criterios: Record<string, unknown>;

  criterioCobertura?: Record<string, unknown>;

  criteriosCatalogo: Array<{
    cod_criterio?: Id | null;

    campo?: string | null;
  }>;

  legs: Array<Record<string, unknown>>;

  dimensiones: DimensionIngresada[];

  codCc?: Id | null;

  codTipoTransporte?: Id | null;

  archivoSpot?: File | null;

  descripcionSpot?: string | null;

  reasonCodeSpot?: Id | null;

  estados: {
    ACTIVO?: Id;
    INACTIVO?: Id;
    AUTORIZADO?: Id;
  };

  onGuardado?: ({
    codCotizacionDetalle,
    version,
  }: {
    codCotizacionDetalle: Id;

    version: Record<string, unknown>;
  }) => Promise<void> | void;
};
async function persistirVersion({
  codCotizacionCabecera,
  codUsuario,
  versionActual,
  rubros,
  criterios,
  criterioCobertura,
  criteriosCatalogo,
  legs,
  dimensiones,
  codCc,
  codTipoTransporte,
  archivoSpot,
  descripcionSpot,
  reasonCodeSpot,
  estados,
  onGuardado,
}: Props) {
  if (
    !versionActual ||
    codCotizacionCabecera == null ||
    !rubros.length ||
    !Object.keys(criterios).length
  ) {
    return {
      ok: false as const,
      motivo: "DATOS_INCOMPLETOS" as const,
    };
  }

  const rubroSpot = obtenerRubroSpot(rubros);
  const { ACTIVO, INACTIVO, AUTORIZADO } = estados;

  // Comprueba los códigos antes de insertar el detalle para evitar un guardado parcial.
  if (ACTIVO == null || INACTIVO == null || (rubroSpot && AUTORIZADO == null)) {
    throw new Error("Faltan códigos de estado para guardar esta versión.");
  }

  if (
    requiereDocumentoSpot({
      rubroSpot,
      archivo: archivoSpot ?? null,
    })
  ) {
    return {
      ok: false as const,
      motivo: "DOCUMENTO_SPOT_REQUERIDO" as const,
    };
  }

  // 1. DETALLE

  const reqBody = construirPayloadVersion({
    version: versionActual,
    codCotizacionCabecera,
    codEstadoInactivo: INACTIVO,
    tieneSpot: rubroSpot != null,
  });

  const codCotizacionDetalle = await insertarCotizacionDetalle(reqBody);

  if (codCotizacionDetalle == null) {
    return {
      ok: false as const,
      motivo: "SIN_CODIGO_DETALLE" as const,
    };
  }

  // 2. SPOT

  if (rubroSpot && AUTORIZADO != null) {
    const spotPayload = construirSpotPayload({
      rubroSpot,
      codUsuario: codUsuario ?? null,
      codCotizacionDetalle,
      codEstadoActivo: ACTIVO,
      codEstadoAutorizado: AUTORIZADO,
      reasonCode: reasonCodeSpot ?? null,
      descripcion: descripcionSpot ?? null,
    });

    const codTarifaSpot = await insertarTarifaSpot(spotPayload);

    if (archivoSpot) {
      await cargarArchivoTarifaSpot({
        codTarifaSpot,
        archivo: archivoSpot,
      });
    }
  }

  // 3. RUBROS

  const grupos = agruparRubrosParaGuardar({
    rubros,
    codCc: codCc ?? null,
    codTipoTransporte: codTipoTransporte ?? null,
  });

  /*
   * Orden secuencial entre grupos.
   */
  for (const grupo of grupos) {
    /*
     * Paralelo dentro del grupo.
     */
    await Promise.all(
      grupo.map((rubro) =>
        insertarRubroCotizacion({
          ...rubro,
          cod_cotizaciondetalle: codCotizacionDetalle,
          cod_cotizacion_cabecera: codCotizacionCabecera,
        }),
      ),
    );
  }

  // 4. LEGS

  await Promise.all(
    legs.map((leg) =>
      insertarLegCotizacion({
        ...leg,
        cod_cotizaciondetalle: codCotizacionDetalle,
      }),
    ),
  );

  // 5. DIMENSIONES

  const dimensionesPayload = construirDimensionesPayload(dimensiones, criterios);

  await Promise.all(
    dimensionesPayload.map((dimension) =>
      insertarDimensionCotizacion({
        ...dimension,

        /*
         * Parche actual del backend.
         */
        cotizaciondetalle_id: Number(codCotizacionDetalle),
        cod_cotizaciondetalle: Number(codCotizacionDetalle),
        cod_cotizacion_cabecera: codCotizacionCabecera,
      }),
    ),
  );

  // 6. CRITERIOS

  const criteriosPayload = construirCriteriosPayload({
    criterios,
    ...(criterioCobertura === undefined ? {} : { criterioCobertura }),
    catalogo: criteriosCatalogo,
  });

  await Promise.all(
    criteriosPayload.map((criterio) =>
      insertarCriterioCotizacion({
        cod_cotizaciondetalle: codCotizacionDetalle,
        ...criterio,
      }),
    ),
  );

  // 7. PDF

  await generarPdfCotizacionDetalle(codCotizacionDetalle);

  // 8. ACTIVAR

  const activar = !rubroSpot || esSpotMayorAlOriginal(rubroSpot);

  if (activar) {
    await activarCotizacionDetalle({
      codCotizacionCabecera,
      codCotizacionDetalle,
    });
  }

  // 9. VERSIÓN GUARDADA PARA EL CLIENTE

  const versionPersistida: Record<string, unknown> = {
    ...reqBody,
  };

  // La respuesta local debe representar una versión persistida.
  delete versionPersistida.isNew;
  delete versionPersistida.isActive;
  delete versionPersistida.accionesDeTabla;

  const versionGuardada = {
    ...versionPersistida,
    cod_cotizaciondetalle: codCotizacionDetalle,

    /*
     * Reflejar el estado que realmente quedó en backend:
     *
     * - normal / SPOT mayor -> se activa
     * - SPOT que requiere autorización -> queda inactiva
     */
    cod_estado: activar ? ACTIVO : INACTIVO,
    isNew: false,
    isActive: activar,
  };

  await onGuardado?.({
    codCotizacionDetalle,
    version: versionGuardada,
  });

  return {
    ok: true as const,
    codCotizacionDetalle,
    version: versionGuardada,
    activada: activar,
  };
}

export function useGuardarVersionCotizacion(props: Props) {
  const guardarMutation = useMutation(
    mutationOptions({ mutationFn: () => persistirVersion(props) }),
  );
  return {
    guardarVersion: guardarMutation.mutateAsync,
    guardando: guardarMutation.isPending,
    error: guardarMutation.error,
  };
}

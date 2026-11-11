"use client";

import { useQueryClient } from "@tanstack/react-query";
import * as React from "react";

import {
  type CotizacionCabecera,
  type CotizacionCabeceraPayload,
  cotizacionCabeceraSchema,
  type FiltrosCotizacionesCabecera,
  useActualizarCotizacionCabecera,
  useConfirmarCotizacionCabecera,
  useCotizacionesCabecera,
  useInsertarCotizacionCabecera,
  useRechazarCotizacionCabecera,
  useValidarElegibilidadCotizacion,
} from "../api/cotizacion-cabecera";
import { VERSIONES_QUERY_KEY } from "../api/versiones";
import { CAMPOS_FILTRO, CAMPOS_FILTRO_API } from "../lib/cabecera";
import { COD_ESTADO_OCULTO_LEGADO, TIPO_PAGO } from "../lib/constantes";
import type { Id } from "../lib/tipos";
import { mismoId } from "../lib/utils";

/**
 * Estado excluido explícitamente por la tabla legado además de RECHAZADO
 * y FINALIZADO.
 *
 * El código antiguo no documenta qué representa 67. Se conserva tal cual
 * hasta confirmar su significado en el catálogo de estados.
 */
export { COD_ESTADO_OCULTO_LEGADO };

export type EstadosGestionCotizacion = {
  ACTIVO: Id;
  RECHAZADO: Id;
  FINALIZADO: Id;
  VENCIDO: Id;
  CONFIRMADO: Id;
  INGRESADO: Id;
  SOLICITADO: Id;
};

export type PlantillaGestionCotizacion = {
  value?: Id | null;
  cod_tarifaplantilla?: Id | null;
  carrier_id?: Id | null;
  [key: string]: unknown;
};

export type CotizacionNueva = CotizacionCabeceraPayload & {
  cod_cotizacion_cabecera?: null;
};

export type CotizacionSeleccionada = CotizacionCabecera | CotizacionNueva;

type Props = {
  filtrosIniciales?: FiltrosCotizacionesCabecera;

  estados: EstadosGestionCotizacion;

  /**
   * En el legado, cambiar/limpiar/nueva cotización ejecuta
   * clearPlantillasRubrosCliente().
   *
   * El hook no conoce cómo se cargan esas plantillas en Next; solamente
   * conserva el punto de integración.
   */
  onLimpiarPlantillas?: () => void;
};

function tieneValorLegado(value: unknown) {
  /*
   * GestionCotizacion hacía:
   *
   * if (!value) return;
   *
   * Se conserva la misma semántica para los filtros de cabecera.
   */
  return Boolean(value);
}

/**
 * Toma de los valores del formulario (o de una cotización) solo los campos
 * marcados como `filtro` en lib/cabecera.ts que tengan valor.
 *
 * Tipo de pago 131 ("Todos") no filtra.
 */
function extraerFiltros(
  values: CotizacionCabeceraPayload | CotizacionCabecera,
): FiltrosCotizacionesCabecera {
  const filtros: FiltrosCotizacionesCabecera = {};

  for (const campo of CAMPOS_FILTRO) {
    const value = values[campo];

    if (!tieneValorLegado(value)) continue;

    if (campo === "cod_tipo_pago" && value === TIPO_PAGO.TODOS) continue;

    filtros[campo] = value as Id;
  }

  return filtros;
}

/** Valores iniciales del formulario de filtros a partir de los filtros activos. */
function filtrosABorrador(filtros: FiltrosCotizacionesCabecera): CotizacionNueva {
  const borrador: Record<string, unknown> = { cod_cotizacion_cabecera: null };

  /*
   * Para una nueva cotización conservamos 131 si estaba seleccionado.
   * Solo se elimina de la CONSULTA, igual que en el legado.
   */
  for (const campo of [...CAMPOS_FILTRO, ...CAMPOS_FILTRO_API]) {
    borrador[campo] = filtros[campo] ?? null;
  }

  return borrador as CotizacionNueva;
}

function obtenerEstadoVisual(payload: CotizacionCabeceraPayload): Id | null {
  const estado = payload.estado;

  if (typeof estado !== "object" || estado == null) {
    return null;
  }

  if (!("value" in estado)) {
    return null;
  }

  const value = (estado as { value?: unknown }).value;

  if (typeof value === "string" || typeof value === "number") {
    return value;
  }

  return null;
}

export function useGestionCotizaciones({
  filtrosIniciales = {},
  estados,
  onLimpiarPlantillas,
}: Props) {
  /* ==========================================================================
   * FILTROS / LISTADO
   * ========================================================================== */

  const [filtros, setFiltros] = React.useState<FiltrosCotizacionesCabecera>(filtrosIniciales);
  const [filtrosBorrador, setFiltrosBorrador] = React.useState<CotizacionCabeceraPayload>(() =>
    filtrosABorrador(filtrosIniciales),
  );

  const [mostrarConfirmados, setMostrarConfirmados] = React.useState(false);
  const [mostrarVencidas, setMostrarVencidas] = React.useState(false);

  /**
   * Regla exacta de TablaGestionCabeceraCotizacion:
   * tipo de pago 131 = "Todos" y no debe enviarse como filtro al endpoint.
   */
  const filtrosConsulta = React.useMemo<FiltrosCotizacionesCabecera>(
    () => ({
      ...filtros,
      cod_tipo_pago: mismoId(filtros.cod_tipo_pago, TIPO_PAGO.TODOS)
        ? null
        : (filtros.cod_tipo_pago ?? null),
    }),
    [filtros],
  );

  const cotizacionesQuery = useCotizacionesCabecera(filtrosConsulta);

  const cotizacionesVisibles = React.useMemo(() => {
    const filtrosActivos = Object.entries(filtrosConsulta).filter(
      ([, value]) => value != null && value !== "",
    );

    return (cotizacionesQuery.data ?? [])
      .filter((cotizacion) => !mismoId(cotizacion.cod_estado, estados.RECHAZADO))
      .filter((cotizacion) => !mismoId(cotizacion.cod_estado, COD_ESTADO_OCULTO_LEGADO))
      .filter((cotizacion) => !mismoId(cotizacion.cod_estado, estados.FINALIZADO))
      .filter((cotizacion) =>
        mostrarConfirmados
          ? mismoId(cotizacion.cod_estado, estados.CONFIRMADO)
          : !mismoId(cotizacion.cod_estado, estados.CONFIRMADO),
      )
      .filter((cotizacion) =>
        mostrarVencidas
          ? mismoId(cotizacion.cod_estado, estados.VENCIDO)
          : !mismoId(cotizacion.cod_estado, estados.VENCIDO),
      )
      .filter((cotizacion) => {
        const valoresCotizacion = extraerFiltros(cotizacion);

        return filtrosActivos.every(([campo, valor]) =>
          mismoId(valoresCotizacion[campo as keyof FiltrosCotizacionesCabecera], valor),
        );
      });
  }, [
    cotizacionesQuery.data,
    filtrosConsulta,
    estados.RECHAZADO,
    estados.FINALIZADO,
    estados.CONFIRMADO,
    estados.VENCIDO,
    mostrarConfirmados,
    mostrarVencidas,
  ]);

  const aplicarFiltrosFormulario = React.useCallback((values: CotizacionCabeceraPayload) => {
    const next = extraerFiltros(values);

    setFiltrosBorrador(values);

    setFiltros((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(next)) {
        return prev;
      }

      return next;
    });
  }, []);

  const alternarConfirmados = React.useCallback(() => {
    setMostrarConfirmados((prev) => !prev);
  }, []);
  const alternarVencidas = React.useCallback(() => {
    setMostrarVencidas((prev) => !prev);
  }, []);

  /* ==========================================================================
   * SELECCIÓN / NUEVA COTIZACIÓN
   * ========================================================================== */

  const [cotizacionSeleccionada, setCotizacionSeleccionada] =
    React.useState<CotizacionSeleccionada | null>(null);

  const [isNewCotizacion, setIsNewCotizacion] = React.useState(false);

  const [plantillaSeleccionada, setPlantillaSeleccionada] =
    React.useState<PlantillaGestionCotizacion | null>(null);

  /**
   * Sustituye el booleano clearForm del legado.
   *
   * Cada incremento representa una solicitud nueva de reset. El formulario
   * que migremos después podrá reaccionar a este valor sin necesidad de
   * mantener dos estados sincronizados.
   */
  const [formResetKey, setFormResetKey] = React.useState(0);

  const limpiarPlantilla = React.useCallback(() => {
    setPlantillaSeleccionada(null);
    onLimpiarPlantillas?.();
  }, [onLimpiarPlantillas]);

  const queryClient = useQueryClient();

  const seleccionarCotizacion = React.useCallback(
    (cotizacion: CotizacionCabecera) => {
      setIsNewCotizacion(false);
      setFormResetKey((prev) => prev + 1);
      limpiarPlantilla();
      setCotizacionSeleccionada(cotizacion);

      /*
       * Al seleccionar una cabecera siempre se reconsultan sus versiones:
       * otro usuario (o Autorización Spot) pudo crear/activar versiones
       * y la caché no debe mostrar una lista vieja. También aplica al
       * volver a seleccionar la misma cabecera.
       */
      void queryClient.invalidateQueries({
        queryKey: [...VERSIONES_QUERY_KEY, cotizacion.cod_cotizacion_cabecera],
      });
    },
    [limpiarPlantilla, queryClient],
  );

  const seleccionarCotizacionPorId = React.useCallback(
    (codCotizacionCabecera: Id) => {
      const cotizacion = (cotizacionesQuery.data ?? []).find((item) =>
        mismoId(item.cod_cotizacion_cabecera, codCotizacionCabecera),
      );

      if (!cotizacion) {
        return null;
      }

      seleccionarCotizacion(cotizacion);

      return cotizacion;
    },
    [cotizacionesQuery.data, seleccionarCotizacion],
  );

  const aplicarPlantilla = React.useCallback((plantilla: PlantillaGestionCotizacion) => {
    setPlantillaSeleccionada(plantilla);

    setCotizacionSeleccionada((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        ...plantilla,
        cod_cotizacion_cabecera: prev.cod_cotizacion_cabecera ?? null,
        cod_tarifaplantilla: plantilla.cod_tarifaplantilla ?? plantilla.value ?? null,
      } as CotizacionSeleccionada;
    });

    setFormResetKey((prev) => prev + 1);
  }, []);

  const limpiarCotizacion = React.useCallback(() => {
    setIsNewCotizacion(false);
    setFormResetKey((prev) => prev + 1);
    limpiarPlantilla();
    setCotizacionSeleccionada(null);
  }, [limpiarPlantilla]);

  const nuevaCotizacion = React.useCallback(() => {
    setIsNewCotizacion(true);
    setFormResetKey((prev) => prev + 1);
    limpiarPlantilla();
    setCotizacionSeleccionada(filtrosABorrador(filtros));
  }, [filtros, limpiarPlantilla]);

  /* ==========================================================================
   * MUTATIONS
   * ========================================================================== */

  const insertarMutation = useInsertarCotizacionCabecera();
  const actualizarMutation = useActualizarCotizacionCabecera();
  const rechazarMutation = useRechazarCotizacionCabecera();
  const validarElegibilidadMutation = useValidarElegibilidadCotizacion();
  const confirmarMutation = useConfirmarCotizacionCabecera();
  const rechazarMutateAsync = rechazarMutation.mutateAsync;
  const validarElegibilidadMutateAsync = validarElegibilidadMutation.mutateAsync;
  const confirmarMutateAsync = confirmarMutation.mutateAsync;

  const insertarCotizacion = React.useCallback(
    async (cotizacion: CotizacionCabeceraPayload) => {
      const payload: CotizacionCabeceraPayload = {
        ...cotizacion,
        cod_estado: cotizacion.cod_estado ?? estados.ACTIVO,
      };

      const result = await insertarMutation.mutateAsync(payload);

      const cotizacionInsertada = cotizacionCabeceraSchema.parse({
        ...payload,
        cod_cotizacion_cabecera: result.cod_cotizacion_cabecera,
      });

      setCotizacionSeleccionada(cotizacionInsertada);
      setIsNewCotizacion(false);

      return cotizacionInsertada;
    },
    [estados.ACTIVO, insertarMutation],
  );

  const actualizarCotizacion = React.useCallback(
    async (cotizacion: CotizacionCabeceraPayload) => {
      const estadoVisual = obtenerEstadoVisual(cotizacion);

      const payload: CotizacionCabeceraPayload = {
        ...cotizacion,

        /*
         * Misma prioridad del legado:
         *
         * cotizacion.cod_estado
         *   || cotizacion.estado?.value
         *   || ACTIVO
         */
        cod_estado: cotizacion.cod_estado || estadoVisual || estados.ACTIVO,
      };

      await actualizarMutation.mutateAsync(payload);

      setCotizacionSeleccionada((prev) => {
        if (!prev) {
          return prev;
        }

        const payloadDefinido = Object.fromEntries(
          Object.entries(payload).filter(([, value]) => value !== undefined),
        ) as CotizacionCabeceraPayload;

        return {
          ...prev,
          ...payloadDefinido,

          /*
           * El legado protege el contacto si el formulario lo envía vacío
           * por timing.
           */
          entidadcontacto_id: payload.entidadcontacto_id ?? prev.entidadcontacto_id ?? null,
        } as CotizacionSeleccionada;
      });

      return payload;
    },
    [actualizarMutation, estados.ACTIVO],
  );

  const rechazarCotizacion = React.useCallback(
    async (codCotizacionCabecera: Id) => {
      const result = await rechazarMutateAsync(codCotizacionCabecera);

      return result.success;
    },
    [rechazarMutateAsync],
  );

  const confirmarCotizacion = React.useCallback(
    async (codCotizacionCabecera: Id) => {
      const elegibilidad = await validarElegibilidadMutateAsync(codCotizacionCabecera);

      if (!elegibilidad.success) {
        return false;
      }

      const confirmacion = await confirmarMutateAsync(codCotizacionCabecera);

      if (!confirmacion.success) {
        return false;
      }

      /*
       * La tabla legado ejecuta handleNew() después de confirmar.
       * Se conserva ese comportamiento.
       */
      nuevaCotizacion();

      return true;
    },
    [validarElegibilidadMutateAsync, confirmarMutateAsync, nuevaCotizacion],
  );

  /* ==========================================================================
   * CAPACIDADES / ESTADO DERIVADO
   * ========================================================================== */

  const puedeConfirmarCotizacion = React.useCallback(
    (cotizacion: CotizacionCabecera) => {
      if (cotizacion.cod_version_activa == null) {
        return false;
      }

      return [estados.ACTIVO, estados.INGRESADO, estados.SOLICITADO].some((estado) =>
        mismoId(cotizacion.cod_estado, estado),
      );
    },
    [estados.ACTIVO, estados.INGRESADO, estados.SOLICITADO],
  );

  const cotizacionPersistida = React.useMemo(() => {
    if (isNewCotizacion || !cotizacionSeleccionada) {
      return null;
    }

    if (cotizacionSeleccionada.cod_cotizacion_cabecera == null) {
      return null;
    }

    return cotizacionSeleccionada as CotizacionCabecera;
  }, [isNewCotizacion, cotizacionSeleccionada]);

  const isMutating =
    insertarMutation.isPending ||
    actualizarMutation.isPending ||
    rechazarMutation.isPending ||
    validarElegibilidadMutation.isPending ||
    confirmarMutation.isPending;

  return {
    /* listado */
    filtros,
    filtrosBorrador,
    filtrosConsulta,
    setFiltros,
    aplicarFiltrosFormulario,

    cotizaciones: cotizacionesQuery.data ?? [],
    cotizacionesVisibles,

    mostrarConfirmados,
    setMostrarConfirmados,
    mostrarVencidas,
    alternarVencidas,
    alternarConfirmados,

    refetchCotizaciones: cotizacionesQuery.refetch,

    /* selección */
    cotizacionSeleccionada,
    cotizacionPersistida,
    isNewCotizacion,

    seleccionarCotizacion,
    seleccionarCotizacionPorId,
    aplicarPlantilla,
    limpiarCotizacion,
    nuevaCotizacion,

    /* plantilla */
    plantillaSeleccionada,
    setPlantillaSeleccionada,

    /* formulario */
    formResetKey,

    /* acciones */
    insertarCotizacion,
    actualizarCotizacion,
    rechazarCotizacion,
    confirmarCotizacion,
    puedeConfirmarCotizacion,

    /* estados async */
    isLoading: cotizacionesQuery.isLoading,
    isFetching: cotizacionesQuery.isFetching,
    isMutating,

    isInserting: insertarMutation.isPending,
    isUpdating: actualizarMutation.isPending,
    isRejecting: rechazarMutation.isPending,
    isValidatingEligibility: validarElegibilidadMutation.isPending,
    isConfirming: confirmarMutation.isPending,

    error:
      cotizacionesQuery.error ??
      insertarMutation.error ??
      actualizarMutation.error ??
      rechazarMutation.error ??
      validarElegibilidadMutation.error ??
      confirmarMutation.error ??
      null,
  };
}

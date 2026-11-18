"use client";

import * as React from "react";
import type { CalculoCotizacionProps } from "../lib/calculo-cotizacion-tipos";
import type { ReasonCodeSpot } from "../lib/tipos";
import type { useCalculoCotizacion } from "./use-calculo-cotizacion";
import type { useCarrierFlete } from "./use-carrier-flete";
import type { useCriteriosCotizacion } from "./use-criterios-cotizacion";
import { useEstadosCalculo } from "./use-estados-cotizacion";
import { useGuardarVersionCotizacion } from "./use-guardar-version-cotizacion";
import type { usePorcentajesRubros } from "./use-porcentajes-rubros";
import type { useTotalesRubros } from "./use-totales-rubros";
import type { useVersionCotizacion } from "./use-version-cotizacion";

type Params = {
  cotizacion: CalculoCotizacionProps["cotizacion"];
  codUsuario: CalculoCotizacionProps["codUsuario"] | undefined;
  onActualizarEstadoCabecera: CalculoCotizacionProps["onActualizarEstadoCabecera"] | undefined;
  versiones: ReturnType<typeof useVersionCotizacion>;
  criterios: ReturnType<typeof useCriteriosCotizacion>;
  criterioCobertura: Record<string, unknown>;
  setCriterioCobertura: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
  calculo: ReturnType<typeof useCalculoCotizacion>;
  carrier: ReturnType<typeof useCarrierFlete>;
  dueAgent: ReturnType<typeof usePorcentajesRubros>["dueAgent"];
  totales: ReturnType<typeof useTotalesRubros>;
};

/**
 * Spot, guardado de la versión, reset entre versiones y acciones (Calcular / Guardar)
 * de `DetalleCalculoCotizacion` (components/calculo-cotizacion.tsx).
 */
export function useDetalleCalculoGuardado({
  cotizacion,
  codUsuario,
  onActualizarEstadoCabecera,
  versiones,
  criterios,
  criterioCobertura,
  setCriterioCobertura,
  calculo,
  carrier,
  dueAgent,
  totales,
}: Params) {
  const { estados } = useEstadosCalculo();
  const versionActual = versiones.versionActual;

  /* ==========================================================================
   * SPOT / GUARDADO
   * ========================================================================== */

  const [datosComplementariosValidos, setDatosComplementariosValidos] = React.useState(true);

  const [archivoSpot, setArchivoSpot] = React.useState<File | null>(null);

  const [descripcionSpot, setDescripcionSpot] = React.useState("");

  const [reasonCodeSpot, setReasonCodeSpot] = React.useState<ReasonCodeSpot | null>(null);

  const [solicitarArchivoSpot, setSolicitarArchivoSpot] = React.useState(false);

  const criteriosParaGuardar = React.useMemo(
    () => ({
      ...criterios.valores,

      total_cw:
        criterios.valores.total_cw ??
        criterios.valores.valor_cw ??
        criterios.totalesDimensiones.valorCw,

      total_peso:
        criterios.valores.total_peso ??
        criterios.valores.valor_por_peso ??
        criterios.totalesDimensiones.pesoTotal,

      total_volumen: criterios.valores.total_volumen ?? criterios.totalesDimensiones.volumenTotal,
    }),
    [
      criterios.valores,
      criterios.totalesDimensiones.valorCw,
      criterios.totalesDimensiones.pesoTotal,
      criterios.totalesDimensiones.volumenTotal,
    ],
  );

  const [errorReactivarCabecera, setErrorReactivarCabecera] = React.useState(false);

  const guardar = useGuardarVersionCotizacion({
    codCotizacionCabecera: cotizacion.cod_cotizacion_cabecera,

    codUsuario: codUsuario ?? null,

    versionActual,

    rubros: totales.rubrosAgrupados,

    criterios: criteriosParaGuardar,

    criterioCobertura,

    criteriosCatalogo: versiones.criteriosDisponibles,

    legs: versiones.legs,

    dimensiones: criterios.dimensiones,

    codCc: cotizacion.cod_cc ?? null,

    codTipoTransporte: cotizacion.cod_tipo_transporte ?? null,

    archivoSpot,

    descripcionSpot,

    reasonCodeSpot: reasonCodeSpot?.value ?? null,

    estados,

    onGuardado: async ({ codCotizacionDetalle }) => {
      // Al guardar una versión nueva, la cabecera pasa a activa.
      if (Number(versionActual?.cod_cotizaciondetalle) === 0) {
        try {
          if (estados.ACTIVO == null || !onActualizarEstadoCabecera) {
            throw new Error("No se pudo determinar cómo reactivar la cabecera.");
          }

          await onActualizarEstadoCabecera({
            cod_cotizacion_cabecera: cotizacion.cod_cotizacion_cabecera,
            cod_estado: estados.ACTIVO,
          });
        } catch {
          // La cabecera se actualiza por separado; un fallo no invalida la versión guardada.
          setErrorReactivarCabecera(true);
        }
      }

      await versiones.abrirVersionGuardada(codCotizacionDetalle);

      setArchivoSpot(null);
      setDescripcionSpot("");
      setReasonCodeSpot(null);
      setSolicitarArchivoSpot(false);
    },
  });

  /* ==========================================================================
   * RESET ENTRE VERSIONES
   * ========================================================================== */

  const versionKey = `${cotizacion.cod_cotizacion_cabecera}-${versionActual?.cod_cotizaciondetalle ?? "SIN_VERSION"}`;

  React.useEffect(() => {
    // versionKey fuerza el reset aunque los callbacks conserven su referencia.
    void versionKey;

    calculo.limpiarCalculo();
    carrier.limpiarCarrier();

    setCriterioCobertura({});

    setArchivoSpot(null);
    setDescripcionSpot("");
    setReasonCodeSpot(null);
    setSolicitarArchivoSpot(false);
  }, [versionKey, calculo.limpiarCalculo, carrier.limpiarCarrier, setCriterioCobertura]);

  /* ==========================================================================
   * ACCIONES DE UI
   * ========================================================================== */

  const handleCalcular = React.useCallback(() => {
    /*
     * El botón Calcular reinicia el pipeline.
     * useCalculoCotizacion volverá a ejecutar el paso A (fletes)
     * por su resetFleteToken; Carrier se reconstruirá después.
     */
    calculo.limpiarCalculo();
    carrier.limpiarCarrier();
  }, [calculo.limpiarCalculo, carrier.limpiarCarrier]);

  const puedeGuardar = Boolean(
    versionActual &&
      Number(versionActual.cod_cotizaciondetalle) === 0 &&
      totales.rubrosAgrupados.length &&
      dueAgent.isValid &&
      datosComplementariosValidos &&
      !guardar.guardando,
  );

  const handleGuardar = React.useCallback(async () => {
    setErrorReactivarCabecera(false);
    const resultado = await guardar.guardarVersion();

    if (!resultado.ok && resultado.motivo === "DOCUMENTO_SPOT_REQUERIDO") {
      setSolicitarArchivoSpot(true);
    }
  }, [guardar]);

  return {
    datosComplementariosValidos,
    setDatosComplementariosValidos,
    archivoSpot,
    setArchivoSpot,
    descripcionSpot,
    setDescripcionSpot,
    reasonCodeSpot,
    setReasonCodeSpot,
    solicitarArchivoSpot,
    setSolicitarArchivoSpot,
    errorReactivarCabecera,
    guardar,
    handleCalcular,
    puedeGuardar,
    handleGuardar,
  };
}

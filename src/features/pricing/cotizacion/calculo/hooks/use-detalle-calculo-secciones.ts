"use client";

import * as React from "react";
import type { CalculoCotizacionProps } from "../lib/calculo-cotizacion-tipos";
import { RUBRO, TIPO_CALCULO } from "../lib/constantes";
import { esMetodoCostoPorcentaje } from "../lib/rubros-manuales";
import type { EntidadCatalogo, Id } from "../lib/tipos";
import { useCalculoCotizacion } from "./use-calculo-cotizacion";
import { useCarrierFlete } from "./use-carrier-flete";
import { useCatalogosCotizacion } from "./use-catalogos-cotizacion";
import { useCriteriosCotizacion } from "./use-criterios-cotizacion";
import { usePorcentajesRubros } from "./use-porcentajes-rubros";
import { useRubrosCotizacion } from "./use-rubros-cotizacion";
import { useRubrosDueAgent } from "./use-rubros-due-agent";
import { useRubrosDueCarrier } from "./use-rubros-due-carrier";
import { useRubrosScalling } from "./use-rubros-scalling";
import { useTotalesRubros } from "./use-totales-rubros";
import type { useVersionCotizacion } from "./use-version-cotizacion";

/** Arreglo vacío estable (evita recalcular memos en cada render). */
const SIN_RUBROS: Record<string, unknown>[] = [];

function getEntidadId(entidad?: EntidadCatalogo | null) {
  return entidad?.entidad_id ?? entidad?.cod_entidad ?? entidad?.id ?? entidad?.value ?? null;
}

function getCampoRegistro(value: unknown, campo: string): unknown {
  if (typeof value !== "object" || value === null) return undefined;

  return (value as Record<string, unknown>)[campo];
}

function getValorNumericoOTexto(value: unknown): string | number | null {
  return typeof value === "string" || typeof value === "number" ? value : null;
}

type Params = {
  cotizacion: CalculoCotizacionProps["cotizacion"];
  plantillaSeleccionada: CalculoCotizacionProps["plantillaSeleccionada"] | undefined;
  filtrosCalculo: CalculoCotizacionProps["filtrosCalculo"];
  serviciosAutoSeleccion: Id[];
  puedeAgregar: boolean;
  versiones: ReturnType<typeof useVersionCotizacion>;
};

/**
 * Secciones del cálculo de una versión (criterios → carrier → rubros → Due Agent / Due Carrier →
 * Scalling → porcentajes → totales). Parte de `DetalleCalculoCotizacion` (components/calculo-cotizacion.tsx).
 */
export function useDetalleCalculoSecciones({
  cotizacion,
  plantillaSeleccionada,
  serviciosAutoSeleccion,
  filtrosCalculo,
  versiones,
  puedeAgregar,
}: Params) {
  const { calculo: catalogos } = useCatalogosCotizacion();
  const versionActual = versiones.versionActual;

  const isReadOnly = React.useMemo(() => {
    // Sin permiso de Agregar no se captura ni se guarda una versión nueva.
    if (!versionActual || !puedeAgregar) {
      return true;
    }

    const esNueva =
      versionActual.isNew === true || Number(versionActual.cod_cotizaciondetalle) === 0;

    return !esNueva;
  }, [versionActual, puedeAgregar]);

  const plantillaActiva = versiones.plantilla ?? plantillaSeleccionada ?? null;

  /* ==========================================================================
   * CRITERIOS
   * ========================================================================== */

  const criterios = useCriteriosCotizacion({
    resetKey: `${cotizacion.cod_cotizacion_cabecera}-${versionActual?.cod_cotizaciondetalle ?? 0}`,

    valoresIniciales: versiones.criteriosIniciales,

    dimensionesIniciales: versiones.dimensiones,

    codTipoTransporte: cotizacion.cod_tipo_transporte ?? null,
  });

  const criteriosCalculo = React.useMemo(
    () => criterios.obtenerCriteriosCalculo(),
    [criterios.obtenerCriteriosCalculo],
  );

  /*
   * IMPORTANTE:
   * valor_factura NO pertenece al estado general que dispara Carrier/Flete.
   *
   * En el legado GenerarRubrosDueAgent recibía:
   *
   *   setCriterios={setCriterioCobertura}
   *
   * por lo que cobertura se almacenaba aparte y únicamente se mezclaba
   * con los criterios al guardar la versión.
   */
  const [criterioCobertura, setCriterioCobertura] = React.useState<Record<string, unknown>>({});

  /* ==========================================================================
   * CÁLCULO GENERAL
   * ========================================================================== */

  const calculo = useCalculoCotizacion({
    filtros: filtrosCalculo,

    criterios: criteriosCalculo,

    plantilla: plantillaActiva as Exclude<
      Parameters<typeof useCalculoCotizacion>[0]["plantilla"],
      undefined
    >,

    isReadOnly,
  });

  /* ==========================================================================
   * CARRIER
   * ========================================================================== */

  const recalcularCarrier = React.useCallback(
    async (
      nextCriterios: Record<string, unknown>,
      carrierSeleccionado: { entidad_id: Id | null },
    ) => {
      /*
       * El formulario mantiene objetos { value, label } para selects.
       * Por eso no sobrescribimos TODO el estado con el payload procesado:
       * solo los campos que realmente determina Carrier.
       */
      criterios.actualizarValores({
        categoria_transporte: nextCriterios.categoria_transporte,
        valor_flete: nextCriterios.valor_flete,
      });

      return calculo.calcularCotizacion({
        criteriosCalculo: nextCriterios,
        codProveedorCarrier: carrierSeleccionado.entidad_id,
      });
    },
    [criterios.actualizarValores, calculo.calcularCotizacion],
  );

  const carrier = useCarrierFlete({
    fletes: calculo.fletesCalculados as Parameters<typeof useCarrierFlete>[0]["fletes"],

    criterios: criteriosCalculo,

    criteriosParaFlete: calculo.criteriosParaFlete,

    plantillaId: plantillaActiva?.cod_tarifaplantilla ?? null,

    carrierPlantillaId: plantillaActiva?.carrier_id ?? null,

    codTipoPago: cotizacion.cod_tipo_pago ?? null,

    codTipoTransporte: cotizacion.cod_tipo_transporte ?? null,

    valorCw: criterios.valorCw,

    entidadIdGuardadaEnVersion: versiones.entidadIdGuardada,

    cotizacionEntidadId: cotizacion.entidad_id ?? null,

    isReadOnly,

    onRecalcular: recalcularCarrier,

    onLimpiarResultados: calculo.limpiarResultadosTarifa,
  });

  /*
   * En lectura no se vuelve a ejecutar el cálculo de fletes, por lo que
   * Carrier puede no tener una opción viva seleccionada. La entidad guardada
   * en la versión sigue siendo la fuente correcta para reconstruir lectura.
   */
  const entidadEfectivaId = isReadOnly
    ? (versiones.entidadIdGuardada ?? cotizacion.entidad_id ?? null)
    : carrier.entidadSeleccionadaId;

  const entidadEfectiva = React.useMemo<EntidadCatalogo | null>(() => {
    if (carrier.carrierSeleccionado && !isReadOnly) {
      return carrier.carrierSeleccionado;
    }

    if (entidadEfectivaId == null) {
      return null;
    }

    return (
      catalogos.proveedores.find(
        (entidad) => String(getEntidadId(entidad)) === String(entidadEfectivaId),
      ) ??
      ({
        entidad_id: entidadEfectivaId,
      } satisfies EntidadCatalogo)
    );
  }, [carrier.carrierSeleccionado, isReadOnly, entidadEfectivaId, catalogos.proveedores]);

  const entidadNombre = React.useMemo(() => {
    if (!entidadEfectiva) {
      return null;
    }

    return String(
      entidadEfectiva.entidad_nombre ??
        entidadEfectiva.razon_social ??
        entidadEfectiva.nombre ??
        entidadEfectiva.label ??
        "",
    );
  }, [entidadEfectiva]);

  /* ==========================================================================
   * RUBROS DEL CÁLCULO / LECTURA
   * ========================================================================== */

  const rubros = useRubrosCotizacion({
    lectura: isReadOnly,

    rubrosCalculados: calculo.valoresCalculados?.data ?? [],

    codTipoTransporte: cotizacion.cod_tipo_transporte ?? null,

    rubrosGuardados: (versiones.rubrosGuardados ?? []) as NonNullable<
      Parameters<typeof useRubrosCotizacion>[0]["rubrosGuardados"]
    >,

    versionSpot: versionActual?.es_spot === true,

    entidadSeleccionadaId: entidadEfectivaId,

    categoriaSeleccionada: carrier.categoriaSeleccionada,

    codRubroFleteSeleccionado: carrier.codRubroFleteSeleccionado,

    codServicioFleteSeleccionado: carrier.codServicioFleteSeleccionado,

    valorCw: criterios.valorCw,
  });

  /* ==========================================================================
   * DUE AGENT
   * ========================================================================== */

  /*
   * Solo debe existir el recálculo "Due Carrier basado en Due Agent"
   * si alguno de los servicios actuales declara tipo 90.
   *
   * Se revisan tanto los campos directos del servicio como los del método
   * porque durante el procesamiento los datos pueden venir normalizados
   * en cualquiera de esas dos ubicaciones.
   */
  const requiereRecalculoDueCarrierDesdeAgent = React.useMemo(
    () =>
      rubros.rubrosDueCarrier.some((item) => {
        const servicio = item.servicio ?? item;

        const metodoServicio = getCampoRegistro(servicio, "metodo");
        const metodoItem = getCampoRegistro(item, "metodo");

        const codTipo =
          getCampoRegistro(servicio, "cod_tipo") ??
          getCampoRegistro(metodoServicio, "cod_tipo") ??
          getCampoRegistro(item, "cod_tipo") ??
          getCampoRegistro(metodoItem, "cod_tipo");

        const codTipoCalculo =
          getCampoRegistro(servicio, "cod_tipo_calculo") ??
          getCampoRegistro(metodoServicio, "cod_tipo_calculo") ??
          getCampoRegistro(item, "cod_tipo_calculo") ??
          getCampoRegistro(metodoItem, "cod_tipo_calculo");

        return (
          Number(codTipo) === TIPO_CALCULO.DUE_AGENT ||
          Number(codTipoCalculo) === TIPO_CALCULO.DUE_AGENT
        );
      }),
    [rubros.rubrosDueCarrier],
  );

  const calcularDueCarrierDesdeAgent = React.useCallback(
    (totalDueAgent: number) =>
      calculo.calcularDueCarrierBasadoEnDueAgent({
        totalDueAgent,
        codProveedorCarrier: entidadEfectivaId,
      }),
    [calculo.calcularDueCarrierBasadoEnDueAgent, entidadEfectivaId],
  );

  /*
   * No escribir en criterios generales:
   * hacerlo cambia criteriosParaFlete y reinicia el pipeline Carrier.
   *
   * Igual que en el legado, valor_factura vive en criterioCobertura.
   * La cobertura puede venir en Due Agent o en Due Carrier.
   */
  const cambiarValorFacturaCobertura = React.useCallback((valorFactura: number) => {
    setCriterioCobertura({
      valor_factura: valorFactura,
    });
  }, []);

  const valorFleteCriterios = getValorNumericoOTexto(criterios.valores.valor_flete);

  const dueAgentBase = useRubrosDueAgent({
    rubros: rubros.rubrosDueAgent as Parameters<typeof useRubrosDueAgent>[0]["rubros"],

    lectura: isReadOnly,

    serviciosAutoSeleccion,

    codMonedaPadre: carrier.servicioSeleccionado?.metodo?.cod_moneda_venta ?? null,

    valorFlete: valorFleteCriterios,

    entidadSeleccionadaId: entidadEfectivaId,

    onValorFacturaChange: cambiarValorFacturaCobertura,

    onCalcularDueCarrier: calcularDueCarrierDesdeAgent,

    onLimpiarDueCarrier: calculo.limpiarDueCarrierBasadoEnDueAgent,

    dueCarrierContextKey: calculo.dueCarrierDesdeAgentContextKey,

    requiereRecalculoDueCarrier: requiereRecalculoDueCarrierDesdeAgent,
  });

  /* ==========================================================================
   * DUE CARRIER
   * ========================================================================== */

  const rubrosDueCarrierConSpot = React.useMemo(
    () => [...rubros.rubrosDueCarrier, ...carrier.tarifasSpot],
    [rubros.rubrosDueCarrier, carrier.tarifasSpot],
  );

  const dueCarrierBase = useRubrosDueCarrier({
    rubros: rubrosDueCarrierConSpot as Parameters<typeof useRubrosDueCarrier>[0]["rubros"],

    lectura: isReadOnly,

    valorFlete: valorFleteCriterios,

    onValorFacturaChange: cambiarValorFacturaCobertura,

    onVentaFleteCostoPorcentajeChange: carrier.cambiarVentaFleteCostoPorcentaje,
  });

  /*
   * Flete (normal) con método Costo por porcentaje: su costo se escribe a mano
   * y debe respaldarse con un archivo para poder guardar la versión.
   */
  const fleteCostoPorcentaje = React.useMemo(
    () =>
      !isReadOnly &&
      dueCarrierBase.rubros.some(
        (item) => item.es_flete === true && !item.es_tarifa_spot && esMetodoCostoPorcentaje(item),
      ),
    [isReadOnly, dueCarrierBase.rubros],
  );

  const dueCarrierDesdeAgentBase = useRubrosDueCarrier({
    rubros: calculo.dueCarrierBasadoEnDueAgent as Parameters<
      typeof useRubrosDueCarrier
    >[0]["rubros"],

    lectura: isReadOnly,

    valorFlete: valorFleteCriterios,

    onValorFacturaChange: cambiarValorFacturaCobertura,
  });

  /* ==========================================================================
   * SCALLING
   * ========================================================================== */

  const tieneScalling = React.useMemo(() => {
    /*
     * En lectura basta que exista un rubro Scalling guardado.
     */
    if (rubros.rubrosScalling.length > 0) {
      return true;
    }

    if (entidadEfectivaId == null) {
      return false;
    }

    return catalogos.servicios.some(
      (servicio) =>
        String(servicio.entidad_id) === String(entidadEfectivaId) &&
        Number(servicio.cod_rubro) === RUBRO.SCALLING,
    );
  }, [rubros.rubrosScalling, entidadEfectivaId, catalogos.servicios]);

  const calcularScalling = React.useCallback(
    ({ lista_paises }: { lista_paises: string[] }) =>
      calculo.calcularScalling({
        criteriosCalculo: {
          ...criteriosCalculo,
          lista_paises,
        },
        codProveedorCarrier: entidadEfectivaId,
      }),
    [calculo.calcularScalling, criteriosCalculo, entidadEfectivaId],
  );

  const scalling = useRubrosScalling({
    rubros: rubros.rubrosScalling as Parameters<typeof useRubrosScalling>[0]["rubros"],

    codTipoTransporte: cotizacion.cod_tipo_transporte ?? null,

    codPuntoOrigen: cotizacion.cod_puntoenlace_origen ?? null,

    codPuntoDestino: cotizacion.cod_puntoenlace_destino ?? null,

    entidadId: tieneScalling ? entidadEfectivaId : null,

    codCotizacionDetalle: versionActual?.cod_cotizaciondetalle ?? null,

    lectura: isReadOnly,

    legs: (versiones.legs ?? []) as NonNullable<Parameters<typeof useRubrosScalling>[0]["legs"]>,

    onLegsChange: versiones.setLegs,

    onCalcularScalling: calcularScalling,

    calculoContextKey: calculo.calculoContextKey,
  });

  /* ==========================================================================
   * MÉTODO PORCENTAJE (rubro = % de otro rubro, de cualquier sección)
   * ========================================================================== */

  const rubrosScallingAplicados = tieneScalling ? scalling.rutasProcesadas : SIN_RUBROS;

  const { dueCarrier, dueAgent, dueCarrierDesdeAgent } = usePorcentajesRubros({
    dueCarrier: dueCarrierBase,
    dueAgent: dueAgentBase,
    dueCarrierDesdeAgent: dueCarrierDesdeAgentBase,
    rubrosScalling: rubrosScallingAplicados as Parameters<
      typeof usePorcentajesRubros
    >[0]["rubrosScalling"],
    lectura: isReadOnly,
  });

  /* ==========================================================================
   * TOTAL
   * ========================================================================== */

  const rubrosParaTotal = React.useMemo(
    () => [
      ...dueCarrier.rubros,
      ...dueAgent.seleccionados,
      ...dueCarrierDesdeAgent.rubros,
      ...(tieneScalling ? scalling.rutasProcesadas : []),
    ],
    [
      dueCarrier.rubros,
      dueAgent.seleccionados,
      dueCarrierDesdeAgent.rubros,
      tieneScalling,
      scalling.rutasProcesadas,
    ],
  );

  const totales = useTotalesRubros({
    rubros: rubrosParaTotal,

    cotizacion,

    entidad: entidadEfectiva,

    lectura: isReadOnly,
  });

  return {
    versionActual,
    isReadOnly,
    criterios,
    criterioCobertura,
    setCriterioCobertura,
    calculo,
    carrier,
    entidadEfectivaId,
    entidadNombre,
    rubrosDueCarrierConSpot,
    fleteCostoPorcentaje,
    dueCarrier,
    dueAgent,
    dueCarrierDesdeAgent,
    tieneScalling,
    scalling,
    totales,
  };
}

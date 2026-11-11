"use client";

import { AlertTriangle, Save } from "lucide-react";
import React from "react";

import { Button } from "@/shared/components/ui/button";
import { Loader } from "@/shared/components/ui/loader";
import { useCalculoCotizacion } from "../hooks/use-calculo-cotizacion";
import { useCarrierFlete } from "../hooks/use-carrier-flete";
import { useCatalogosCotizacion } from "../hooks/use-catalogos-cotizacion";
import { useCriteriosCotizacion } from "../hooks/use-criterios-cotizacion";
import { useEstadosCalculo } from "../hooks/use-estados-cotizacion";
import { useGuardarVersionCotizacion } from "../hooks/use-guardar-version-cotizacion";
import { usePdfCotizacion } from "../hooks/use-pdf-cotizacion";
import { useRubrosCotizacion } from "../hooks/use-rubros-cotizacion";
import { useRubrosDueAgent } from "../hooks/use-rubros-due-agent";
import { useRubrosDueCarrier } from "../hooks/use-rubros-due-carrier";
import { useRubrosScalling } from "../hooks/use-rubros-scalling";
import { useTotalesRubros } from "../hooks/use-totales-rubros";
import { useVersionCotizacion } from "../hooks/use-version-cotizacion";
import type { CotizacionParaCalculo } from "../lib/cabecera";
import { RUBRO, TIPO_CALCULO } from "../lib/constantes";
import type { EntidadCatalogo, Id, ReasonCodeSpot } from "../lib/tipos";
import { CarrierSelector } from "./carrier-selector";
import { CriteriosForm } from "./criterios-form";
import { DatosComplementariosCotizacion } from "./datos-complementarios-cotizacion";
import { DueAgent } from "./due-agent";
import { DueCarrier } from "./due-carrier";
import { PdfCotizacionDialog } from "./pdf-cotizacion-dialog";
import { Scalling } from "./scalling";
import { SpotDocumentoDialog } from "./spot-documento-dialog";
import { TotalesRubros } from "./totales-rubros";
import { SeccionConLoader } from "./utils";
import { VersionesTable } from "./versiones-table";

type Props = {
  /** Cabecera de la cotización (campos definidos en lib/cabecera.ts). */
  cotizacion: CotizacionParaCalculo;

  plantillaSeleccionada?: {
    cod_tarifaplantilla?: Id | null;
    carrier_id?: Id | null;

    criterios?: Array<{
      campo: string;
      cod_tipo_dato?: string | number | null;
    }>;

    [key: string]: unknown;
  } | null;

  codUsuario?: Id | null;

  onActualizarEstadoCabecera?: (payload: {
    cod_cotizacion_cabecera: Id;
    cod_estado: Id;
  }) => Promise<unknown>;

  /*
   * Los catálogos ya NO llegan por props: se leen con useCatalogosCotizacion()
   * (ver hooks/use-catalogos-cotizacion.tsx).
   */

  /*
   * Servicios que la plantilla solicita seleccionar automáticamente
   * en Due Agent.
   */
  serviciosAutoSeleccion?: Id[];

  filtrosCalculo: Record<string, unknown>;
};

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

export function CalculoCotizacion(props: Props) {
  const { cotizacion, codUsuario, filtrosCalculo } = props;
  const { estados } = useEstadosCalculo();
  /* ==========================================================================
   * VERSIONES
   * ========================================================================== */

  // Este hook carga la lista, abre el detalle seleccionado y coordina la activación.
  const versiones = useVersionCotizacion({
    codCotizacionCabecera: cotizacion.cod_cotizacion_cabecera,

    codUsuario: codUsuario ?? null,

    cotizacion,

    filtros: filtrosCalculo,

    estados,
  });

  const versionActual = versiones.versionActual;

  const pdf = usePdfCotizacion({
    codCotizacionCabecera: cotizacion.cod_cotizacion_cabecera,
    codTipoServicio: cotizacion.cod_tipo_servicio ?? null,
  });

  const [borrador, setBorrador] = React.useState(0);
  const esBorrador = versionActual?.isNew === true;
  const cargandoBorrador = esBorrador && versiones.cargandoDetalle;

  return (
    <div className="space-y-4 relative">
      {versiones.cargandoVersiones || cargandoBorrador || versiones.isLoading ? (
        <div className="absolute w-full h-full flex items-center justify-center bg-muted/50 z-5">
          <Loader texto="ESTAMOS CARGANDO LA VERSION" />
        </div>
      ) : null}
      <VersionesTable
        versiones={versiones.versiones as Parameters<typeof VersionesTable>[0]["versiones"]}
        versionActual={versionActual as Parameters<typeof VersionesTable>[0]["versionActual"]}
        cotizacion={cotizacion}
        loading={versiones.isLoading}
        onView={versiones.abrirVersion}
        onActivate={versiones.activarVersion}
        onNew={async () => {
          // Cada borrador empieza con un formulario nuevo aunque el ID siga siendo 0.
          setBorrador((actual) => actual + 1);
          pdf.setOpen(false);
          await versiones.nuevaVersion();
        }}
        onPdf={(version) => pdf.generar(version, 1)}
        onPdfStation={(version) => pdf.generar(version, 2)}
      />
      {!cargandoBorrador ? (
        <DetalleCalculoCotizacion key={borrador} {...props} versiones={versiones} />
      ) : null}
      {versionActual ? (
        <PdfCotizacionDialog
          open={pdf.open}
          cargando={pdf.cargando}
          error={pdf.error}
          pdfUrl={pdf.pdfUrl}
          idioma={pdf.idioma}
          nombreArchivo={pdf.nombreArchivo}
          onOpenChange={pdf.setOpen}
          onIdiomaChange={pdf.cambiarIdioma}
          onDescargar={pdf.descargar}
        />
      ) : null}
    </div>
  );
}

function DetalleCalculoCotizacion({
  cotizacion,
  plantillaSeleccionada,
  codUsuario,
  onActualizarEstadoCabecera,
  serviciosAutoSeleccion = [],
  filtrosCalculo,
  versiones,
}: Props & {
  versiones: ReturnType<typeof useVersionCotizacion>;
}) {
  const { estados } = useEstadosCalculo();
  const { calculo: catalogos } = useCatalogosCotizacion();
  const versionActual = versiones.versionActual;

  const isReadOnly = React.useMemo(() => {
    if (!versionActual) {
      return true;
    }

    const esNueva =
      versionActual.isNew === true || Number(versionActual.cod_cotizaciondetalle) === 0;

    return !esNueva;
  }, [versionActual]);

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

  const dueAgent = useRubrosDueAgent({
    rubros: rubros.rubrosDueAgent as Parameters<typeof useRubrosDueAgent>[0]["rubros"],

    lectura: isReadOnly,

    serviciosAutoSeleccion,

    codMonedaPadre: carrier.servicioSeleccionado?.metodo?.cod_moneda_venta ?? null,

    valorFlete: getValorNumericoOTexto(criterios.valores.valor_flete),

    entidadSeleccionadaId: entidadEfectivaId,

    onValorFacturaChange: (valorFactura) => {
      /*
       * No escribir en criterios generales:
       * hacerlo cambia criteriosParaFlete y reinicia el pipeline Carrier.
       *
       * Igual que en el legado, valor_factura vive en criterioCobertura.
       */
      setCriterioCobertura({
        valor_factura: valorFactura,
      });
    },

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

  const dueCarrier = useRubrosDueCarrier({
    rubros: rubrosDueCarrierConSpot as Parameters<typeof useRubrosDueCarrier>[0]["rubros"],

    lectura: isReadOnly,
  });

  const dueCarrierDesdeAgent = useRubrosDueCarrier({
    rubros: calculo.dueCarrierBasadoEnDueAgent as Parameters<
      typeof useRubrosDueCarrier
    >[0]["rubros"],

    lectura: isReadOnly,
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
  }, [versionKey, calculo.limpiarCalculo, carrier.limpiarCarrier]);

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

  return (
    <>
      {guardar.guardando ? (
        <div className="absolute w-full h-full flex items-center justify-center bg-muted/50 ">
          <Loader />
        </div>
      ) : null}
      {errorReactivarCabecera ? (
        <p role="alert">La versión se guardó, pero no se pudo reactivar la cotización.</p>
      ) : null}
      {versionActual ? (
        <>
          {/* =================================
              CABECERA DE VERSIÓN
          ================================== */}

          <div className="flex flex-wrap items-center gap-4 rounded-lg border px-4 py-3">
            <span className="text-lg font-semibold">VERSIÓN {versionActual.version ?? 0}</span>

            <span className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
              Modo {isReadOnly ? "lectura" : "edición"}
            </span>
          </div>

          {/* =================================
              CRITERIOS / COMPLEMENTARIOS
          ================================== */}

          <div className="grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <CriteriosForm
                criteriosDisponibles={versiones.criteriosDisponibles}
                valores={criterios.valores}
                dimensiones={criterios.dimensiones}
                valorCw={criterios.valorCw}
                valorPeso={criterios.valorPeso}
                lectura={isReadOnly}
                codTipoTransporte={cotizacion.cod_tipo_transporte ?? null}
                onChange={criterios.cambiarValor}
                onAplicarMedidas={criterios.aplicarMedidas}
                onCalcular={handleCalcular}
              />
            </div>

            <div className="lg:col-span-5">
              <DatosComplementariosCotizacion
                value={versionActual}
                lectura={isReadOnly}
                onChange={versiones.actualizarVersionActual}
                onValidChange={setDatosComplementariosValidos}
              />
            </div>
          </div>

          {/* =================================
              CÁLCULO
          ================================== */}

          <div className="grid items-start gap-4 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-7">
              {/* CARRIER */}

              <SeccionConLoader loading={calculo.calculandoFlete}>
                <CarrierSelector
                  options={carrier.opcionesCarrier}
                  value={carrier.carrierSeleccionado}
                  lectura={isReadOnly}
                  onChange={carrier.seleccionarCarrier}
                />
              </SeccionConLoader>

              {/* DUE CARRIER */}

              <SeccionConLoader loading={calculo.calculandoDueCarrier}>
                <DueCarrier
                  controller={dueCarrier}
                  rubros={
                    rubrosDueCarrierConSpot as React.ComponentProps<typeof DueCarrier>["rubros"]
                  }
                  lectura={isReadOnly || entidadEfectivaId == null}
                  entidadNombre={entidadNombre}
                  valorCw={criterios.valorCw}
                  onAgregarSpot={(rubro, valor, rate) => {
                    carrier.agregarSpot({
                      rubroBase: rubro,
                      valorSpot: valor,
                      rateValor: rate,
                    });

                    carrier.forzarRecalculo();
                  }}
                  onRemoveSpot={carrier.quitarSpot}
                />
              </SeccionConLoader>

              {/* DUE AGENT */}

              <SeccionConLoader loading={calculo.calculandoDueAgent}>
                <DueAgent
                  controller={dueAgent}
                  lectura={isReadOnly || entidadEfectivaId == null}
                  entidadNombre={entidadNombre}
                />
              </SeccionConLoader>

              {/* CARRIER BASADO EN AGENT */}

              {dueCarrierDesdeAgent.rubros.length > 0 ||
              calculo.calculandoDueCarrierBasadoEnDueAgent ? (
                <SeccionConLoader loading={calculo.calculandoDueCarrierBasadoEnDueAgent}>
                  <DueCarrier
                    controller={dueCarrierDesdeAgent}
                    rubros={
                      calculo.dueCarrierBasadoEnDueAgent as React.ComponentProps<
                        typeof DueCarrier
                      >["rubros"]
                    }
                    lectura={isReadOnly}
                    entidadNombre={entidadNombre}
                  />
                </SeccionConLoader>
              ) : null}

              {/* SCALLING */}

              {tieneScalling ? (
                <SeccionConLoader loading={calculo.calculandoScalling}>
                  <Scalling
                    controller={scalling}
                    lectura={isReadOnly || entidadEfectivaId == null}
                    entidadNombre={entidadNombre}
                    calculando={calculo.calculandoScalling}
                  />
                </SeccionConLoader>
              ) : null}
            </div>

            {/* =================================
                TOTAL
            ================================== */}

            <div className="lg:col-span-5">
              <TotalesRubros
                controller={totales}
                lectura={isReadOnly || entidadEfectivaId == null}
              />
            </div>
          </div>

          {/* =================================
              VALIDACIÓN / GUARDAR
          ================================== */}

          <div className="flex flex-col items-end gap-3">
            {!totales.rubrosAgrupados.length ? (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <AlertTriangle className="size-4" />
                No se ha seleccionado ningún rubro.
              </div>
            ) : !dueAgent.isValid ? (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertTriangle className="size-4" />
                Hay un error en la sección Due Agent.
              </div>
            ) : !datosComplementariosValidos ? (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertTriangle className="size-4" />
                Hay un error en Datos complementarios de cotización.
              </div>
            ) : null}

            {!isReadOnly ? (
              <Button type="button" disabled={!puedeGuardar} onClick={handleGuardar}>
                <Save className="size-4" />

                {guardar.guardando ? "Guardando..." : "Guardar"}
              </Button>
            ) : null}
          </div>

          <SpotDocumentoDialog
            open={solicitarArchivoSpot}
            onOpenChange={setSolicitarArchivoSpot}
            archivo={archivoSpot}
            descripcion={descripcionSpot}
            reasonCode={reasonCodeSpot}
            onArchivoChange={setArchivoSpot}
            onDescripcionChange={setDescripcionSpot}
            onReasonCodeChange={setReasonCodeSpot}
            onGuardar={handleGuardar}
            guardando={guardar.guardando}
          />
        </>
      ) : null}
    </>
  );
}

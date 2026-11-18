"use client";

import { AlertTriangle, Save } from "lucide-react";
import React from "react";

import { Button } from "@/shared/components/ui/button";
import { Loader } from "@/shared/components/ui/loader";
import { useDetalleCalculoGuardado } from "../hooks/use-detalle-calculo-guardado";
import { useDetalleCalculoSecciones } from "../hooks/use-detalle-calculo-secciones";
import { useEstadosCalculo } from "../hooks/use-estados-cotizacion";
import { usePdfCotizacion } from "../hooks/use-pdf-cotizacion";
import { useVersionCotizacion } from "../hooks/use-version-cotizacion";
import type { CalculoCotizacionProps as Props } from "../lib/calculo-cotizacion-tipos";
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

export function CalculoCotizacion(props: Props) {
  const { cotizacion, codUsuario, filtrosCalculo, puedeAgregar = true, puedeEditar = true } = props;
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
        onActivate={puedeEditar ? versiones.activarVersion : undefined}
        onNew={
          puedeAgregar
            ? async () => {
                // Cada borrador empieza con un formulario nuevo aunque el ID siga siendo 0.
                setBorrador((actual) => actual + 1);
                pdf.setOpen(false);
                await versiones.nuevaVersion();
              }
            : undefined
        }
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
  puedeAgregar = true,
}: Props & {
  versiones: ReturnType<typeof useVersionCotizacion>;
}) {
  const versionActual = versiones.versionActual;

  /* ==========================================================================
   * CRITERIOS → CARRIER → RUBROS → DUE AGENT / CARRIER → SCALLING → TOTAL
   * (hooks/use-detalle-calculo-secciones.ts)
   * ========================================================================== */

  const {
    isReadOnly,
    criterios,
    criterioCobertura,
    setCriterioCobertura,
    calculo,
    carrier,
    entidadEfectivaId,
    entidadNombre,
    rubrosDueCarrierConSpot,
    dueCarrier,
    dueAgent,
    dueCarrierDesdeAgent,
    tieneScalling,
    scalling,
    totales,
  } = useDetalleCalculoSecciones({
    cotizacion,
    plantillaSeleccionada,
    serviciosAutoSeleccion,
    filtrosCalculo,
    versiones,
    puedeAgregar,
  });

  /* ==========================================================================
   * SPOT / GUARDADO / RESET / ACCIONES (hooks/use-detalle-calculo-guardado.ts)
   * ========================================================================== */

  const {
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
  } = useDetalleCalculoGuardado({
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
  });

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

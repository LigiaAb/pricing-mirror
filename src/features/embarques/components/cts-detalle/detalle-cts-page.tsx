"use client";

/**
 * Detalle CTS privado rediseñado sobre la carta de instrucciones (Fase A.2 del
 * plan de paridad): las secciones públicas de la Fase C se renderizan en modo
 * privado alimentadas por la carta fusionada, y "guardar sección" actualiza el
 * borrador de la carta (no los endpoints reales). "Crear Coordinación" exige
 * todos los pasos bloqueantes guardados: una sección con cambios sin guardar
 * ("pending") bloquea el botón porque el motor de commit aplica solo lo ya
 * persistido en json_data_usuario.
 */

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { COD_ESTADO_CARTA_INCOMPLETA, CROPA_DOCS } from "@/features/embarques/lib/constantes";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Loader } from "@/shared/components/ui/loader";
import { EmbarqueProvider } from "../context";
import { LoaderInicial } from "../loader-inicial";
import { CrearCoordinacionModal } from "../modales/crear-coordinacion-modal";
import { LinkClienteDialog } from "../modales/link-cliente-dialog";
import { EntidadComparePanel } from "../public/entidad-compare-panel";
import type { CambioClienteRow } from "../public/secciones/entidad-public-form/cambios-cliente";
import { CtsHeader } from "./cts-header";
import { type FacturacionValuesPrivada, SeccionesWizardPrivado } from "./secciones-wizard-privado";
import { useCommitContextCts } from "./use-commit-context-cts";
import { useDatosCartaPrivada } from "./use-datos-carta-privada";
import { useGuardarSeccionPrivada } from "./use-guardar-seccion-privada";
import { useLinkClienteCts } from "./use-link-cliente-cts";
import { tooltipCrearCoordinacion, useValidezPasosCts } from "./use-validez-pasos-cts";

type JsonRecord = Record<string, unknown>;

export function DetalleCtsPage({ embarqueId }: Readonly<{ embarqueId: number | null }>) {
  const router = useRouter();
  const [estado, setEstado] = useState(0);
  const [shipperValues, setShipperValues] = useState<JsonRecord>({});
  const [consignatarioValues, setConsignatarioValues] = useState<JsonRecord>({});
  const [notificacionesValues, setNotificacionesValues] = useState<JsonRecord>({});
  const [fechasValues, setFechasValues] = useState<JsonRecord>({});
  const [facturacionValues, setFacturacionValues] = useState<FacturacionValuesPrivada>({
    cliente: {},
    detalles: {},
  });
  const [cargasPublicasValues, setCargasPublicasValues] = useState<JsonRecord[]>([]);
  // D.8: el panel "Historial de cambios" de Shipper/Consignatario se muestra
  // como panel independiente a la derecha del formulario, no dentro de él.
  const [shipperCompareRows, setShipperCompareRows] = useState<CambioClienteRow[]>([]);
  const [consignatarioCompareRows, setConsignatarioCompareRows] = useState<CambioClienteRow[]>([]);
  const datos = useDatosCartaPrivada({ embarqueId, cargasPublicasValues });
  const [isCrearCoordinacionOpen, setIsCrearCoordinacionOpen] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);

  // D.7: el loader global espera también a las secciones privadas.
  const [seccionesPrivadasLoading, setSeccionesPrivadasLoading] = useState<Record<string, boolean>>(
    {},
  );
  const loadingHandlers = useMemo(() => {
    const handler = (label: string) => (loading: boolean) =>
      setSeccionesPrivadasLoading((prev) =>
        prev[label] === loading ? prev : { ...prev, [label]: loading },
      );
    return {
      Gastos: handler("Gastos"),
      Documentos: handler("Documentos"),
      Rutas: handler("Rutas"),
      Seguimiento: handler("Seguimiento"),
    };
  }, []);
  const algunaSeccionPrivadaCargando = Object.values(seccionesPrivadasLoading).some(Boolean);

  // Selección CROPA de Detalles → mapa {doc: boolean} que persiste la carta.
  const documentosCropa = useMemo(() => {
    const seleccion = facturacionValues?.detalles?.documentosCropa;
    if (!Array.isArray(seleccion)) return {};
    return CROPA_DOCS.reduce<Record<string, boolean>>((acc, { key }) => {
      acc[key] = (seleccion as string[]).includes(key);
      return acc;
    }, {});
  }, [facturacionValues]);

  const limpiarEstadoSecciones = useCallback(() => {
    setCargasPublicasValues([]);
    setShipperValues({});
    setConsignatarioValues({});
    setNotificacionesValues({});
    setFacturacionValues({ cliente: {}, detalles: {} });
    setFechasValues({});
  }, []);

  // Cualquier reemplazo del snapshot del servidor descarta ediciones de cargas.
  // biome-ignore lint/correctness/useExhaustiveDependencies: la dep dispara el reset, no se lee dentro
  useEffect(() => {
    setCargasPublicasValues([]);
  }, [datos.jsonCartaCliente]);

  const { guardarSeccion, isSaving, aviso, setAviso } = useGuardarSeccionPrivada({
    cotizacionCabeceraId: datos.cotizacionCabeceraId,
    jsonCartaCliente: datos.jsonCartaCliente,
    cartaListaCoordinacionGuardada: datos.cartaListaCoordinacionGuardada,
    shipperValues,
    consignatarioValues,
    facturacionValues,
    fechasValues,
    notificacionesValues,
    cargasPublicasValues,
    documentosCropa,
    entidadIdShipperCoord: datos.entidadIdShipperCoord,
    entidadIdConsignatarioCoord: datos.entidadIdConsignatarioCoord,
    refetchCartaCliente: datos.refetchCartaCliente,
    limpiarEstadoSecciones,
  });

  const {
    filteredSteps,
    validityHandlers,
    allStepsValid,
    hasUnsavedSection,
    allSectionsInitialized,
    isPreCliente,
    stepValidityParaStepper,
  } = useValidezPasosCts({ showFechas: datos.showFechas, estado, setEstado });

  const commitContext = useCommitContextCts({ datos, embarqueId });

  const linkCliente = useLinkClienteCts({
    embarqueId,
    embarqueData: datos.embarqueData,
    cotizacionCabeceraId: datos.cotizacionCabeceraId,
    entidadIdCliente: datos.entidadIdCliente,
    jsonCartaCliente: datos.jsonCartaCliente,
    filaCartaCliente: datos.filaCartaCliente,
    listaCoordinacion: datos.listaCoordinacion,
    cargas: datos.cargasCarta,
    fechasMovData: datos.fechasMovData,
  });

  // Link Cliente solo aplica mientras la carta está pendiente de completar
  // (cod_estado 1); una vez el cliente la completó (cod_estado 83) ya no
  // corresponde generar un nuevo link.
  const filaCartaRecord = datos.filaCartaCliente as JsonRecord | null;
  const codEstadoCarta = Number(filaCartaRecord?.cod_estado ?? filaCartaRecord?.COD_ESTADO);
  const showLinkCliente = codEstadoCarta === COD_ESTADO_CARTA_INCOMPLETA;

  const isCrearCoordinacionDisabled =
    !allStepsValid || datos.loadingEmbarque || !allSectionsInitialized;
  const crearCoordinacionTooltip = tooltipCrearCoordinacion({
    disabled: isCrearCoordinacionDisabled,
    hasUnsavedSection,
    isPreCliente,
  });

  // Referencia estable: EmbarqueProvider propaga por contexto, que ignora la
  // memoización de los componentes intermedios (SeccionesWizardPrivado) — sin
  // esto, Gastos/Documentos/Rutas/Seguimiento se re-renderizarían en cada
  // tecla escrita en cualquier otra sección del wizard.
  const contextValue = useMemo(
    () => ({
      embarque_id: embarqueId,
      cod_file: datos.codFile || null,
      servicioNombre: "CTS",
    }),
    [embarqueId, datos.codFile],
  );

  const stepActivo = filteredSteps[estado];
  const activeCompare =
    stepActivo === "Shipper" && shipperCompareRows.length > 0
      ? { titulo: "Shipper", rows: shipperCompareRows }
      : stepActivo === "Consignatario" && consignatarioCompareRows.length > 0
        ? { titulo: "Consignatario", rows: consignatarioCompareRows }
        : null;

  if (datos.loadingEmbarque) {
    return <Loader className="fixed inset-0 z-50 min-h-0 bg-background" />;
  }

  if (!datos.embarqueData) {
    return (
      <div className="flex flex-col items-center gap-4 p-12">
        <p className="text-lg text-muted-foreground">Embarque no encontrado</p>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="size-4" />
          Regresar
        </Button>
      </div>
    );
  }

  return (
    <EmbarqueProvider value={contextValue}>
      <div className="relative space-y-3">
        {/* G4: espera también las cascadas de catálogos de las secciones (depto/
            municipio/ciudad, SERVICIO, contactos), no solo los flags de secciones
            privadas — mismo criterio que la vista pública. */}
        <LoaderInicial
          cargandoBase={
            datos.loadingEmbarque || datos.seccionesLoading || algunaSeccionPrivadaCargando
          }
        />

        <CtsHeader
          loadingEmbarque={datos.loadingEmbarque}
          embarqueData={datos.embarqueData as unknown as JsonRecord}
          onRegresar={() => router.back()}
          onLinkCliente={() => {
            linkCliente.setGeneratedLink("");
            setIsLinkDialogOpen(true);
          }}
          showLinkCliente={showLinkCliente}
          isGeneratingLink={linkCliente.isGeneratingLink}
          onCrearCoordinacion={() => setIsCrearCoordinacionOpen(true)}
          isCrearCoordinacionDisabled={isCrearCoordinacionDisabled}
          crearCoordinacionTooltip={crearCoordinacionTooltip}
          aviso={aviso}
          onCerrarAviso={() => setAviso(null)}
          filteredSteps={[...filteredSteps]}
          estado={estado}
          stepValidityParaStepper={stepValidityParaStepper}
          onStepClick={setEstado}
        />

        <div
          className={`mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 lg:items-start ${
            activeCompare ? "lg:grid-cols-[minmax(0,1fr)_360px]" : ""
          }`}
        >
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-3 sm:pt-6">
              <SeccionesWizardPrivado
                estado={estado}
                filteredSteps={filteredSteps}
                datos={datos}
                isSaving={isSaving}
                guardarSeccion={guardarSeccion}
                validityHandlers={validityHandlers}
                loadingHandlers={loadingHandlers}
                cargasPublicasValues={cargasPublicasValues}
                setShipperValues={setShipperValues}
                setConsignatarioValues={setConsignatarioValues}
                setFechasValues={setFechasValues}
                setFacturacionValues={setFacturacionValues}
                setCargasPublicasValues={setCargasPublicasValues}
                onShipperCompareRows={setShipperCompareRows}
                onConsignatarioCompareRows={setConsignatarioCompareRows}
              />
            </CardContent>
          </Card>
          {activeCompare && (
            <div className="lg:sticky lg:top-4">
              <EntidadComparePanel
                titulo={activeCompare.titulo}
                showEntity={false}
                readOnly
                rows={activeCompare.rows}
              />
            </div>
          )}
        </div>

        <LinkClienteDialog
          open={isLinkDialogOpen}
          onClose={() => setIsLinkDialogOpen(false)}
          existingLink={linkCliente.existingLinkCliente}
          generatedLink={linkCliente.generatedLink}
          isLoading={linkCliente.isGeneratingLink}
          onGenerateNew={linkCliente.handleGenerarLink}
        />

        <CrearCoordinacionModal
          open={isCrearCoordinacionOpen}
          onClose={() => setIsCrearCoordinacionOpen(false)}
          embarqueData={datos.embarqueData as unknown as JsonRecord}
          embarqueId={embarqueId || 0}
          idServicio={datos.idServicio}
          commitContext={commitContext}
        />
      </div>
    </EmbarqueProvider>
  );
}

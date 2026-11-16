"use client";

/**
 * Wizard público de la carta de instrucciones (`/public/cts`), port del
 * legacy `public/page.jsx`: 7 pasos con guardado por sección como borrador de
 * la carta ("Documentos" condicional por clasificación peligrosa / cobertura
 * de seguro y "Fechas" por gasto cod_rubro=12), pantallas de gestión culminada
 * / link expirado, y flujo "Completar" (subir instructivo firmado + PDF +
 * cod_estado 83).
 */

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useInformacionPdfPublico } from "@/features/embarques/hooks/use-informacion-pdf-publico";
import { type CliInfo, parseCliInfo } from "@/features/embarques/lib/cli-info";
import { COD_ESTADO_CARTA_COMPLETADA, CROPA_DOCS } from "@/features/embarques/lib/constantes";
import { setPublicSession } from "@/shared/api/public-session";
import { BannerInformativo } from "@/shared/components/banner-informativo";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { LoaderInicial } from "../loader-inicial";
import { StepperNav } from "../stepper";
import { InstruccionesPaso } from "./instrucciones-paso";
import { PantallaGestionCompletada, PantallaLinkExpirado } from "./pantallas-estado";
import { type FacturacionValues, SeccionesWizard } from "./secciones-wizard";
import { SubirInstructivoModal } from "./subir-instructivo-modal";
import { useDatosCartaPublica } from "./use-datos-carta-publica";
import { useGuardarSeccionPublica } from "./use-guardar-seccion-publica";
import { usePasosWizard } from "./use-pasos-wizard";

type JsonRecord = Record<string, unknown>;

export function PublicCtsPage() {
  const searchParams = useSearchParams();
  const cliInfo = useMemo(() => parseCliInfo(searchParams?.get("cli_inf")), [searchParams]);
  const embarqueId = Number(cliInfo?.embarque_id);

  if (!cliInfo || !Number.isSafeInteger(embarqueId) || embarqueId <= 0) {
    return (
      <div className="grid min-h-screen place-items-center p-6">
        <Alert variant="destructive" className="max-w-xl">
          <AlertTitle>Enlace inválido</AlertTitle>
          <AlertDescription>
            El token no contiene un embarque válido. Solicite un nuevo enlace.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <PublicCtsWizard key={cliInfo.token_interaccion} embarqueId={embarqueId} cliInfo={cliInfo} />
  );
}

function PublicCtsWizard({
  embarqueId,
  cliInfo,
}: {
  readonly embarqueId: number;
  readonly cliInfo: CliInfo;
}) {
  // El token se setea ANTES de habilitar cualquier fetch público. Sin cleanup:
  // un `return () => clearPublicSession()` aquí abre una ventana donde
  // `tokenReady` ya es `true` (no se resetea) pero el módulo quedó sin token
  // -- en dev, React Strict Mode duplica setup+cleanup+setup del efecto en el
  // montaje inicial, y las queries de los hijos (ya habilitadas) pueden
  // disparar el fetch justo en ese hueco, saliendo sin Authorization. Un
  // cliInfo nuevo (link distinto) sobreescribe el token vigente sin pasar por
  // ese hueco.
  const [tokenReady, setTokenReady] = useState(false);
  useEffect(() => {
    setPublicSession(cliInfo?.token_interaccion, String(cliInfo?.version_app || "0.0.2"));
    setTokenReady(true);
  }, [cliInfo]);

  const [shipperValues, setShipperValues] = useState<JsonRecord>({});
  const [consignatarioValues, setConsignatarioValues] = useState<JsonRecord>({});
  const [notificacionesValues, setNotificacionesValues] = useState<JsonRecord>({});
  const [fechasValues, setFechasValues] = useState<JsonRecord>({});
  const [facturacionValues, setFacturacionValues] = useState<FacturacionValues>({
    cliente: {},
    detalles: {},
  });
  const [cargasPublicasValues, setCargasPublicasValues] = useState<JsonRecord[]>([]);
  const [modalCompletarAbierto, setModalCompletarAbierto] = useState(false);

  const datos = useDatosCartaPublica({
    embarqueId,
    cliInfo,
    tokenReady,
    cargasPublicasValues,
  });

  // Selección CROPA de Detalles → mapa {doc: boolean} que persiste la carta.
  const documentosCropa = useMemo(() => {
    const seleccion = facturacionValues?.detalles?.documentosCropa;
    if (!Array.isArray(seleccion)) return {};
    return CROPA_DOCS.reduce<Record<string, boolean>>((acc, { key }) => {
      acc[key] = (seleccion as string[]).includes(key);
      return acc;
    }, {});
  }, [facturacionValues]);

  const refetchTodo = useCallback(
    () =>
      Promise.all([
        datos.refetchCarta(),
        datos.refetchFilaCarta(),
        datos.refetchEntidadesRelacionadas(),
      ]),
    [datos.refetchCarta, datos.refetchFilaCarta, datos.refetchEntidadesRelacionadas],
  );

  const limpiarEstadoSecciones = useCallback(() => {
    setCargasPublicasValues([]);
    setShipperValues({});
    setConsignatarioValues({});
    setNotificacionesValues({});
    setFacturacionValues({ cliente: {}, detalles: {} });
    setFechasValues({});
  }, []);

  const industriaLabel = useCallback(
    (_code: unknown) => null,
    // La etiqueta de industria solo enriquece el slim de entidad nueva; el
    // backend la resuelve por código si falta.
    [],
  );

  const { guardarSeccion, isSaving, aviso, setAviso, completadoMensaje } = useGuardarSeccionPublica(
    {
      embarqueId,
      cliInfo,
      jsonCartaCliente: datos.jsonCartaCliente,
      cartaListaCoordinacionGuardada: datos.cartaListaCoordinacionGuardada,
      cargas: datos.cargas,
      fechasMovOriginales: (datos.resumenData?.fechasMov ?? []) as unknown as JsonRecord[],
      shipperValues,
      consignatarioValues,
      facturacionValues,
      fechasValues,
      notificacionesValues,
      cargasPublicasValues,
      documentosCropa,
      entidadIdShipperCoord: datos.entidadIdShipperCoord,
      entidadIdConsignatarioCoord: datos.entidadIdConsignatarioCoord,
      allEntidades: datos.allEntidades,
      industriaLabel,
      refetchTodo,
      limpiarEstadoSecciones,
    },
  );

  // Cualquier reemplazo del snapshot del servidor descarta ediciones de cargas.
  // biome-ignore lint/correctness/useExhaustiveDependencies: las deps disparan el reset, no se leen dentro
  useEffect(() => {
    setCargasPublicasValues([]);
  }, [datos.resumenData, datos.jsonCartaCliente]);

  const {
    estado,
    setEstado,
    filteredSteps,
    validityHandlers,
    stepValidityParaStepper,
    allStepsValid,
    allStepsSaved,
  } = usePasosWizard({
    showFechas: datos.showFechas,
    showDocumentosPeligrosidad: datos.showDocumentosPeligrosidad,
    showDocumentosCoberturaSeguro: datos.showDocumentosCoberturaSeguro,
  });

  // --- PDF: solo datos persistidos; refetch antes de generar -------------------
  const { isGeneratingPdf, handleDownloadPdf } = useInformacionPdfPublico({
    cartaPublicaData: datos.cartaPublicaData,
    cargas: datos.cargasParaPdf,
    isDraft: !allStepsValid,
  });
  const [isRefreshingForPdf, setIsRefreshingForPdf] = useState(false);
  const handleDescargarPdfClick = useCallback(
    async (options: { forceDownload: boolean }) => {
      setIsRefreshingForPdf(true);
      try {
        await refetchTodo();
      } finally {
        setIsRefreshingForPdf(false);
      }
      // El refetch ya actualizó la caché; el payload del PDF se lee del estado
      // re-renderizado en el siguiente tick.
      await new Promise((resolve) => setTimeout(resolve, 0));
      await handleDownloadPdf(options);
    },
    [refetchTodo, handleDownloadPdf],
  );

  // Completar: guardar con cod_estado 83. El PDF ya se descargó desde el modal
  // (orden obligatorio: con estado 83 la fila ya no entrega datos del PDF).
  const [completadoLocal, setCompletadoLocal] = useState(false);
  const handleCompletar = useCallback(async () => {
    const resultado = await guardarSeccion(undefined, COD_ESTADO_CARTA_COMPLETADA);
    if (resultado === "error") return false;
    setModalCompletarAbierto(false);
    if (resultado === "ok") setCompletadoLocal(true);
    return true;
  }, [guardarSeccion]);

  if (datos.yaCulmino || completadoMensaje || completadoLocal) {
    return <PantallaGestionCompletada mensaje={completadoMensaje || datos.mensajeCulmino} />;
  }

  if (datos.tokenExpirado) {
    return <PantallaLinkExpirado />;
  }

  return (
    <div className="relative min-h-screen w-full bg-background">
      <LoaderInicial cargandoBase={!tokenReady || datos.seccionesLoading} />

      {/* Header fijo (D.7): instrucciones + acción principal + stepper siempre
          visibles al hacer scroll, ocupando todo el ancho de la pantalla. */}
      <div className="sticky top-14 z-10 border-b border-border/60 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="mx-auto w-full max-w-4xl px-3 pt-3 sm:px-4 sm:pt-4 lg:px-6 lg:pt-6">
          <div className="mb-3 flex flex-col items-stretch justify-between gap-2 md:flex-row md:items-center">
            <InstruccionesPaso pasoActivo={filteredSteps[estado] ?? filteredSteps[0] ?? ""} />
            <div className="flex items-center justify-start gap-2 md:justify-end">
              <Button
                size="sm"
                onClick={() => setModalCompletarAbierto(true)}
                disabled={!allStepsSaved || datos.cartaLoading}
                title={
                  allStepsSaved ? "" : "Debe completar y guardar todos los pasos antes de continuar"
                }
              >
                Completar
              </Button>
            </div>
          </div>

          {aviso && (
            <div className="mb-3">
              <BannerInformativo
                titulo={aviso.tipo === "error" ? "Error" : "Éxito"}
                mensaje={aviso.mensaje}
                severidad={aviso.tipo}
                acciones={
                  <Button variant="ghost" size="sm" onClick={() => setAviso(null)}>
                    Cerrar
                  </Button>
                }
              />
            </div>
          )}
        </div>

        {/* Sin max-w: el stepper ocupa todo el ancho de la pantalla. */}
        <div className="w-full px-3 pb-3 sm:px-4 lg:px-6">
          <StepperNav
            steps={filteredSteps}
            activeStep={estado}
            stepValidity={stepValidityParaStepper}
            onStepClick={setEstado}
          />
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl p-3 sm:p-4 lg:p-6">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-3 sm:pt-6">
            <SeccionesWizard
              estado={estado}
              filteredSteps={filteredSteps}
              datos={datos}
              cliInfo={cliInfo}
              tokenReady={tokenReady}
              isSaving={isSaving}
              guardarSeccion={guardarSeccion}
              validityHandlers={validityHandlers}
              cargasPublicasValues={cargasPublicasValues}
              setShipperValues={setShipperValues}
              setConsignatarioValues={setConsignatarioValues}
              setNotificacionesValues={setNotificacionesValues}
              setFechasValues={setFechasValues}
              setFacturacionValues={setFacturacionValues}
              setCargasPublicasValues={setCargasPublicasValues}
            />
          </CardContent>
        </Card>
      </div>

      <SubirInstructivoModal
        open={modalCompletarAbierto}
        onClose={() => setModalCompletarAbierto(false)}
        onCompletar={handleCompletar}
        embarqueId={cliInfo?.embarque_id}
        codFile={String(datos.listaCoordinacion?.codFile ?? datos.codFile ?? "")}
        isCompleting={isSaving}
        onDownloadPdf={handleDescargarPdfClick}
        isGeneratingPdf={isGeneratingPdf}
        isRefreshingForPdf={isRefreshingForPdf}
        allStepsValid={allStepsValid}
      />
    </div>
  );
}

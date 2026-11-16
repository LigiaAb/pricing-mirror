"use client";

import { AlertTriangle, Loader2, SearchIcon } from "lucide-react";
import * as React from "react";

import { useContextoOperativoStore } from "@/features/shell";
import { Button } from "@/shared/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet";
import { cn } from "@/shared/lib/utils";
import { useAuthStore } from "@/shared/stores/auth-store";
import type { CotizacionCabeceraPayload } from "../api/cotizacion-cabecera";
import {
  type ContextoPlantillasCotizacion,
  type PlantillaCotizacion,
  usePlantillasPosiblesCotizacion,
  useRubrosPlantillaCotizacion,
} from "../api/plantillas-cotizacion";
import {
  CatalogosCotizacionProvider,
  useCatalogosCotizacion,
} from "../hooks/use-catalogos-cotizacion";
import { useEstadosCotizacion } from "../hooks/use-estados-cotizacion";
import {
  type EstadosGestionCotizacion,
  useGestionCotizaciones,
} from "../hooks/use-gestion-cotizaciones";
import { construirFiltrosCalculo, etiquetaCampo } from "../lib/cabecera";
import type { Id } from "../lib/tipos";
import { esRegistro, mismoId } from "../lib/utils";
import { resolverEstadosCatalogo } from "../lib/versiones";
import { CalculoCotizacionContainer } from "./calculo-cotizacion-container";
import { CotizacionForm } from "./cotizacion-form";
import { CotizacionesTable, type CotizacionesTableProps } from "./cotizaciones-table";
import { PlantillasPosiblesDialog } from "./plantillas-posibles-dialog";
import { SectionHeader } from "./utils";

type UnknownRecord = Record<string, unknown>;

type EstadoGestionCompleto = EstadosGestionCotizacion & Record<NombreEstadoRequerido, Id>;

/* ==========================================================================
 * COMPORTAMIENTO DEL CONTENEDOR LEGADO
 * ========================================================================== */

const GRUPOS_FILTRO = ["carga", "origen"] as const;

const CAMPOS_FILTRO = [
  "contacto",
  "tipoCarga",
  "clasificacionCarga",
  "tipoPuntoEnlaceOrigen",
  "tipoPuntoEnlaceDestino",
  "descripcion",
  "carrier",
] as const;

const CAMPOS_EDICION_NORMAL = ["cliente", "empresa", "contacto"] as const;

const CAMPOS_EDICION_CONFIRMADO = [
  "cliente",
  "empresa",
  "centroCosto",
  "contacto",
  "tipoTransporte",
  "tipoServicio",
  "tipoCarga",
  "clasificacionCarga",
  "incoterm",
  "tipoPago",
  // "paisOrigen",
  // "tipoPuntoEnlaceOrigen",
  // "puntoEnlaceOrigen",
  // "paisDestino",
  // "tipoPuntoEnlaceDestino",
  // "puntoEnlaceDestino",
] as const;

const CAMPOS_FORMULARIO_INFORMACION = ["empresa", "centroCosto", "descripcion", "carrier"] as const;

const ESTADOS_REQUERIDOS = [
  "ACTIVO",
  "CONFIRMADO",
  "RECHAZADO",
  "FINALIZADO",
  "VENCIDO",
  "INGRESADO",
  "SOLICITADO",
] as const;

type NombreEstadoRequerido = (typeof ESTADOS_REQUERIDOS)[number];

/*
 * Solo se usan mientras el catálogo de estados todavía está cargando.
 *
 * No representan códigos reales y nunca deben enviarse al backend:
 * la UI que permite mutaciones no se renderiza hasta resolver todos
 * los estados requeridos.
 */
const ESTADOS_PENDIENTES: Record<NombreEstadoRequerido, string> = {
  ACTIVO: "__ESTADO_PENDIENTE_ACTIVO__",
  CONFIRMADO: "__ESTADO_PENDIENTE_CONFIRMADO__",
  RECHAZADO: "__ESTADO_PENDIENTE_RECHAZADO__",
  FINALIZADO: "__ESTADO_PENDIENTE_FINALIZADO__",
  VENCIDO: "__ESTADO_PENDIENTE_VENCIDO__",
  INGRESADO: "__ESTADO_PENDIENTE_INGRESADO__",
  SOLICITADO: "__ESTADO_PENDIENTE_SOLICITADO__",
};

/* ==========================================================================
 * HELPERS
 * ========================================================================== */

function obtenerIdContexto(value: unknown, keys: string[]): Id | null {
  if (typeof value === "string" || typeof value === "number") {
    return value;
  }

  if (!esRegistro(value)) {
    return null;
  }

  if (typeof value.value === "string" || typeof value.value === "number") {
    return value.value;
  }

  for (const key of keys) {
    const candidate = value[key];

    if (typeof candidate === "string" || typeof candidate === "number") {
      return candidate;
    }
  }

  return null;
}

/* ==========================================================================
 * COMPONENTE
 *
 * IMPORTANTE:
 * Igual que GestionCotizacion.jsx legado, este componente NO recibe props.
 * ========================================================================== */

type GestionCotizacionProps = {
  codCotizacionInicial?: Id | null;
};

/**
 * Pantalla de Gestión de Cotizaciones.
 *
 * Monta el provider de catálogos: todo lo que se renderiza adentro
 * (formulario, tabla, cálculo, due agent/carrier...) puede usar
 * `useCatalogosCotizacion()` sin recibir catálogos por props.
 */
export function GestionCotizacion(props: GestionCotizacionProps) {
  return (
    <CatalogosCotizacionProvider>
      <GestionCotizacionContenido {...props} />
    </CatalogosCotizacionProvider>
  );
}

function GestionCotizacionContenido({ codCotizacionInicial = null }: GestionCotizacionProps) {
  /* ==========================================================================
   * CONTEXTO / USUARIO
   * ========================================================================== */

  const centroCostoActual = useContextoOperativoStore((state) => state.currentCentroCosto);
  const empresaActual = useContextoOperativoStore((state) => state.currentEmpresa);
  const paisActual = useContextoOperativoStore((state) => state.currentPais);
  const authRaw = useAuthStore((state) => state.user);
  const auth: UnknownRecord = esRegistro(authRaw) ? authRaw : {};

  const ctx = React.useMemo(
    () => ({ empresaId: empresaActual, centroCostoId: centroCostoActual, paisId: paisActual }),
    [empresaActual, centroCostoActual, paisActual],
  );

  const currentEmpresaId = obtenerIdContexto(ctx?.empresaId, ["cod_empresa", "empresaId", "id"]);

  const currentCentroCostoId = obtenerIdContexto(ctx?.centroCostoId, [
    "cod_cc",
    "centroCostoId",
    "id",
  ]);

  const currentPaisId = obtenerIdContexto(ctx?.paisId, ["cod_pais", "paisId", "id"]);

  const codUsuario =
    typeof auth?.cod_usuario === "string" || typeof auth?.cod_usuario === "number"
      ? auth.cod_usuario
      : null;

  /* ==========================================================================
   * CATÁLOGOS (centralizados en hooks/use-catalogos-cotizacion.tsx)
   * ========================================================================== */

  const { isLoading: isLoadingCatalogos } = useCatalogosCotizacion();

  // Mismo catálogo de estados que usa el cálculo (una sola consulta).
  const { catalogo: catalogoEstados } = useEstadosCotizacion();

  const estadosResueltos = React.useMemo(
    () => resolverEstadosCatalogo(catalogoEstados, ESTADOS_REQUERIDOS),
    [catalogoEstados],
  );

  const faltanEstados = React.useMemo(
    () => ESTADOS_REQUERIDOS.filter((nombre) => estadosResueltos[nombre] == null),
    [estadosResueltos],
  );

  /*
   * useGestionCotizaciones necesita el mapa desde el primer render.
   * Los sentinels solo mantienen estable la firma de hooks mientras
   * termina de cargar el catálogo; no se habilita la UI funcional
   * hasta que `faltanEstados` quede vacío.
   */
  const estadosGestion = React.useMemo<EstadoGestionCompleto>(
    () => ({ ...ESTADOS_PENDIENTES, ...estadosResueltos }),
    [estadosResueltos],
  );

  /* ==========================================================================
   * GESTIÓN DE CABECERAS
   * ========================================================================== */

  const filtrosIniciales = React.useMemo(
    () => ({
      cod_empresa: currentEmpresaId,
      cod_cc: currentCentroCostoId,
    }),
    [currentEmpresaId, currentCentroCostoId],
  );

  const {
    aplicarFiltrosFormulario,
    cotizacionesVisibles,
    mostrarConfirmados,
    alternarConfirmados,
    mostrarVencidas,
    alternarVencidas,
    cotizacionSeleccionada,
    cotizacionPersistida,
    isNewCotizacion,
    seleccionarCotizacion,
    seleccionarCotizacionPorId,
    aplicarPlantilla,
    limpiarCotizacion,
    nuevaCotizacion,
    plantillaSeleccionada,
    formResetKey,
    insertarCotizacion,
    actualizarCotizacion,
    rechazarCotizacion,
    confirmarCotizacion,
    puedeConfirmarCotizacion,
    refetchCotizaciones,
    isLoading,
    isFetching,
    isMutating,
    isInserting,
    isUpdating,
    isRejecting,
    isValidatingEligibility,
    isConfirming,
    error,
    filtrosBorrador: filtros,
  } = useGestionCotizaciones({
    filtrosIniciales,
    estados: estadosGestion,
  });

  /*
   * La ruta solicitud-cotizacion/[id] entrega el código ya decodificado.
   * Se intenta seleccionar nuevamente cuando termina de cargar la consulta,
   * pero solo se aplica una vez por cada ID recibido.
   */
  const cotizacionInicialAplicadaRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (codCotizacionInicial == null) return;

    const key = String(codCotizacionInicial);

    if (cotizacionInicialAplicadaRef.current === key) return;

    const cotizacion = seleccionarCotizacionPorId(codCotizacionInicial);

    if (cotizacion) {
      cotizacionInicialAplicadaRef.current = key;
    }
  }, [codCotizacionInicial, seleccionarCotizacionPorId]);

  /* ==========================================================================
   * PLANTILLAS POSIBLES DEL CLIENTE
   * ========================================================================== */

  const [contextoPlantillas, setContextoPlantillas] =
    React.useState<ContextoPlantillasCotizacion | null>(null);

  const [plantillasDialogOpen, setPlantillasDialogOpen] = React.useState(false);

  const contextoOmitidoRef = React.useRef<string | null>(null);

  const plantillasQuery = usePlantillasPosiblesCotizacion(
    contextoPlantillas,
    estadosGestion.ACTIVO,
    isNewCotizacion,
  );

  const codPlantillaSeleccionada =
    plantillaSeleccionada?.cod_tarifaplantilla ?? plantillaSeleccionada?.value ?? null;

  const rubrosPlantillaQuery = useRubrosPlantillaCotizacion(
    codPlantillaSeleccionada,
    estadosGestion.ACTIVO,
  );

  const contextoPlantillasKey = contextoPlantillas
    ? `${contextoPlantillas.entidad_id}|${contextoPlantillas.cod_emp}|${contextoPlantillas.cod_cc}`
    : null;

  React.useEffect(() => {
    if (!isNewCotizacion) {
      setPlantillasDialogOpen(false);
      return;
    }

    if (!contextoPlantillasKey) return;
    if (contextoOmitidoRef.current === contextoPlantillasKey) return;
    if ((plantillasQuery.data?.length ?? 0) === 0) return;

    setPlantillasDialogOpen(true);
  }, [contextoPlantillasKey, isNewCotizacion, plantillasQuery.data]);

  const handleClienteContextoChange = React.useCallback(
    (contexto: ContextoPlantillasCotizacion | null) => {
      setContextoPlantillas((prev) => {
        const prevKey = prev ? `${prev.entidad_id}|${prev.cod_emp}|${prev.cod_cc}` : null;
        const nextKey = contexto
          ? `${contexto.entidad_id}|${contexto.cod_emp}|${contexto.cod_cc}`
          : null;

        return prevKey === nextKey ? prev : contexto;
      });
    },
    [],
  );

  const handleSeleccionarPlantilla = React.useCallback(
    (plantilla: PlantillaCotizacion) => {
      contextoOmitidoRef.current = contextoPlantillasKey;
      aplicarPlantilla({
        ...plantilla,
        carrier_id: plantilla.carrier_id ?? null,
      });
      setPlantillasDialogOpen(false);
    },
    [contextoPlantillasKey, aplicarPlantilla],
  );

  const handleOmitirPlantilla = React.useCallback(() => {
    contextoOmitidoRef.current = contextoPlantillasKey;
    setPlantillasDialogOpen(false);
  }, [contextoPlantillasKey]);

  /* ==========================================================================
   * ESTADO VISUAL
   * ========================================================================== */

  const [informacionOpen, setInformacionOpen] = React.useState(false);

  const [esFormularioValido, setEsFormularioValido] = React.useState(false);

  const [camposFaltantes, setCamposFaltantes] = React.useState<string[]>([]);

  const [abrirFiltro, setAbrirFiltro] = React.useState(false);

  const informacionRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!cotizacionSeleccionada) return;

    setInformacionOpen(true);

    informacionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [cotizacionSeleccionada]);

  /* ==========================================================================
   * FORMULARIO SELECCIONADO
   * ========================================================================== */

  const tipoFormularioInformacion = React.useMemo(() => {
    if (!cotizacionSeleccionada) {
      return "lectura" as const;
    }

    if (
      "cod_version_activa" in cotizacionSeleccionada &&
      cotizacionSeleccionada.cod_version_activa
    ) {
      return "lectura" as const;
    }

    return isNewCotizacion ? ("ingreso" as const) : ("edicion" as const);
  }, [cotizacionSeleccionada, isNewCotizacion]);

  const inputsReadOnlyInformacion = React.useMemo(() => {
    if (isNewCotizacion) {
      return ["fecha"] as const;
    }

    const esConfirmada = mismoId(cotizacionSeleccionada?.cod_estado, estadosGestion.CONFIRMADO);

    return ["fecha", ...(esConfirmada ? CAMPOS_EDICION_CONFIRMADO : CAMPOS_EDICION_NORMAL)];
  }, [isNewCotizacion, cotizacionSeleccionada?.cod_estado, estadosGestion.CONFIRMADO]);

  const handleSubmitInformacion = React.useCallback(
    async (payload: CotizacionCabeceraPayload) => {
      if (isNewCotizacion) {
        await insertarCotizacion(payload);
        return;
      }

      await actualizarCotizacion(payload);
    },
    [isNewCotizacion, insertarCotizacion, actualizarCotizacion],
  );

  /* ==========================================================================
   * CÁLCULO
   * ========================================================================== */

  const filtrosCalculo = React.useMemo(
    () => (cotizacionPersistida ? construirFiltrosCalculo(cotizacionPersistida) : null),
    [cotizacionPersistida],
  );

  const cotizacionesTableProps: Omit<CotizacionesTableProps, "filtro"> = {
    cotizacionesVisibles,
    mostrarConfirmados,
    alternarConfirmados,
    mostrarVencidas,
    alternarVencidas,
    seleccionarCotizacion,
    nuevaCotizacion,
    limpiarCotizacion,
    rechazarCotizacion,
    confirmarCotizacion,
    puedeConfirmarCotizacion,
    refetchCotizaciones,
    isLoading,
    isFetching,
    isRejecting,
    isValidatingEligibility,
    isConfirming,
    error,
  };

  /* ==========================================================================
   * CARGA / CONTRATOS BASE
   * ========================================================================== */

  const isLoadingBase = isLoadingCatalogos;

  if (isLoadingBase) {
    return (
      <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Cargando cotizaciones...
      </div>
    );
  }

  if (faltanEstados.length > 0) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" />

          <div>
            <p className="font-semibold">Catálogo de estados incompleto</p>

            <p className="mt-1 text-sm text-muted-foreground">
              No se puede iniciar Gestión de Cotizaciones porque no se encontraron estos estados:
            </p>

            <p className="mt-2 text-sm font-medium">{faltanEstados.join(", ")}</p>
          </div>
        </div>
      </div>
    );
  }

  /* ==========================================================================
   * RENDER
   * ========================================================================== */

  return (
    <div className="space-y-4">
      {/* ================================================================
          FILTROS
      ================================================================= */}
      <Sheet open={abrirFiltro} onOpenChange={() => setAbrirFiltro((prev) => !prev)}>
        <SheetContent
          side="right"
          className="modal-solicitud-hero w-full overflow-y-auto border-l bg-card p-0 sm:max-w-2xl"
        >
          <SheetHeader className="border-b bg-muted/40 px-4 py-5 pr-12 sm:px-6 sm:py-6 sm:pr-14">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <SearchIcon className="size-5" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <SheetTitle>Filtrar Cotizaciones</SheetTitle>
                <SheetDescription>Filtros para la búsqueda.</SheetDescription>
              </div>
            </div>
          </SheetHeader>
          <div className="space-y-5 p-4 sm:space-y-6 sm:p-6">
            <CotizacionForm
              tipoFormulario="filtro"
              resetKey="filtro-cotizaciones"
              groupsToHide={GRUPOS_FILTRO}
              inputsToHide={CAMPOS_FILTRO}
              inputsReadOnly={[]}
              currentEmpresaId={currentEmpresaId}
              currentCentroCostoId={currentCentroCostoId}
              currentPaisId={currentPaisId}
              codUsuario={codUsuario}
              codEstadoActivo={estadosGestion.ACTIVO}
              defaultValues={filtros}
              onSubmit={(payload) => {
                aplicarFiltrosFormulario(payload);
                setAbrirFiltro(false);
              }}
              onClear={() => {
                aplicarFiltrosFormulario(filtrosIniciales);
                setAbrirFiltro(false);
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
      {/* ================================================================
          LISTADO
      ================================================================= */}
      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <CotizacionesTable
          {...cotizacionesTableProps}
          filtro={
            <Button
              size="sm"
              variant="outline"
              className="border-teal-600 "
              onClick={() => setAbrirFiltro(true)}
            >
              Filtrar
            </Button>
          }
        />
      </section>

      {/* ================================================================
          COTIZACIÓN SELECCIONADA
      ================================================================= */}

      {cotizacionSeleccionada ? (
        <section ref={informacionRef} className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/40 bg-card px-4 py-3 shadow-sm">
            <div>
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Cotización
              </span>

              <p className="text-lg font-semibold">
                {isNewCotizacion
                  ? "NUEVA"
                  : String(cotizacionSeleccionada.cod_cotizacion_cabecera ?? "")}
              </p>
            </div>

            <span className="text-sm text-muted-foreground">Modo {tipoFormularioInformacion}</span>
          </div>

          {/* ============================================================
              INFORMACIÓN
          ============================================================= */}

          <section className="overflow-hidden rounded-lg border bg-card">
            <SectionHeader
              title="Información"
              open={informacionOpen}
              onToggle={() => setInformacionOpen((prev) => !prev)}
            />

            {informacionOpen ? (
              <div className="p-4">
                <CotizacionForm
                  tipoFormulario={tipoFormularioInformacion}
                  defaultValues={cotizacionSeleccionada as CotizacionCabeceraPayload}
                  resetKey={formResetKey}
                  inputsReadOnly={inputsReadOnlyInformacion}
                  inputsToHide={CAMPOS_FORMULARIO_INFORMACION}
                  currentEmpresaId={currentEmpresaId}
                  currentCentroCostoId={currentCentroCostoId}
                  currentPaisId={currentPaisId}
                  codUsuario={codUsuario}
                  codEstadoActivo={estadosGestion.ACTIVO}
                  isSubmitting={isInserting || isUpdating}
                  onSubmit={handleSubmitInformacion}
                  onValidezChange={setEsFormularioValido}
                  onClienteContextoChange={handleClienteContextoChange}
                  onCamposFaltantesChange={setCamposFaltantes}
                />
              </div>
            ) : null}
          </section>

          {/* ============================================================
              CÁLCULO
          ============================================================= */}

          {cotizacionPersistida && filtrosCalculo ? (
            <section className="relative rounded-lg border bg-card p-4 shadow-sm">
              <CalculoCotizacionContainer
                cotizacion={
                  cotizacionPersistida as NonNullable<
                    React.ComponentProps<typeof CalculoCotizacionContainer>["cotizacion"]
                  >
                }
                codUsuario={codUsuario}
                plantillaSeleccionada={plantillaSeleccionada}
                serviciosAutoSeleccion={(rubrosPlantillaQuery.data ?? []).flatMap((rubro) =>
                  rubro.cod_servicio == null ? [] : [rubro.cod_servicio],
                )}
                filtrosCalculo={filtrosCalculo}
              />

              {!esFormularioValido ? (
                <div className="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-background/85 p-6 backdrop-blur-[1px]">
                  <div className="flex max-w-2xl items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-5 text-amber-800 dark:text-amber-200">
                    <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />

                    <div>
                      <p className="font-semibold">Información incompleta</p>

                      <p className="mt-1 text-sm">
                        Para realizar el cálculo, favor de completar:{" "}
                        {camposFaltantes.map(etiquetaCampo).join(", ")}.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}
        </section>
      ) : null}

      <PlantillasPosiblesDialog
        open={plantillasDialogOpen}
        plantillas={plantillasQuery.data ?? []}
        isLoading={plantillasQuery.isFetching}
        onOpenChange={(open) => {
          if (open) setPlantillasDialogOpen(true);
          else handleOmitirPlantilla();
        }}
        onSeleccionar={handleSeleccionarPlantilla}
        onOmitir={handleOmitirPlantilla}
      />

      {/* ================================================================
          MUTATIONS
      ================================================================= */}

      {isMutating ? (
        <div
          className={cn(
            "fixed bottom-4 right-4 z-50",
            "flex items-center gap-2 rounded-md border bg-card",
            "px-4 py-3 text-sm shadow-lg",
          )}
          role="status"
          aria-live="polite"
        >
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Procesando cotización...
        </div>
      ) : null}
    </div>
  );
}

export default GestionCotizacion;

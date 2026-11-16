"use client";

import { format } from "date-fns";
import { useEffect, useState } from "react";
import {
  useCreateCoordinacionFechaMov,
  useFetchCoordinacionFechaMov,
  useListarMasterDisponiblesCoordinacion,
  useUpdateCoordinacionEstado,
  useUpdateCoordinacionFechaMov,
} from "@/features/coordinaciones";
import { useAsignarMasterCoordinacion, useFetchGuiasCoordinacion } from "@/features/correlativos";
import { TIPO_FECHA_ENTREGA_COMBEX } from "@/features/embarques/lib/constantes";
import {
  agruparMasters,
  ESTADOS_DESTINO,
  fechaEntregaDefault,
  filtrarMasters,
  getServicioFlags,
  getWizardSteps,
  type ModoSeleccionarDestino,
  type OpcionDestino,
} from "./destino-model";

export interface UseSeleccionarDestinoInput {
  open: boolean;
  onClose: () => void;
  modo: ModoSeleccionarDestino;
  options: OpcionDestino[];
  initialSelection: string | null;
  embarqueId: string | number | null;
  codFile: string;
  servicioNombre: string;
  codEstadoActual: number;
  existingGuia: string;
  existingGuiaMaster: string;
  onConfirm?: ((data: Record<string, unknown>) => Promise<void> | void) | undefined;
  onSuccess?: ((data: Record<string, unknown>) => void) | undefined;
}

export function useSeleccionarDestino({
  open,
  onClose,
  modo,
  options,
  initialSelection,
  embarqueId,
  codFile,
  servicioNombre,
  codEstadoActual,
  existingGuia,
  existingGuiaMaster,
  onConfirm,
  onSuccess,
}: UseSeleccionarDestinoInput) {
  const mostrarSoloPaso1 = modo === "asignar_master";
  const mostrarSoloPaso2 = modo === "seleccionar_destino";
  const flags = getServicioFlags(servicioNombre);
  const { esDirecto, esCourier, esConsolidado, usaResumenGuias, showStep1 } = flags;
  const existingMasterGuia = String(existingGuiaMaster || existingGuia || "").trim();

  const [activeStep, setActiveStep] = useState(0);
  const [opcionSeleccionada, setOpcionSeleccionada] = useState<string | null>(initialSelection);
  const [fechaEntrega, setFechaEntrega] = useState<Date | undefined>(() => fechaEntregaDefault());
  const [error, setError] = useState<string | null>(null);
  const [selectedMaster, setSelectedMaster] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [step1Completed, setStep1Completed] = useState(() =>
    esCourier ? !!existingMasterGuia : !!existingGuia,
  );

  const wizardSteps = getWizardSteps(modo, showStep1, esDirecto);

  const updateCoordinacionEstado = useUpdateCoordinacionEstado();
  const createCoordinacionFechaMov = useCreateCoordinacionFechaMov();
  const updateCoordinacionFechaMov = useUpdateCoordinacionFechaMov();
  const asignarMaster = useAsignarMasterCoordinacion();
  const processing =
    updateCoordinacionEstado.isPending ||
    createCoordinacionFechaMov.isPending ||
    updateCoordinacionFechaMov.isPending;

  // Fecha de entrega COMBEX ya registrada para este embarque: si existe se
  // actualiza en vez de insertar una nueva al confirmar el destino.
  const { data: fechasMovEmbarque = [] } = useFetchCoordinacionFechaMov(
    { embarque_id: embarqueId },
    { enabled: !!embarqueId && open },
  );
  const fechaEntregaCombexExistente = fechasMovEmbarque.find(
    (f) => Number(f.id_tipo_fecha) === TIPO_FECHA_ENTREGA_COMBEX,
  );

  const { data: mastersDisponibles = [], isLoading: isLoadingMasters } =
    useListarMasterDisponiblesCoordinacion(embarqueId ?? undefined, codFile, {
      enabled: !!embarqueId && open && showStep1,
    });

  // Verificación de que correlativo_guia_master quedó asignado antes de avanzar.
  const { refetch: refetchGuiasCoordinacion } = useFetchGuiasCoordinacion(
    { embarque_id: Number(embarqueId) },
    { enabled: false },
  );

  const mastersFiltrados = filtrarMasters(mastersDisponibles, searchQuery);
  const mastersAgrupados = agruparMasters(mastersFiltrados);
  const primerMaster = mastersFiltrados[0];

  useEffect(() => {
    if (open) {
      if (existingGuia) {
        setStep1Completed(true);
        setActiveStep(showStep1 ? 1 : 0);
      } else if (esCourier) {
        setStep1Completed(!!existingMasterGuia);
        setActiveStep(0);
      }
    } else {
      setActiveStep(0);
      setOpcionSeleccionada(initialSelection);
      setFechaEntrega(fechaEntregaDefault());
      setError(null);
      setSelectedMaster("");
      setSearchQuery("");
      setStep1Completed(esCourier ? !!existingMasterGuia : !!existingGuia);
    }
  }, [open, initialSelection, existingGuia, existingMasterGuia, esCourier, showStep1]);

  const handleClose = () => {
    if (processing || asignarMaster.isPending) return;
    onClose();
  };

  const completarPaso1 = () => {
    setStep1Completed(true);
    if (mostrarSoloPaso1) {
      onClose();
    } else {
      setActiveStep(1);
    }
  };

  const verificarMasterAsignada = async (): Promise<boolean> => {
    const { data: guiasActualizadas } = await refetchGuiasCoordinacion();
    const guiaMasterAsignada = guiasActualizadas?.[0]?.correlativoGuiaMaster;
    if (!guiaMasterAsignada) {
      setError("La guía master no pudo confirmarse. Por favor seleccione una guía válida.");
      return false;
    }
    return true;
  };

  /** CONSOLIDADO sin master en la lista: crea una nueva master en el backend. */
  const handleNuevaMaster = async () => {
    setError(null);
    try {
      await asignarMaster.mutateAsync({
        embarque_id: Number(embarqueId),
        cod_file: codFile || "",
      });
      if (!(await verificarMasterAsignada())) return;
      completarPaso1();
    } catch (err) {
      setError((err as Error)?.message || "Error al asignar nueva master");
    }
  };

  const handleAsignarGuia = async () => {
    if (esConsolidado && mastersDisponibles.length === 0) return;
    if (esConsolidado && !selectedMaster) {
      setError("No hay guía disponible para asignar.");
      return;
    }
    setError(null);
    try {
      const payload: {
        embarque_id: number;
        cod_file: string;
        num_guia_master?: string;
      } = {
        embarque_id: Number(embarqueId),
        cod_file: codFile || "",
      };
      // Solo CONSOLIDADO elige la master; DIRECTO deja que el backend asigne.
      if (esConsolidado) {
        const guia = selectedMaster || primerMaster?.correlativoGuiaMaster;
        if (guia) payload.num_guia_master = guia;
      }
      await asignarMaster.mutateAsync(payload);
      if (!(await verificarMasterAsignada())) return;
      completarPaso1();
    } catch (err) {
      setError((err as Error)?.message || "Error al asignar correlativo de guía");
    }
  };

  const selectedOption = options.find((o) => o.id === opcionSeleccionada);

  const handleConfirm = async () => {
    if (!opcionSeleccionada) return;
    const data: Record<string, unknown> = { opcion: opcionSeleccionada };
    if (selectedOption?.requiresDate && fechaEntrega) {
      data.fechaEntrega = format(fechaEntrega, "yyyy-MM-dd");
    }
    setError(null);
    try {
      if (embarqueId) {
        const codEstadoSiguiente = ESTADOS_DESTINO[opcionSeleccionada];
        if (codEstadoSiguiente) {
          await updateCoordinacionEstado.mutateAsync({
            embarque_id: embarqueId,
            cod_file: codFile || "",
            cod_estado_actual: codEstadoActual,
            cod_estado_siguiente: codEstadoSiguiente,
          });
        }

        if (opcionSeleccionada === "combex_con_etiquetas" && data.fechaEntrega) {
          const fechaPayload = {
            estado_cod: 1,
            fecha: data.fechaEntrega as string,
            id_tipo_fecha: TIPO_FECHA_ENTREGA_COMBEX,
            observacion: "Fecha de entrega COMBEX",
          };
          if (fechaEntregaCombexExistente) {
            await updateCoordinacionFechaMov.mutateAsync({
              id_fecha_reg_embarque: fechaEntregaCombexExistente.id_fecha_reg_embarque,
              embarque_id: Number(embarqueId) || 0,
              ...fechaPayload,
            });
          } else {
            await createCoordinacionFechaMov.mutateAsync({
              embarqueId: Number(embarqueId) || 0,
              ...fechaPayload,
            });
          }
        }
      }

      await onConfirm?.(data);
      onSuccess?.(data);
      onClose();
    } catch (err) {
      setError((err as Error)?.message || "Ocurrió un error al procesar la acción");
    }
  };

  const mostrarPaso1 = mostrarSoloPaso1 || (!mostrarSoloPaso2 && showStep1 && activeStep === 0);
  const mostrarPaso2 =
    mostrarSoloPaso2 ||
    (!mostrarSoloPaso1 && (showStep1 ? activeStep === 1 : !!existingMasterGuia));

  return {
    flags: { esDirecto, esCourier, esConsolidado, usaResumenGuias, showStep1 },
    mostrarSoloPaso1,
    mostrarSoloPaso2,
    mostrarPaso1,
    mostrarPaso2,
    existingMasterGuia,
    wizardSteps,
    activeStep,
    step1Completed,
    opcionSeleccionada,
    setOpcionSeleccionada,
    fechaEntrega,
    setFechaEntrega,
    error,
    setError,
    selectedMaster,
    setSelectedMaster,
    searchQuery,
    setSearchQuery,
    mastersDisponibles,
    mastersFiltrados,
    mastersAgrupados,
    primerMaster,
    isLoadingMasters,
    isAsignando: asignarMaster.isPending,
    processing,
    selectedOption,
    handleClose,
    handleNuevaMaster,
    handleAsignarGuia,
    handleConfirm,
  };
}

"use client";

import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { cn } from "@/shared/lib/utils";
import type { ModoSeleccionarDestino, OpcionDestino } from "./destino-model";
import { PasoAsignarGuia } from "./paso-asignar-guia";
import { PasoConfirmarDestino } from "./paso-confirmar-destino";
import { useSeleccionarDestino } from "./use-seleccionar-destino";

interface SeleccionarDestinoModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly options?: OpcionDestino[];
  readonly initialSelection?: string | null;
  readonly title?: string;
  readonly subtitle?: string;
  readonly embarqueId?: string | number | null;
  readonly codFile?: string;
  readonly servicioNombre?: string;
  readonly codEstadoActual?: number;
  readonly existingGuia?: string;
  readonly existingGuiaMaster?: string;
  readonly onConfirm?: (data: Record<string, unknown>) => Promise<void> | void;
  readonly onSuccess?: (data: Record<string, unknown>) => void;
  readonly currentFile?: string;
  readonly modo?: ModoSeleccionarDestino;
}

export function SeleccionarDestinoModal({
  open,
  onClose,
  options = [],
  initialSelection = null,
  title = "Destino de Coordinación",
  subtitle = "",
  embarqueId = null,
  codFile = "",
  servicioNombre = "",
  codEstadoActual = 65,
  existingGuia = "",
  existingGuiaMaster = "",
  onConfirm,
  onSuccess,
  currentFile = "",
  modo = "completo",
}: SeleccionarDestinoModalProps) {
  const destino = useSeleccionarDestino({
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
  });

  const {
    flags,
    mostrarSoloPaso1,
    mostrarSoloPaso2,
    mostrarPaso1,
    mostrarPaso2,
    existingMasterGuia,
    wizardSteps,
    activeStep,
    error,
    setError,
    handleClose,
  } = destino;

  const stepIndexActivo = mostrarSoloPaso2 ? 0 : activeStep;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{title}</DialogTitle>
              {(subtitle || currentFile) && (
                <p className="mt-1 text-xs text-muted-foreground">{subtitle || currentFile}</p>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="px-1">
          {!mostrarSoloPaso1 && (
            <div className="mb-4 flex gap-2">
              {wizardSteps.map((label, index) => (
                <div
                  key={label}
                  className={cn(
                    "flex-1 rounded-md px-3 py-2 text-center text-sm font-medium",
                    (() => {
                      if (index === stepIndexActivo) return "bg-primary text-primary-foreground";
                      if (index < stepIndexActivo) return "bg-primary/20 text-primary";
                      return "bg-muted text-muted-foreground";
                    })(),
                  )}
                >
                  {label}
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="mb-4 flex items-start justify-between gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm">
              <span>{error}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto px-1 py-0"
                onClick={() => setError(null)}
              >
                ✕
              </Button>
            </div>
          )}

          {!flags.showStep1 && !existingMasterGuia && (
            <div className="mb-4 rounded-md border border-yellow-500/50 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-700 dark:text-yellow-400">
              No se puede avanzar al destino porque la guía de coordinación no tiene correlativo de
              guía master.
            </div>
          )}

          {mostrarPaso1 && (
            <PasoAsignarGuia
              flags={flags}
              mastersDisponibles={destino.mastersDisponibles}
              mastersFiltrados={destino.mastersFiltrados}
              mastersAgrupados={destino.mastersAgrupados}
              primerMaster={destino.primerMaster}
              isLoadingMasters={destino.isLoadingMasters}
              isAsignando={destino.isAsignando}
              selectedMaster={destino.selectedMaster}
              onSelectMaster={destino.setSelectedMaster}
              searchQuery={destino.searchQuery}
              onSearchChange={destino.setSearchQuery}
              onNuevaMaster={destino.handleNuevaMaster}
              onAsignar={destino.handleAsignarGuia}
              onCancel={handleClose}
            />
          )}

          {mostrarPaso2 && !mostrarSoloPaso1 && (
            <PasoConfirmarDestino
              options={options}
              existingGuia={existingGuia}
              opcionSeleccionada={destino.opcionSeleccionada}
              onSelectOpcion={destino.setOpcionSeleccionada}
              fechaEntrega={destino.fechaEntrega}
              onFechaEntregaChange={destino.setFechaEntrega}
              selectedOption={destino.selectedOption}
              processing={destino.processing}
              onConfirm={destino.handleConfirm}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

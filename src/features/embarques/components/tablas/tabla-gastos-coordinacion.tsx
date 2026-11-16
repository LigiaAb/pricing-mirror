"use client";

import { useEffect } from "react";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useGastosCoordinacion } from "../../hooks/use-gastos-coordinacion";
import { ServiceAutocomplete } from "./servicio-autocomplete";
import { TablaDue } from "./tabla-due";

interface TablaGastosCoordinacionProps {
  embarqueId?: string | number | null;
  onLoadingChange?: ((loading: boolean) => void) | undefined;
  mostrarAgregarServicio?: boolean;
}

export function TablaGastosCoordinacion({
  embarqueId,
  onLoadingChange,
  mostrarAgregarServicio = true,
}: Readonly<TablaGastosCoordinacionProps>) {
  const gastos = useGastosCoordinacion(embarqueId);

  const { isLoading } = gastos;
  useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

  if (!embarqueId) {
    return null;
  }

  const pagoTypeValue = gastos.selectedPagoType == null ? "" : String(gastos.selectedPagoType);

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {/* DUE AGENT */}
        <div className="md:col-span-8">
          <TablaDue
            titulo="DUE AGENT"
            subtituloParte=""
            entidadNombre="CROPA, S.A."
            colorBarra="#104f9c"
            items={gastos.dueAgentItems}
            mostrarCodTipoPago
            mostrarCosto
            mostrarCabecera
            onRefresh={gastos.handleRefresh}
            refreshDisabled={!embarqueId}
          >
            {mostrarAgregarServicio && (
              <div className="mb-2 flex flex-nowrap items-start gap-1">
                <div className="min-w-0 flex-[1_1_72%]">
                  <ServiceAutocomplete
                    options={gastos.dueAgentServiceOptions}
                    value={gastos.selectedDueAgentService}
                    onValueChange={gastos.setSelectedDueAgentService}
                    onSearchChange={gastos.setDueAgentServiceSearch}
                    searchText={gastos.dueAgentServiceSearch}
                    helperText={gastos.dueAgentServiceHelperText}
                  />
                </div>
                <div className="mt-px w-24.75 shrink-0 self-start">
                  <Select
                    value={pagoTypeValue}
                    onValueChange={(val) => gastos.setSelectedPagoType(Number(val))}
                    disabled={gastos.isPagoTypeReadOnly}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {gastos.pagoTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={String(option.value)}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  size="sm"
                  className="mt-px self-start"
                  disabled={
                    !gastos.selectedDueAgentService ||
                    !embarqueId ||
                    gastos.isAddingDueAgent ||
                    gastos.selectedPagoType == null
                  }
                  onClick={gastos.handleAddDueAgent}
                >
                  {gastos.isAddingDueAgent ? "Añadiendo..." : "Añadir"}
                </Button>
              </div>
            )}
          </TablaDue>
        </div>

        {/* DUE CARRIER */}
        <div className="md:col-span-4">
          <TablaDue
            titulo="DUE CARRIER"
            subtituloParte=""
            entidadNombre={gastos.dueCarrierEntidadNombre}
            colorBarra="#104f9c"
            items={gastos.dueCarrierItems}
            mostrarCodTipoPago
            mostrarCosto
            mostrarCabecera
            onRefresh={gastos.handleRefresh}
            refreshDisabled={!embarqueId}
          />
        </div>
      </div>
    </div>
  );
}

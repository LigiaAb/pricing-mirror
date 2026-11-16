"use client";

import { ChevronRight, Loader2, Search } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { MasterDisponibleCard } from "./destino-cards";
import {
  getAsignarGuiaLabel,
  getResumenGuiasDescription,
  getTituloAsignacion,
  isAsignarGuiaDisabled,
  type MasterAgrupado,
  type MasterDisponibleRow,
  type ServicioFlags,
} from "./destino-model";

interface PasoAsignarGuiaProps {
  readonly flags: ServicioFlags;
  readonly mastersDisponibles: readonly MasterDisponibleRow[];
  readonly mastersFiltrados: readonly MasterDisponibleRow[];
  readonly mastersAgrupados: readonly MasterAgrupado[];
  readonly primerMaster: MasterDisponibleRow | undefined;
  readonly isLoadingMasters: boolean;
  readonly isAsignando: boolean;
  readonly selectedMaster: string;
  readonly onSelectMaster: (guia: string) => void;
  readonly searchQuery: string;
  readonly onSearchChange: (query: string) => void;
  readonly onNuevaMaster: () => void;
  readonly onAsignar: () => void;
  readonly onCancel: () => void;
}

export function PasoAsignarGuia({
  flags,
  mastersDisponibles,
  mastersFiltrados,
  mastersAgrupados,
  primerMaster,
  isLoadingMasters,
  isAsignando,
  selectedMaster,
  onSelectMaster,
  searchQuery,
  onSearchChange,
  onNuevaMaster,
  onAsignar,
  onCancel,
}: PasoAsignarGuiaProps) {
  const { esDirecto, esCourier, esConsolidado, usaResumenGuias } = flags;
  const tituloAsignacion = getTituloAsignacion(esCourier, esDirecto);

  return (
    <div>
      {usaResumenGuias && mastersDisponibles.length > 0 ? (
        <div className="mb-4 rounded-xl border bg-primary/5 p-4">
          <div className="grid gap-4 md:grid-cols-[168px_1fr] md:items-center">
            <div className="flex min-h-32 flex-col items-center justify-center rounded-lg bg-primary text-primary-foreground">
              {isLoadingMasters ? (
                <Loader2 className="size-7 animate-spin" />
              ) : (
                <span className="text-4xl font-semibold leading-none">
                  {mastersDisponibles.length}
                </span>
              )}
              <span className="mt-2 text-xs tracking-widest opacity-90">GUÍAS DISPONIBLES</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-semibold">{tituloAsignacion}</h3>
              <p className="text-sm text-muted-foreground">
                {getResumenGuiasDescription(esDirecto)}
              </p>
              {!isLoadingMasters && mastersFiltrados.length > 0 && (
                <div className="rounded-lg border bg-card px-3 py-2 text-sm">
                  <p className="font-semibold">
                    <span className="text-muted-foreground">Guía:</span>{" "}
                    {primerMaster?.correlativoGuiaMaster || "Guía disponible"}
                  </p>
                  <p className="mt-1 font-semibold">
                    <span className="text-muted-foreground">País destino:</span>{" "}
                    {primerMaster?.paisDestino || "Destino pendiente"}
                  </p>
                  <p className="mt-1 font-semibold">
                    <span className="text-muted-foreground">Línea aérea:</span>{" "}
                    {primerMaster?.lineaAerea || "Pendiente"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <p className="mb-2 text-sm text-muted-foreground">Seleccione la Master</p>
      )}

      {isLoadingMasters && (
        <div className="flex justify-center py-8">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      )}

      {!isLoadingMasters && mastersDisponibles.length === 0 && (
        <div className="mb-4 rounded-md border border-info/50 bg-info/10 px-4 py-3 text-sm">
          {esDirecto || esConsolidado
            ? "No hay Masters disponibles para esta coordinación. Se creará una nueva Master."
            : "No hay guías disponibles para esta coordinación."}
        </div>
      )}

      {!usaResumenGuias && !isLoadingMasters && (
        <div className="mb-2 space-y-2">
          {esConsolidado && (
            <div className="flex justify-end">
              <Button variant="outline" onClick={onNuevaMaster} disabled={isAsignando}>
                Nueva Master
              </Button>
            </div>
          )}

          {mastersDisponibles.length > 0 && (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Buscar guía, file, destino o cliente"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
              </div>

              <div className="max-h-90 space-y-2 overflow-y-auto pr-1">
                {mastersAgrupados.map((group) => (
                  <MasterDisponibleCard
                    key={group.masterGuia}
                    master={group.masterGuia}
                    houses={group.houses}
                    paisDestino={group.paisDestino}
                    cliente={group.cliente}
                    lineaAerea={group.lineaAerea}
                    seleccionado={selectedMaster === group.masterGuia}
                    onClick={() => onSelectMaster(group.masterGuia)}
                  />
                ))}
              </div>

              {mastersAgrupados.length === 0 && (
                <div className="rounded-md border border-info/50 bg-info/10 px-4 py-3 text-sm">
                  No se encontraron guías para la búsqueda.
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div className="mt-4 flex justify-end gap-2 border-t pt-4">
        <Button variant="outline" onClick={onCancel} disabled={isAsignando}>
          Cancelar
        </Button>
        <Button
          variant="success"
          onClick={onAsignar}
          disabled={isAsignarGuiaDisabled({
            isPending: isAsignando,
            isLoadingMasters,
            esConsolidado,
            mastersCount: mastersDisponibles.length,
            selectedMaster,
          })}
        >
          {isAsignando ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ChevronRight className="size-4" />
          )}
          {getAsignarGuiaLabel(isAsignando, esDirecto)}
        </Button>
      </div>
    </div>
  );
}

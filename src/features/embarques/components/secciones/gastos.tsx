"use client";

import { useEffect } from "react";
import { useEmbarqueContext } from "@/features/embarques/components/context";
import { useContextoOperativoStore } from "@/features/shell";
import { BannerInformativo } from "@/shared/components/banner-informativo";
import { TablaGastosCoordinacion } from "../tablas/tabla-gastos-coordinacion";
import { TablaGastosCriterio } from "../tablas/tabla-gastos-criterio";

interface GastosSectionProps {
  readonly onValidityChange?: (valid: boolean) => void;
  readonly onLoadingChange?: ((loading: boolean) => void) | undefined;
  /** CTS (G5): el asesor no agrega servicios DUE Agent desde aquí. */
  readonly mostrarAgregarServicio?: boolean;
}

export function GastosSection({
  onValidityChange,
  onLoadingChange,
  mostrarAgregarServicio = true,
}: GastosSectionProps) {
  const { embarque_id: embarqueId } = useEmbarqueContext();
  const currentCentroCosto = useContextoOperativoStore((state) => state.currentCentroCosto);
  const shouldShowTablaGastosCriterio =
    currentCentroCosto?.nombre_cc?.toString()?.toUpperCase() === "INFORMATICA";

  useEffect(() => {
    if (typeof onValidityChange === "function") {
      onValidityChange(Boolean(embarqueId));
    }
  }, [embarqueId, onValidityChange]);

  return (
    <div className="flex flex-col items-center gap-2 p-2">
      <BannerInformativo
        ocultar={Boolean(embarqueId)}
        severidad="warning"
        titulo="Faltan datos del embarque"
        mensaje="No hay identificador de embarque para cargar gastos."
      />
      <div className="flex w-full justify-center">
        <TablaGastosCoordinacion
          embarqueId={embarqueId}
          onLoadingChange={onLoadingChange}
          mostrarAgregarServicio={mostrarAgregarServicio}
        />
      </div>
      {shouldShowTablaGastosCriterio && (
        <div className="flex w-full justify-center">
          <TablaGastosCriterio embarqueId={embarqueId} />
        </div>
      )}
    </div>
  );
}

"use client";

/**
 * Header del detalle CTS privado (D.7): la info de coordinación se desplaza
 * con el scroll; botonera + aviso + stepper quedan fijos (sticky) siempre
 * visibles. Extraído de `DetalleCtsPage` para mantenerlo bajo el límite de
 * tamaño de archivo.
 */

import { BannerInformativo } from "@/shared/components/banner-informativo";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { InfoCoordinacion } from "../info-coordinacion/info-coordinacion";
import { type StepItem, StepperNav, type StepperNavProps } from "../stepper";
import { BotoneraCts } from "./botonera-cts";
import type { EstadoAvisoPrivado } from "./use-guardar-seccion-privada";

type JsonRecord = Record<string, unknown>;

export function CtsHeader({
  loadingEmbarque,
  embarqueData,
  onRegresar,
  onLinkCliente,
  showLinkCliente,
  isGeneratingLink,
  onCrearCoordinacion,
  isCrearCoordinacionDisabled,
  crearCoordinacionTooltip,
  aviso,
  onCerrarAviso,
  filteredSteps,
  estado,
  stepValidityParaStepper,
  onStepClick,
}: Readonly<{
  loadingEmbarque: boolean;
  embarqueData: JsonRecord;
  onRegresar: () => void;
  onLinkCliente: () => void;
  showLinkCliente: boolean;
  isGeneratingLink: boolean;
  onCrearCoordinacion: () => void;
  isCrearCoordinacionDisabled: boolean;
  crearCoordinacionTooltip: string;
  aviso: EstadoAvisoPrivado | null;
  onCerrarAviso: () => void;
  filteredSteps: (string | StepItem)[];
  estado: number;
  stepValidityParaStepper: NonNullable<StepperNavProps["stepValidity"]>;
  onStepClick: (step: number) => void;
}>) {
  return (
    <>
      <div className="-mt-2 mx-auto w-full max-w-6xl px-4 sm:-mt-4 sm:px-6 lg:-mt-5 lg:px-8">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-3">
            <InfoCoordinacion
              isLoading={loadingEmbarque}
              coordinacion={embarqueData}
              showGuia={false}
            />
          </CardContent>
        </Card>
      </div>

      <div className="sticky top-(--header-height) z-10 -mx-4 space-y-2 border-b border-border/60 bg-background pb-2 pt-2 sm:-mx-6 lg:-mx-8">
        <div className="mx-auto w-full max-w-6xl space-y-2 px-4 sm:px-6 lg:px-8">
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-3">
              <BotoneraCts
                onRegresar={onRegresar}
                onLinkCliente={onLinkCliente}
                showLinkCliente={showLinkCliente}
                isGeneratingLink={isGeneratingLink}
                onCrearCoordinacion={onCrearCoordinacion}
                isCrearCoordinacionDisabled={isCrearCoordinacionDisabled}
                crearCoordinacionTooltip={crearCoordinacionTooltip}
              />
            </CardContent>
          </Card>

          {aviso && (
            <BannerInformativo
              titulo={aviso.tipo === "error" ? "Error al guardar" : "Éxito"}
              mensaje={aviso.mensaje}
              severidad={aviso.tipo}
              acciones={
                <Button variant="ghost" size="sm" onClick={onCerrarAviso}>
                  Cerrar
                </Button>
              }
            />
          )}
        </div>

        <div className="w-full px-4 sm:px-6 lg:px-8">
          <StepperNav
            steps={filteredSteps}
            activeStep={estado}
            stepValidity={stepValidityParaStepper}
            onStepClick={onStepClick}
          />
        </div>
      </div>
    </>
  );
}

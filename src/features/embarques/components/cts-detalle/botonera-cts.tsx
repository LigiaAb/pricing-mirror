"use client";

/**
 * Botonera del detalle CTS (parte del header sticky, D.7): "Regresar" a la
 * izquierda; Link Cliente / Crear Coordinación a la derecha.
 */

import { ArrowLeft, Link, PlusCircle } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";

interface Props {
  readonly onRegresar: () => void;
  readonly onLinkCliente: () => void;
  readonly showLinkCliente: boolean;
  readonly isGeneratingLink: boolean;
  readonly onCrearCoordinacion: () => void;
  readonly isCrearCoordinacionDisabled: boolean;
  readonly crearCoordinacionTooltip: string;
}

export function BotoneraCts({
  onRegresar,
  onLinkCliente,
  showLinkCliente,
  isGeneratingLink,
  onCrearCoordinacion,
  isCrearCoordinacionDisabled,
  crearCoordinacionTooltip,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <Button variant="outline" size="sm" onClick={onRegresar}>
        <ArrowLeft className="size-4" />
        Regresar
      </Button>
      <div className="flex flex-wrap gap-2">
        {showLinkCliente && (
          <Button variant="outline" size="sm" onClick={onLinkCliente} disabled={isGeneratingLink}>
            <Link className="size-4" />
            Link Cliente
          </Button>
        )}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  variant="default"
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={onCrearCoordinacion}
                  disabled={isCrearCoordinacionDisabled}
                >
                  <PlusCircle className="size-4" />
                  Crear Coordinación
                </Button>
              </span>
            </TooltipTrigger>
            {isCrearCoordinacionDisabled && (
              <TooltipContent>
                <p>{crearCoordinacionTooltip}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

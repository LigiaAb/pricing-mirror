"use client";

import { Loader2 } from "lucide-react";
import React from "react";

import { useCatalogosCotizacion } from "../hooks/use-catalogos-cotizacion";
import { useEstadosCotizacion } from "../hooks/use-estados-cotizacion";
import { CalculoCotizacion } from "./calculo-cotizacion";

type CalculoCotizacionProps = React.ComponentProps<typeof CalculoCotizacion>;

type Props = Omit<CalculoCotizacionProps, "cotizacion" | "filtrosCalculo"> & {
  /**
   * Opcionales solo para poder montar el container durante desarrollo
   * sin provocar un error de runtime. CalculoCotizacion NO se monta
   * hasta que exista la cotización.
   */
  cotizacion?: CalculoCotizacionProps["cotizacion"];
  filtrosCalculo?: CalculoCotizacionProps["filtrosCalculo"];
};

/**
 * Espera a que estén los catálogos, los estados y la cotización antes de montar el cálculo.
 * Los catálogos ya no se pasan por props: CalculoCotizacion los lee con
 * `useCatalogosCotizacion()`.
 */
export function CalculoCotizacionContainer({ cotizacion, filtrosCalculo, ...props }: Props) {
  const { isLoading } = useCatalogosCotizacion();
  const { estados, isLoading: cargandoEstados, faltantes } = useEstadosCotizacion();

  if (isLoading || cargandoEstados) {
    return (
      <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Cargando catálogos...
      </div>
    );
  }

  /*
   * Todo lo que está dentro del cálculo usa useEstadosCalculo(), que exige
   * los estados completos. Si faltan, se avisa aquí en lugar de romper la pantalla.
   */
  if (estados == null) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-sm">
        <p className="font-semibold">Catálogo de estados incompleto</p>

        <p className="mt-1 text-muted-foreground">
          No se puede iniciar el cálculo porque no se encontraron estos estados: {faltantes.join(", ")}.
        </p>
      </div>
    );
  }

  if (cotizacion == null) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
        Selecciona una cotización para iniciar el cálculo.
      </div>
    );
  }

  if (filtrosCalculo == null) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
        Falta conectar filtrosCalculo antes de iniciar el cálculo de la cotización.
      </div>
    );
  }

  return <CalculoCotizacion {...props} cotizacion={cotizacion} filtrosCalculo={filtrosCalculo} />;
}

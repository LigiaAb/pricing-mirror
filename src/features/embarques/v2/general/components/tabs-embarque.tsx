"use client";

import { Check } from "lucide-react";
import type * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { cn } from "@/shared/lib/utils";
import { useOperacion } from "../../shared/components/operacion-context";
import type { DefinicionOperacion, PasoEmbarque } from "../../shared/lib/operacion";
import type { EmbarqueMaqueta, PerfilEmbarque } from "../../shared/lib/tipos";
import { pasoDeTab, pasosDelPerfil, puedeEditarInformacion } from "../lib/pasos";
import { PasoActividades } from "./pasos/paso-actividades";
import { PasoArchivos } from "./pasos/paso-archivos";
import { PasoBitacora } from "./pasos/paso-bitacora";
import { PasoInformacion } from "./pasos/paso-informacion";

/**
 * Contenido de la tab: Información y Archivos (lista del embarque, solo
 * consulta y descarga) tienen su propio componente; las demás usan la tab genérica de actividades,
 * que muestra el formulario de cada actor.
 */
function contenidoPaso(
  paso: PasoEmbarque,
  embarque: EmbarqueMaqueta,
  perfil: PerfilEmbarque,
): React.ReactNode {
  switch (paso.value) {
    case "informacion":
      return <PasoInformacion embarque={embarque} editable={puedeEditarInformacion(perfil)} />;
    case "archivos":
      return <PasoArchivos paso={paso} embarque={embarque} />;
    case "bitacora":
      return <PasoBitacora paso={paso} embarque={embarque} />;
    default:
      return (
        <PasoActividades
          paso={paso}
          pasoActual={embarque.pasoActual}
          servicio={embarque.servicio}
          perfil={perfil}
        />
      );
  }
}

function TriggerPaso({ paso, pasoActual }: { paso: PasoEmbarque; pasoActual: number }) {
  const Icono = paso.icono;
  const operacion = useOperacion();
  const pasoTracking = pasoDeTab(operacion, paso);
  const completado = pasoTracking != null && pasoTracking < pasoActual;
  const actual = pasoTracking != null && pasoTracking === pasoActual;

  return (
    <TabsTrigger
      value={paso.value}
      className={cn("w-full gap-2", paso.destructiva && "text-destructive")}
    >
      <Icono className="size-5 shrink-0" aria-hidden="true" />

      <div className="flex w-full flex-wrap">
        <span className="text-left">{paso.label}</span>
        <span className="w-full text-left text-[9px]">{paso.detalle}</span>
      </div>

      {completado ? (
        <Check className="size-4 shrink-0 text-primary" aria-label="Completado" />
      ) : null}
      {actual ? (
        <span
          className="size-2 shrink-0 rounded-full bg-primary"
          role="img"
          aria-label="Paso actual"
        />
      ) : null}
    </TabsTrigger>
  );
}

/** Tabs del flujo agrupadas por paso del tracking (las sin paso van primero). */
function gruposPorPaso(operacion: DefinicionOperacion, pasos: readonly PasoEmbarque[]) {
  const sinPaso = pasos.filter((paso) => pasoDeTab(operacion, paso) == null);
  const grupos = operacion.pasos
    .map((tracking) => ({
      tracking,
      pasos: pasos.filter((paso) => pasoDeTab(operacion, paso) === tracking.id),
    }))
    .filter((grupo) => grupo.pasos.length > 0);
  return { sinPaso, grupos };
}

/**
 * Tabs verticales de gestión del embarque (mismo patrón que `TarifasTabs`).
 * Los pasos visibles dependen del perfil (Operaciones, Bodegas, Combex).
 */
export function TabsEmbarque({
  embarque,
  perfil,
  value,
  onValueChange,
}: {
  embarque: EmbarqueMaqueta;
  perfil: PerfilEmbarque;
  value: string;
  onValueChange: (value: string) => void;
}) {
  const operacion = useOperacion();
  const pasos = pasosDelPerfil(operacion, perfil);
  const { sinPaso, grupos } = gruposPorPaso(
    operacion,
    pasos.filter((paso) => paso.grupo === "flujo"),
  );
  const extra = pasos.filter((paso) => paso.grupo === "extra");

  return (
    <Tabs className="flex flex-col gap-2 md:flex-row" value={value} onValueChange={onValueChange}>
      <TabsList className="h-auto w-full flex-col justify-start md:w-60 md:shrink-0">
        {sinPaso.map((paso) => (
          <TriggerPaso key={paso.value} paso={paso} pasoActual={embarque.pasoActual} />
        ))}

        {grupos.map(({ tracking, pasos: delPaso }) => (
          <div key={tracking.id} className="flex w-full flex-col">
            <span
              className={cn(
                "mt-2 px-2 pb-1 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground",
                tracking.id === embarque.pasoActual && "text-primary",
              )}
              title={tracking.titulo}
            >
              {tracking.id} · {tracking.corto}
            </span>
            {delPaso.map((paso) => (
              <TriggerPaso key={paso.value} paso={paso} pasoActual={embarque.pasoActual} />
            ))}
          </div>
        ))}

        {extra.length > 0 ? (
          <div className="my-1 h-px w-full bg-border" aria-hidden="true" />
        ) : null}

        {extra.map((paso) => (
          <TriggerPaso key={paso.value} paso={paso} pasoActual={embarque.pasoActual} />
        ))}
      </TabsList>

      {pasos.map((paso) => (
        <TabsContent key={paso.value} value={paso.value} className="min-w-0 grow p-4">
          {contenidoPaso(paso, embarque, perfil)}
        </TabsContent>
      ))}
    </Tabs>
  );
}

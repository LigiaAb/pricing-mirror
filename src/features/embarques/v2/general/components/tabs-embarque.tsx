"use client";

import {
  Ban,
  Check,
  ClipboardList,
  FileStack,
  FileText,
  FolderUp,
  Landmark,
  type LucideIcon,
  PackageCheck,
  PlaneLanding,
  PlaneTakeoff,
  Receipt,
  Scale,
  Send,
  Ship,
  Tags,
  Truck,
  Warehouse,
} from "lucide-react";
import type * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { cn } from "@/shared/lib/utils";
import {
  type PasoEmbarque,
  pasoDeTab,
  pasosDelPerfil,
  TRACKING_PASOS,
  type ValorPasoEmbarque,
} from "../lib/pasos";
import type { EmbarqueMaqueta, PerfilEmbarque } from "../lib/tipos";
import { PasoActividades } from "./pasos/paso-actividades";
import { PasoDocumentos } from "./pasos/paso-documentos";
import { PasoInformacion } from "./pasos/paso-informacion";

const ICONOS: Record<ValorPasoEmbarque, LucideIcon> = {
  informacion: ClipboardList,
  recoleccion: Truck,
  guias: Tags,
  reservas: Ship,
  draft: FileText,
  aduana: Landmark,
  "recepcion-bodega": Warehouse,
  "despacho-bodega": PackageCheck,
  combex: Scale,
  "guia-final": Send,
  tarifas: Receipt,
  "documentacion-final": FileStack,
  salida: PlaneTakeoff,
  complementaria: FileText,
  cierre: PlaneLanding,
  documentos: FolderUp,
  cancelacion: Ban,
};

/**
 * Contenido de la tab: Información y Documentos tienen su propio componente;
 * las demás usan la tab genérica de actividades.
 */
function contenidoPaso(paso: PasoEmbarque, embarque: EmbarqueMaqueta): React.ReactNode {
  switch (paso.value) {
    case "informacion":
      return <PasoInformacion embarque={embarque} />;
    case "documentos":
      return <PasoDocumentos />;
    default:
      return <PasoActividades paso={paso} pasoActual={embarque.pasoActual} />;
  }
}

function TriggerPaso({ paso, pasoActual }: { paso: PasoEmbarque; pasoActual: number }) {
  const Icono = ICONOS[paso.value];
  const pasoTracking = pasoDeTab(paso);
  const completado = pasoTracking != null && pasoTracking < pasoActual;
  const actual = pasoTracking != null && pasoTracking === pasoActual;

  return (
    <TabsTrigger
      value={paso.value}
      className={cn("w-full gap-2", paso.value === "cancelacion" && "text-destructive")}
    >
      <Icono className="size-5 shrink-0" aria-hidden="true" />

      <div className="flex w-full flex-wrap">
        <span className="text-left">{paso.label}</span>
        <span className="w-full text-left text-[9px]">
          {paso.detalle}
          {paso.actividades.length > 0 ? ` · ${paso.actividades.length}` : ""}
        </span>
      </div>

      {completado ? <Check className="size-4 shrink-0 text-primary" aria-label="Completado" /> : null}
      {actual ? (
        <span className="size-2 shrink-0 rounded-full bg-primary" role="img" aria-label="Paso actual" />
      ) : null}
    </TabsTrigger>
  );
}

/** Tabs del flujo agrupadas por paso del tracking (las sin paso van primero). */
function gruposPorPaso(pasos: readonly PasoEmbarque[]) {
  const sinPaso = pasos.filter((paso) => pasoDeTab(paso) == null);
  const grupos = TRACKING_PASOS.map((tracking) => ({
    tracking,
    pasos: pasos.filter((paso) => pasoDeTab(paso) === tracking.id),
  })).filter((grupo) => grupo.pasos.length > 0);
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
  value: ValorPasoEmbarque;
  onValueChange: (value: ValorPasoEmbarque) => void;
}) {
  const pasos = pasosDelPerfil(perfil);
  const { sinPaso, grupos } = gruposPorPaso(pasos.filter((paso) => paso.grupo === "flujo"));
  const extra = pasos.filter((paso) => paso.grupo === "extra");

  return (
    <Tabs
      className="flex flex-col gap-2 md:flex-row"
      value={value}
      onValueChange={(nuevo: string) => onValueChange(nuevo as ValorPasoEmbarque)}
    >
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

        {extra.length > 0 ? <div className="my-1 h-px w-full bg-border" aria-hidden="true" /> : null}

        {extra.map((paso) => (
          <TriggerPaso key={paso.value} paso={paso} pasoActual={embarque.pasoActual} />
        ))}
      </TabsList>

      {pasos.map((paso) => (
        <TabsContent key={paso.value} value={paso.value} className="min-w-0 grow p-4">
          {contenidoPaso(paso, embarque)}
        </TabsContent>
      ))}
    </Tabs>
  );
}

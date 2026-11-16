"use client";

import {
  Ban,
  Check,
  ClipboardList,
  FileText,
  FolderUp,
  type LucideIcon,
  Receipt,
  Ship,
  Tags,
} from "lucide-react";
import type * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { cn } from "@/shared/lib/utils";
import { actividadesPorId } from "../lib/actividades-tracking";
import {
  type PasoEmbarque,
  pasoDeTab,
  pasosDelPerfil,
  TRACKING_PASOS,
  type ValorPasoEmbarque,
} from "../lib/pasos";
import type { EmbarqueMaqueta, PerfilEmbarque } from "../lib/tipos";
import { ListaActividades } from "./actividades-tracking";
import { PasoCancelacion } from "./pasos/paso-cancelacion";
import { PasoDocumentos } from "./pasos/paso-documentos";
import { PasoDraft } from "./pasos/paso-draft";
import { PasoGuias } from "./pasos/paso-guias";
import { PasoInformacion } from "./pasos/paso-informacion";
import { PasoReservas } from "./pasos/paso-reservas";
import { PasoTarifas } from "./pasos/paso-tarifas";

const ICONOS: Record<ValorPasoEmbarque, LucideIcon> = {
  informacion: ClipboardList,
  guias: Tags,
  reservas: Ship,
  draft: FileText,
  tarifas: Receipt,
  documentos: FolderUp,
  cancelacion: Ban,
};

function contenidoPaso(valor: ValorPasoEmbarque, embarque: EmbarqueMaqueta): React.ReactNode {
  switch (valor) {
    case "informacion":
      return <PasoInformacion embarque={embarque} />;
    case "guias":
      return <PasoGuias />;
    case "reservas":
      return <PasoReservas />;
    case "draft":
      return <PasoDraft />;
    case "tarifas":
      return <PasoTarifas />;
    case "documentos":
      return <PasoDocumentos />;
    case "cancelacion":
      return <PasoCancelacion />;
  }
}

function TriggerPaso({ paso, pasoActual }: { paso: PasoEmbarque; pasoActual: number }) {
  const Icono = ICONOS[paso.value];
  const pasoTracking = pasoDeTab(paso);
  const completado = pasoTracking != null && pasoTracking < pasoActual;

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
          {pasoTracking == null ? "" : ` · Paso ${pasoTracking}`}
        </span>
      </div>

      {completado ? (
        <Check className="size-4 shrink-0 text-primary" aria-label="Completado" />
      ) : null}
    </TabsTrigger>
  );
}

/** Actividades del Excel que se trabajan en la tab (si tiene). */
function ActividadesDeTab({ paso }: { paso: PasoEmbarque }) {
  const actividades = actividadesPorId(paso.actividades);
  if (actividades.length === 0) return null;

  const pasoTracking = actividades[0]?.paso;
  const nombrePaso = TRACKING_PASOS.find((item) => item.id === pasoTracking)?.titulo ?? "";

  return (
    <section className="mt-6 space-y-2">
      <h4 className="text-sm font-semibold">
        Actividades del tracking
        <span className="ml-2 text-xs font-normal text-muted-foreground">
          Paso {pasoTracking} · {nombrePaso}
        </span>
      </h4>
      <ListaActividades actividades={actividades} />
    </section>
  );
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
  const flujo = pasos.filter((paso) => paso.grupo === "flujo");
  const extra = pasos.filter((paso) => paso.grupo === "extra");

  return (
    <Tabs
      className="flex flex-col gap-2 md:flex-row"
      value={value}
      onValueChange={(nuevo: string) => onValueChange(nuevo as ValorPasoEmbarque)}
    >
      <TabsList className="h-auto w-full flex-col justify-start md:w-56 md:shrink-0">
        {flujo.map((paso) => (
          <TriggerPaso key={paso.value} paso={paso} pasoActual={embarque.pasoActual} />
        ))}

        {extra.length > 0 ? <div className="my-1 h-px w-full bg-border" aria-hidden="true" /> : null}

        {extra.map((paso) => (
          <TriggerPaso key={paso.value} paso={paso} pasoActual={embarque.pasoActual} />
        ))}
      </TabsList>

      {pasos.map((paso) => (
        <TabsContent key={paso.value} value={paso.value} className="min-w-0 grow p-4">
          {contenidoPaso(paso.value, embarque)}
          <ActividadesDeTab paso={paso} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

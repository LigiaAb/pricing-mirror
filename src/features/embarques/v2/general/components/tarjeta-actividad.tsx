"use client";

import {
  Activity,
  BadgeCheck,
  Camera,
  ClipboardPen,
  FileText,
  Link2,
  type LucideIcon,
  Mail,
  Paperclip,
  Scale,
  ShieldCheck,
  ShoppingCart,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { type ActividadTracking, actividadesPorId } from "../lib/actividades-tracking";
import { accionDe, camposDe, gestionDe } from "../lib/gestion-actividades";
import type { CampoGestion, TipoInteraccion } from "../lib/interacciones";
import { EtiquetaTipo } from "./actividades-tracking";
import { CampoMaqueta, Dato, Pendiente } from "./utils";

/* ==========================================================================
 * TARJETA DE UNA ACTIVIDAD (SOLO MAQUETA)
 *
 * Misma estructura para las 69 actividades del Excel; cambia según el tipo
 * de interacción (`lib/interacciones.ts`) y los campos de la actividad
 * (`lib/gestion-actividades.ts`):
 *
 *   encabezado: icono · código · actividad · responsable · tipo del Excel · estado
 *   cuerpo:     entrada · actividades previas · comparación · campos
 *   pie:        control del Excel · resultado · botón de la acción
 *
 * El tipo de interacción es interno: no se muestra su nombre al usuario.
 * ========================================================================== */

export const ICONO_INTERACCION: Record<TipoInteraccion, LucideIcon> = {
  formulario: ClipboardPen,
  "dato-especial": Scale,
  confirmacion: BadgeCheck,
  notificacion: Mail,
  "orden-compra": ShoppingCart,
  documento: FileText,
  evidencia: Camera,
  seguimiento: Activity,
  incidencia: TriangleAlert,
};

export type EstadoActividad = "hecha" | "en-curso" | "pendiente" | "si-ocurre";

const ESTADO: Record<EstadoActividad, { label: string; clase: string }> = {
  hecha: { label: "Hecha", clase: "bg-primary text-primary-foreground" },
  "en-curso": { label: "En curso", clase: "border border-primary text-primary" },
  pendiente: { label: "Pendiente", clase: "bg-muted text-muted-foreground" },
  "si-ocurre": { label: "Solo si aplica", clase: "border border-amber-500/40 text-amber-800 dark:text-amber-200" },
};

/** Estado de maqueta: sale del paso del embarque (sin datos reales todavía). */
export function estadoActividad(actividad: ActividadTracking, pasoActual: number): EstadoActividad {
  if (actividad.tipo === "Excepción") return "si-ocurre";
  if (actividad.paso < pasoActual) return "hecha";
  if (actividad.paso === pasoActual) return "en-curso";
  return "pendiente";
}

function idCampo(actividad: ActividadTracking, campo: CampoGestion): string {
  const slug = campo.label
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${actividad.id.replace(/\s+/g, "-").toLowerCase()}-${slug}`;
}

/** Un campo de la actividad según su tipo (solo lectura, sin lógica). */
function CampoActividad({ actividad, campo }: { actividad: ActividadTracking; campo: CampoGestion }) {
  const id = idCampo(actividad, campo);
  const tipo = campo.tipo ?? "texto";
  const etiqueta = `${campo.label}${campo.requerido ? " *" : ""}`;

  if (tipo === "archivo") {
    return (
      <div className="flex flex-col gap-1 sm:col-span-2">
        <span className="text-sm font-medium">{etiqueta}</span>
        <div className="flex items-center gap-2 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
          <Paperclip className="size-4 text-primary" aria-hidden="true" />
          Arrastrar archivos aquí o seleccionar
        </div>
      </div>
    );
  }

  if (tipo === "area") {
    return (
      <label htmlFor={id} className="flex flex-col gap-1 sm:col-span-2">
        <span className="text-sm font-medium">{etiqueta}</span>
        <textarea
          id={id}
          readOnly
          rows={2}
          placeholder={campo.label}
          className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm"
        />
      </label>
    );
  }

  const tipoInput = {
    texto: "text",
    seleccion: "text",
    numero: "number",
    fecha: "date",
    "fecha-hora": "datetime-local",
  } as const;

  return (
    <CampoMaqueta
      id={id}
      label={campo.label}
      tipo={tipoInput[tipo]}
      requerido={campo.requerido ?? false}
    />
  );
}

export function TarjetaActividad({
  actividad,
  pasoActual,
}: {
  actividad: ActividadTracking;
  pasoActual: number;
}) {
  const gestion = gestionDe(actividad.id);
  const Icono = ICONO_INTERACCION[gestion.interaccion];
  const estado = ESTADO[estadoActividad(actividad, pasoActual)];
  const requiere = actividadesPorId(gestion.requiere ?? []);
  const excepcion = gestion.interaccion === "incidencia";

  return (
    <article
      className={cn(
        "overflow-hidden rounded-lg border bg-card",
        excepcion && "border-amber-500/40",
      )}
    >
      {/* Encabezado */}
      <header
        className={cn(
          "flex flex-wrap items-start gap-3 border-b px-4 py-3",
          excepcion ? "bg-amber-500/10" : "bg-muted/40",
        )}
      >
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            excepcion ? "bg-amber-500/20 text-amber-800 dark:text-amber-200" : "bg-primary/10 text-primary",
          )}
        >
          <Icono className="size-5" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded border px-1 font-mono text-[10px] text-muted-foreground">
              {actividad.id}
            </span>
            <h5 className="text-sm font-semibold">{actividad.actividad}</h5>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
            <span>Responsable: {actividad.responsable}</span>
            <EtiquetaTipo tipo={actividad.tipo} />
          </div>
        </div>

        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", estado.clase)}>
          {estado.label}
        </span>
      </header>

      {/* Cuerpo */}
      <div className="space-y-3 p-4">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Entrada:</span> {actividad.entrada}
        </p>

        {requiere.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
            <Link2 className="size-3.5" aria-hidden="true" />
            Antes:
            {requiere.map((previa) => (
              <span key={previa.id} className="rounded border px-1.5" title={`${previa.responsable} ${previa.codigo}`}>
                {previa.actividad}
              </span>
            ))}
          </div>
        ) : null}

        {gestion.compara ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Dato label={gestion.compara} valor="—" />
            <Dato label="Actual" valor="—" />
            <Dato label="Diferencia" valor="—" />
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {camposDe(gestion).map((campo) => (
            <CampoActividad key={campo.label} actividad={actividad} campo={campo} />
          ))}
        </div>

        {gestion.pendiente ? <Pendiente texto={gestion.pendiente} /> : null}
      </div>

      {/* Pie */}
      <footer className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-2">
        <div className="space-y-0.5 text-[11px] text-muted-foreground">
          <p className="flex items-center gap-1">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            Control: {actividad.control}
          </p>
          <p>Resultado: {actividad.resultado}</p>
        </div>
        <Button type="button" size="sm" variant={excepcion ? "outline" : "default"} disabled>
          <Icono className="size-4" aria-hidden="true" />
          {accionDe(gestion)}
        </Button>
      </footer>
    </article>
  );
}

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
  Route,
  Scale,
  ShieldCheck,
  ShoppingCart,
  TriangleAlert,
} from "lucide-react";
import { createContext, type ReactNode, use } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { type ActividadTracking, actividadesPorId } from "../lib/actividades-tracking";
import { accionDe, camposDe, type GestionActividad } from "../lib/gestion-actividades";
import type { CampoGestion, TipoInteraccion } from "../lib/interacciones";
import { EtiquetaTipo } from "./actividades-tracking";
import { CampoPorTipo } from "./campos";
import { Dato, Pendiente, SoloConsulta } from "./utils";

/* ==========================================================================
 * TARJETA DE UNA ACTIVIDAD (SOLO MAQUETA)
 *
 * Misma estructura para las 69 actividades del Excel; cambia según el tipo
 * de interacción (`lib/interacciones.ts`) y los campos de la actividad
 * (`<actor>/lib/gestion-actividades.ts`):
 *
 *   encabezado: icono · código · actividad · responsable · tipo del Excel · estado
 *   cuerpo:     entrada · actividades previas · comparación · campos
 *   pie:        control del Excel · resultado · botón de la acción
 *
 * El tipo de interacción es interno: no se muestra su nombre al usuario.
 *
 * Plegable (acordeón): el encabezado abre/cierra cuerpo y pie. Abre por
 * defecto solo la actividad "En curso" y editable; el resto queda plegado
 * para ahorrar espacio.
 *
 * `editable = false` (actividad de otra área): mismos datos en solo consulta,
 * sin campos de captura ni botón.
 *
 * La tarjeta es común; cada actor la usa con sus definiciones desde su carpeta
 * (`operaciones/`, `bodegas/`, `combex/` → `components/actividad-<actor>.tsx`).
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

/**
 * Abre el Sheet del tracking interactivo (lo da `VistaGeneral`). Las actividades
 * con archivos muestran un botón "Tracking" (copia del de la franja del
 * embarque) para subirlos ahí (#128). Sin provider, no hay botón.
 */
export const AbrirTrackingContext = createContext<(() => void) | null>(null);

export type EstadoActividad = "hecha" | "en-curso" | "pendiente" | "si-ocurre";

const ESTADO: Record<EstadoActividad, { label: string; clase: string }> = {
  hecha: { label: "Hecha", clase: "bg-primary text-primary-foreground" },
  "en-curso": { label: "En curso", clase: "border border-primary text-primary" },
  pendiente: { label: "Pendiente", clase: "bg-muted text-muted-foreground" },
  "si-ocurre": {
    label: "Solo si aplica",
    clase: "border border-amber-500/40 text-amber-800 dark:text-amber-200",
  },
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

/** Valor registrado de un campo, en solo consulta (sin datos todavía). */
function ValorCampo({ campo }: { campo: CampoGestion }) {
  const ancho =
    campo.tipo === "area" ||
    campo.tipo === "archivo" ||
    campo.tipo === "fecha-hora" ||
    campo.tipo === "casillas";
  return (
    <div className={cn(ancho && "sm:col-span-2")}>
      <Dato label={campo.label} valor={campo.tipo === "archivo" ? "Sin archivos" : "—"} />
    </div>
  );
}

/** Props del formulario de una actividad (lo que cada actor recibe de la tab). */
export type PropsActividad = {
  actividad: ActividadTracking;
  pasoActual: number;
  editable: boolean;
  /** Servicio del embarque por nombre (ej. "CONSOLIDADO"); define reglas como la de guías. */
  servicio: string;
};

export function TarjetaActividad({
  actividad,
  pasoActual,
  editable,
  gestion,
  antesDeCampos,
}: PropsActividad & {
  /** Cómo se trabaja la actividad (definiciones del actor). */
  gestion: GestionActividad;
  /** Control propio del actor antes de los campos (ej. formato de reserva de OPS 2.1). */
  antesDeCampos?: ReactNode;
}) {
  const Icono = ICONO_INTERACCION[gestion.interaccion];
  const estado = ESTADO[estadoActividad(actividad, pasoActual)];
  const requiere = actividadesPorId(gestion.requiere ?? []);
  const excepcion = gestion.interaccion === "incidencia";
  const abrirTracking = use(AbrirTrackingContext);
  const conArchivos = camposDe(gestion).some((campo) => campo.tipo === "archivo");
  const abierta =
    editable &&
    estadoActividad(actividad, pasoActual) === "en-curso" &&
    actividad.tipo !== "Opcional";

  return (
    <Accordion type="single" collapsible {...(abierta ? { defaultValue: actividad.id } : {})}>
      <AccordionItem
        value={actividad.id}
        className={cn(
          "overflow-hidden rounded-lg border bg-card last:border-b",
          excepcion && "border-amber-500/40",
        )}
      >
        {/* Encabezado (abre/cierra la tarjeta) */}
        <AccordionTrigger
          className={cn(
            "items-start gap-3 rounded-none px-4 py-3 text-left hover:no-underline data-[state=open]:border-b",
            excepcion ? "bg-amber-500/10 hover:bg-amber-500/30" : "bg-muted/40 hover:bg-muted/90",
          )}
        >
          <span className="flex min-w-0 flex-1 flex-wrap items-start gap-3">
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-lg",
                excepcion
                  ? "bg-amber-500/20 text-amber-800 dark:text-amber-200"
                  : "bg-primary/10 text-primary",
              )}
            >
              <Icono className="size-5" aria-hidden="true" />
            </span>

            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="flex flex-wrap items-center gap-1.5">
                <span className="rounded border px-1 font-mono text-[10px] text-muted-foreground">
                  {actividad.id}
                </span>
                <span className="text-sm font-semibold">{actividad.actividad}</span>
              </span>
              <span className="flex flex-wrap items-center gap-1.5 text-[11px] font-normal text-muted-foreground">
                <span>Responsable: {actividad.responsable}</span>
                <EtiquetaTipo tipo={actividad.tipo} />
              </span>
            </span>

            <span className="flex flex-wrap items-center gap-1.5">
              {editable ? null : <SoloConsulta />}
              <span
                className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", estado.clase)}
              >
                {estado.label}
              </span>
            </span>
          </span>
        </AccordionTrigger>

        <AccordionContent className="pb-0">
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
                  <span
                    key={previa.id}
                    className="rounded border px-1.5"
                    title={`${previa.responsable} ${previa.codigo}`}
                  >
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

            {editable ? antesDeCampos : null}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {camposDe(gestion).map((campo) =>
                editable ? (
                  <CampoPorTipo key={campo.label} id={idCampo(actividad, campo)} campo={campo} />
                ) : (
                  <ValorCampo key={campo.label} campo={campo} />
                ),
              )}
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
            {editable ? (
              <div className="flex flex-wrap items-center gap-2">
                {abrirTracking && conArchivos ? (
                  <Button type="button" size="sm" variant="outline" onClick={abrirTracking}>
                    <Route className="size-4" aria-hidden="true" />
                    Tracking
                  </Button>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  variant={excepcion ? "outline" : "default"}
                  disabled
                >
                  <Icono className="size-4" aria-hidden="true" />
                  {accionDe(gestion)}
                </Button>
              </div>
            ) : null}
          </footer>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

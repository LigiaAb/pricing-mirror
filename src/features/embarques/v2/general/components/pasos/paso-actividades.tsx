"use client";

import { AlertTriangle, ChevronDown } from "lucide-react";
import type { ActividadTracking } from "../../lib/actividades-tracking";
import {
  actividadesDelPerfil,
  type PasoEmbarque,
  pasoDeTab,
  puedeEditar,
  TRACKING_PASOS,
} from "../../lib/pasos";
import type { PerfilEmbarque } from "../../lib/tipos";
import { TarjetaActividad } from "../tarjeta-actividad";
import { EncabezadoPaso } from "../utils";

/* ==========================================================================
 * TAB GENÉRICA DE ACTIVIDADES (SOLO MAQUETA)
 *
 * Todas las tabs con actividades del Excel se ven igual:
 *   1. Encabezado (título, descripción y paso del tracking).
 *   2. Aviso (si la tab lo define).
 *   3. Actividades del flujo agrupadas por proceso, en el orden de la tab.
 *   4. Excepciones aparte, plegadas (solo se usan si ocurren).
 *
 * Según el perfil: Operaciones ve todas las actividades (edita solo las de
 * OPS); Bodegas y Combex ven solo las de su área.
 * ========================================================================== */

/** Agrupa actividades consecutivas con el mismo proceso. */
function porProceso(actividades: readonly ActividadTracking[]) {
  const grupos: { proceso: string; actividades: ActividadTracking[] }[] = [];
  for (const actividad of actividades) {
    const ultimo = grupos.at(-1);
    if (ultimo?.proceso === actividad.proceso) ultimo.actividades.push(actividad);
    else grupos.push({ proceso: actividad.proceso, actividades: [actividad] });
  }
  return grupos;
}

export function PasoActividades({
  paso,
  pasoActual,
  perfil,
}: {
  paso: PasoEmbarque;
  pasoActual: number;
  perfil: PerfilEmbarque;
}) {
  const actividades = actividadesDelPerfil(paso, perfil);
  const flujo = actividades.filter((actividad) => actividad.tipo !== "Excepción");
  const excepciones = actividades.filter((actividad) => actividad.tipo === "Excepción");
  const pasoTracking = pasoDeTab(paso) ?? actividades[0]?.paso;
  const nombrePaso = TRACKING_PASOS.find((item) => item.id === pasoTracking)?.titulo;

  return (
    <div className="space-y-4">
      <EncabezadoPaso titulo={paso.label} descripcion={paso.descripcion} />

      {nombrePaso ? (
        <p className="text-xs text-muted-foreground">
          Paso {pasoTracking} del tracking · {nombrePaso} · {actividades.length}{" "}
          {actividades.length === 1 ? "actividad" : "actividades"}
        </p>
      ) : null}

      {paso.aviso ? (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-amber-800 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <p className="text-sm">{paso.aviso}</p>
        </div>
      ) : null}

      {porProceso(flujo).map((grupo) => (
        <section key={grupo.proceso} className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {grupo.proceso}
          </h4>
          {grupo.actividades.map((actividad) => (
            <TarjetaActividad
              key={actividad.id}
              actividad={actividad}
              pasoActual={pasoActual}
              editable={puedeEditar(actividad, perfil)}
            />
          ))}
        </section>
      ))}

      {excepciones.length > 0 ? (
        <details
          open={flujo.length === 0}
          className="group space-y-2 rounded-lg border border-amber-500/40 p-3"
        >
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-200">
            <AlertTriangle className="size-4" aria-hidden="true" />
            Excepciones ({excepciones.length})
            <span className="text-xs font-normal text-muted-foreground">Solo si aplican</span>
            <ChevronDown
              className="ml-auto size-4 transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <div className="space-y-2 pt-2">
            {excepciones.map((actividad) => (
              <TarjetaActividad
              key={actividad.id}
              actividad={actividad}
              pasoActual={pasoActual}
              editable={puedeEditar(actividad, perfil)}
            />
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}

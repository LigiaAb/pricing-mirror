"use client";

import { AlertTriangle } from "lucide-react";
import type * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { ActividadBodegas } from "../../../bodegas/components/actividad-bodegas";
import { ActividadCombex } from "../../../combex/components/actividad-combex";
import { ActividadOperaciones } from "../../../operaciones/components/actividad-operaciones";
import type { PropsActividad } from "../../../shared/components/tarjeta-actividad";
import { EncabezadoPaso } from "../../../shared/components/utils";
import type { ActividadTracking, TipoActividad } from "../../../shared/lib/actividades-tracking";
import type { PerfilEmbarque, ResponsableTracking } from "../../../shared/lib/tipos";
import {
  actividadesDelPerfil,
  type PasoEmbarque,
  pasoDeTab,
  puedeEditar,
  TRACKING_PASOS,
} from "../../lib/pasos";

/* ==========================================================================
 * TAB GENÉRICA DE ACTIVIDADES (SOLO MAQUETA)
 *
 * Todas las tabs con actividades del Excel se ven igual:
 *   1. Encabezado (título, descripción y paso del tracking).
 *   2. Aviso (si la tab lo define).
 *   3. Tabs horizontales por tipo de actividad del Excel (Principal, Opcional,
 *      Condicional, Transversal, Excepción); siempre las 5, bloqueadas las que
 *      no tienen actividades.
 *      Dentro, agrupadas por proceso, en el orden de la tab.
 *
 * Según el perfil: Operaciones ve todas las actividades (edita solo las de
 * OPS); Bodegas y Combex ven solo las de su área.
 *
 * Los formularios no viven aquí: cada actividad usa el de su actor
 * (`operaciones/`, `bodegas/`, `combex/`), según su responsable.
 * ========================================================================== */

/** Formulario de cada actor (carpeta del actor). */
const FORMULARIO_DE_RESPONSABLE: Record<
  ResponsableTracking,
  (props: PropsActividad) => React.ReactNode
> = {
  OPS: ActividadOperaciones,
  Bodega: ActividadBodegas,
  CBX: ActividadCombex,
};

function FormularioActividad(props: PropsActividad) {
  const Formulario = FORMULARIO_DE_RESPONSABLE[props.actividad.responsable];
  return <Formulario {...props} />;
}

/** Orden de las tabs por tipo (siempre todas; abre la primera con actividades). */
const ORDEN_TIPOS: readonly TipoActividad[] = [
  "Principal",
  "Opcional",
  "Condicional",
  "Transversal",
  "Excepción",
];

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
  servicio,
  perfil,
}: {
  paso: PasoEmbarque;
  pasoActual: number;
  servicio: string;
  perfil: PerfilEmbarque;
}) {
  const actividades = actividadesDelPerfil(paso, perfil);
  const porTipo = ORDEN_TIPOS.map((tipo) => ({
    tipo,
    actividades: actividades.filter((actividad) => actividad.tipo === tipo),
  }));
  const tipoInicial = porTipo.find((grupo) => grupo.actividades.length > 0)?.tipo;
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

      {tipoInicial ? (
        <Tabs key={perfil} defaultValue={tipoInicial} className="space-y-3">
          <TabsList className="h-auto flex-wrap justify-start">
            {porTipo.map((grupo) => (
              <TabsTrigger
                key={grupo.tipo}
                value={grupo.tipo}
                disabled={grupo.actividades.length === 0}
                className="gap-1.5"
              >
                {grupo.tipo === "Excepción" ? (
                  <AlertTriangle className="size-3.5 text-amber-600" aria-hidden="true" />
                ) : null}
                {grupo.tipo}
                <span className="text-xs text-muted-foreground">({grupo.actividades.length})</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {porTipo.map((grupo) => (
            <TabsContent key={grupo.tipo} value={grupo.tipo} className="space-y-4">
              {grupo.tipo === "Excepción" ? (
                <p className="text-xs text-muted-foreground">Solo si aplican.</p>
              ) : null}
              {porProceso(grupo.actividades).map((proceso) => (
                <section key={proceso.proceso} className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {proceso.proceso}
                  </h4>
                  {proceso.actividades.map((actividad) => (
                    <FormularioActividad
                      key={actividad.id}
                      actividad={actividad}
                      pasoActual={pasoActual}
                      servicio={servicio}
                      editable={puedeEditar(actividad, perfil)}
                    />
                  ))}
                </section>
              ))}
            </TabsContent>
          ))}
        </Tabs>
      ) : null}
    </div>
  );
}

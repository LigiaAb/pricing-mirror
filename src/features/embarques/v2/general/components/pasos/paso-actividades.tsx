"use client";

import { AlertTriangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { useOperacion } from "../../../shared/components/operacion-context";
import {
  type PropsActividad,
  TarjetaActividad,
} from "../../../shared/components/tarjeta-actividad";
import { EncabezadoPaso } from "../../../shared/components/utils";
import type { ActividadTracking, TipoActividad } from "../../../shared/lib/actividades-tracking";
import {
  gestionDeActividad,
  type PasoEmbarque,
  pasoTrackingDe,
} from "../../../shared/lib/operacion";
import type { PerfilEmbarque } from "../../../shared/lib/tipos";
import { actividadesDelPerfil, pasoDeTab, puedeEditar } from "../../lib/pasos";

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
 * Los formularios no viven aquí: cada actividad usa la tarjeta común con la
 * gestión de su responsable en la operación, o su formulario propio
 * (`formularios` de la operación, en la carpeta del actor).
 * ========================================================================== */

function FormularioActividad(props: PropsActividad) {
  const operacion = useOperacion();
  const Formulario = operacion.formularios?.[props.actividad.id] ?? TarjetaActividad;
  const gestion = gestionDeActividad(operacion, props.actividad) ?? { interaccion: "formulario" };
  return <Formulario {...props} gestion={gestion} />;
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
  const operacion = useOperacion();
  const actividades = actividadesDelPerfil(operacion, paso, perfil);
  const porTipo = ORDEN_TIPOS.map((tipo) => ({
    tipo,
    actividades: actividades.filter((actividad) => actividad.tipo === tipo),
  }));
  const tipoInicial = porTipo.find((grupo) => grupo.actividades.length > 0)?.tipo;
  const pasoTracking = pasoDeTab(operacion, paso) ?? actividades[0]?.paso;
  const nombrePaso = pasoTrackingDe(operacion, pasoTracking)?.titulo;

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
                      editable={puedeEditar(operacion, actividad, perfil)}
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

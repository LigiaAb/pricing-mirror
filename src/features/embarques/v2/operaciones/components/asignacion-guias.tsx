"use client";

import { Info, Plus, Search } from "lucide-react";
import type { ChangeEvent } from "react";
import * as React from "react";
import { Button } from "@/shared/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/shared/components/ui/input-group";
import { cn } from "@/shared/lib/utils";
import { BotonLimpiar } from "../../shared/components/campos";
import { type PropsActividad, TarjetaActividad } from "../../shared/components/tarjeta-actividad";
import { Dato } from "../../shared/components/utils";
import type { GestionActividad } from "../../shared/lib/gestion-actividades";
import {
  agruparMasters,
  filtrarMasters,
  MASTERS_MAQUETA,
  type ServicioGuias,
  servicioGuias,
} from "../lib/guias";

/* ==========================================================================
 * ASIGNACIÓN DE GUÍAS · OPS 1.1 (HAWB) Y OPS 1.2 (MAWB) (SOLO MAQUETA)
 *
 * Reglas en `lib/guias.ts` (mismas del módulo actual):
 *   OPS 1.1 → la HAWB la asigna el sistema: solo se consulta.
 *   OPS 1.2 → según el servicio: consolidado elige de la lista de masters
 *             disponibles (o crea una nueva); directo la asigna el sistema;
 *             courier no lleva master.
 * Servicio sin regla: formulario general de `lib/gestion-actividades.ts`.
 * ========================================================================== */

function Aviso({ texto }: { texto: string }) {
  return (
    <p className="flex items-start gap-2 rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {texto}
    </p>
  );
}

/** Lista de masters disponibles agrupadas, con búsqueda y selección (consolidado). */
function MastersDisponibles() {
  const [busqueda, setBusqueda] = React.useState("");
  const [seleccionada, setSeleccionada] = React.useState("");
  const grupos = agruparMasters(filtrarMasters(MASTERS_MAQUETA, busqueda));

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">
          Masters disponibles{" "}
          <span className="text-xs text-muted-foreground">({grupos.length})</span>
        </p>
        <InputGroup className="w-full sm:w-72">
          <InputGroupAddon>
            <Search className="size-4" aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput
            value={busqueda}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setBusqueda(e.target.value)}
            placeholder="Buscar master, house, cliente…"
            aria-label="Buscar master"
          />
          {busqueda ? (
            <InputGroupAddon align="inline-end">
              <BotonLimpiar onClick={() => setBusqueda("")} />
            </InputGroupAddon>
          ) : null}
        </InputGroup>
      </div>

      {grupos.length === 0 ? (
        <Aviso
          texto={
            busqueda
              ? "Ninguna master coincide con la búsqueda."
              : "No hay masters disponibles: cree una nueva."
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2" aria-label="Masters disponibles">
          {grupos.map((grupo) => {
            const activa = grupo.masterGuia === seleccionada;
            return (
              <li key={grupo.masterGuia}>
                <button
                  type="button"
                  aria-pressed={activa}
                  onClick={() => setSeleccionada(activa ? "" : grupo.masterGuia)}
                  className={cn(
                    "w-full rounded-lg border p-3 text-left text-xs transition-colors hover:bg-muted",
                    activa && "border-primary bg-primary/5 ring-1 ring-primary",
                  )}
                >
                  <span className="block font-mono text-sm font-semibold">{grupo.masterGuia}</span>
                  <span className="block text-muted-foreground">
                    {[grupo.lineaAerea, grupo.paisDestino, grupo.cliente]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                  <span className="mt-1 block text-muted-foreground">
                    {grupo.houses.length
                      ? `Houses: ${grupo.houses.join(", ")}`
                      : "Sin houses asignadas"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Maqueta: crea una master nueva en el backend (`useAsignarMasterCoordinacion` sin número). */}
      <Button type="button" size="sm" variant="outline" disabled>
        <Plus className="size-4" aria-hidden="true" />
        Nueva master
      </Button>
    </section>
  );
}

/** Cómo se ve OPS 1.2 según el servicio (`null` = formulario general). */
function contenidoMaster(servicio: ServicioGuias | null): {
  accion: string;
  contenido: React.ReactNode;
} | null {
  switch (servicio) {
    case "consolidado":
      return { accion: "Asignar master", contenido: <MastersDisponibles /> };
    case "directo":
      return {
        accion: "Asignar master",
        contenido: <Aviso texto="Servicio directo: la master la asigna el sistema al confirmar." />,
      };
    case "courier":
      return {
        accion: "Confirmar",
        contenido: <Aviso texto="Courier: no lleva master (retiro en bodega)." />,
      };
    default:
      return null;
  }
}

export function AsignacionGuias({
  gestion,
  ...props
}: PropsActividad & { gestion: GestionActividad }) {
  if (props.actividad.id === "OPS 1.1") {
    return (
      <TarjetaActividad
        {...props}
        gestion={{ ...gestion, campos: [], accion: "Confirmar HAWB" }}
        antesDeCampos={
          <div className="space-y-2">
            <Aviso texto="La HAWB la asigna el sistema (correlativo, sin duplicados ni saltos)." />
            <Dato label="No. HAWB" valor="—" />
          </div>
        }
      />
    );
  }

  const master = contenidoMaster(servicioGuias(props.servicio));
  if (!master) return <TarjetaActividad {...props} gestion={gestion} />;
  return (
    <TarjetaActividad
      {...props}
      gestion={{ ...gestion, campos: [], accion: master.accion }}
      antesDeCampos={master.contenido}
    />
  );
}

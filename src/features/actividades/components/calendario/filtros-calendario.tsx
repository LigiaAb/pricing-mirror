"use client";

import { AlertTriangle, Circle, CircleCheck, SlidersHorizontal } from "lucide-react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import type { Estado } from "@/features/catalogos";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { cn } from "@/shared/lib/utils";
import type { ConteoActividades } from "../../api/conteo-actividades";
import { iconoActividad } from "../../lib/actividad-iconos";
import type { FiltrosCalendario as EstadoFiltrosCalendario } from "../../lib/calendario-filtros";

interface TipoActividadFiltro {
  cod_tipo_actividad: string | number;
  nom_tipo_actividad: string;
  color?: string | null;
  icono?: string | null;
}

interface FiltrosCalendarioProps {
  filtros: EstadoFiltrosCalendario;
  estados: Estado[];
  tipos: TipoActividadFiltro[];
  conteo: ConteoActividades | undefined;
  onCambiar: (filtros: EstadoFiltrosCalendario) => void;
  setFilterByUser: Dispatch<SetStateAction<boolean>>;
  filterByUser: boolean;
  puedeVerTodo: boolean;
}

function GrupoFiltros({
  titulo,
  opciones,
  seleccion,
  onCambiar,
  bgcolor = "bg-cyan-700/10",
}: Readonly<{
  titulo: ReactNode;
  opciones: {
    codigo: number;
    nombre: string;
    cantidad?: number;
    color?: string;
    icono?: ReactNode;
  }[];
  seleccion: Set<number>;
  onCambiar: (siguiente: Set<number>) => void;
  bgcolor?: string;
}>) {
  const todos = opciones.map((opcion) => opcion.codigo);
  return (
    <fieldset className={cn(bgcolor, "min-w-0 p-2 rounded-md")}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <legend className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {titulo}
        </legend>
        <div className="flex items-center gap-1 text-xs">
          <Button
            className="h-6 rounded-full px-2 text-[0.7rem]"
            size="sm"
            type="button"
            variant="outline"
            onClick={() => onCambiar(new Set(todos))}
          >
            Todos
          </Button>
          <span aria-hidden="true" className="text-border">
            ·
          </span>
          <Button
            className="h-6 rounded-full px-2 text-[0.7rem]"
            size="sm"
            type="button"
            variant="outline"
            onClick={() => onCambiar(new Set())}
          >
            Limpiar
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 justify-center items-center">
        {opciones.map((opcion) => {
          const id = `${titulo}-${opcion.codigo}`;
          const seleccionado = seleccion.has(opcion.codigo);
          type colorTypes =
            | "primary"
            | "secondary"
            | "accent"
            | "destructive"
            | "muted-foreground"
            | "border"
            | "foreground";
          const color: colorTypes | undefined = opcion.color as colorTypes | undefined;
          return (
            <label
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors ${seleccionado ? "border-primary/20 bg-primary/8 text-foreground" : "border-border/70 bg-background/60 text-muted-foreground hover:bg-muted/60"}`}
              htmlFor={id}
              key={opcion.codigo}
            >
              <Checkbox
                className="sr-only"
                id={id}
                checked={seleccionado}
                onCheckedChange={(marcado) => {
                  const siguiente = new Set(seleccion);
                  if (marcado) siguiente.add(opcion.codigo);
                  else siguiente.delete(opcion.codigo);
                  onCambiar(siguiente);
                }}
              />
              {seleccionado
                ? (opcion.icono ?? (
                    <CircleCheck
                      aria-hidden="true"
                      className={color ? "text-muted-foreground" : ""}
                      style={{ color }}
                      size={12}
                    />
                  ))
                : (opcion.icono ?? (
                    <Circle
                      aria-hidden="true"
                      className={color ? "text-muted-foreground" : ""}
                      style={{ color }}
                      size={12}
                    />
                  ))}
              <span className="max-w-48 truncate">{opcion.nombre}</span>
              {opcion.cantidad && (
                <span className="tabular-nums text-muted-foreground">{opcion.cantidad}</span>
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function FiltrosCalendario({
  filtros,
  estados,
  tipos,
  conteo,
  onCambiar,
  setFilterByUser,
  filterByUser,
  puedeVerTodo,
}: Readonly<FiltrosCalendarioProps>) {
  const tiposUnicos = [...new Map(tipos.map((tipo) => [tipo.cod_tipo_actividad, tipo])).values()];
  const valores: Set<number> = new Set([...(filterByUser ? [1] : [])]);
  return (
    <section
      aria-label="Filtros del calendario"
      className="rounded-2xl border border-border/60 bg-card/80 p-4 shadow-xs backdrop-blur-sm"
    >
      <div className="mb-4 flex items-center gap-2">
        <span className="grid size-7 place-items-center rounded-full bg-muted text-muted-foreground">
          <SlidersHorizontal aria-hidden="true" className="size-3.5" />
        </span>
        <p className="text-sm font-semibold">Filtrar actividades</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(16rem,0.8fr)_minmax(28rem,1.5fr)] xl:gap-6">
        <GrupoFiltros
          titulo="Estado"
          opciones={estados
            .filter((estado) => [23, 24].includes(Number(estado.cod_estado)))
            .map((estado) => ({
              codigo: Number(estado.cod_estado),
              nombre: estado.estado_desc,
              cantidad: conteo?.estados[estado.estado_desc] ?? 0,
              color: "text-primary",
            }))}
          seleccion={filtros.estados}
          onCambiar={(estados) => onCambiar({ ...filtros, estados })}
        />
        <GrupoFiltros
          titulo="Tipo de actividad"
          opciones={tiposUnicos.map((tipo) => {
            const Icono = iconoActividad(tipo.nom_tipo_actividad, tipo.icono);
            return {
              codigo: Number(tipo.cod_tipo_actividad),
              nombre: tipo.nom_tipo_actividad,
              cantidad: conteo?.tipos[tipo.nom_tipo_actividad] ?? 0,
              color: tipo.color ?? "",
              icono: (
                <Icono aria-hidden="true" size={12} style={{ color: tipo.color ?? undefined }} />
              ),
            };
          })}
          seleccion={filtros.tipos}
          onCambiar={(tipos) => onCambiar({ ...filtros, tipos })}
        />
        {puedeVerTodo ? (
          <GrupoFiltros
            bgcolor="bg-warning/20"
            titulo={
              <span className="flex items-center gap-2">
                <AlertTriangle className="size-3.5" />
                Acceso a todas las actividades
              </span>
            }
            opciones={[
              {
                codigo: Number(1),
                nombre: "Filtrar para mi usuario",
                color: "text-primary",
              },
            ]}
            seleccion={valores}
            onCambiar={(estados) => {
              setFilterByUser(estados.has(1));
            }}
          />
        ) : null}
      </div>
    </section>
  );
}

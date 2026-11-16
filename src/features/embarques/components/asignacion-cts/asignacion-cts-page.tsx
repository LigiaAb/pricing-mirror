"use client";

import { useState } from "react";
import { useObtenerNombresOpcionesCategoriaActual, usePermisosCategoria } from "@/features/shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { CargaAsignacionesCts } from "./carga-asignaciones-cts";
import { ListaAsignacionesCts } from "./lista-asignaciones-cts";

const PESTANAS = [
  { valor: "lista", opcion: "Lista" },
  { valor: "masiva", opcion: "Asignación Masiva" },
];

export function AsignacionCtsPage() {
  const opciones = useObtenerNombresOpcionesCategoriaActual();
  const permisosMasiva = usePermisosCategoria("Asignación Masiva");
  const [elegida, setElegida] = useState<string | null>(null);
  const disponibles = PESTANAS.filter((pestana) => opciones?.has(pestana.opcion));
  if (!opciones) return <p role="status">Cargando permisos...</p>;
  if (!disponibles.length) return <p>No tiene opciones habilitadas para asignación de CTS.</p>;
  const activa =
    elegida && disponibles.some((pestana) => pestana.valor === elegida)
      ? elegida
      : (disponibles[0]?.valor ?? "lista");
  return (
    <Tabs value={activa} onValueChange={setElegida} className="space-y-4">
      <TabsList>
        {disponibles.map((pestana) => (
          <TabsTrigger key={pestana.valor} value={pestana.valor}>
            {pestana.opcion}
          </TabsTrigger>
        ))}
      </TabsList>
      {opciones.has("Lista") && (
        <TabsContent value="lista">
          <ListaAsignacionesCts />
        </TabsContent>
      )}
      {opciones.has("Asignación Masiva") && (
        <TabsContent value="masiva">
          <CargaAsignacionesCts
            puedeCargar={permisosMasiva.puedeAgregar || permisosMasiva.puedeAsignar}
          />
        </TabsContent>
      )}
    </Tabs>
  );
}

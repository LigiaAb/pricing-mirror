"use client";

import { usePermisosCategoria } from "@/features/shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { CalendarioActividades } from "../calendario/calendario-actividades";
import { ListaActividadesClient } from "./lista-actividades-client";

export function ActividadesTabsClient() {
  const permisosLista = usePermisosCategoria("Lista de Actividades");
  const permisosCalendario = usePermisosCategoria("Calendario");
  const permisosSinAsignar = usePermisosCategoria("Actividades sin Asignar");
  const permisosInformacion = usePermisosCategoria("Información");
  const permisosResultados = usePermisosCategoria("Resultados");
  const tabs = [
    ...(permisosCalendario.puedeVer ? ["calendario"] : []),
    ...(permisosLista.puedeVer ? ["lista"] : []),
    ...(permisosSinAsignar.puedeVer ? ["sin-asignar"] : []),
  ];
  const defaultTab = tabs[0];

  if (!defaultTab) {
    return <p>No tiene permisos para consultar las listas de actividades.</p>;
  }

  return (
    <Tabs defaultValue={defaultTab} className="space-y-4">
      <TabsList>
        {permisosCalendario.puedeVer && <TabsTrigger value="calendario">Calendario</TabsTrigger>}
        {permisosLista.puedeVer && <TabsTrigger value="lista">Lista de Actividades</TabsTrigger>}
        {permisosSinAsignar.puedeVer && (
          <TabsTrigger value="sin-asignar">Actividades sin Asignar</TabsTrigger>
        )}
      </TabsList>
      {permisosCalendario.puedeVer && (
        <TabsContent value="calendario">
          <CalendarioActividades />
        </TabsContent>
      )}
      {permisosLista.puedeVer && (
        <TabsContent value="lista">
          <ListaActividadesClient
            puedeVerTodo={permisosLista.puedeVerTodo}
            puedeFiltrarContexto={permisosInformacion.puedeFiltrarEmpresaCentroCosto}
          />
        </TabsContent>
      )}
      {permisosSinAsignar.puedeVer && (
        <TabsContent value="sin-asignar">
          <ListaActividadesClient
            sinAsignar
            puedeAsignar={permisosResultados.puedeAsignar}
            puedeFiltrarContexto={permisosResultados.puedeFiltrarEmpresaCentroCosto}
          />
        </TabsContent>
      )}
    </Tabs>
  );
}

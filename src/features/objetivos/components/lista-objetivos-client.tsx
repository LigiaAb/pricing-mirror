"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  centrosCosto,
  configuracionActividades,
  empresas,
  estados,
  periodicidad,
  tipos,
} from "@/features/catalogos";
import { objetivos } from "@/features/objetivos/api/objetivos";
import { componerFilasObjetivo, type ObjetivoFila } from "@/features/objetivos/lib/objetivo-vista";
import { rutaDetalle } from "@/features/objetivos/lib/objetivos-rutas";
import { useContextoOperativoStore, usePermisosCategoria } from "@/features/shell";
import { DataTable } from "@/shared/components/data-table/data-table";
import { Button } from "@/shared/components/ui/button";
import { DialogoInactivarObjetivo } from "./dialogo-inactivar-objetivo";
import {
  type FiltroObjetivos,
  FiltrosObjetivos,
  TODAS_LAS_EMPRESAS,
  TODOS_LOS_CENTROS_COSTO,
} from "./filtros-objetivos";
import { objetivosColumns } from "./objetivos-columns";

const TIPO_TABLA_ASIGNACION_ENTIDAD = "ASIGNACION_ENTIDAD";

export function ListaObjetivosClient({ rutaBase }: Readonly<{ rutaBase: string }>) {
  const router = useRouter();
  const permisos = usePermisosCategoria("Lista");
  const currentEmpresa = useContextoOperativoStore((state) => state.currentEmpresa);
  const currentCentroCosto = useContextoOperativoStore((state) => state.currentCentroCosto);

  const [filtroElegido, setFiltroElegido] = useState<FiltroObjetivos | null>(null);
  const filtro: FiltroObjetivos = filtroElegido ?? {
    codEmp: currentEmpresa ? String(currentEmpresa.cod_empresa) : TODAS_LAS_EMPRESAS,
    codCc: currentCentroCosto ? String(currentCentroCosto.cod_cc) : TODOS_LOS_CENTROS_COSTO,
  };

  const filtrosServidor = useMemo(() => {
    const base: Record<string, unknown> = {};
    if (filtro.codEmp !== TODAS_LAS_EMPRESAS) base.cod_emp = Number(filtro.codEmp);
    if (filtro.codCc !== TODOS_LOS_CENTROS_COSTO) base.cod_cc = Number(filtro.codCc);
    return base;
  }, [filtro]);

  const {
    data: lista = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = objetivos.useLista(filtrosServidor);
  const { data: empresasData = [] } = empresas.useLista();
  const { data: centros = [] } = centrosCosto.useLista();
  const { data: actividades = [] } = configuracionActividades.useLista();
  const { data: tiposAsignacion = [] } = tipos.useLista({
    tipo_tabla: TIPO_TABLA_ASIGNACION_ENTIDAD,
  });
  const { data: periodicidades = [] } = periodicidad.useLista();
  const { data: estadosData = [] } = estados.useLista();

  const filas = useMemo(
    () =>
      componerFilasObjetivo(lista, {
        empresas: empresasData,
        centrosCosto: centros,
        actividades,
        tiposAsignacion,
        periodicidades,
        estados: estadosData,
      }),
    [lista, empresasData, centros, actividades, tiposAsignacion, periodicidades, estadosData],
  );

  const [aInactivar, setAInactivar] = useState<ObjetivoFila | null>(null);

  const columns = useMemo(
    () =>
      objetivosColumns({
        rutaBase,
        router,
        puedeEliminar: permisos.puedeEliminar,
        onInactivar: setAInactivar,
      }),
    [rutaBase, router, permisos.puedeEliminar],
  );

  if (isLoading) return <div>Cargando...</div>;
  if (isError) return <div>Error al cargar objetivos.</div>;

  return (
    <div className="space-y-4">
      <DataTable
        data={filas}
        columns={columns}
        searchKeys={["descripcion"]}
        searchPlaceholder="Buscar objetivo..."
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
        extraActions={
          <div className="flex items-end gap-2">
            {permisos.puedeFiltrarEmpresaCentroCosto && (
              <FiltrosObjetivos filtro={filtro} onCambiar={setFiltroElegido} />
            )}
            {permisos.puedeAgregar && (
              <Button size="sm" onClick={() => router.push(rutaDetalle(rutaBase, "new"))}>
                <Plus className="h-4 w-4" />
                Nuevo objetivo
              </Button>
            )}
          </div>
        }
      />

      <DialogoInactivarObjetivo
        objetivo={aInactivar}
        onOpenChange={(open) => !open && setAInactivar(null)}
      />
    </div>
  );
}

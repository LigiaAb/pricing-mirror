"use client";

import React from "react";
import { useFetchEntidades } from "@/features/entidades";
import { DataTable } from "@/shared/components/data-table/data-table";
import { buscarClientesTarifa, type EntidadTarifaOption } from "../../api/buscar-entidad";
import {
  useEliminarTarifaEntidad,
  useGuardarTarifaEntidad,
  useTarifaEntidades,
} from "../../api/tarifa-entidades";
import { eliminarDuplicadosById } from "../../lib/tarifa-helpers";
import { crearEntidadColumns, type FilaMetodoEntidad } from "./entidad-columns";
import { EntidadForm } from "./entidad-form";

type Props = {
  codMetodo?: string | number | null;
};

export function EntidadTable({ codMetodo }: Props) {
  const entidades = useTarifaEntidades({
    codEstado: 1,
    ...(codMetodo == null ? {} : { codMetodo, cod_metodo: codMetodo }),
  });

  const guardarEntidad = useGuardarTarifaEntidad();
  const eliminarEntidad = useEliminarTarifaEntidad();

  const entidadesConsultadas = useFetchEntidades({ tipo_entidad: "CLIENTE" });

  const data = React.useMemo<FilaMetodoEntidad[]>(() => entidades.data ?? [], [entidades.data]);

  const [entidadesLocales, setEntidadesLocales] = React.useState<EntidadTarifaOption[]>([]);

  React.useEffect(() => {
    const iniciales = entidadesConsultadas.data ?? [];

    setEntidadesLocales((actuales) =>
      eliminarDuplicadosById<EntidadTarifaOption>(
        [
          ...actuales,
          ...iniciales.map((item) => ({
            entidad_id: item.entidad_id,
            entidad_nombre: item.entidad_nombre,
          })),
        ],
        "entidad_id",
      ),
    );
  }, [entidadesConsultadas.data]);

  const fetchOptions = React.useCallback(
    async (search: string): Promise<EntidadTarifaOption[]> => {
      const busqueda = search.trim().toLowerCase();

      const asignadas = new Set((entidades.data ?? []).map((item) => String(item.entidad_id)));

      const filtrarAsignadas = (lista: EntidadTarifaOption[]) =>
        lista.filter((cliente) => !asignadas.has(String(cliente.entidad_id)));

      if (busqueda.length < 2) {
        return filtrarAsignadas(entidadesLocales);
      }

      const encontradosLocalmente = entidadesLocales.filter((item) =>
        item.entidad_nombre.toLowerCase().includes(busqueda),
      );

      const encontradosRemotos = await buscarClientesTarifa(search);

      const nuevaLista = eliminarDuplicadosById<EntidadTarifaOption>(
        [...entidadesLocales, ...encontradosRemotos],
        "entidad_id",
      );

      setEntidadesLocales(nuevaLista);

      return filtrarAsignadas(
        eliminarDuplicadosById<EntidadTarifaOption>(
          [...encontradosLocalmente, ...encontradosRemotos],
          "entidad_id",
        ),
      );
    },
    [entidades.data, entidadesLocales],
  );

  const handleAgregar = React.useCallback(
    (entidad: EntidadTarifaOption) => {
      if (codMetodo == null) return;

      guardarEntidad.mutate({
        cod_metodo: codMetodo,
        entidad_id: entidad.entidad_id,
      });
    },
    [codMetodo, guardarEntidad],
  );

  const handleEliminar = React.useCallback(
    (row: FilaMetodoEntidad) => {
      if (codMetodo == null) return;

      eliminarEntidad.mutate({
        ...row,
        cod_metodo: codMetodo,
        entidad_id: row.entidad_id,
      });
    },
    [codMetodo, eliminarEntidad],
  );

  const columns = React.useMemo(
    () =>
      crearEntidadColumns({
        onEliminar: handleEliminar,
      }),
    [handleEliminar],
  );

  return (
    <div className="space-y-4">
      <EntidadForm
        fetchOptions={fetchOptions}
        onAgregar={handleAgregar}
        isPending={guardarEntidad.isPending}
      />

      <DataTable
        columns={columns}
        data={data}
        isRefreshing={entidades.isFetching}
        onRefresh={() => entidades.refetch()}
      />
    </div>
  );
}

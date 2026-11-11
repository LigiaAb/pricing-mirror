"use client";

import React from "react";
import { commodities as fetchCommodities, estados as fetchEstados } from "@/features/catalogos";
import { DataTable } from "@/shared/components/data-table/data-table";

import {
  type MetodoCommodityMutationPayload,
  useActualizarMetodoCommodity,
  useEliminarMetodoCommodity,
  useInsertarMetodoCommodity,
  useMetodoCommodities,
} from "../../api/metodo-commodities";

import {
  type CommodityOption,
  crearCommoditiesColumns,
  type EstadoCommodityOption,
  type FilaMetodoCommodity,
} from "./commodities-columns";

import { CommoditiesForm } from "./commodities-form";

const COD_ESTADO_ACTIVO = 1;

type Props = {
  codMetodo?: string | number | null;
};

export function CommoditiesTable({ codMetodo }: Props) {
  const commoditiesMetodo = useMetodoCommodities({
    ...(codMetodo == null ? {} : { codMetodo, cod_metodo: codMetodo }),
  });

  const commoditiesFetch = fetchCommodities.useLista({ cod_estado: COD_ESTADO_ACTIVO });
  const estadosFetch = fetchEstados.useLista();

  const insertarCommodity = useInsertarMetodoCommodity();

  const actualizarCommodity = useActualizarMetodoCommodity();

  const eliminarCommodity = useEliminarMetodoCommodity();

  const [filaEditando, setFilaEditando] = React.useState<FilaMetodoCommodity | null>(null);

  const commodities = React.useMemo<CommodityOption[]>(
    () =>
      (commoditiesFetch.data ?? [])
        .filter((item) => Number(item.cod_estado) === COD_ESTADO_ACTIVO)
        .map((item) => ({
          ...item,
          value: String(item.cod_commodity),
          label: item.nombre,
          cod_commodity: item.cod_commodity,
        })),
    [commoditiesFetch.data],
  );

  const estados = React.useMemo<EstadoCommodityOption[]>(
    () =>
      (estadosFetch.data ?? []).map((item) => ({
        ...item,
        value: String(item.cod_estado),
        label: item.estado_desc,
        cod_estado: item.cod_estado,
      })),
    [estadosFetch.data],
  );

  const estadoActivo = React.useMemo(
    () => estados.find((estado) => String(estado.cod_estado) === String(COD_ESTADO_ACTIVO)) ?? null,
    [estados],
  );

  const data = React.useMemo<FilaMetodoCommodity[]>(
    () =>
      (commoditiesMetodo.data ?? []).map((fila) => ({
        ...fila,

        commodity:
          commodities.find(
            (commodity) => String(commodity.cod_commodity) === String(fila.cod_commodity),
          ) ?? null,

        estado:
          estados.find((estado) => String(estado.cod_estado) === String(fila.cod_estado)) ?? null,
      })),
    [commoditiesMetodo.data, commodities, estados],
  );

  const commoditiesSeleccionables = React.useMemo(() => {
    return commodities.filter((commodity) => {
      const asignadoActivo = (commoditiesMetodo.data ?? []).some(
        (item) =>
          String(item.cod_commodity) === String(commodity.cod_commodity) &&
          String(item.cod_estado) === String(COD_ESTADO_ACTIVO) &&
          // Cuando editamos, dejamos disponible
          // el commodity de esa misma fila.
          String(item.cod_metodocommodity) !== String(filaEditando?.cod_metodocommodity ?? ""),
      );

      return !asignadoActivo;
    });
  }, [commodities, commoditiesMetodo.data, filaEditando?.cod_metodocommodity]);

  const formatearFilaApi = React.useCallback(
    (fila: FilaMetodoCommodity): MetodoCommodityMutationPayload | null => {
      if (codMetodo == null) return null;
      if (!fila.commodity) return null;

      return {
        cod_metodocommodity: fila.cod_metodocommodity ?? null,

        cod_metodo: codMetodo,

        cod_commodity: fila.commodity.cod_commodity,

        cod_estado: fila.estado?.cod_estado ?? fila.cod_estado ?? COD_ESTADO_ACTIVO,
      };
    },
    [codMetodo],
  );

  const handleGuardar = React.useCallback(
    (fila: FilaMetodoCommodity) => {
      const payload = formatearFilaApi(fila);

      if (!payload) return;

      if (fila.cod_metodocommodity) {
        actualizarCommodity.mutate(payload, {
          onSuccess: () => {
            setFilaEditando(null);
          },
        });

        return;
      }

      insertarCommodity.mutate({
        ...payload,
        cod_estado: COD_ESTADO_ACTIVO,
      });
    },
    [actualizarCommodity, insertarCommodity, formatearFilaApi],
  );

  const handleEliminar = React.useCallback(
    (fila: FilaMetodoCommodity) => {
      const payload = formatearFilaApi(fila);

      if (!payload) return;

      eliminarCommodity.mutate(payload);
    },
    [eliminarCommodity, formatearFilaApi],
  );

  const columns = React.useMemo(
    () =>
      crearCommoditiesColumns({
        onEditar: setFilaEditando,
        onEliminar: handleEliminar,
      }),
    [handleEliminar],
  );

  return (
    <div className="space-y-4">
      <CommoditiesForm
        value={filaEditando}
        commodities={commoditiesSeleccionables}
        estados={estados}
        estadoActivo={estadoActivo}
        onGuardar={handleGuardar}
        onCancelar={() => setFilaEditando(null)}
        isPending={insertarCommodity.isPending || actualizarCommodity.isPending}
      />

      <DataTable
        columns={columns}
        data={data}
        isRefreshing={commoditiesMetodo.isFetching}
        onRefresh={() => commoditiesMetodo.refetch()}
      />
    </div>
  );
}

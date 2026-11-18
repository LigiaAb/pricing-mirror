"use client";

import React from "react";
import { tipos as useFetchTipos } from "@/features/catalogos";
import { DataTable } from "@/shared/components/data-table/data-table";

import {
  type TarifaDetalleMutationPayload,
  useActualizarTarifaDetalle,
  useEliminarTarifaDetalle,
  useInsertarTarifaDetalle,
  useTarifaDetalles,
} from "../../api/tarifa-detalles";

import {
  crearDetalleColumns,
  type DetalleTipoOption,
  type FilaMetodoDetalle,
} from "./detalle-columns";

import { DetalleForm } from "./detalle-form";

type Props = {
  codMetodo?: string | number | null;
};

export function DetalleTable({ codMetodo }: Props) {
  const detalles = useTarifaDetalles({
    codEstado: 1,
    ...(codMetodo == null ? {} : { codMetodo, cod_metodo: codMetodo }),
  });

  const tiposFetch = useFetchTipos.useLista();

  const insertarDetalle = useInsertarTarifaDetalle();
  const actualizarDetalle = useActualizarTarifaDetalle();
  const eliminarDetalle = useEliminarTarifaDetalle();

  const [filaEditando, setFilaEditando] = React.useState<FilaMetodoDetalle | null>(null);

  const tipos = React.useMemo<DetalleTipoOption[]>(
    () =>
      (tiposFetch.data ?? [])
        .filter((item) => item.tipoTabla === "TARIFA_DETALLE" && Number(item.codEstado) === 1)
        .map((item) => ({
          ...item,
          value: String(item.codTipo),
          label: item.nomTipo,
          cod_tipo: item.codTipo,
          cod_tipo_dato: item.codTipoDato,
        })),
    [tiposFetch.data],
  );

  const data = React.useMemo<FilaMetodoDetalle[]>(
    () =>
      (detalles.data ?? []).map((fila) => ({
        ...fila,

        tipo:
          tipos.find((tipo) => String(tipo.cod_tipo ?? tipo.value) === String(fila.cod_tipo)) ??
          null,
      })),
    [detalles.data, tipos],
  );

  const formatearFilaApi = React.useCallback(
    (fila: FilaMetodoDetalle): TarifaDetalleMutationPayload | null => {
      if (codMetodo == null) return null;

      return {
        cod_tarifa_detalle: fila.cod_tarifa_detalle ?? null,

        cod_metodo: codMetodo,

        cod_tipo: fila.tipo?.cod_tipo ?? fila.tipo?.value ?? fila.cod_tipo ?? null,

        descripcion: fila.descripcion ?? null,

        valor: fila.valor ?? null,

        cod_estado: fila.cod_estado ?? 1,
      };
    },
    [codMetodo],
  );

  const handleGuardar = React.useCallback(
    (fila: FilaMetodoDetalle) => {
      const payload = formatearFilaApi(fila);

      if (!payload) return;

      if (fila.cod_tarifa_detalle) {
        actualizarDetalle.mutate(payload, {
          onSuccess: () => {
            setFilaEditando(null);
          },
        });

        return;
      }

      insertarDetalle.mutate(payload);
    },
    [actualizarDetalle, insertarDetalle, formatearFilaApi],
  );

  const handleEliminar = React.useCallback(
    (fila: FilaMetodoDetalle) => {
      const payload = formatearFilaApi(fila);

      if (!payload) return;

      eliminarDetalle.mutate(payload);
    },
    [eliminarDetalle, formatearFilaApi],
  );

  const columns = React.useMemo(
    () =>
      crearDetalleColumns({
        onEditar: setFilaEditando,
        onEliminar: handleEliminar,
      }),
    [handleEliminar],
  );

  return (
    <div className="space-y-4">
      <DetalleForm
        value={filaEditando}
        tipos={tipos}
        onGuardar={handleGuardar}
        onCancelar={() => setFilaEditando(null)}
        isPending={insertarDetalle.isPending || actualizarDetalle.isPending}
      />

      <DataTable
        columns={columns}
        data={data}
        isRefreshing={detalles.isFetching}
        onRefresh={() => detalles.refetch()}
      />
    </div>
  );
}

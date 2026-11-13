"use client";

import React from "react";
import { METODO_RANGO } from "@/features/pricing/shared";
import { DataTable } from "@/shared/components/data-table/data-table";
import { Alert } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import {
  type TarifaRangoMutationPayload,
  useGuardarTarifaRangos,
  useMonedasRango,
  useTarifaRangos,
} from "../../../api/tarifa-rangos";
import { useOpcionesMonedas } from "../../../hooks/use-opciones-tarifa";
import { crearRangoColumns, type FilaMetodoRango, type MonedaRangoOption } from "./rango-columns";
import { RangoForm } from "./rango-form";

type Props = {
  codMetodo?: string | number | null;
  codServicio?: string | number | null;

  readonly?: boolean;

  reConsultar?: () => void;
  onTarifaCreada?: () => void;
};

export function RangoTable({
  codMetodo,
  codServicio,
  readonly = false,
  reConsultar = () => {},
  onTarifaCreada = () => {},
}: Props) {
  const rangosQuery = useTarifaRangos({
    codEstado: 1,
    ...(codMetodo == null ? {} : { codMetodo, cod_metodo: codMetodo }),
  });

  const monedasQuery = useMonedasRango();

  const guardarRangos = useGuardarTarifaRangos();

  const [rangosLocales, setRangosLocales] = React.useState<FilaMetodoRango[]>([]);

  const [filaEditando, setFilaEditando] = React.useState<FilaMetodoRango | null>(null);

  React.useEffect(() => {
    setRangosLocales(
      (rangosQuery.data ?? []).map((rango) => ({
        ...rango,
        localId: `api-${rango.cod_tarifa_rango}`,
      })),
    );
  }, [rangosQuery.data]);

  const monedas: MonedaRangoOption[] = useOpcionesMonedas(monedasQuery.data);

  // Las filas editadas ya traen sus opciones; las del API las buscan por código.
  const data = React.useMemo<FilaMetodoRango[]>(
    () =>
      rangosLocales.map((rango) => {
        const fila = METODO_RANGO.aFila(rango, { monedas });

        return {
          ...fila,
          localId: rango.localId,
          moneda_costo: rango.moneda_costo ?? fila.moneda_costo ?? null,
          moneda_venta: rango.moneda_venta ?? fila.moneda_venta ?? null,
        };
      }),
    [rangosLocales, monedas],
  );

  const handleAplicarFila = React.useCallback((fila: FilaMetodoRango) => {
    setRangosLocales((actuales) => {
      const existe = actuales.some((item) => item.localId === fila.localId);

      if (existe) {
        return actuales.map((item) => (item.localId === fila.localId ? fila : item));
      }

      return [...actuales, fila];
    });

    setFilaEditando(null);
  }, []);

  const formatearFilaApi = React.useCallback(
    (fila: FilaMetodoRango): TarifaRangoMutationPayload | null => {
      if (codMetodo == null) return null;
      if (!fila.moneda_costo) return null;
      if (!fila.moneda_venta) return null;

      // inicio || 0, final null, montos tal cual y cod_estado ?? 1: ver la definición.
      return METODO_RANGO.aPayload(fila, { codMetodo, codServicio });
    },
    [codMetodo, codServicio],
  );

  const handleEliminar = React.useCallback(
    (fila: FilaMetodoRango) => {
      setRangosLocales((actuales) => actuales.filter((item) => item.localId !== fila.localId));

      if (filaEditando?.localId === fila.localId) {
        setFilaEditando(null);
      }
    },
    [filaEditando?.localId],
  );

  const handleGuardarTodo = React.useCallback(() => {
    const payload = data
      .map(formatearFilaApi)
      .filter((item): item is TarifaRangoMutationPayload => item !== null);

    if (!payload.length) return;

    guardarRangos.mutate(payload, {
      onSuccess: () => {
        onTarifaCreada();
        reConsultar();
      },
    });
  }, [data, formatearFilaApi, guardarRangos, onTarifaCreada, reConsultar]);

  const columns = React.useMemo(
    () =>
      crearRangoColumns({
        readonly,
        onEditar: setFilaEditando,
        onEliminar: handleEliminar,
      }),
    [readonly, handleEliminar],
  );

  return (
    <div className="space-y-4 overflow-auto">
      {!readonly && (
        <Alert variant="info" className="rounded-md border p-3 text-sm break-all">
          Los datos ingresados en la lista no se registrarán hasta hacer clic en Guardar. Favor de
          ingresar todos los rangos antes de Guardar.
        </Alert>
      )}

      <RangoForm
        value={filaEditando}
        monedas={monedas}
        onGuardar={handleAplicarFila}
        onCancelar={() => setFilaEditando(null)}
        readonly={readonly}
      />

      <DataTable
        columns={columns}
        data={data}
        isRefreshing={rangosQuery.isFetching || monedasQuery.isFetching}
        onRefresh={() => rangosQuery.refetch()}
      />

      {!readonly && (
        <div className="flex justify-center">
          <Button
            type="button"
            disabled={!data.length || guardarRangos.isPending}
            onClick={handleGuardarTodo}
          >
            Guardar
          </Button>
        </div>
      )}
    </div>
  );
}

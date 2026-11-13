"use client";

import React from "react";
import {
  monedas as fetchMonedas,
  puntosEnlace as fetchPuntosEnlace,
  tipos as useFetchTipos,
} from "@/features/catalogos";
import { DataTable } from "@/shared/components/data-table/data-table";

import {
  type TarifaScallingMutationPayload,
  useActualizarTarifaScalling,
  useEliminarTarifaScalling,
  useInsertarTarifaScalling,
  useTarifaScalling,
} from "../../../api/tarifa-scalling";
import { useOpcionesMonedas } from "../../../hooks/use-opciones-tarifa";
import {
  type FilaMetodoScalling,
  METODO_SCALLING,
  type MonedaScallingOption,
  type PuntoEnlaceScallingOption,
  type TipoPuntoEnlaceScallingOption,
} from "../../../lib/metodos/scalling";
import { crearScallingColumns } from "./scalling-columns";
import { ScallingForm } from "./scalling-form";

const TIPO_PUNTO_SEGUN_TRANSPORTE: Record<string, string> = {
  AEREO: "AEROPUERTO",
  MARITIMO: "PUERTO",
  TERRESTRE: "ADUANA",
};

type Props = {
  codMetodo?: string | number | null;
  codTipoTransporte?: string | number | null;
};

export function ScallingTable({ codMetodo, codTipoTransporte }: Props) {
  /*
   * =========================================================
   * CONSULTAS
   * =========================================================
   */

  const scallingQuery = useTarifaScalling({
    codEstado: 1,
    ...(codMetodo == null ? {} : { codMetodo }),
  });

  // La lista de tipos se filtra localmente, igual que en Países.
  const tiposPuntoEnlaceFetch = useFetchTipos.useLista();

  const puntosEnlaceFetch = fetchPuntosEnlace.useLista();

  const monedasFetch = fetchMonedas.useLista({ cod_estado: 1 });

  const insertarScalling = useInsertarTarifaScalling();

  const actualizarScalling = useActualizarTarifaScalling();

  const eliminarScalling = useEliminarTarifaScalling();

  /*
   * =========================================================
   * ESTADO
   * =========================================================
   */

  const [filaEditando, setFilaEditando] = React.useState<FilaMetodoScalling | null>(null);

  /*
   * =========================================================
   * CATÁLOGOS
   * =========================================================
   */

  const tiposPuntoEnlace = React.useMemo<TipoPuntoEnlaceScallingOption[]>(
    () =>
      (tiposPuntoEnlaceFetch.data ?? []).flatMap((item) => {
        if (item.tipoTabla !== "PUNTO_ENLACE" || Number(item.codEstado) !== 1) return [];

        const codTipo = item.codTipo;

        return [
          {
            ...item,
            value: String(codTipo),
            label: String(item.label ?? item.nomTipo ?? ""),
            cod_tipo: codTipo,
          },
        ];
      }),
    [tiposPuntoEnlaceFetch.data],
  );

  const puntosEnlace = React.useMemo<PuntoEnlaceScallingOption[]>(
    () =>
      (puntosEnlaceFetch.data ?? []).map((item) => ({
        ...item,

        value: String(item.value ?? item.cod_puntoenlace ?? ""),

        label: String(item.label ?? item.nombre ?? ""),

        cod_puntoenlace: item.cod_puntoenlace ?? item.value,

        cod_tipo: item.cod_tipo,
      })) as PuntoEnlaceScallingOption[],
    [puntosEnlaceFetch.data],
  );

  const monedas: MonedaScallingOption[] = useOpcionesMonedas(monedasFetch.data, {
    soloOperativas: true,
  });

  /*
   * =========================================================
   * TIPO DE PUNTO DE ENLACE POR DEFECTO
   *
   * Viejo:
   * AEREO     -> AEROPUERTO
   * MARITIMO  -> PUERTO
   * TERRESTRE -> ADUANA
   * =========================================================
   */

  const tipoPuntoEnlaceDefault = React.useMemo(() => {
    if (codTipoTransporte == null) return null;

    const transporte = (tiposPuntoEnlaceFetch.data ?? []).find(
      (tipo) =>
        tipo.tipoTabla === "TRANSPORTE" && String(tipo.codTipo) === String(codTipoTransporte),
    );
    const nombreTipo =
      TIPO_PUNTO_SEGUN_TRANSPORTE[
        String(transporte?.nomTipo ?? "")
          .trim()
          .toUpperCase()
      ];

    if (!nombreTipo) return null;

    return tiposPuntoEnlace.find((tipo) => tipo.label.trim().toUpperCase() === nombreTipo) ?? null;
  }, [codTipoTransporte, tiposPuntoEnlaceFetch.data, tiposPuntoEnlace]);

  /*
   * =========================================================
   * DATOS DE API -> DATOS DE UI
   *
   * El API solamente guarda cod_puntoenlace.
   * De ese punto obtenemos su cod_tipo.
   * =========================================================
   */

  const data = React.useMemo<FilaMetodoScalling[]>(
    () =>
      (scallingQuery.data ?? []).map((registro) => {
        // punto_enlace (por cod_puntoenlace) y moneda: ver la definición.
        const fila = METODO_SCALLING.aFila(registro, { puntosEnlace, monedas });

        const puntoEnlace = fila.punto_enlace ?? null;

        const tipoPuntoEnlace =
          puntoEnlace == null
            ? null
            : (tiposPuntoEnlace.find(
                (tipo) => String(tipo.cod_tipo) === String(puntoEnlace.cod_tipo),
              ) ?? null);

        return {
          ...fila,

          tipo_puntoenlace: tipoPuntoEnlace,
        };
      }),
    [scallingQuery.data, puntosEnlace, tiposPuntoEnlace, monedas],
  );

  /*
   * =========================================================
   * UI -> API
   * =========================================================
   */

  const formatearFilaApi = React.useCallback(
    (fila: FilaMetodoScalling): TarifaScallingMutationPayload | null => {
      if (codMetodo == null) return null;

      // id ?? 0, punto, costo ?? 0, cod_moneda ?? value ?? 1 y cod_estado ?? 1: ver la definición.
      return METODO_SCALLING.aPayload(fila, { codMetodo });
    },
    [codMetodo],
  );

  /*
   * =========================================================
   * GUARDAR
   * =========================================================
   */

  const handleGuardar = React.useCallback(
    (fila: FilaMetodoScalling) => {
      const payload = formatearFilaApi(fila);

      if (!payload) return;

      const esEdicion = fila.cod_tarifa_scalling != null && Number(fila.cod_tarifa_scalling) !== 0;

      if (esEdicion) {
        actualizarScalling.mutate(payload, {
          onSuccess: () => {
            setFilaEditando(null);
          },
        });

        return;
      }

      insertarScalling.mutate(payload);
    },
    [formatearFilaApi, insertarScalling, actualizarScalling],
  );

  /*
   * =========================================================
   * ELIMINAR
   * =========================================================
   */

  const handleEliminar = React.useCallback(
    (fila: FilaMetodoScalling) => {
      const payload = formatearFilaApi(fila);

      if (!payload) return;

      eliminarScalling.mutate(payload, {
        onSuccess: () => {
          if (String(filaEditando?.cod_tarifa_scalling) === String(fila.cod_tarifa_scalling)) {
            setFilaEditando(null);
          }
        },
      });
    },
    [formatearFilaApi, eliminarScalling, filaEditando?.cod_tarifa_scalling],
  );

  /*
   * =========================================================
   * COLUMNAS
   * =========================================================
   */

  const columns = React.useMemo(
    () =>
      crearScallingColumns({
        onEditar: setFilaEditando,
        onEliminar: handleEliminar,
      }),
    [handleEliminar],
  );

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <div className="space-y-4">
      <ScallingForm
        value={filaEditando}
        tiposPuntoEnlace={tiposPuntoEnlace}
        puntosEnlace={puntosEnlace}
        monedas={monedas}
        tipoPuntoEnlaceDefault={tipoPuntoEnlaceDefault}
        onGuardar={handleGuardar}
        onCancelar={() => setFilaEditando(null)}
        isPending={insertarScalling.isPending || actualizarScalling.isPending}
      />

      <DataTable
        columns={columns}
        data={data}
        searchKeys={["tipo_puntoenlace", "punto_enlace", "moneda"]}
        numericColumns={["costo"]}
        isLoading={
          scallingQuery.isLoading ||
          tiposPuntoEnlaceFetch.isLoading ||
          puntosEnlaceFetch.isLoading ||
          monedasFetch.isLoading
        }
        isRefreshing={
          scallingQuery.isFetching ||
          tiposPuntoEnlaceFetch.isFetching ||
          puntosEnlaceFetch.isFetching ||
          monedasFetch.isFetching
        }
        onRefresh={() => {
          void Promise.all([
            scallingQuery.refetch(),
            tiposPuntoEnlaceFetch.refetch(),
            puntosEnlaceFetch.refetch(),
            monedasFetch.refetch(),
          ]);
        }}
      />
    </div>
  );
}

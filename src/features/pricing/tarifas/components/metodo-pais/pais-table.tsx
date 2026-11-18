"use client";

import React from "react";
import { DataTable } from "@/shared/components/data-table/data-table";
import {
  type TarifaRutaMutationPayload,
  useActualizarTarifaRuta,
  useEliminarTarifaRuta,
  useInsertarTarifaRuta,
  useTarifaRutas,
} from "../../api/tarifa-rutas";
import { useCatalogosTarifas } from "../../hooks/use-catalogos-tarifas";
import { crearPaisColumns, type FilaMetodoPais, type RutaOption } from "./pais-columns";
import { PaisForm } from "./pais-form";

type Props = {
  codMetodo?: string | number | null;
  codTipoTransporte?: string | number | null;
};

const COD_TRANSPORTE_TERRESTRE = 51;

function normalizarOpciones(items: readonly unknown[]): RutaOption[] {
  return items.flatMap((item) => {
    if (typeof item !== "object" || item === null) return [];

    const source = item as Record<string, unknown>;
    const value = source.value;
    if (typeof value !== "string" && typeof value !== "number") return [];

    return [{ ...source, value, label: String(source.label ?? "") }];
  });
}

export function PaisTable({ codMetodo, codTipoTransporte }: Props) {
  const esTerrestre = String(codTipoTransporte) === String(COD_TRANSPORTE_TERRESTRE);

  const rutas = useTarifaRutas({
    codEstado: 1,
    ...(codMetodo == null ? {} : { codMetodo, cod_metodo: codMetodo }),
  });

  const { catalogos } = useCatalogosTarifas();

  const catalogosRuta = React.useMemo(
    () => ({
      tiposRuta: normalizarOpciones(catalogos.tiposRuta),
      continentes: normalizarOpciones(catalogos.continentes),
      paises: normalizarOpciones(catalogos.paises),
      tiposPuntoEnlace: normalizarOpciones(catalogos.tiposPuntoEnlace),
      puntosEnlace: normalizarOpciones(catalogos.puntosEnlace),
      ciudades: normalizarOpciones(catalogos.ciudades),
    }),
    [
      catalogos.tiposRuta,
      catalogos.continentes,
      catalogos.paises,
      catalogos.tiposPuntoEnlace,
      catalogos.puntosEnlace,
      catalogos.ciudades,
    ],
  );

  // const continentesFetch = continentes.useLista();
  // const paisesFetch = paises.useLista();
  // const tiposRutaFetch = tipos.useLista({ tipo_tabla: "TARIFA_RUTA" });
  // const tiposPuntoEnlaceFetch = tipos.useLista({ tipo_tabla: "PUNTO_ENLACE" });
  // const puntosEnlaceFetch = fetchPuntosEnlace.useLista();
  // const ciudadesFetch = ciudades.useLista();

  // const puntosEnlace = React.useMemo<RutaOption[]>(
  //   () =>
  //     (puntosEnlaceFetch.data ?? []).map((item) => ({
  //       ...item,
  //       value: item.value ?? item.cod_puntoenlace,
  //       label: String(item.label ?? item.nombre ?? ""),
  //       cod_puntoenlace: item.cod_puntoenlace ?? item.value,
  //       cod_pais: item.cod_pais,
  //       cod_tipo: item.cod_tipo,
  //     })) as RutaOption[],
  //   [puntosEnlaceFetch.data],
  // );

  // const catalogos: CatalogosProps = {
  //   tiposRuta: (tiposRutaFetch.data ?? []) as RutaOption[],
  //   continentes: (continentesFetch.data ?? []) as RutaOption[],
  //   paises: (paisesFetch.data ?? []) as RutaOption[],
  //   tiposPuntoEnlace: (tiposPuntoEnlaceFetch.data ?? []) as RutaOption[],
  //   puntosEnlace,
  //   ciudades: (ciudadesFetch.data ?? []) as RutaOption[],
  // };

  const insertarRuta = useInsertarTarifaRuta();
  const actualizarRuta = useActualizarTarifaRuta();
  const eliminarRuta = useEliminarTarifaRuta();

  const [filaEditando, setFilaEditando] = React.useState<FilaMetodoPais | null>(null);

  const data = React.useMemo<FilaMetodoPais[]>(
    () =>
      (rutas.data ?? []).map((fila) => ({
        ...fila,

        tipo:
          catalogosRuta.tiposRuta.find(
            (item) => String(item.value) === String(fila.cod_tipo_ruta),
          ) ?? null,

        continente:
          catalogosRuta.continentes.find(
            (item) => String(item.value) === String(fila.cod_continente),
          ) ?? null,

        pais:
          catalogosRuta.paises.find((item) => String(item.value) === String(fila.cod_pais)) ?? null,

        tipo_puntoenlace:
          catalogosRuta.tiposPuntoEnlace.find(
            (item) => String(item.value) === String(fila.cod_tipo_puntoenlace),
          ) ?? null,

        punto_enlace:
          catalogosRuta.puntosEnlace.find(
            (item) => String(item.value) === String(fila.cod_puntoenlace),
          ) ?? null,

        ciudad:
          catalogosRuta.ciudades.find((item) => String(item.value) === String(fila.cod_ciudad)) ??
          null,
      })),
    [rutas.data, catalogosRuta],
  );

  const formatearFilaApi = React.useCallback(
    (fila: FilaMetodoPais): TarifaRutaMutationPayload | null => {
      if (codMetodo == null) return null;

      return {
        cod_tarifa_ruta: fila.cod_tarifa_ruta ?? null,

        cod_metodo: codMetodo,

        cod_continente: fila.continente?.value ?? fila.cod_continente ?? null,

        cod_pais: fila.pais?.value ?? fila.cod_pais ?? null,

        cod_tipo_ruta: fila.tipo?.value ?? fila.cod_tipo_ruta ?? null,

        ruta_aplica: true,

        cod_estado: fila.cod_estado ?? 1,

        ...(esTerrestre
          ? {
              cod_ciudad: fila.ciudad?.value ?? fila.cod_ciudad ?? null,

              cod_puntoenlace: null,
              cod_tipo_puntoenlace: null,
            }
          : {
              cod_ciudad: null,

              cod_puntoenlace: fila.punto_enlace?.value ?? fila.cod_puntoenlace ?? null,

              cod_tipo_puntoenlace:
                fila.tipo_puntoenlace?.value ?? fila.cod_tipo_puntoenlace ?? null,
            }),
      };
    },
    [codMetodo, esTerrestre],
  );

  const handleGuardar = React.useCallback(
    (fila: FilaMetodoPais) => {
      const payload = formatearFilaApi(fila);

      if (!payload) return;

      if (fila.cod_tarifa_ruta) {
        actualizarRuta.mutate(payload, {
          onSuccess: () => {
            setFilaEditando(null);
          },
        });

        return;
      }

      insertarRuta.mutate(payload);
    },
    [actualizarRuta, insertarRuta, formatearFilaApi],
  );

  const handleEliminar = React.useCallback(
    (fila: FilaMetodoPais) => {
      const payload = formatearFilaApi(fila);

      if (!payload) return;

      eliminarRuta.mutate(payload);
    },
    [eliminarRuta, formatearFilaApi],
  );

  const columns = React.useMemo(
    () =>
      crearPaisColumns({
        esTerrestre,
        onEditar: setFilaEditando,
        onEliminar: handleEliminar,
      }),
    [esTerrestre, handleEliminar],
  );

  return (
    <div className="space-y-4">
      <PaisForm
        value={filaEditando}
        esTerrestre={esTerrestre}
        tiposRuta={catalogosRuta.tiposRuta}
        continentes={catalogosRuta.continentes}
        paises={catalogosRuta.paises}
        tiposPuntoEnlace={catalogosRuta.tiposPuntoEnlace}
        puntosEnlace={catalogosRuta.puntosEnlace}
        ciudades={catalogosRuta.ciudades}
        onGuardar={handleGuardar}
        onCancelar={() => setFilaEditando(null)}
        isPending={insertarRuta.isPending || actualizarRuta.isPending}
      />

      <DataTable
        columns={columns}
        data={data}
        isRefreshing={rutas.isFetching}
        onRefresh={() => rutas.refetch()}
      />
    </div>
  );
}

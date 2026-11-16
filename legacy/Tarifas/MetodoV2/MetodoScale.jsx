import React from "react";
import PropTypes from "prop-types";
import { useFetchPuntosEnlace, useFetchTarifaScale } from "@/hooks/Fetch/useFetchTarifas";
import { Box, Grid } from "@mui/material";
import FormularioComponent from "@/components/Formulario/FormularioComponent";
import { useFetchMonedas, useFetchTipos } from "@/hooks/Fetch/useFetchCatalog";
import useCatalogosCotizacion from "../Cotizaciones/hooks/useCatalogosCotizacion";
import TablaEditableComponent from "@/components/Tabla/TablaEditableComponent";
import { api } from "@/api";
import { Typography } from "@mui/material";

const tipoOrigenVsTipoTransporte = {
  AEREO: "AEROPUERTO",
  MARITIMO: "PUERTO",
  TERRESTRE: "ADUANA",
};

const MetodoScale = ({ metodo }) => {
  const tiposPuntoEnlaceFetch = useFetchTipos({ tipo_tabla: "PUNTO_ENLACE" });
  const puntosEnlaceFetch = useFetchPuntosEnlace();
  const tarifaScaleFetch = useFetchTarifaScale({ cod_estado: 1, cod_metodo: metodo.cod_metodo });
  const monedasFetch = useFetchMonedas({ es_operativa: true });

  const tiposPuntoEnlace = React.useMemo(() => tiposPuntoEnlaceFetch.data || [], [tiposPuntoEnlaceFetch.data]);
  const puntosEnlace = React.useMemo(() => puntosEnlaceFetch.data || [], [puntosEnlaceFetch.data]);
  const tarifaScale = React.useMemo(() => tarifaScaleFetch.data?.filter(i => i.cod_metodo === metodo.cod_metodo) || [], [tarifaScaleFetch.data, metodo]);
  const monedas = React.useMemo(() => monedasFetch.data || [], [monedasFetch.data]);

  const findBy = (arr, key, value) => arr?.find((e) => e[key] === value) ?? null;

  const objetoBase = React.useMemo(() => {
    const tipoPuntoEnlace = tipoOrigenVsTipoTransporte[metodo.tipoTransporte?.label];
    const tipoPuntoEnlaceEncontrado = findBy(tiposPuntoEnlace, "label", tipoPuntoEnlace);

    return {
      cod_tarifa_scalling: 0,
      descripcion: null,
      cod_metodo: null,
      cod_tipo: null,
      cod_estado: null,
      tipo_puntoenlace: tipoPuntoEnlaceEncontrado,
      punto_enlace: null,
      costo: 0,
      cod_puntoenlace: null,
      cod_moneda: null,
      moneda: null,
    };
  }, [metodo.tipoTransporte?.label, tiposPuntoEnlace]);

  const handleOnInput = ({ field, value, row }) => {
    console.log("Input cambiado:", { field, value, row });
    let _row = { ...row, [field]: value };
    if (field === "tipo_puntoenlace") _row = { ...row, [field]: value };
    if (field === "punto_enlace") _row = { ...row, ...objetoBase, tipo_puntoenlace: row.tipo_puntoenlace, [field]: value };

    console.log("Fila guardada:", _row);
    return { row: _row };
  };

  const formatearFilaApi = React.useCallback(
    (fila) => ({
      cod_tarifa_scalling: fila.cod_tarifa_scalling,
      cod_metodo: metodo.cod_metodo,
      cod_puntoenlace: fila.punto_enlace?.value || null,
      costo: fila.costo,
      cod_moneda: fila.moneda?.cod_moneda || 1,
      cod_estado: fila.cod_estado || 1,
    }),
    [metodo],
  );

  const formatearFila = React.useCallback(
    (fila) => {
      const punto_enlace = puntosEnlace.find((i) => i.cod_puntoenlace == fila.cod_puntoenlace);
      return {
        ...fila,
        cod_metodo: metodo.cod_metodo,
        tipo_puntoenlace: tiposPuntoEnlace.find((m) => m.cod_tipo === punto_enlace?.cod_tipo),
        punto_enlace,
        moneda: monedas.find((m) => m.cod_moneda === fila.cod_moneda),
      };
    },
    [metodo.cod_metodo, puntosEnlace, tiposPuntoEnlace, monedas],
  );

  const datos = React.useMemo(() => tarifaScale.map(formatearFila), [formatearFila, tarifaScale]);

  const filtrarPuntosEnlace = React.useCallback(
    (row) => {
      if (!row?.tipo_puntoenlace) {
        return [];
      }
      const tipoValue = row.tipo_puntoenlace.value;

      const filtrados = puntosEnlace.filter((punto) => punto.cod_tipo === tipoValue);

      return filtrados;
    },
    [puntosEnlace],
  );

  const encabezados = React.useMemo(() => {
    const aduanaEditable = (row) => !!row?.tipo_puntoenlace;
    const headers = [
      { id: "tipo_puntoenlace", label: "Tipo", tipo: "select", options: tiposPuntoEnlace, labelOption: "label", valueOption: "value" },
      { id: "punto_enlace", label: "Aduana/Puerto/Aereopuerto", editable: aduanaEditable, tipo: "select", options: filtrarPuntosEnlace, labelOption: "label", valueOption: "value" },
      { id: "moneda", label: "Moneda", tipo: "select", options: monedas },
      { id: "costo", label: "Value", tipo: "number", textAlign: "right" },
    ];

    return headers;
  }, [tiposPuntoEnlace, filtrarPuntosEnlace, monedas]);

  const eliminarFila = React.useCallback(
    async (id, row) => await api.post("api/appweb/actualizar-tarifa-scalling", { ...formatearFilaApi(row), cod_estado: 4 }).then((i) => tarifaScaleFetch.refetch()),
    [tarifaScaleFetch, formatearFilaApi],
  );
  const guardar = React.useCallback(
    async (id, row) => await api.post("api/appweb/actualizar-tarifa-scalling", { ...formatearFilaApi(row) }).then((i) => tarifaScaleFetch.refetch()),
    [tarifaScaleFetch, formatearFilaApi],
  );
  const agregar = React.useCallback(
    async (id, row) => await api.post("api/appweb/insertar-tarifa-scalling", { ...formatearFilaApi(row) }).then((i) => tarifaScaleFetch.refetch()),
    [tarifaScaleFetch, formatearFilaApi],
  );

  if (!metodo) return <div>Cargando...</div>;
  return (
    <TablaEditableComponent
      idKey="cod_tarifa_scalling"
      data={datos}
      encabezados={encabezados}
      objetoBase={objetoBase}
      acciones={{ add: true, delete: true }}
      onInput={handleOnInput}
      onRowAdded={agregar}
      onRowDeleted={eliminarFila}
      onRowUpdated={guardar}
      textoAlertaEliminacion={(id) => {
        let l = datos.find((i) => i.cod_tarifa_scalling === id);
        return (
          <>
            <Typography>
              Esta por anular el ruta
              <Typography variant="span" fontSize={20} color="error">
                <b>{l?.descripcion}</b>.
              </Typography>
              <br />
              Esto puede causar problemas a la hora mostrar las cotizaciones.
              <br />
              ¿Esta seguro que desea continuar?
            </Typography>
          </>
        );
      }}
    />
  );
};

MetodoScale.propTypes = {
  metodo: PropTypes.object,
};

export default MetodoScale;

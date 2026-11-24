import React from "react";
import PropTypes from "prop-types";
// import useCatalogosCotizacion from "../Cotizaciones/hooks/useCatalogosCotizacion";
import TablaEditableComponent from "@/components/Tabla/TablaEditableComponent";
import { api } from "@/api";
import { useFetchContinentes, useFetchPaises, useFetchTipos } from "@/hooks/Fetch/useFetchCatalog";
import { useFetchPuntosEnlace, useFetchTarifaRuta } from "@/hooks/Fetch/useFetchTarifas";
import { Typography } from "@mui/material";

const tipoOrigenVsTipoTransporte = {
  AEREO: "AEROPUERTO",
  MARITIMO: "PUERTO",
  TERRESTRE: "ADUANA",
};

const tipoDeRutaSegunCentroCosto = {
  EXPORTACIONES: "DESTINO",
  IMPORTACIONES: "ORIGEN",
};

const MetodoPais = ({ metodo }) => {
  const paisesFetch = useFetchPaises();
  const continentessFetch = useFetchContinentes();
  const tiposPuntoEnlaceFetch = useFetchTipos({ tipo_tabla: "PUNTO_ENLACE" });
  const tiposTarifaRutaFetch = useFetchTipos({ tipo_tabla: "TARIFA_RUTA" });
  const puntosEnlaceFetch = useFetchPuntosEnlace();
  const tarifasRutasFetch = useFetchTarifaRuta({ cod_estado: 1, cod_metodo: metodo?.cod_metodo });

  const paises = React.useMemo(() => paisesFetch.data || [], [paisesFetch.data]);
  const continentes = React.useMemo(() => continentessFetch.data || [], [continentessFetch.data]);
  const tiposPuntoEnlace = React.useMemo(() => tiposPuntoEnlaceFetch.data || [], [tiposPuntoEnlaceFetch.data]);
  const tipos = React.useMemo(() => tiposTarifaRutaFetch.data || [], [tiposTarifaRutaFetch.data]);
  const puntosEnlace = React.useMemo(() => puntosEnlaceFetch.data || [], [puntosEnlaceFetch.data]);
  const tarifasRutas = React.useMemo(() => tarifasRutasFetch.data?.filter(i => i.cod_metodo === metodo.cod_metodo) || [], [tarifasRutasFetch.data, metodo]);

  const findBy = (arr, key, value) => arr?.find((e) => e[key] === value) ?? null;

  const objetoBase = React.useMemo(() => {
    const tipoPuntoEnlace = tipoOrigenVsTipoTransporte[metodo.tipoTransporte?.label];
    const tipoPuntoEnlaceEncontrado = findBy(tiposPuntoEnlace, "label", tipoPuntoEnlace);

    const tipoAComparar = tipoDeRutaSegunCentroCosto[metodo.centroCosto?.label];
    const tipo = findBy(tipos, "label", tipoAComparar);

    return {
      cod_tarifa_ruta: 0,
      descripcion: null,
      valor: null,
      cod_metodo: null,
      cod_tipo: null,
      cod_estado: null,
      tipo_puntoenlace: tipoPuntoEnlaceEncontrado,
      tipo,
      continente: null,
      pais: null,
      aduana_puerto_aereopuerto: null,
    };
  }, [metodo.tipoTransporte?.label, metodo.centroCosto?.label, tiposPuntoEnlace, tipos]);

  const handleOnInput = ({ field, value, row }) => {
    console.log("Input cambiado:", { field, value, row });
    let _row = { ...row };
    if (field === "tipo") _row = { ...row, ...objetoBase, [field]: value };
    if (field === "continente") _row = { ...row, ...objetoBase, tipo: row.tipo, [field]: value };
    if (field === "pais") _row = { ...row, ...objetoBase, tipo: row.tipo, continente: row.continente, [field]: value };
    if (field === "tipo_puntoenlace") _row = { ...row, tipo: row.tipo, continente: row.continente, pais: row.pais, [field]: value };
    if (field === "aduana_puerto_aereopuerto") _row = { ...row, ...objetoBase, tipo: row.tipo, continente: row.continente, pais: row.pais, tipo_puntoenlace: row.tipo_puntoenlace, [field]: value };

    console.log("Fila guardada:", _row);
    return { row: _row };
  };

  const formatearFilaApi = React.useCallback(
    (fila) => ({
      cod_continente: fila.continente?.cod_continente ?? null,
      cod_tarifa_ruta: fila.cod_tarifa_ruta,
      cod_metodo: metodo.cod_metodo,
      cod_pais: fila.pais?.value ?? null,
      cod_puntoenlace: fila.aduana_puerto_aereopuerto?.value || null,
      cod_tipo_ruta: fila.tipo?.value,
      cod_tipo_puntoenlace: fila.cod_tipo_puntoenlace?.value || null,
      ruta_aplica: true,
      cod_estado: fila.cod_estado || 1,
    }),
    [metodo],
  );

  const formatearFila = React.useCallback(
    (fila) => ({
      ...fila,
      cod_metodo: metodo.cod_metodo,
      tipo: tipos.find((m) => m.cod_tipo === fila.cod_tipo_ruta),
      tipo_puntoenlace: tiposPuntoEnlace.find((m) => m.cod_tipo === fila.cod_tipo_puntoenlace),
      continente: continentes.find((i) => i.cod_continente === fila.cod_continente),
      pais: paises.find((i) => i.cod_pais === fila.cod_pais),
      aduana_puerto_aereopuerto: puntosEnlace.find((i) => i.cod_puntoenlace == fila.cod_puntoenlace),
    }),
    [continentes, metodo.cod_metodo, paises, puntosEnlace, tipos, tiposPuntoEnlace],
  );

  const datos = React.useMemo(() => tarifasRutas.map(formatearFila), [formatearFila, tarifasRutas]);

  const filtrarPaises = React.useCallback(
    (row) => {
      if (row.continente) {
        const puntosEnlaceContinentes = puntosEnlace
          .filter((punto) => punto.cod_continente === row.continente.value)
          .reduce((acc, pais) => {
            if (acc.some((p) => p === pais.cod_pais)) return acc;

            return [...acc, pais.cod_pais];
          }, []);
        return (paises || []).filter((p) => puntosEnlaceContinentes.some((pa) => pa === p.cod_pais));
      }
      return [];
    },
    [paises, puntosEnlace],
  );

  const filtrarPuntosEnlace = React.useCallback(
    (row) => {
      if (!row?.tipo_puntoenlace || !row?.pais) {
        // console.log(`No se puede seleccionar aduana/puerto/aereopuerto: tipo=${row?.tipo_puntoenlace}, pais=${row?.pais}, row=`, row, typeof row);
        return [];
      }

      const tipoValue = row.tipo_puntoenlace.value;
      const paisValue = row.pais.value;

      const filtrados = puntosEnlace.filter((punto) => punto.cod_tipo === tipoValue && punto.cod_pais === paisValue);

      return filtrados;
    },
    [puntosEnlace],
  );

  const encabezados = React.useMemo(() => {
    const continenteEditable = (row) => !!row?.tipo;
    const paisEditable = (row) => !!row?.tipo && !!row?.continente;
    const tipoEditable = (row) => !!row?.continente && !!row?.pais;
    const aduanaEditable = (row) => !!row?.continente && !!row?.pais && !!row?.tipo_puntoenlace;
    const headers = [
      { id: "tipo", label: "Tipo de Ruta", editable: true, tipo: "select", options: tipos, labelOption: "label", valueOption: "value", requerido: true },
      { id: "continente", label: "Continente", editable: continenteEditable, tipo: "select", options: continentes, labelOption: "label", valueOption: "value", requerido: true },
      { id: "pais", label: "Pais", editable: paisEditable, tipo: "select", options: filtrarPaises, labelOption: "label", valueOption: "value", requerido: false },
      { id: "tipo_puntoenlace", label: "Tipo", editable: tipoEditable, tipo: "select", options: tiposPuntoEnlace, labelOption: "label", valueOption: "value" },
      { id: "aduana_puerto_aereopuerto", label: "Aduana/Puerto/Aereopuerto", editable: aduanaEditable, tipo: "select", options: filtrarPuntosEnlace, labelOption: "label", valueOption: "value" },
    ];

    return headers;
  }, [tipos, continentes, filtrarPaises, tiposPuntoEnlace, filtrarPuntosEnlace]);

  const eliminarFila = React.useCallback(
    async (id, row) => await api.post("api/appweb/actualizar-tarifa-ruta", { ...formatearFilaApi(row), cod_estado: 4 }).then((i) => tarifasRutasFetch.refetch()()),
    [tarifasRutasFetch, formatearFilaApi],
  );
  const guardar = React.useCallback(
    async (id, row) => await api.post("api/appweb/actualizar-tarifa-ruta", { ...formatearFilaApi(row) }).then((i) => tarifasRutasFetch.refetch()()),
    [tarifasRutasFetch, formatearFilaApi],
  );
  const agregar = React.useCallback(
    async (id, row) => await api.post("api/appweb/insertar-tarifa-ruta", { ...formatearFilaApi(row) }).then((i) => tarifasRutasFetch.refetch()()),
    [tarifasRutasFetch, formatearFilaApi],
  );

  if (!metodo) return <div>Cargando...</div>;
  return (
    <TablaEditableComponent
      idKey="cod_tarifa_ruta"
      data={datos}
      encabezados={encabezados}
      objetoBase={objetoBase}
      acciones={{ add: true, delete: true }}
      onInput={handleOnInput}
      onRowAdded={agregar}
      onRowDeleted={eliminarFila}
      onRowUpdated={guardar}
      textoAlertaEliminacion={(id) => {
        let l = datos.find((i) => i.cod_tarifa_ruta === id);
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

MetodoPais.propTypes = {
  metodo: PropTypes.object,
};

export default MetodoPais;

import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Box, Grid, Typography } from "@mui/material";
import { api } from "../../../api";
import EditableDataGridComponent from "../../../components/Tabla/EditableDataGridComponent";
import useObtenerOpcionesAcciones from "../../../hooks/useObtenerOpcionesAcciones";
import LOADER from "../../../assets/loader_1.gif";
import TablaEditableComponent from "../../../components/Tabla/TablaEditableComponent";
import { useFetchPuntosEnlace } from "@/hooks/Fetch/useFetchTarifas";
import { useFetchContinentes, useFetchPaises, useFetchTipos } from "@/hooks/Fetch/useFetchCatalog";

const permisosBase = { ver: false, editar: false, eliminar: false, guardar: false };

const tipoOrigenVsTipoTransporte = {
  AEREO: "AEROPUERTO",
  MARITIMO: "PUERTO",
  TERRESTRE: "ADUANA",
};

const tipoDeRutaSegunCentroCosto = {
  EXPORTACIONES: "DESTINO",
  IMPORTACIONES: "ORIGEN",
};

const FormularioCompletoRutaMetodo = (props) => {
  const { metodo } = props;

  const [isLoading, setIsLoading] = useState(true);
  const [rutas, setRutas] = useState([]);
  const [rutasConsultado, setRutasConsultado] = useState([]);
  // const [paises, setPaises] = useState([]);
  const paisesFetch = useFetchPaises();
  const continentessFetch = useFetchContinentes();
  const tiposPuntoEnlaceFetch = useFetchTipos({ tipo_tabla: "PUNTO_ENLACE" });
  const tiposTarifaRutaFetch = useFetchTipos({ tipo_tabla: "TARIFA_RUTA" });

  // const [tiposPuntoEnlace, setTiposPuntoEnlace] = useState([]);
  const puntosEnlaceFetch = useFetchPuntosEnlace();
  const [filaSeleccionada, setFilaSeleccionada] = useState(null);
  const { permisosArray } = useObtenerOpcionesAcciones();

  const paises = React.useMemo(() => paisesFetch.data || [], [paisesFetch.data]);
  const continentes = React.useMemo(() => continentessFetch.data || [], [continentessFetch.data]);
  const tiposPuntoEnlace = React.useMemo(() => tiposPuntoEnlaceFetch.data || [], [tiposPuntoEnlaceFetch.data]);
  const tipos = React.useMemo(() => tiposTarifaRutaFetch.data || [], [tiposTarifaRutaFetch.data]);

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
  }, [metodo.tipoTransporte?.label, metodo.tipo?.label, tiposPuntoEnlace, tipos]);

  // // DEBUG
  // useEffect(() => {
  //   console.log("=== DEBUG ACTUALIZADO ===");
  //   console.log("Tipos:", tipos?.length);
  //   console.log("Paises:", paises?.length);
  //   console.log("TiposPuntoEnlace:", tiposPuntoEnlace?.length);
  //   console.log("PuntosEnlace:", puntosEnlace?.length);
  //   console.log("========================");
  // }, [tipos, paises, tiposPuntoEnlace, puntosEnlace]);

  // ENCABEZADOS CORREGIDOS
  const encabezados = useMemo(() => {
    const headers = [
      {
        id: "tipo",
        label: "Tipo de Ruta",
        editable: true,
        tipo: "select",
        options: tipos,
        labelOption: "label",
        valueOption: "value",
        requerido: true,
      },
      {
        id: "continente",
        label: "Continente",
        editable: (row) => !!row?.tipo,
        tipo: "select",
        options: continentes,
        labelOption: "label",
        valueOption: "value",
        requerido: true,
      },
      {
        id: "pais",
        label: "Pais",
        editable: (row) => !!row?.tipo && !!row?.continente,
        tipo: "select",
        options: (row) => {
          if (row.continente) {
            const puntosEnlaceContinentes = puntosEnlaceFetch.data
              .filter((punto) => punto.cod_continente === row.continente.value)
              .reduce((acc, pais) => {
                if (acc.some((p) => p === pais.cod_pais)) return acc;

                return [...acc, pais.cod_pais];
              }, []);
            return (paises || []).filter((p) => puntosEnlaceContinentes.some((pa) => pa === p.cod_pais));
          }
          return [];
        },
        labelOption: "label",
        valueOption: "value",
        requerido: false,
      },
      {
        id: "tipo_puntoenlace",
        label: "Tipo",
        editable: (row) => !!row?.pais,
        tipo: "select",
        options: tiposPuntoEnlace,
        labelOption: "label",
        valueOption: "value",
      },
      {
        id: "aduana_puerto_aereopuerto",
        label: "Aduana/Puerto/Aereopuerto",
        editable: (row) => !!row?.tipo_puntoenlace && !!row?.pais,
        tipo: "select",
        options: (row) => {
          if (!row?.tipo_puntoenlace || !row?.pais) {
            // console.log(`No se puede seleccionar aduana/puerto/aereopuerto: tipo=${row?.tipo_puntoenlace}, pais=${row?.pais}, row=`, row, typeof row);
            return [];
          }

          const tipoValue = row.tipo_puntoenlace.value;
          const paisValue = row.pais.value;

          const filtrados = puntosEnlaceFetch.data.filter((punto) => punto.cod_tipo === tipoValue && punto.cod_pais === paisValue);

          return filtrados;
        },
        labelOption: "label",
        valueOption: "value",
      },
    ];

    return headers;
  }, [tipos, continentes, tiposPuntoEnlace, paises, puntosEnlaceFetch.data]);

  const datosObligatorios = useMemo(() => {
    const segunTipo = filaSeleccionada?.row?.tipo?.cod_tipo_dato === 2 ? { descripcion: "Descripcion" } : { valor: "Valor" };

    const datosObligatorios = {
      tipo: "Tipo de Ruta",
      pais: "Pais",
    };

    if (filaSeleccionada?.row?.tipo_puntoenlace) {
      datosObligatorios.aduana_puerto_aereopuerto = "Aduana/Puerto/Aereopuerto";
    }
    return datosObligatorios;
  }, [filaSeleccionada]);

  const formatearFilaTabla = useCallback(
    (fila) => ({
      ...fila,
      cod_metodo: metodo.cod_metodo,
      tipo: tipos.find((m) => m.cod_tipo === fila.cod_tipo_ruta),
      tipo_puntoenlace: tiposPuntoEnlace.find((m) => m.cod_tipo === fila.cod_tipo_puntoenlace),
      continente: continentes.find((i) => i.cod_continente === fila.cod_continente),
      pais: paises.find((i) => i.cod_pais === fila.cod_pais),
      aduana_puerto_aereopuerto: puntosEnlaceFetch.data.find((i) => i.cod_puntoenlace == fila.cod_puntoenlace),
    }),
    [metodo, tipos, continentes, paises, tiposPuntoEnlace, puntosEnlaceFetch.data],
  );
  const formatearFilaApi = useCallback(
    (fila) => {
      const filaConFormato = {
        cod_continente: fila.continente?.cod_continente ?? null,
        cod_tarifa_ruta: fila.cod_tarifa_ruta,
        cod_metodo: metodo.cod_metodo,
        cod_pais: fila.pais?.value ?? null,
        cod_puntoenlace: fila.aduana_puerto_aereopuerto?.value || null,
        cod_tipo_ruta: fila.tipo?.value,
        cod_tipo_puntoenlace: fila.cod_tipo_puntoenlace?.value || null,
        ruta_aplica: true,
        cod_estado: fila.cod_estado || 1,
      };

      return filaConFormato;
    },
    [metodo],
  );
  const datos = useMemo(() => rutas.map(formatearFilaTabla), [formatearFilaTabla, rutas]);
  const obtenerAccionesSegunPermisos = useMemo(() => {
    let item = permisosArray.find((i) => i.nom_opcion === "Identificaciones");
    return {
      ...permisosBase,
      add: true, // item?.acciones.some((i) => i.cod_accion === 3),
      view: false, // item?.acciones.some((i) => i.cod_accion === 1),
      // edit: true, // item?.acciones.some((i) => i.cod_accion === 2),
      save: true, // item?.acciones.some((i) => i.cod_accion === 2),
      delete: true, // item?.acciones.some((i) => [5, 4].includes(i.cod_accion)),
    };
  }, [permisosArray]);

  const obtenerTipos = useCallback(async () => {
    // await api.get("/api/appweb/lista-tipo", { params: { tipo_tabla: "TARIFA_RUTA" } }).then(({ data }) => setTipos(data.data.map((i) => ({ ...i, value: i.cod_tipo, label: i.nom_tipo }))));
    // await api.get("/api/appweb/lista-tipo", { params: { tipo_tabla: "PUNTO_ENLACE" } }).then(({ data }) => setTiposPuntoEnlace(data.data.map((i) => ({ ...i, value: i.cod_tipo, label: i.nom_tipo }))));
  }, []);
  // const obtenerPaises = useCallback(async () => {
  //   await api.get("/api/appweb/listapaises", { params: { tipo_tabla: "TARIFA_RUTA" } }).then(({ data }) => setPaises(data.data.map((i) => ({ ...i, value: i.cod_pais, label: i.nombre_pais }))));
  // }, []);
  const obtenerRutasMetodo = useCallback(async (metodo) => {
    if (metodo.cod_metodo)
      await api
        .get("/api/appweb/lista-tarifa-ruta", { params: { cod_metodo: metodo.cod_metodo, cod_estado: 1 } })
        .then(({ data }) => {
          setRutas(data.data.map(formatearFilaTabla));
          setRutasConsultado(data.data.map(formatearFilaTabla));
        })
        .catch((e) => console.error(e));
    else {
      setRutas([]);
      setRutasConsultado([]);
    }
  }, []);
  const consultar = useCallback(async () => {
    await Promise.all([obtenerTipos(), obtenerRutasMetodo(metodo)]);
  }, [metodo, obtenerTipos, obtenerRutasMetodo]);

  useEffect(() => {
    setIsLoading(true);
    consultar().finally(() => setIsLoading(false));
  }, [consultar]);

  const eliminarFila = useCallback(async (row) => await api.post("api/appweb/actualizar-tarifa-ruta", { ...row, cod_estado: 4 }).then((i) => consultar()), [consultar]);
  const guardar = useCallback(async (row) => await api.post("api/appweb/actualizar-tarifa-ruta", { ...row }).then((i) => consultar()), [consultar]);
  const agregar = useCallback(async (row) => await api.post("api/appweb/insertar-tarifa-ruta", { ...row }).then((i) => consultar()), [consultar]);

  if (isLoading) return <Box component="img" src={LOADER} sx={{ maxWidth: { xs: "90%" }, mx: "auto" }} />;

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

  return (
    <Grid container>
      <Grid width="100%">
        <TablaEditableComponent
          idKey="cod_tarifa_ruta"
          acciones={obtenerAccionesSegunPermisos}
          data={datos}
          encabezados={encabezados}
          objetoBase={objetoBase}
          columnaAExtender={[0, 1, 2, 3]}
          onRowAdded={(id, row) => agregar(formatearFilaApi(row))}
          onRowDeleted={(id, row) => eliminarFila(formatearFilaApi(row))}
          onRowUpdated={(id, row) => guardar(formatearFilaApi(row))}
          onInput={handleOnInput}
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
      </Grid>
      {/* DEBUG INFO */}
      {/* <Grid container>
        <Grid size={12}>
          <Typography variant="h6">Debug Info:</Typography>
          <Typography>Tipos: {tipos.length}</Typography>
          <Typography>Paises: {paises.length}</Typography>
          <Typography>Tipos Punto Enlace: {tiposPuntoEnlace.length}</Typography>
          <Typography>Puntos Enlace: {puntosEnlace.length}</Typography>
        </Grid>
      </Grid> */}
      <Grid container>
        {/* <pre>{JSON.stringify(filaSeleccionada, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(tipos, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(rutas, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(datos, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(metodo, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(puntosEnlace, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(continentes, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(puntosEnlaceFetch.data, null, 2)}</pre> */}
      </Grid>
    </Grid>
  );
};

FormularioCompletoRutaMetodo.propTypes = {
  metodo: PropTypes.object,
  reConsultar: PropTypes.func,
};

export default FormularioCompletoRutaMetodo;

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Grid, Typography } from "@mui/material";
import { api } from "../../api";
import { decryptId } from "../../api/encryptDecrypt";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { apagarCarga, encenderCarga } from "../../store/slices/status/statusSlice";
import PropTypes from "prop-types";
import TablaEditableActividades from "../../views/Actividades/TablaEditableActividades";

const ListaEditableActividades = (props) => {
  let { fecha, obtenerFilaSeleccionada, currentDate, entidades, catalogos } = props;
  const { nombre, cod_usuario, json } = useSelector((state) => state.auth);
  /**
   * USE STATE
   * Lista de States
   */
  //lista de datos consultados a base de datos
  const dispatch = useDispatch();
  const [datos, setDatos] = useState([]);
  const [estados, setEstados] = useState([]);
  //   const [entidades, setEntidades] = useState([]);
  const [actividades, setActividades] = useState([]);
  const [actividadesSinGuardar, setActividadesSinGuardar] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [tipos, setTipos] = useState();
  // const [valores, setValores] = useState({ filtro1: ""  , filtro2: ""   });
  /**
   * USE MEMO
   * Estados manejados con ahorro de memoria
   */
  // LISTA FILTRADA
  const lista = useMemo(
    // () => actividades.map((i) => ({ ...i, estado: estados.find((e) => i.cod_estado === e.cod_estado) })),
    () =>
      actividades[
        // .filter(i => {})
        (actividades, estados) /*, valores */
      ]
  );
  const convertKeysToLowerCase = (obj) => {
    if (Array.isArray(obj)) {
      return obj.map((v) => convertKeysToLowerCase(v));
    } else if (obj !== null && obj.constructor === Object) {
      return Object.keys(obj).reduce((acc, key) => {
        acc[key.toLowerCase()] = convertKeysToLowerCase(obj[key]);
        return acc;
      }, {});
    }
    return obj;
  };

  /**
   * CONSULTA DE DATOS
   * Consulta a base de datos de la lista
   */
  const obtenerTipos = useCallback(async () => {
    await api
      .get("api/appweb/lista-tipo")
      .then(({ data }) => setTipos(data.data))
      .catch((e) => console.error(e));
  }, []);
  const obtenerConfiguraciones = useCallback(async () => {
    await api
      .get("api/appweb/lista-configuracion-actividad", {
        params: { cod_cc: JSON.parse(decryptId(sessionStorage.getItem("currentCentroCosto"))).cod_cc || null, cod_estado: 1 },
      })
      .then(({ data }) => {
        console.log("configs", data.data);
        setConfigs(data.data.filter((config) => config.solo_resultado));
      })
      .catch((e) => console.error(e));
  }, []);
  //  Obtener el catalogo de estados
  const obtenerActividades = useCallback(async () => {
    await api
      .get("api/appweb/lista-actividades2", {
        params: { fecha_programada: fecha, cod_asesor: cod_usuario },
      })
      .then(({ data }) =>
        setActividades(
          data.data.map((actividad) => {
            const contacto = actividad.contacto ? JSON.parse(actividad.contacto) : null;
            const resultado = actividad.resultado ? JSON.parse(actividad.resultado) : null;
            console.log(resultado);
            const indice_res = indiceResultadoReferencia(resultado ? resultado : []);
            // const indice_res = 0
            return {
              ...actividad,
              contacto: contacto ? convertKeysToLowerCase(contacto[0]) : null,
              [resultado ? resultado[indice_res].ABREVIATURA : "NO_RES"]: true,
              comentario: resultado ? resultado[indice_res].DESCRIPCION : null,
              fecha_seguimiento: resultado ? resultado[indice_res].FECHA_PROGRAMADA : null,
              referencia: resultado ? resultado[indice_res].REFERENCIA : null,
            };
          })
        )
      )
      .catch((e) => console.error(e));
  }, [fecha]);

  const indiceResultadoReferencia = (resultados) => {
    let index = resultados.findIndex((item) => item.REFERENCIA);
    return index !== -1 ? index : 0;
  };

  const hacerConsultas = useCallback(async () => {
    await Promise.all([obtenerConfiguraciones(), obtenerActividades(), obtenerTipos()]).then(() => dispatch(apagarCarga()));
  }, [obtenerConfiguraciones, obtenerActividades, obtenerTipos, dispatch]);
  useEffect(() => {
    hacerConsultas();
  }, [hacerConsultas]);
  useEffect(() => {
    dispatch(encenderCarga());
  }, [dispatch]);

  const actividades_ = useMemo(() => {
    const tipos = configs.map((tipo) => tipo.nom_tipo_actividad);
    return [...actividades].filter((actividad) => !tipos.includes(actividad.nom_tipo));
  }, [actividades, configs]);

  return (
    <Box sx={{ p: 1, m: 0 }}>
      <TablaEditableActividades lista={actividades_} catalogos={{ ...catalogos, configs, estados, tipos }} currentDate={currentDate} reConsultar={obtenerActividades} />
    </Box>
  );
};
ListaEditableActividades.propTypes = {
  // ELEMENTO
  //   tipo: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  //   entidad_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  //   entidad: PropTypes.object,
  //   obtenerFilaSeleccionada: PropTypes.func,
};
export default ListaEditableActividades;

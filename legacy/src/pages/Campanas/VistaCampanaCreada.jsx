import React, { useEffect, useState, useCallback, useMemo, version } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, Typography, Grid, Button, Icon, CircularProgress, ImageList, ImageListItem } from "@mui/material";
import { api } from "../../api";
import { CardCampana } from "../../views/Campanas/CardCampana";
import propTypes from "prop-types";
import { useDispatch } from "react-redux";
import { apagarCarga, encenderCarga } from "../../store/slices/status/statusSlice";
import TabComponent from "../../components/Tabs/TabComponent";
import ListaEditableCampanas from "./ListaEditableCampanas";
import { TablaActividadesCampana } from "../../views/Actividades/TablaActividadesCampana";
import { proceso_campana } from "./proceso_campana";
import { useSelector } from "react-redux";
import StepperComponent from "../../components/Stepper/StepperComponent";
import useObtenerOpcionesAcciones from "../../hooks/useObtenerOpcionesAcciones";

export const VistaCampanaCreada = (props) => {
  const dispatch = useDispatch();
  const { json, cod_usuario } = useSelector((state) => state.auth);
  const { permisosArray, catalogoArray } = useObtenerOpcionesAcciones();
  const { dataGet, catalogos } = props;
  const { entidades = [], empresas = [], estados, paises = [], ciudades, industrias, tipos = [], cencos = [], empleados = [] } = catalogos;
  const [data, setData] = useState(null);
  const [actividades, setActividades] = useState([]);
  const [updateData, setUpdateData] = useState(0);

  const [indexEstadoActual, setIndexEstadoActual] = useState(0);
  const [estado, setEstado] = useState({
    cod_estado: 37,
    estado_desc: "EN PROCESO",
    cod_tipo: 66,
    nom_tipo: "CAMPANA",
  });

  const aprobar = permisosArray?.find((opcion) => opcion.nom_opcion == "Información")?.acciones?.find((accion) => accion.nom_accion == "Aprobar");

  useEffect(() => {
    if (dataGet) {
      console.log(dataGet);
      // const pais_origen = paises?.find((pais) => pais.cod_pais == dataGet?.pais_origen)
      // const pais_destino = paises?.find((pais) => pais.cod_pais == dataGet?.pais_destino)
      const tipo_transporte = tipos?.find((tipo) => tipo.cod_tipo == dataGet?.tipo_transporte);
      const tipo_entidad = tipos?.find((tipo) => tipo.cod_tipo == dataGet?.tipo_entidad);
      const tipo_actividad = tipos?.find((tipo) => tipo.cod_tipo == dataGet?.tipo_actividad);
      setData({
        ...dataGet,
        tipo_entidad_desc: tipo_entidad?.nom_tipo,
        tipo_transporte_desc: tipo_transporte?.nom_tipo,
        // pais_origen: dataGet?.pais_origen ? JSON.parse(dataGet?.pais_origen) : [],
        // pais_destino: dataGet?.pais_destino ? JSON.parse(dataGet?.pais_destino) : [],
        tipo_actividad_desc: tipo_actividad?.nom_tipo,
        // cod_pais_origen: pais_origen?.ref_pais_2,
        // cod_pais_destino: pais_destino?.ref_pais_2
      });
      setEstado(proceso_campana.find((estado) => estado.cod_estado === dataGet.cod_estado));
      setIndexEstadoActual(proceso_campana.findIndex((estado) => estado.cod_estado === dataGet.cod_estado));
    }
  }, [dataGet, entidades, empleados, empresas, cencos, tipos]);

  const obtenerActividades = useCallback(async () => {
    if (dataGet?.cod_emp && dataGet?.cod_cc && dataGet?.cod_campana) {
      const resultados = await api.get("api/appweb/estado-actividades-campanas", {
        params: {
          cod_emp: dataGet?.cod_emp,
          cod_cenco: dataGet?.cod_cc,
          cod_campana: dataGet?.cod_campana,
        },
      });
      await api
        .get("api/appweb/lista-actividades-campanas", {
          params: {
            cod_emp: dataGet?.cod_emp,
            cod_cenco: dataGet?.cod_cc,
            cod_campana: dataGet?.cod_campana,
          },
        })
        .then(async ({ data }) => {
          let temp_actividades = data.data;
          setActividades(
            temp_actividades.map((actividad) => ({
              ...actividad,
              estado_res: resultados.data.data.find((res) => res.entidad_id == actividad.cod_cliente).total > 0 ? "COMPLETADA" : "EN PROGRESO",
            }))
          );
        })
        .catch((e) => console.error(e));
    }
  }, [dataGet, updateData]);
  // Realizar la consulta
  const hacerConsultas = useCallback(async () => {
    await Promise.all([obtenerActividades()]).then(() => dispatch(apagarCarga()));
  }, [obtenerActividades, dispatch]);
  useEffect(() => {
    hacerConsultas();
  }, [hacerConsultas]);
  useEffect(() => {
    dispatch(encenderCarga());
  }, [dispatch]);

  const actividades_ = useMemo(
    () =>
      actividades.map((actividad) => {
        const curr_empleado = empleados.find((empleado) => actividad.cod_asesor == empleado.cod_usuario);
        return {
          ...actividad,
          nombre_asesor: curr_empleado ? `${curr_empleado.nom_empleado} ${curr_empleado.apellido_emp}` : "",
          propiedadesDeTabla: {
            estado_res: {
              color: actividad.estado_res == "COMPLETADA" ? "green.main" : "orange.main",
              bold: 1,
            },
          },
          accionesDeTabla: { view: true },
        };
      }),
    [actividades, empleados]
  );

  const cambiarEstadoOportunidad = (estado) => {
    api
      .post("api/appweb/actualizar-campana", {
        ...data,
        cod_tipo_entidad: data.tipo_entidad,
        cod_estado: estado.cod_estado,
        cod_transporte: data.tipo_transporte,
        cod_tipo_actividad: data.tipo_actividad,
        cod_pais_origen: data.pais_origen,
        cod_pais_destino: data.pais_destino,
      })
      .then(({ data }) => {
        if (data.data.mensaje == "Campana actualizada correctamente") {
          setEstado(estado);
        } else {
          console.error(data.data.mensaje);
        }
      })
      .catch((e) => console.error(e));
  };

  return data ? (
    <Box sx={{ px: 1, py: 2, m: 0 }}>
      <Box sx={{ pb: 1 }}>
        <StepperComponent
          sx={{ my: 1 }}
          estados={proceso_campana}
          siguienteProps={{
            onClick: (estado) => {
              cambiarEstadoOportunidad(estado);
              setIndexEstadoActual(indexEstadoActual + 1);
            },
            disabled: !aprobar,
            label: "Avanzar",
          }}
          anteriorProps={{
            onClick: (estado) => {
              if (indexEstadoActual > 0) {
                cambiarEstadoOportunidad(proceso_campana[indexEstadoActual - 1]);
                setIndexEstadoActual(indexEstadoActual - 1);
              }
            },
            // disabled: false,
            disabled: !aprobar,
            label: "Retroceder",
          }}
          autorizarProps={{
            onClick: () => {
              console.log("autorizarProps");
            },
            disabled: false,
            label: undefined,
          }}
          estado={estado.cod_estado}
          propiedades={{ id: "cod_estado", label: "estado_desc" }}
        />
        <CardCampana campana={data} catalogos={catalogos} />
        {actividades.length == 0 ? (
          <ListaEditableCampanas campana={data} catalogos={catalogos} currentDate={new Date()} updateData={updateData} setUpdateData={setUpdateData} />
        ) : (
          <TablaActividadesCampana datos={actividades_} />
        )}
      </Box>
    </Box>
  ) : (
    <Box sx={{ display: "flex", width: "90vw", height: "85vh", justifyContent: "center", alignItems: "center", color: "primary" }}>
      <CircularProgress />
    </Box>
  );
};

// VistaCampanaCreada.propTypes = {
//     dataGet: propTypes.object,
//     catalogos: PropTypes.object,
//     setUpdateData: propTypes.func,
//     updateData: PropTypes.any
// };

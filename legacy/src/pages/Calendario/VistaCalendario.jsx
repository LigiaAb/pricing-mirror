import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Box, Typography, Grid, Button, Icon, ButtonGroup } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import CalendarioComponent from "../../components/CalendarioComponent/CalendarioComponent";
import CardActividadComponent from "../../components/CalendarioComponent/CardActividadComponent";
import CodigosColorComponent from "../../components/CalendarioComponent/CodigosColorComponent";
import { colores_actividad, colores_estados, iconos_actividad } from "../../theme/colores_actividad";
import AcordeonComponent2 from "../../components/AcordeonComponent/AcordeonComponent2";
import { encryptId, decryptId } from "../../api/encryptDecrypt";
import TabComponent from "../../components/Tabs/TabComponent";
import useObtenerOpcionesAcciones from "../../hooks/useObtenerOpcionesAcciones";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { apagarCarga, encenderCarga } from "../../store/slices/status/statusSlice";
import { ListaActividades2 } from "../Actividades/ListaActividades2";
import { VistaActividadesDia } from "../Actividades/VistaActividadesDia";
import CalendarioSemanaComponent from "../../components/CalendarioComponent/CalendarioSemanaComponent";
import CardActividadComponent2 from "../../components/CalendarioComponent/CardActividadComponent2";
import DialogComponent from "../../components/Dialog/DialogComponent";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import generarPDFCalendario from "../../utils/GeneradorPDF/_generador_seguimiento_actividades_calendario";
import moment from "moment";
import { useListarCotizacionesConfirmadasCalendario } from "../../hooks/Fetch/useFetchEmbarques";
import { useFetchConteoActividades } from "../../hooks/Fetch/useFetchActividades";

export const VistaCalendario = () => {
  const { nombre, cod_usuario, json } = useSelector((state) => state.auth);
  const { currentEmpresa, currentCentroCosto } = useSelector((state) => state.menu);
  const { fontSize, themeMode, opositeMode } = useSelector((state) => state.theme);
  const { permisosArray, catalogoArray } = useObtenerOpcionesAcciones();
  const informacionDeUsuario = useSelector((state) => state.auth);
  const [currentFecha, setCurrentFecha] = useState(null);
  const conteoActividades = useFetchConteoActividades({
    cod_usuario,
    fecha_inicial: currentFecha ? moment(currentFecha)?.startOf("month").toDate() : undefined,
    fecha_final: currentFecha ? moment(currentFecha)?.endOf("month").toDate() : undefined,
  });
  useEffect(() => {
    conteoActividades.refetch();
  }, [currentFecha]);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [openColores, setOpenColores] = useState(true);
  const [openColoresSem, setOpenColoresSem] = useState(true);
  const [actividades, setActividades] = useState([]);
  const [entidades, setEntidades] = useState([]);
  const [configuracion, setConfiguracion] = useState([]);
  const [datos, setDatos] = useState([]);
  const [mostrarFiltroFechas, setMostrarFiltroFechas] = useState(false);
  const [fechasReporte, setFechasReporte] = useState({ fechaInicio: null, fechaFin: null });
  const [accionesDeTabla, setAccionesDeTabla] = useState({
    add: false,
    view: true,
    go: false,
    copy: false,
    paste: false,
    auth: false,
    edit: false,
    excel: false,
    pdf: false,
    download: false,
    delete: false,
  });

  const [filtroEstado, setFiltroEstado] = useState(
    Object.entries(colores_estados).map(([key, value]) => ({
      label: key,
      value: value,
      activo: true,
    })),
  );

  // const [filtroActividades, setFiltroActividades] = useState(
  //   Object.entries(colores_actividad).map(([key, value]) => ({
  //     label: key,
  //     value: value,
  //     activo: true,
  //   })),
  // );

  const [filtroActividades, setFiltroActividades] = useState([]);

  const verTodo = permisosArray?.find((opcion) => opcion.nom_opcion == "Lista de Actividades")?.acciones?.find((accion) => accion.nom_accion == "Ver Todo");

  const [cambiarVista, setCambiarVista] = useState(localStorage.getItem("vistaCalendario") || "mes");

  // Hook para obtener seguimientos CTS para el calendario (solo los creados por el usuario actual)
  const { data: seguimientosCTS = [] } = { data: [] }/* useListarCotizacionesConfirmadasCalendario(cod_usuario) */;

  // --------------------------CONSULTAS
  const obtenerActividadesParaReporte = useCallback(async () => {
    await api.get("/api/appweb/lista-actividades2", { params: { cod_asesor: informacionDeUsuario?.cod_usuario } }).then(({ data }) => setDatos(data.data));
  }, [informacionDeUsuario]);

  const obtenerActividades = useCallback(async () => {
    await api
      .get("api/appweb/lista-actividades", {
        params: {
          cod_asesor: informacionDeUsuario?.cod_usuario,
        },
      })
      .then(({ data }) => setActividades(data.data))
      .catch((e) => console.error(e));
  }, [cambiarVista]);

  const obtenerEntidades = useCallback(async () => {
    let lista_entidades = [];
    let tipos_entidades = ["PROVEEDOR", "CLIENTE", "PRE-CLIENTE", "DSV", "PRE-PROVEEDOR"];

    for (let tipo in tipos_entidades) {
      await api
        // .get("api/appweb/lista-entidad ", { params: { tipo_entidad: tipos_entidades[tipo].nom_tipo } })
        .get("api/appweb/lista-entidad-simplificada", { params: { tipo_entidad: tipos_entidades[tipo] } })
        .then(({ data }) => {
          lista_entidades = lista_entidades.concat(data.data.data);
        })
        .catch((e) => console.error(e));
    }

    setEntidades(lista_entidades);
  }, []);

  const obtenerConfiguraciones = useCallback(async () => {
    console.log(currentCentroCosto)
    const lista_config = await api
      .get("api/appweb/lista-configuracion-actividad", {
          params: { cod_cc: currentCentroCosto.cod_cc, cod_estado: 1 }
      })
      .then(({ data }) => { return data.data})
      .catch((e) => console.error(e));

    setConfiguracion(lista_config.map(actividad => ({...actividad, activo: true,})))
  }, []);

  // Realizar la consulta
  const hacerConsultas = useCallback(async () => {
    await Promise.all([obtenerActividades(), obtenerEntidades(), obtenerActividadesParaReporte(), obtenerConfiguraciones()]).then(() => dispatch(apagarCarga()));
  }, [obtenerActividades, obtenerEntidades, obtenerActividadesParaReporte, obtenerConfiguraciones, dispatch]);

  useEffect(() => {
    hacerConsultas();
  }, [hacerConsultas]);

  useEffect(() => {
    dispatch(encenderCarga());
  }, [dispatch]);

  // -------------------------- FUNCIONES

  const toggleEstados = ({ label, value, activo }) => {
    console.log("click", label);
    setFiltroEstado((ant) =>
      ant.map((estado) => ({
        ...estado,
        activo: estado.label == label ? !estado.activo : estado.activo,
      })),
    );
  };

  const toggleActividades = ({ cod_tipo, label, value, activo }) => {
    setConfiguracion((ant) =>
      ant.map((actividad) => ({
        ...actividad,
        activo: actividad.cod_tipo_actividad == cod_tipo ? !actividad.activo : actividad.activo,
      })))
  };

  // Combinar actividades normales con seguimientos CTS
  const todasLasActividades = useMemo(() => {
    return [...actividades, ...seguimientosCTS];
  }, [actividades, seguimientosCTS]);

  const actividades_filtradas = useMemo(() => {
    const lista_estados = filtroEstado.filter((estado) => estado.activo).map((estado) => estado.label);
    const lista_tipos = configuracion.filter((tipo) => tipo.activo).map((tipo) => tipo.cod_tipo_actividad);
    console.log(lista_tipos)
    
    return todasLasActividades
      .filter((actividad) => lista_estados.includes(actividad.estado_desc) && lista_tipos.includes(actividad.cod_tipo))
      .filter((actividad) => actividad.cod_asesor == informacionDeUsuario?.cod_usuario);
  }, [todasLasActividades, filtroEstado, configuracion, informacionDeUsuario]);

  // Handler para click en actividad del calendario
  const handleClickActividad = useCallback(
    (actividad) => {
      if (actividad.es_seguimiento_cts) {
        // Para seguimientos CTS: redirigir a cotizaciones aprobadas con el ID
        navigate(`/embarques/embarques/crear-embarques?id=${actividad.cod_cotizacion_cabecera}`);
        return;
      }
      // Para actividades normales: navegar con ruta relativa
      navigate(encryptId(actividad.cod_actividad));
    },
    [navigate],
  );

  return (
    <Box sx={{ px: 2, m: 0, padding: { xs: 1, md: 2 } }}>
      <Box sx={{ pb: 1 }}>
        <TabComponent
          tabInicial={catalogoArray?.filter((o) => o.nivel_opcion === "E")[0]?.cod_opcion || null}
          opciones={[
            ...(catalogoArray
              .filter((o) => o.nivel_opcion === "E")
              .map((o) => ({
                id: o.cod_opcion,
                label: o.nom_opcion,
                icono: o.ico_opcion,
                disabled: !permisosArray.find((pa) => pa.cod_opcion === o.cod_opcion),
                content:
                  o.nom_opcion === "Calendario" ? (
                    <Grid container direction="row" width="100%">
                      <Grid size="grow"></Grid>
                      <Grid size="auto">
                        <ButtonGroup>
                          <Button
                            variant={cambiarVista == "mes" ? "contained" : "outlined"}
                            sx={{ mb: 1 }}
                            onClick={() => {
                              setCambiarVista("mes");
                              localStorage.setItem("vistaCalendario", "mes");
                            }}
                          >
                            Mes
                          </Button>
                          <Button
                            variant={cambiarVista == "semana" ? "contained" : "outlined"}
                            sx={{ mb: 1 }}
                            onClick={() => {
                              setCambiarVista("semana");
                              localStorage.setItem("vistaCalendario", "semana");
                            }}
                          >
                            Semana
                          </Button>
                          <Button
                            variant={cambiarVista == "dia" ? "contained" : "outlined"}
                            sx={{ mb: 1 }}
                            onClick={() => {
                              setCambiarVista("dia");
                              localStorage.setItem("vistaCalendario", "dia");
                            }}
                          >
                            Dia
                          </Button>
                        </ButtonGroup>
                      </Grid>
                      {cambiarVista == "mes" ? (
                        <Grid container direction="row" width="100%">
                          <Grid size={12}>
                            <AcordeonComponent2
                              expandido={openColores}
                              expandir={() => setOpenColores(!openColores)}
                              titulo={
                                <Grid container direction="row" color="white.main" width="100%" alignItems="center" p={0.5}>
                                  <Grid size="auto" px={0.5} sx={{ display: "flex", justifyContent: "center" }}>
                                    <Icon
                                      sx={{
                                        transform: `rotate(${openColores ? 90 : 0}deg)`,
                                        transition: "transform 0.3s ease",
                                      }}
                                      className={" c-derecha-simple"}
                                    />
                                  </Grid>
                                  <Grid size="grow" px={0.5}>
                                    <Typography variant="h6">Filtros</Typography>
                                  </Grid>
                                </Grid>
                              }
                              cuerpo={
                                <Grid container justifyItems="center" spacing={2}>
                                  <Grid
                                    size={6}
                                    sx={{
                                      p: 1,
                                      bgcolor: themeMode === "dark" ? "grey.800" : "blueGrey.50",
                                      color: themeMode === "dark" ? "white.main" : "black.main",
                                      borderRadius: 2.5,
                                    }}
                                  >
                                    <Typography fontSize="1.2rem" width={"100%"} textAlign="left">
                                      Estado
                                    </Typography>
                                    <Grid container spacing={1} borderRadius={2.5} justifyContent="center">
                                      {filtroEstado.map((estado, i) => (
                                        <Grid key={i} size={4}>
                                          <CodigosColorComponent
                                            cantidad={conteoActividades.data?.estados?.[estado.label] || 0}
                                            width="100%"
                                            color={estado.value}
                                            text={estado.label}
                                            icon="c-radio-button"
                                            activo={estado.activo}
                                            onClick={toggleEstados}
                                          />
                                        </Grid>
                                      ))}
                                    </Grid>
                                  </Grid>
                                  <Grid
                                    size={6}
                                    sx={{
                                      p: 1,
                                      bgcolor: themeMode === "dark" ? "grey.800" : "blueGrey.50",
                                      color: themeMode === "dark" ? "white.main" : "black.main",
                                      borderRadius: 2.5,
                                    }}
                                  >
                                    <Typography fontSize="1.2rem" width={"100%"} textAlign="right">
                                      Tipo de Actividad
                                    </Typography>
                                    <Grid container spacing={1} borderRadius={2.5} justifyContent="center">
                                      {configuracion.map((actividad, i) => {
                                        return (
                                          <Grid key={i} size={4}>
                                            <CodigosColorComponent
                                              cod_tipo={actividad.cod_tipo_actividad}
                                              cantidad={conteoActividades.data?.tipos?.[actividad.nom_tipo_actividad] || 0}
                                              color={actividad.color}
                                              text={actividad.nom_tipo_actividad}
                                              icon={actividad.icono}
                                              activo={actividad.activo}
                                              onClick={toggleActividades}
                                            />
                                          </Grid>
                                        );
                                      })}
                                    </Grid>
                                  </Grid>
                                </Grid>
                              }
                            />
                          </Grid>
                          <Grid size={12}>
                            <CalendarioComponent
                              renderizarTabla
                              actividades={actividades_filtradas}
                              catalogos={{ entidades }}
                              generarActividad={(i) => <CardActividadComponent catalogos={{ entidades }} actividad={i} onClick={() => handleClickActividad(i)} />}
                              generarReport={setMostrarFiltroFechas}
                              clickFecha={(fecha) => setCurrentFecha(fecha)}
                              clickActividad={(item) => handleClickActividad(item)}
                            />
                          </Grid>
                        </Grid>
                      ) : cambiarVista == "semana" ? (
                        <Grid size={12}>
                          <AcordeonComponent2
                            expandido={openColoresSem}
                            expandir={() => setOpenColoresSem(!openColoresSem)}
                            titulo={
                              <Grid container direction="row" color="white.main" width="100%" alignItems="center" p={0.5}>
                                <Grid size="auto" px={0.5} sx={{ display: "flex", justifyContent: "center" }}>
                                  <Icon
                                    sx={{
                                      transform: `rotate(${openColores ? 90 : 0}deg)`,
                                      transition: "transform 0.3s ease",
                                    }}
                                    className={" c-derecha-simple"}
                                  />
                                </Grid>
                                <Grid size="grow" px={0.5}>
                                  <Typography variant="h6">Guia de colores</Typography>
                                </Grid>
                              </Grid>
                            }
                            cuerpo={
                              <Box
                                borderRadius={2.5}
                                sx={{
                                  display: "flex",
                                  flexDirection: "column",
                                  padding: { xs: 1, md: 2 },
                                  bgcolor: themeMode === "dark" ? "blueGrey.800" : "blueGrey.50",
                                  color: themeMode === "dark" ? "white.main" : "black.main",
                                }}
                              >
                                <Typography fontSize="1.2rem" width={"100%"}>
                                  Estado
                                </Typography>
                                <Box borderRadius={2.5} sx={{ display: "flex", flexDirection: "row", flexWrap: "wrap", mb: 1 }}>
                                  {filtroEstado.map((estado, i) => (
                                    <CodigosColorComponent key={i} color={estado.value} text={estado.label} icon="c-radio-button" activo={estado.activo} onClick={toggleEstados} />
                                  ))}
                                </Box>
                                <Typography fontSize="1.2rem" width={"100%"}>
                                  Tipo de Actividad
                                </Typography>
                                <Box borderRadius={2.5} sx={{ display: "flex", flexDirection: "row", flexWrap: "wrap" }}>
                                  {configuracion.map((actividad, i) => (
                                    <CodigosColorComponent
                                      cod_tipo={actividad.cod_tipo_actividad}
                                      key={i}
                                      color={actividad.color}
                                      text={actividad.nom_tipo_actividad}
                                      icon={actividad.icono}
                                      activo={actividad.activo}
                                      onClick={toggleActividades}
                                    />
                                  ))}
                                </Box>
                              </Box>
                            }
                          />
                          <CalendarioSemanaComponent
                            actividades={actividades_filtradas}
                            catalogos={{ entidades }}
                            generarActividad={(i) => <CardActividadComponent2 catalogos={{ entidades }} actividad={i} onClick={() => handleClickActividad(i)} />}
                            clickActividad={(item) => handleClickActividad(item)}
                          />
                        </Grid>
                      ) : (
                        <Grid size={12}>
                          <VistaActividadesDia />
                        </Grid>
                      )}
                    </Grid>
                  ) : o.nom_opcion === "Lista de Actividades" ? (
                    <Grid size={12} sx={{ p: 1 }}>
                      <ListaActividades2
                        filtros={{
                          estado: true,
                          fecha: true,
                          empleado: verTodo,
                          empresa: verTodo,
                          cenco: verTodo,
                        }}
                        cod_usuario={verTodo ? null : cod_usuario}
                      />
                    </Grid>
                  ) : o.nom_opcion === "Actividades sin Asignar" ? (
                    <Grid size={12} sx={{ p: 1 }}>
                      <ListaActividades2
                        filtros={{
                          estado: false,
                          empresa: false,
                          cenco: false,
                          empleado: false,
                          fecha: true,
                        }}
                        cod_cc={json?.configuracion?.centrosCosto[0] || null}
                        asignacion={true}
                      />
                    </Grid>
                  ) : null,
              })) || []),
          ]}
        />
      </Box>

      <DialogComponent
        openDialog={mostrarFiltroFechas}
        handleClose={() => {
          setMostrarFiltroFechas(false);
          setFechasReporte({ fechaInicio: null, fechaFin: null });
        }}
        titulo="Reporte de Actividades"
      >
        <FormularioComponent
          inputs={[
            { id: "fechaInicio", size: 12, tipo: "date", val: fechasReporte["fechaInicio"], label: "FECHA INICIO" },
            { id: "fechaFin", size: 12, tipo: "date", val: fechasReporte["fechaFin"], label: "FECHA FIN" },
          ]}
          onInput={({ id, val }) => setFechasReporte((v) => ({ ...v, [id]: val }))}
          botones={{ agregar: { visible: false } }}
        />
      </DialogComponent>
    </Box>
  );
};

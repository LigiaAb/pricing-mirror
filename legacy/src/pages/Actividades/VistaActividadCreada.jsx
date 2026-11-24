import React, { useEffect, useState } from "react";
import TabComponent from "../../components/Tabs/TabComponent";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setCurrentCategoria, setCurrentMenu, setCurrentModulo } from "../../store/slices/menu/menuSlice";
import { Box, Typography, Grid, Button, Paper, Fab, Tooltip } from "@mui/material";
import { api } from "../../api";
import { FormularioActividades } from "../../views/Actividades/FormularioActividades";
import { TablaResultados } from "../../views/Actividades/TablaResultados";
import FormularioCompletoEntidadContactos from "../../views/Entidad/EntidadContactos/FormularioCompletoEntidadContactos";
import { CardContacto } from "../../views/Actividades/CardContacto";
import { CardCliente } from "../../views/Actividades/CardCliente";
import useObtenerOpcionesAcciones from "../../hooks/useObtenerOpcionesAcciones";
import { CarruselComponent } from "../../components/CarruselComponent/CarruselComponent";
import DialogComponent from "../../components/Dialog/DialogComponent";
import TablaContactosActividad from "../../views/Actividades/TablaContatosActividad";
import { FormularioResultado } from "../../views/Actividades/FormularioResultados";
import ActionAlertComponent from "../../components/Dialog/ActionAlertComponent";
import { colores_estados } from "../../theme/colores_actividad";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { ReporteCliente } from "../../views/Actividades/ReporteCliente";
import { FormularioPreferencias } from "../../views/Entidad/FormularioPreferencias";
import { encryptId, decryptId } from "../../api/encryptDecrypt";

import { useFetchTipos } from "../../hooks/Fetch/useFetchCatalog";

export const VistaActividadCreada = (props) => {
  const { cod_usuario } = useSelector((state) => state.auth);
  const { themeMode } = useSelector((state) => state.theme);
  const { currentCentroCosto } = useSelector((state) => state.menu);
  const { dataGet, setUpdateData, updateData, readOnlyInput = false, catalogos } = props;
  const {
    entidades = [],
    contactos = [],
  } = catalogos;

  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Esta vista vive dentro del módulo CRM (calendario/actividad). Los botones de
  // abajo saltan a OTRO módulo (Embarques, Tarifas) navegando directo con
  // `navigate()`. El sidebar de destino (DesktopMenuBasePage/MovilMenuBasePage)
  // no deriva sus categorías de la URL: las lee de `currentMenu`/`currentCategoria`
  // en Redux, que solo se actualizan cuando algo los despacha explícitamente (ver
  // handleClickModulo en DashboardPage.jsx). Sin este despacho, currentModulo/
  // currentMenu/currentCategoria seguían apuntando a CRM y el sidebar mostraba las
  // categorías de Actividades sobre la página de Embarques/Tarifas recién cargada.
  const navegarAModuloExterno = (moduloRuta, menuRuta, categoriaRuta, path) => {
    // Comparación case-insensitive: el catálogo de módulos trae rutas con
    // capitalización inconsistente (p. ej. "/Embarques" en vez de "/embarques").
    const igual = (a, b) => `${a || ""}`.toLowerCase() === `${b || ""}`.toLowerCase();
    const modulo = (currentCentroCosto?.modulos || []).find((m) => igual(m.modulo_ruta, moduloRuta));
    const menu = modulo?.menus?.find((m) => igual(m.menu_ruta, menuRuta));
    const categoria = menu?.categorias?.find((c) => igual(c.ruta_cat, categoriaRuta));

    if (modulo) dispatch(setCurrentModulo({ modulo }));
    if (menu) dispatch(setCurrentMenu({ menu }));
    if (categoria) dispatch(setCurrentCategoria({ categoria }));

    navigate(path);
  };

  const tipos = useFetchTipos()

  const [cliente, setCliente] = useState(null);
  const [openBusquedaContacto, setOpenBusquedaContacto] = useState(false);
  const [openCrearContacto, setOpenCrearContacto] = useState(false);
  const [allContactos, setAllContactos] = useState([]);
  const [listaResultados, setListaResultados] = useState([]);
  const [resultadosNuevo, setResultadosNuevo] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [estadoActividad, setEstadoActividad] = useState(0);
  const [estadoActividadDesc, setEstadoActividadDesc] = useState("");
  const [mostrarAlerta, setMostrarAlerta] = useState(false);
  const [correlativo, setCorrelativo] = useState(0);
  const [sinResultadosDesc, setSinResultadosDesc] = useState("");

  const [resultadoCotizacion, setResultadoCotizacion] = useState(false);

  const tiposResultados = [
    "CORREO",
    "LLAMADA",
    "VISITA",
    "SALES LEADS",
    "CALENDARIZAR COTIZACION",
    "CALENDARIZAR CTS",
    "COTIZACION REALIZADA",
    "CTS REALIZADO",
    "FILE REALIZADO",
    "FINALIZAR SIN RESULTADOS",
    "CONFIRMAR COTIZACION",
  ];

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

  const getResults = async () => {
    await api
      .get("api/appweb/lista-resultados", { params: { cod_actividad: dataGet.cod_actividad } })
      .then(({ data }) => setListaResultados(data.data))
      .catch((e) => console.error(e));
  };

  useEffect(() => {
    if (dataGet) {
      setEstadoActividad(dataGet.cod_estado);
      setEstadoActividadDesc(dataGet.estado_desc);

      const fetchData = async (cliente) => {
        let tipos_entidades = [3, 4, 5];
        let tipo_entidad = -99;

        await api
          .get("api/appweb/recuperar-datos-entidad-resumen", {
            params: { cod_entidad: cliente },
          })
          .then(({ data }) => {
            if (data.data[0]) {
              let clienteData = convertKeysToLowerCase(data.data[0]);
              ((tipo_entidad = clienteData.cod_entidad),
                setCliente({
                  estado: clienteData.estado_desc,
                  entidad_id: clienteData.cod_entidad,
                  entidad_nombre: clienteData.entidad_nombre,
                  ciudad: clienteData.nombre_ciudad,
                  pais: clienteData.nombre_pais,
                  industria: clienteData.nom_industria_es,
                  tipo: clienteData.entidad_clasificacion,
                }));
            }
          })
          .catch((e) => console.error(e));

        if (tipo_entidad != -99) {
          await api
            .get("api/appweb/lista-entidad-contacto", {
              params: {
                cod_tipo: cliente,
                entidad_id: cliente,
              },
            })
            .then(({ data }) => setAllContactos(data.data.data))
            .catch((e) => console.error(e));
        }
        await getResults();
      };

      fetchData(dataGet?.cod_cliente).catch(console.error);
    }
  }, [dataGet, entidades]);

  const contactoSeleccionado = async (contacto) => {
    setOpenBusquedaContacto(false);
    await api
      .post("api/appweb/insertar-contactos-actividad", {
        contactos: [contacto.entidadcontacto_id],
        cod_actividad: dataGet.cod_actividad,
      })
      .then(({ data }) => {
        if (data.data.contactos_agregados > 0) {
          contactos.push(contacto);
        }
        setOpenCrearContacto(false);
        setUpdateData(updateData + 1);
      })
      .catch((e) => console.error(e));
    setOpenCrearContacto(false);
  };

  const nuevoEnContacto = () => {
    setOpenBusquedaContacto(false);
    setOpenCrearContacto(true);
  };

  const registrarResultados = async () => {
    let resultado_cotizacion = null;

    for (let i = 0; i < resultadosNuevo.length; i++) {
      // console.log(resultadosNuevo[i].tipo)
      // continue
      let estado = 23;
      if (resultadosNuevo[i].tipo?.solo_resultado) {
        estado = 24;
      }
      if ([67, 68, 289].includes(resultadosNuevo[i].tipo.cod_tipo_actividad)) {
        resultado_cotizacion = {
          cod_tipo: resultadosNuevo[i].tipo.cod_tipo_actividad,
          cod_cotizacion_cabecera: resultadosNuevo[i].referencia,
        };
      }

      await api.post("api/appweb/insertar-resultado", {
        actividad_padre: resultadosNuevo[i].actividad_padre,
        fecha_programada: resultadosNuevo[i].fecha_programada,
        asunto: resultadosNuevo[i].asunto,
        descripcion: resultadosNuevo[i].descripcion,
        cod_tipo: resultadosNuevo[i].tipo.cod_tipo_actividad,
        cod_cliente: resultadosNuevo[i].cod_cliente,
        cod_emp: resultadosNuevo[i].cod_emp,
        cod_cc: resultadosNuevo[i].cod_cc,
        cod_asesor: resultadosNuevo[i].cod_asesor,
        contactos: resultadosNuevo[i].contactos,
        cod_estado: estado,
        cod_campana: resultadosNuevo[i].cod_campana,
        crear_seguimiento: !resultadosNuevo[i].tipo?.solo_resultado,
        referencia: resultadosNuevo[i].referencia,
        reason_code: resultadosNuevo[i].reason_code?.cod_tipo,
      });
    }
    await getResults();
    setResultadosNuevo([]);
    await api
      .post("api/appweb/actualizar-actividad", {
        ...dataGet,
        cod_estado: 24,
      })
      .then(({ data }) => {
        // console.log(data)
        if (data.data.mensaje == "Actividad actualizada correctamente") {
          setEstadoActividad(24);
          setEstadoActividadDesc("FINALIZADO");
        }
      });

    if (!!resultado_cotizacion) {
      await api.post("api/appweb/cerrar-seguimiento", {
        ...dataGet,
        ...resultado_cotizacion,
      });
    }
  };

  const registrarSinResultados = async () => {
    await api.post("api/appweb/insertar-resultado", {
      actividad_padre: dataGet.cod_actividad,
      fecha_programada: new Date(),
      asunto: "SIN RESULTADOS",
      descripcion: sinResultadosDesc,
      cod_tipo: 37,
      cod_cliente: dataGet.cod_cliente,
      cod_emp: dataGet.cod_emp,
      cod_cc: dataGet.cod_cc,
      cod_asesor: dataGet.cod_asesor,
      contactos: dataGet.contactos,
      cod_estado: 24,
      cod_campana: dataGet.cod_campana,
    });

    await getResults();
    setResultadosNuevo([]);

    await api
      .post("api/appweb/actualizar-actividad", {
        ...dataGet,
        cod_estado: 24,
      })
      .then(({ data }) => {
        // console.log(data)
        if (data.data.mensaje == "Actividad actualizada correctamente") {
          setEstadoActividad(24);
          setEstadoActividadDesc("FINALIZADO");
        }
      });
  };

  const nuevoResultado = (resultado) => {
    if (resultado.fecha_programada && resultado.tipo && resultado.asunto) {
      setListaResultados([
        ...listaResultados,
        {
          ...resultado,
          correlativo: correlativo + 1,
          cod_actividad: 0,
          actividad_padre: dataGet.cod_actividad,
          cod_tipo: resultado.tipo.cod_tipo_actividad,
          nom_tipo: tipos.data?.find((t) => t.cod_tipo == resultado.tipo.cod_tipo_actividad).nom_tipo,
          contactos: contactos.filter((c) => c.cod_estado == 1).map((c) => c.entidadcontacto_id),
        },
      ]);

      setResultadosNuevo([
        ...resultadosNuevo,
        {
          ...resultado,
          correlativo: correlativo + 1,
          cod_actividad: 0,
          actividad_padre: dataGet.cod_actividad,
          cod_tipo: resultado.tipo.cod_tipo_actividad,
          nom_tipo: tipos.data?.find((t) => t.cod_tipo == resultado.tipo.cod_tipo_actividad).nom_tipo,
          contactos: contactos.filter((c) => c.cod_estado == 1).map((c) => c.entidadcontacto_id),
        },
      ]);
      setCorrelativo(correlativo + 1);
    }
  };

  const eliminarResultado = (resultado) => {
    if (resultado.correlativo) {
      setResultadosNuevo(resultadosNuevo.filter((item) => item.correlativo != resultado.correlativo));
      setListaResultados(listaResultados.filter((item) => item.correlativo != resultado.correlativo));
      if ([67, 68].includes(resultado.tipo.cod_tipo_actividad)) {
        setResultadoCotizacion(false);
      }
    }
  };

  const anularActividad = async () => {
    await api
      .post("api/appweb/actualizar-actividad", {
        ...dataGet,
        cod_estado: 26,
      })
      .then(({ data }) => {
        if (data.data.mensaje == "Actividad actualizada correctamente") {
          setEstadoActividad(26);
          setEstadoActividadDesc("ANULADO");
        } else {
          console.error(data.data.mensaje);
        }
      })
      .catch((e) => console.error(e));
  };

  return (
    <Box sx={{ px: 2, m: 0 }}>
      <Grid container columns={{ xs: 4, md: 8 }}>
        <Grid size="grow" sx={{ mb: 2, mt: 1 }}>
          <Typography m={0} p={0} variant="h4">
            {`${dataGet?.asunto || `Actividad ${dataGet?.fecha_programada ? new Date(dataGet?.fecha_programada).toLocaleDateString() : ""} - ${dataGet?.nombre_cliente || ""}`}`}
          </Typography>
        </Grid>
      </Grid>

      <Box sx={{ pb: 1 }}>
        <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", alignContent: "center", width: "100%", px: 1 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Estado:{" "}
            <Box component="span" sx={{ color: colores_estados[estadoActividadDesc], fontSize: "1.2rem" }}>
              {estadoActividadDesc}
            </Box>
          </Typography>
        </Box>
        <TabComponent
          tabInicial={1}
          opciones={[
            {
              id: 1,
              label: "Información",
              content: (
                <Box sx={{ p: 1, m: 0 }}>
                  <Paper
                    elevation={3}
                    sx={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyItems: "center",
                      flexDirection: "column",
                      px: 1,
                      py: 0.5,
                      borderRadius: 2,
                      bgcolor: themeMode === "dark" ? "background.50" : "background.900",
                      borderColor: themeMode === "dark" ? "background.100" : "background.700",
                      borderWidth: 1,
                    }}
                  >
                    <ActionAlertComponent
                      aceptar={() => {
                        setMostrarAlerta(false);
                        anularActividad();
                      }}
                      cancelar={() => {
                        setMostrarAlerta(false);
                      }}
                      openDialog={mostrarAlerta}
                      tipo="warning"
                      handleClose={() => {}}
                      content={
                        <Grid container wdith="100%" direction="column">
                          <Grid size={12}>{`¿Está seguro de anular la actividad?`}</Grid>
                          Esto cambiará el estado de la actividad y no permitirá agregar resultados adicionales.
                        </Grid>
                      }
                    />
                    <FormularioActividades dataGet={dataGet} catalogos={catalogos} />
                    {estadoActividad == 23 && dataGet?.cod_asesor == cod_usuario && (
                      <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", alignContent: "center", width: "100%", py: 1, px: 1 }}>
                        <Button variant="outlined" color="error" onClick={() => setMostrarAlerta(true)}>
                          <Typography sx={{ mr: 1 }} className="c-cancelar" />
                          Anular Actividad
                        </Button>
                      </Box>
                    )}
                  </Paper>
                </Box>
              ),
            },
            cliente
              ? {
                  id: 2,
                  label: "Cliente",
                  content: (
                    <Box sx={{ px: 1, pt: 1, m: 0 }}>
                      <ReporteCliente cliente={cliente} onClick={() => {}} />
                    </Box>
                  ),
                }
              : null,
            {
              id: 3,
              label: "Resultados",
              content: (
                <Box sx={{ p: 1, pt: 2 }}>
                  {
                    //  estadoActividad == 23 && dataGet?.cod_asesor == cod_usuario && (
                    estadoActividad == 23 && (
                      <>
                        <FormularioResultado
                          actividadPadre={dataGet}
                          readOnlyInput={false}
                          catalogos={catalogos}
                          updateData={updateData}
                          setUpdateData={setUpdateData}
                          onCreate={nuevoResultado}
                          resultadoCotizacion={resultadoCotizacion}
                          setResultadoCotizacion={setResultadoCotizacion}
                        />
                      </>
                    )
                  }
                  <TablaResultados
                    readOnly={false}
                    datos={listaResultados}
                    newBtn={false}
                    catalogos={catalogos}
                    tiposResultados={tiposResultados}
                    readOnlyInput={readOnlyInput}
                    updateData={updateData}
                    setUpdateData={setUpdateData}
                    actividadPadre={dataGet}
                    onDelete={eliminarResultado}
                  />
                  {resultadosNuevo.length > 0 && estadoActividad == 23 && (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "center",
                        mt: 2,
                      }}
                    >
                      <ActionAlertComponent
                        aceptar={() => {
                          setOpenDialog(false);
                          registrarResultados(resultadosNuevo);
                        }}
                        cancelar={() => {
                          setOpenDialog(false);
                        }}
                        openDialog={openDialog}
                        tipo="warning"
                        handleClose={() => {}}
                        content={
                          <Grid container wdith="100%" direction="column">
                            <Grid size={12}>{`¿Está seguro de guardar los resultados?`}</Grid>
                            Esto cambiará el estado de la actividad y no permitirá agregar resultados adicionales.
                          </Grid>
                        }
                      />
                      <Button sx={{ mt: 1 }} color="primary" variant="contained" onClick={() => setOpenDialog(true)}>
                        Guardar Resultados
                      </Button>
                    </Box>
                  )}
                  {resultadosNuevo.length == 0 && estadoActividad == 23 && (
                    // resultadosNuevo.length == 0 && estadoActividad == 23 && dataGet?.cod_asesor == cod_usuario && (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "center",
                        mt: 2,
                      }}
                    >
                      <ActionAlertComponent
                        aceptar={() => {
                          setOpenDialog(false);
                          registrarSinResultados();
                        }}
                        cancelar={() => {
                          setOpenDialog(false);
                        }}
                        openDialog={openDialog}
                        // tipo="warning"
                        handleClose={() => {}}
                        content={
                          <Grid container wdith="100%" direction="column">
                            ¿Esta seguro de querer cerrar la actividad sin resultados?
                            <FormularioComponent
                              inputs={[
                                {
                                  tipo: "textarea",
                                  id: "descripcion",
                                  size: 12,
                                  val: sinResultadosDesc,
                                  label: "Comentario",
                                  readonly: false,
                                },
                              ]}
                              onInput={({ id, val }) => {
                                setSinResultadosDesc(val);
                              }}
                              botones={{
                                agregar: { visible: false, onClick: null },
                                cancelar: { visible: false, onClick: null },
                                guardar: { visible: false, onClick: null },
                                filtrar: { visible: false, onClick: null },
                              }}
                            />
                          </Grid>
                        }
                      />
                      <Button sx={{ mt: 1 }} color="error" variant="outlined" onClick={() => setOpenDialog(true)}>
                        <Typography sx={{ mr: 1 }} className="c-cancelar" />
                        {listaResultados.length > 0 ? "Cerrar Actividad" : "Guardar Sin Resultados"}
                      </Button>
                    </Box>
                  )}
                </Box>
              ),
            },
            cliente
              ? {
                  id: 4,
                  label: "Contactos",
                  content: (
                    <Box>
                      <Box
                        sx={{
                          p: 1,
                          width: "100%",
                          display: "flex",
                          flexDirection: "row",
                          justifyContent: "flex-end",
                          gap: 1,
                        }}
                      >
                        {estadoActividad == 23 && dataGet?.cod_asesor == cod_usuario && (
                          <Button variant="contained" onClick={() => setOpenBusquedaContacto(true)}>
                            Agregar Contacto
                          </Button>
                        )}
                      </Box>
                      {contactos.length > 0 ? (
                        <CarruselComponent itemsPerPage={{ lg: 2, xl: 3 }}>
                          {contactos.map((contacto, i) => (
                            <CardContacto key={i} contacto={contacto} />
                          ))}
                        </CarruselComponent>
                      ) : (
                        <Typography fontWeight="bold" fontSize={18} pt={2}>
                          No se han agregado contactos.
                        </Typography>
                      )}
                    </Box>
                  ),
                }
              : null,
          ].filter((i) => i != null)}
        />
      </Box>

      <DialogComponent
        openDialog={openCrearContacto}
        handleClose={() => setOpenCrearContacto(false)}
        titulo="Crear Contacto"
        width="80vw"
        children={
          <Grid sx={{ display: "flex", flexDirection: "column", px: 3 }}>
            <FormularioCompletoEntidadContactos id="new" tipo={5} cliente={cliente} catalogos={catalogos} onCreate={contactoSeleccionado} onActividad />
          </Grid>
        }
      />

      <DialogComponent
        openDialog={openBusquedaContacto}
        handleClose={() => {
          setOpenBusquedaContacto(false);
        }}
        titulo="Buscar Contacto"
        children={
          <Grid sx={{ display: "flex", flexDirection: "column", px: 3, minWidth: "80vw", maxHeight: "80vh" }}>
            <TablaContactosActividad lista={allContactos} reConsultar={null} obtenerFilaSeleccionada={contactoSeleccionado} cliente={cliente} handleNuevo={nuevoEnContacto} catalogos={catalogos} />
          </Grid>
        }
      />
      {dataGet?.cod_tipo == 35 && (
        <Tooltip title="Ver documento CTS">
          <Button
            size="small"
            color="success"
            aria-label="seguimiento-cts"
            variant="outlined"
            sx={{
              margin: 0,
              top: 100,
              right: 140,
              bottom: "auto",
              left: "auto",
              position: "fixed",
              bgcolor: "background.main",
            }}
            onClick={
              dataGet.cod_documento
                ? () => navegarAModuloExterno("/embarques", "embarques", "cts", `/embarques/embarques/cts/${encryptId(dataGet.cod_documento)}`)
                : null
            }
          >
            <Typography variant="span" className="c-documento" sx={{ fontSize: "20px !important", fontWeight: 100 }} />
          </Button>
        </Tooltip>
      )}
      {dataGet?.nom_tipo == "SEGUIMIENTO COTIZACION" && (
        <Tooltip title="Ver documento Asociado">
          <Button
            size="small"
            color="success"
            aria-label="seguimiento"
            variant="outlined"
            sx={{
              margin: 0,
              top: 100,
              right: 140,
              bottom: "auto",
              left: "auto",
              position: "fixed",
              bgcolor: "background.main",
            }}
            onClick={dataGet.nom_tipo == "SEGUIMIENTO COTIZACION" && !!dataGet.cod_documento ? () => navigate(`/tarifas/cotizacion/solicitud-cotizacion/${encryptId(dataGet.cod_documento)}`) : null}
          >
            <Typography variant="span" className="c-documento" sx={{ fontSize: "20px !important", fontWeight: 100 }} />
          </Button>
        </Tooltip>
      )}
    </Box>
  );
};

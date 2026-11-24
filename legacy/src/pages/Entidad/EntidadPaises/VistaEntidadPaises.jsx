import React, { useCallback, useEffect, useMemo, useState } from "react";
// import FormularioCompletoEntidadPaises from "../../views/EntidadPaises/FormularioCompletoEntidadPaises";
import TabComponent from "../../../components/Tabs/TabComponent";
import { Box, Button, Grid, Icon, List, Pagination, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, Typography } from "@mui/material";
// import ModalEntidadPaises from "./ModalEntidadPaises";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../../api";
import { decryptId, encryptId } from "../../../api/encryptDecrypt";
import { useDispatch, useSelector } from "react-redux";
import { apagarCarga, encenderCarga } from "../../../store/slices/status/statusSlice";
import PropTypes from "prop-types";
import StepperComponent from "../../../components/Stepper/StepperComponent";
import useObtenerOpcionesAcciones from "../../../hooks/useObtenerOpcionesAcciones";
import BandaAlertaComponent from "../../../components/Alertas/BandaAlertaComponent";
import SubirArchivoComponent from "../../../components/Tabla/TablaEditable/SubirArchivoComponent";
import moment from "moment";
import DialogComponent from "../../../components/Dialog/DialogComponent";
import FormularioComponent from "../../../components/Formulario/FormularioComponent";
import TablaDetallesComponent from "../../../components/Tabla/TablaDetallesComponent";
import { redirectToUserHome } from "../../../store/slices/menu/thunks";

const permisosBase = {
  ver: false,
  editar: false,
  Agregar: false,
  anular: false,
  eliminar: false,
  autorizar: false,
  validar: false,
};

const VistaEntidadPaises = (props) => {
  const { tipo, tipoStr, entidad_id, entidadPais = {}, entidad, actualizarLista = () => {} } = props;

  /**
   * # ---------------------------------------------------------------------------- #
   * #                               PARAMETROS DE URL                              #
   * # ---------------------------------------------------------------------------- #
   * Obtener la lista de paramentros de la url (id)
   */
  let { encryptedId } = useParams();
  let id = decryptId(encryptedId);
  /**
   * # ---------------------------------------------------------------------------- #
   * #                                 USE NAVIGATE                                 #
   * # ---------------------------------------------------------------------------- #
   * Navegacion para regresar a la lista anterior y cualquier ruta necesaria en el futuro
   */
  const navigate = useNavigate();
  /**
   * # ---------------------------------------------------------------------------- #
   * #                                   USE STATE                                  #
   * # ---------------------------------------------------------------------------- #
   * Lista de States
   */
  const dispatch = useDispatch();
  const { colors, themeMode, opositeMode } = useSelector((state) => state.theme);
  const { permisosArray, catalogoArray } = useObtenerOpcionesAcciones();
  const [item, setItem] = useState({});
  const [estados, setEstados] = useState([]);
  const [estadosEntidadIdentificacion, setEstadosEntidadIdentificacion] = useState(null);
  const [estadoReferenteDePreACliente, setEstadoReferenteDePreACliente] = useState([]);
  const [indexEstadoActual, setIndexEstadoActual] = useState(0);
  const [keyRecarga, setKeyRecarga] = useState(0);
  const [bitacoraDePais, setBitacoraDePais] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [empleadoUsuario, setempleadoUsuario] = useState([]);
  const [mostrarDialogCambioEstado, setMostrarDialogCambioEstado] = useState(false);
  const [observacion, setObservacion] = useState("");
  const [estadoClick, setEstadoClick] = useState(undefined);
  const [entidadPaisConsultado, setEntidadPaisConsultado] = useState(entidadPais);
  const [cod_pais, setCod_pais] = useState(entidadPais?.cod_pais);

  const obtenerAccionesSegunPermisos = useMemo(() => {
    let item = permisosArray.find((i) => i.nom_opcion === "Paises");
    return {
      ...permisosBase,
      autorizar: true, // item?.acciones.some((i) => i.cod_accion === 6),
      validar: item?.acciones.some((i) => i.cod_accion === 7),
    };
  }, [permisosArray]);

  let estadosProcesados = useMemo(
    () =>
      (estadoReferenteDePreACliente || []).map((i) => {
        const estaRaro = i.proceso_detalle_estado_siguiente === "{12,14}";
        const siguiente = JSON.parse(i.proceso_detalle_estado_siguiente?.replace("{", "[").replace("}", "]") || "[]").map((i) => estados.find((e) => i === e.cod_estado));

        return {
          ...i,
          proceso_detalle_estado_actual: estaRaro ? 11 : i.proceso_detalle_estado_actual,
          ...estados.find((e) => e.cod_estado === (estaRaro ? 11 : i.proceso_detalle_estado_actual)),
          siguiente,
        };
      }),
    [estadoReferenteDePreACliente, estados]
  );
  const bitacora = useMemo(
    () =>
      bitacoraDePais.map((i) => ({
        ...empleados.map((e) => ({ ...e, ...empleadoUsuario.find((eu) => eu.cod_empleado === e.cod_empleado) })).find((e) => e.cod_usuario === i.usuario_id),
        ...i,
      })),
    [bitacoraDePais, empleadoUsuario, empleados]
  );
  const estadoActual = useMemo(() => estadosProcesados[indexEstadoActual], [estadosProcesados, indexEstadoActual]);
  const obtenerBordes = useCallback(
    (item) => ({
      border: `0.5px solid ${item ? (item?.ESTADO_ID !== 1 ? colors["error"]["main_20"] : colors["background"]["200"]) : colors["background"]["200"]}`,
      borderRoght: `0px solid ${item ? (item?.ESTADO_ID !== 1 ? colors["error"]["main_20"] : colors["background"]["200"]) : colors["background"]["200"]}`,
    }),
    [colors]
  );
  const [elementosPorPagina, setElementosPorPagina] = useState(10);
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPagina = useMemo(() => bitacora.reverse().slice((paginaActual - 1) * elementosPorPagina, paginaActual * elementosPorPagina), [bitacora, paginaActual]);
  const totalPaginas = useMemo(() => Math.ceil(bitacora.length / elementosPorPagina), [bitacora.length]);
  const handleChange = (_, value) => {
    setPaginaActual(value);
  };

  /**
   * # ---------------------------------------------------------------------------- #
   * #                               CONSULTA DE DATOS                              #
   * # ---------------------------------------------------------------------------- #
   * Consulta a base de datos de la lista
   */
  // Obtener los datos del crud
  // const obtenerDatos = useCallback(async () => {
  //   id === "new"
  //     ? null
  //     : await api
  //         .get("api/appweb/lista-entidad-paises", {
  //           params: { cod_tipo: tipo, entidad_id },
  //         })
  //         .then(({ data }) => setItem(data.data[0]))
  //         .catch((e) => console.error(e));
  // }, [entidad_id, id, tipo]);

  const obtenerEstadoDeAutorizacion = useCallback(async () => {
    await api
      .post("api/appweb/verifica-identificacion-entidad", {
        entidad_id,
        cod_pais: entidadPais["cod_pais"],
      })
      .then(({ data }) => setEstadosEntidadIdentificacion(data.data))
      .catch((e) => console.error(e));
  }, [entidadPais, entidad_id]);
  const obtenerBitacoraDePais = useCallback(async () => {
    await api
      .get("api/appweb/lista-entidad-bitacora", {
        params: { entidad_id, entidadbitacora_tabla: "ENTIDAD_IDENTIFICACION" },
      })
      .then(({ data }) =>
        setBitacoraDePais(
          data.data.data.map((i) => ({
            ...JSON.parse(i.data_ultimo_estado),
            ...i,
          }))
          // .filter((i) => i.cod_pais === entidadPais["cod_pais"] || i.PAIS_ID === entidadPais["cod_pais"])
        )
      )
      .catch((e) => console.error(e));
  }, [entidadPais, entidad_id]);
  const obtenerEntidadPais = useCallback(async () => {
    await api
      .get("api/appweb/lista-entidad-paises", { params: { cod_tipo: tipo, entidad_id, entidadpais_id: entidadPais.entidadpais_id } })
      .then(({ data }) => {
        setEntidadPaisConsultado(data.data.data[0] || {});
        setCod_pais(data.data.data[0]?.cod_pais || null);
      })
      .catch((e) => console.error(e));
  }, [tipo, entidad_id, entidadPais.entidadpais_id]);

  const obtenerEmpleadoUsuario = useCallback(async () => {
    await api
      .get("api/appweb/listaemp-usu-puesto", {})
      .then(({ data }) => setempleadoUsuario(data.data))
      .catch((e) => console.error(e));
  }, []);
  const obtenerEmpleado = useCallback(async () => {
    await api
      .get("api/appweb/lista-empleado", {})
      .then(({ data }) => setEmpleados(data.data))
      .catch((e) => console.error(e));
  }, []);
  const obtenerEstadoRespectoARelacionPreACliente = useCallback(async () => {
    if (tipoStr === "PRE-CLIENTE" || tipoStr === "CLIENTE PARA MANIFESTAR")
      await api
        .post(tipoStr === "CLIENTE PARA MANIFESTAR" ? "api/appweb/recuperar-estados-de-manifiesto-a-precliente" : "api/appweb/recuperar-estados-de-pre-a-cliente", {
          entidad_id: id,
          cod_pais: entidadPaisConsultado["cod_pais"],
        })
        .then(({ data }) => {
          setIndexEstadoActual(
            data?.data.lista_estados_proceso
              ?.map((i) => ({
                ...i,
                proceso_detalle_estado_actual: i.proceso_detalle_estado_siguiente === "{12,14}" ? 11 : i.proceso_detalle_estado_actual,
              }))
              .findIndex((i) => {
                return i.proceso_detalle_estado_actual === entidadPaisConsultado?.cod_estado;
              })
          );
          return setEstadoReferenteDePreACliente(data.data.lista_estados_proceso);
        })
        .catch((e) => {
          console.error(e);
        });
  }, [tipoStr, entidadPaisConsultado, id]);
  //  Obtener el catalogo de estados
  const obtenerEstados = useCallback(async () => {
    await api
      .get("api/appweb/listaestados")
      .then(({ data }) => setEstados(data.data))
      .catch((e) => console.error(e));
  }, []);

  const verificarRedireccion = useCallback(async () => {
    await api
      .get("api/appweb/busqueda-entidad-x-criterio", { params: { ref_busqueda: `${id}`, list_descripcion_tipo: ["PRE-CLIENTE", "CLIENTE", "CLIENTE PARA MANIFESTAR"], tipo_busqueda: "ID" } })
      .then(({ data }) => setItem(data.data.data[0]))
      .catch((e) => console.error(e));
  }, [id]);

  // Realizar la consulta
  const hacerConsultas = useCallback(async () => {
    // obtenerEntidadPais(),
    await Promise.all([
      obtenerEstados(),
      obtenerEmpleado(),
      obtenerEmpleadoUsuario(),
      obtenerEstadoRespectoARelacionPreACliente(),
      // obtenerEstadoDeAutorizacion(),
      verificarRedireccion(),
      obtenerBitacoraDePais(),
      // obtenerDatos(),
    ]).then(() => dispatch(apagarCarga()));
    setKeyRecarga((i) => i + 1);
  }, [
    // obtenerDatos,
    obtenerEmpleado,
    obtenerEmpleadoUsuario,
    obtenerEstadoRespectoARelacionPreACliente,
    // obtenerEstadoDeAutorizacion,
    verificarRedireccion,
    obtenerBitacoraDePais,
    obtenerEstados,
    dispatch,
    // obtenerEntidadPais,
  ]);
  useEffect(() => {
    hacerConsultas();
  }, [hacerConsultas]);
  useEffect(() => {
    hacerConsultas();
  }, []);
  useEffect(() => {
    console.log("Entidad pais", entidadPais);
    if (entidadPais["cod_pais"]) setEntidadPaisConsultado(entidadPais);
    hacerConsultas();
  }, [entidadPais]);
  // useEffect(() => {
  //   hacerConsultas();
  // }, []);
  useEffect(() => {
    dispatch(encenderCarga());
  }, [dispatch]);
  const obtenerCambiarDeEstado = useCallback(
    async (observacion, cod_estado) => {
      await api
        .post(tipoStr === "CLIENTE PARA MANIFESTAR" ? "api/appweb/cambio-estado-manifiesto-a-precliente" : "api/appweb/cambio-estado-depre-a-cliente", {
          entidad_id: Number(entidad_id),
          cod_pais,
          observacion,
          cod_estado_siguiente: cod_estado,
        })
        .then(async () => {
          await actualizarLista();
          await obtenerEntidadPais();
          // await obtenerBitacoraDePais();
          // await obtenerEstadoRespectoARelacionPreACliente();
          // setIndexEstadoActual((es) => es - 1);
          await hacerConsultas();
          await obtenerEstadoDeAutorizacion();
        })
        .then(async () => {
          await verificarRedireccion().then(() => {
            if (entidadPaisConsultado.estado_desc === "INGRESADO" || entidadPaisConsultado.estado_desc === "FINALIZADO") {
              const elemento = entidadPaisConsultado?.cod_tipo;
              const url = `/crm/clientes/${elemento.toLowerCase()}/${encryptId(elemento)}/${encryptId(entidad_id)}`;
              navigate(url, { replace: true });
              dispatch(redirectToUserHome(false, url));
            }
          });
        })
        .catch((e) => console.error(e));
    },
    [
      actualizarLista,
      cod_pais,
      entidadPaisConsultado?.cod_tipo,
      entidadPaisConsultado.estado_desc,
      entidad_id,
      hacerConsultas,
      navigate,
      obtenerEntidadPais,
      obtenerEstadoDeAutorizacion,
      tipoStr,
      dispatch,
      verificarRedireccion,
    ]
  );
  return (
    <Box sx={{ p: 1, m: 0 }} key={actualizarLista}>
      {/* Boton para regresar a la lista */}
      {/* <Button color="primary" onClick={() => navigate(`/crud/entidadpaises`)}>
        <Icon className="c-corner-down-left" />
        Regresar a la lista
      </Button> */}

      {/* Nombre del elemento */}
      <Typography variant="h4">{entidadPais?.nombre_pais}</Typography>

      {/* Estado */}
      <StepperComponent
        sx={{ my: 1 }}
        estados={estadosProcesados}
        siguienteProps={{
          onClick: (estado) => {
            // setIndexEstadoActual((es) => estadosProcesados.findIndex((ep) => ep.cod_estado === estado.cod_estado));
            setMostrarDialogCambioEstado(true);
            setEstadoClick(estado.cod_estado);
          },
          disabled: (e) =>
            !(e.cod_estado === 12
              ? obtenerAccionesSegunPermisos.autorizar
              : e.cod_estado === 14
                ? estadosEntidadIdentificacion?.cantidad_pendientes == 0
                  ? obtenerAccionesSegunPermisos.validar
                  : estadoActual?.cod_estado === 12
                : indexEstadoActual <= estadosProcesados.length - 1),
          label: "proceso_descripcion",
        }}
        anteriorProps={{
          onClick: (estado) => {
            obtenerCambiarDeEstado(observacion, estadosProcesados[indexEstadoActual - 1]?.cod_estado);
            // actualizarLista();
          },
          disabled: indexEstadoActual === 0,
          label: "retroceder",
        }}
        autorizarProps={{
          onClick: () => {
            console.log("autorizarProps");
          },
          disabled: false,
          label: undefined,
        }}
        estado={estadoActual?.cod_estado}
        key={estadoActual?.cod_estado}
        propiedades={{ id: "cod_estado", label: "estado_desc" }}
      />
      {/* <pre>{JSON.stringify(estadosProcesados, null, 2)}</pre> */}
      {estadosEntidadIdentificacion && (
        <Grid container key={JSON.stringify(estadosEntidadIdentificacion || {})}>
          {estadosEntidadIdentificacion?.cantidad_pendientes > -1 ? (
            <>
              {estadosEntidadIdentificacion?.cantidad_pendientes > 0 && <BandaAlertaComponent tipo="warning">{estadosEntidadIdentificacion?.mensaje}</BandaAlertaComponent>}
              {estadosEntidadIdentificacion?.cantidad_pendientes > 0 && <Typography sx={{ m: 0, p: 0, mt: 1 }}>Estado de las Identificaciones Requeridas para esta Entidad:</Typography>}
              <Grid container width="100%">
                <TablaDetallesComponent
                  titulo="IDENTIFICACIONES"
                  columnas={[
                    { id: "TIPO", column: "TIPO", label: "TIPO", align: "left" /* weight: "bold" */ },
                    { id: "NUMERO", column: "NUMERO", label: "NUMERO", align: "left" /* weight: "bold" */ },
                    { id: "DOCUMENTO", column: "DOCUMENTO", label: "DOCUMENTO", align: "left" /* weight: "bold" */ },
                    { id: "INGRESADO", column: "INGRESADO", label: "INGRESADO", align: "center" /* weight: "bold" */ },
                  ]}
                  data={(estadosEntidadIdentificacion?.identificaciones || []).map((i) => ({
                    ...i,
                    TIPO: i.NOM_IDENTIFICACION,
                    NUMERO: i.ENTIDADIDENTIFICACIO_NUMERO,
                    DOCUMENTO: (
                      <Typography sx={{ my: "auto" }}>{i.ENTIDADIDENTIFICACION_RUTA && <SubirArchivoComponent input={{ id: "test", val: i.ENTIDADIDENTIFICACION_RUTA, readonly: true }} />}</Typography>
                    ),
                    INGRESADO: <Typography className={i.ESTADO_ID === 1 ? "c-cheque" : "c-x1"} color={i.ESTADO_ID === 1 ? "success" : "error"} />,
                  }))}
                  id="COD_IDENTIFICACION"
                  usarPaginacion={false}
                  // height={200}
                  filasPorPagina={5}
                />
              </Grid>
            </>
          ) : (
            <BandaAlertaComponent tipo="warning">{estadosEntidadIdentificacion?.mensaje}</BandaAlertaComponent>
          )}
        </Grid>
      )}

      <Grid container mt={5}>
        <TablaDetallesComponent
          titulo="BITÁCORA"
          columnas={[
            { id: "USUARIO", column: "USUARIO", label: "USUARIO", align: "left" /* weight: "bold" */ },
            { id: "ACCION", column: "ACCION", label: "ACCION", align: "left" /* weight: "bold" */ },
            { id: "FECHA", column: "FECHA", label: "FECHA", align: "center" /* weight: "bold" */ },
          ]}
          data={(bitacora || []).map((i) => ({
            ...i,
            USUARIO: `${i.nom_empleado} ${i.apellido_emp}`,
            ACCION: i.entidadbitacora_accion === "C" ? "CREACIÓN" : i.entidadbitacora_accion === "U" ? "ACTUALIZACIÓN" : "ANULACIÓN",
            FECHA: moment(i.entidadbitacora_fecha).format("DD-MM-YYYY HH:mm"),
          }))}
          id="entidadbitacora_id"
          usarPaginacion={false}
          // height={200}
          filasPorPagina={5}
        />
      </Grid>

      <Grid container>
        {/* <pre>
          {JSON.stringify(
            { permisosArray: obtenerAccionesSegunPermisos },
            null,
            2
          )}
        </pre> */}
        {/* <pre>
          {JSON.stringify(
            {
              permisosArray: permisosArray.find(
                (i) => i.nom_opcion === "Paises"
              ),
            },
            null,
            2
          )}
        </pre> */}
        {/* <pre>{JSON.stringify({ entidadPaisConsultado }, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify({ item }, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify({ permisosArray }, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify({ obtenerAccionesSegunPermisos }, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify({ estadoActual }, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify({ indexEstadoActual }, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify({ estadosEntidadIdentificacion }, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify({ estadoReferenteDePreACliente }, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify({ estadosProcesados }, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify({ entidadPais }, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify({ estados }, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify({ estadoActual }, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify({ bitacora }, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify({ estadosEntidadIdentificacion }, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify({ identificaciones: estadosEntidadIdentificacion?.identificaciones }, null, 2)}</pre> */}
        {/* <pre>
          {JSON.stringify({ estadoActual: entidadPais?.cod_estado }, null, 2)}
        </pre> */}
        {/* <pre>
          {JSON.stringify(
            {
              bitacoraDePais: bitacoraDePais.map((i) => ({
                ...i,
                ...empleados.map((e) => ({ ...e, ...empleadoUsuario.find((eu) => eu.cod_empleado === e.cod_empleado) })).find((e) => e.cod_usuario === i.usuario_id),
              })),
            },
            null,
            2
          )}
        </pre> */}
        {/* <pre>{JSON.stringify({ empleados }, null, 2)}</pre> */}
      </Grid>

      <DialogComponent
        titulo="Observaciones"
        handleClose={() => {
          setMostrarDialogCambioEstado(false);
          setObservacion("");
          setEstadoClick(undefined);
        }}
        openDialog={mostrarDialogCambioEstado}
      >
        <FormularioComponent
          background
          onInput={({ val }) => setObservacion(val)}
          inputs={[{ id: "Observación", tipo: "textarea", val: observacion, size: 12 }]}
          botones={{
            agregar: {
              texto: "Guardar",
              onClick: () => {
                obtenerCambiarDeEstado(observacion, estadoClick);
                // actualizarLista();
                setMostrarDialogCambioEstado(false);
              },
            },
          }}
        />
      </DialogComponent>

      {/* <pre>{JSON.stringify(entidadPais, null, 2)}</pre> */}

      {/* <TabComponent
        opciones={[
          // Tab principal con el formulario completo relacionado al CRUD
          {
            id: 1,
            label: "Informacion de componente",
            content: (
              <Box sx={{ p: 1, m: 0 }}>
                <FormularioCompletoEntidadPaises id={id} entidadpaises={item} catalogos={{ estados }} />
              </Box>
            ),
          },
          // // [ TEMPORAL ] Tab que contiene el modal para maquetacion
          // {
          //   id: 2,
          //   label: "Vista de formulario Modal",
          //   content: (
          //     <Box sx={{ p: 1, m: 0 }}>
          //       <ModalEntidadPaises />
          //     </Box>
          //   ),
          // },
          // Opcion adicional referente a alguna información de apoyo
          // { id: 3, label: "Informacion de opcion", content: <Box sx={{ p: 1, m: 0 }}></Box> },
        ]}
      /> */}
    </Box>
  );
};
VistaEntidadPaises.propTypes = {
  // ELEMENTO
  tipo: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  entidad_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  entidadPais: PropTypes.object,
  entidad: PropTypes.object,
  obtenerFilaSeleccionada: PropTypes.func,
  actualizarLista: PropTypes.func,
  tipoStr: PropTypes.string,
};
export default VistaEntidadPaises;

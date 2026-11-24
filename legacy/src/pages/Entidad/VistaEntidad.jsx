import React, { useCallback, useEffect, useMemo, useState } from "react";
import FormularioCompletoEntidad from "../../views/Entidad/FormularioCompletoEntidad";
import TabComponent from "../../components/Tabs/TabComponent";
import { Box, Button, Grid, Icon, ListItemButton, Typography } from "@mui/material";
// import ModalCliente from "./ModalCliente";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api";
import { decryptId } from "../../api/encryptDecrypt";
import { useDispatch, useSelector } from "react-redux";
import { apagarCarga, encenderCarga } from "../../store/slices/status/statusSlice";
import PropTypes from "prop-types";
import useObtenerOpcionesAcciones from "../../hooks/useObtenerOpcionesAcciones";
import ListaEntidadNombres from "./EntidadNombres/ListaEntidadNombres";
import ListaEntidadContactos from "./EntidadContactos/ListaEntidadContactos";
import ListaEntidadDirecciones from "./EntidadDirecciones/ListaEntidadDirecciones";
import FormularioCompletoEntidadNombres from "../../views/Entidad/EntidadNombres/FormularioCompletoEntidadNombres";
import FormularioCompletoEntidadContactos from "../../views/Entidad/EntidadContactos/FormularioCompletoEntidadContactos";
import StepperComponent from "../../components/Stepper/StepperComponent";
import ListaEntidadPaises from "./EntidadPaises/ListaEntidadPaises";
import ListaEntidadIdentificacion from "./EntidadIdentificacion/ListaEntidadIdentificacion";
import ListaentidadConfiguracion from "./EntidadConfiguracion/ListaentidadConfiguracion";
import VistaEntidadPaises from "./EntidadPaises/VistaEntidadPaises";
import ListaEntidadBitacora from "./EntidadBitacora/ListaEntidadBitacora";
import ListaEntidadCreditos from "./EntidadCreditos/ListaEntidadCreditos";
import ListaEntidadImpuestos from "./EntidadImpuestos/ListaEntidadImpuestos";
import CreacionTarifa from "../Tarifas/CreacionTarifa/CreacionTarifa";
import VistaEntidadRelacion from "./EntidadRelacion/VistaEntidadRelacion";
import { useFetchOpciones } from "@/hooks/Fetch/useFetchConfiguracion";

const VistaCliente = (props) => {
  /**
   * # ---------------------------------------------------------------------------- #
   * #                               PARAMETROS DE URL                              #
   * # ---------------------------------------------------------------------------- #
   * Obtener la lista de paramentros de la url (id)
   */
  const { tipoStr, id_prop = null, tipo_prop = null } = props;
  let { encryptedId, encryptedTipo } = useParams();
  let id = id_prop || decryptId(encryptedId);
  let tipo = tipo_prop || decryptId(encryptedTipo);
  const { currentCategoria } = useSelector((slice) => slice.menu);
  const opcionesFetch = useFetchOpciones();

  const [estado, setEstado] = useState(0);
  const [codigosEstados, setCodigosEstados] = useState([1]);

  const opciones = useMemo(
    () => [...(currentCategoria?.opciones || [])].map((o) => ({ ...o, ...(opcionesFetch.data || []).find((of) => of.cod_opcion === o.cod_opcion) })),
    [currentCategoria, opcionesFetch.data],
  );
  const opcionesOrdenadas = useMemo(() => opciones.sort((a, b) => a.cod_opcion - b.cod_opcion), [opciones]);

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
  const [item, setItem] = useState({});
  const [estados, setEstados] = useState([]);
  const [paises, setPaises] = useState([]);
  const [ciudades, setCiudades] = useState([]);
  const [industrias, setIndustrias] = useState([]);
  const [tipos, setTipos] = useState();
  const [empresas, setEmpresas] = useState();
  const [monedas, setMonedas] = useState([]);
  const [entidadNombreSeleccionado, setEntidadNombreSeleccionado] = useState(null);
  const [entidadContactoSeleccionado, setEntidadContactoSeleccionado] = useState(null);
  const [entidadPaisSeleccionado, setEntidadPaisSeleccionado] = useState(null);
  const [estadoReferenteDePreACliente, setEstadoReferenteDePreACliente] = useState([]);
  const [actualizar, setActualizar] = useState(0);
  const dispatch = useDispatch();
  const { permisosArray, catalogoArray } = useObtenerOpcionesAcciones();

  /**
   * # ---------------------------------------------------------------------------- #
   * #                               CONSULTA DE DATOS                              #
   * # ---------------------------------------------------------------------------- #
   * Consulta a base de datos de la lista
   */

  /* -------------------------------------------------------------------------- */
  /* Obtener los datos del crud */
  const obtenerDatos = useCallback(async () => {
    id === "new"
      ? null
      : await api
          .get("api/appweb/lista-entidad", { params: { entidad_id: id, tipo_entidad: tipoStr } })
          .then(({ data }) => setItem(data.data.data[0]))
          .catch((e) => console.error(e));
  }, [id, tipoStr]);
  //  Obtener el catalogo de estados
  const obtenerEstados = useCallback(async () => {
    await api
      .get("api/appweb/listaestados", { params: { cod_tipo: 27 } })
      .then(({ data }) => {
        setEstados(data.data);
        setEstado(0);
        setCodigosEstados(data.data.map((i) => i.cod_estado));
      })
      .catch((e) => console.error(e));
  }, []);
  const obtenerTipos = useCallback(async () => {
    await api
      .get("api/appweb/lista-tipo")
      .then(({ data }) => setTipos(data.data))
      .catch((e) => console.error(e));
  }, []);
  const obtenerEstadoRespectoARelacionPreACliente = useCallback(async () => {
    if (tipoStr.includes("PRE-"))
      await api
        .post("api/appweb/recuperar-estados-de-pre-a-cliente", { entidad_id: id, cod_pais: 1 })
        .then(({ data }) => setEstadoReferenteDePreACliente(data.data.lista_estados_proceso))
        .catch((e) => console.error(e));
  }, [tipoStr, id]);
  const obtenerPais = useCallback(async () => {
    await api
      .get("api/appweb/listapaises")
      .then(({ data }) => setPaises(data.data))
      .catch((e) => console.error(e));
  }, []);
  const obtenerCiudad = useCallback(async () => {
    await api
      .get("api/appweb/lista-ciudad")
      .then(({ data }) => setCiudades(data.data))
      .catch((e) => console.error(e));
  }, []);
  const obtenerIndustria = useCallback(async () => {
    await api
      .get("api/appweb/lista-industria", { params: { tipo_entidad: tipoStr.replace("PRE-", "").toUpperCase()[0] } })
      .then(async ({ data }) =>
        data.data.length == 0
          ? await api.get("api/appweb/lista-industria").then(({ data }) => setIndustrias(data.data.filter((i) => i.tipo_entidad === tipoStr.replace("PRE-", "").toUpperCase()[0])))
          : setIndustrias(data.data),
      )
      .catch((e) => console.error(e));
  }, [tipoStr]);
  const obtenerEmpresas = useCallback(async () => {
    await api
      .get("api/appweb/listaempresas")
      .then(({ data }) => setEmpresas(data.data))
      .catch((e) => console.error(e));
  }, []);
  const obtenerMonedas = useCallback(async () => {
    await api
      .get("api/appweb/lista-moneda")
      .then(({ data }) => setMonedas(data.data))
      .catch((e) => console.error(e));
  }, []);
  // Realizar la consulta
  const hacerConsultas = useCallback(async () => {
    await Promise.all([
      obtenerEmpresas(),
      obtenerMonedas(),
      obtenerEstadoRespectoARelacionPreACliente(),
      obtenerEstados(),
      obtenerDatos(),
      obtenerTipos(),
      obtenerPais(),
      obtenerCiudad(),
      obtenerIndustria(),
    ]).then(() => dispatch(apagarCarga()));
  }, [obtenerEmpresas, obtenerMonedas, obtenerEstadoRespectoARelacionPreACliente, obtenerDatos, obtenerEstados, obtenerPais, obtenerCiudad, obtenerIndustria, obtenerTipos, dispatch]);
  useEffect(() => {
    hacerConsultas();
  }, [hacerConsultas]);
  useEffect(() => {
    dispatch(encenderCarga());
  }, [dispatch]);
  return (
    <Box sx={{ p: 1, m: 0 }}>
      {/* Boton para regresar a la lista */}
      {!id_prop && (
        <Button onClick={() => navigate(`../`)} sx={{ color: `primary.${localStorage.getItem("theme") === "light" ? "dark" : "light"}` }}>
          <Icon className="c-derecha-arriba-izquierda" />
          Regresar a la lista
        </Button>
      )}
      {/* Nombre del elemento */}
      <Grid container>
        <Grid size={{ xs: 12, sm: 10 }}>
          <Typography variant="h4">{item?.entidad_nombre}</Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: "grow" }} sx={{ my: "auto" }}>
          <Typography variant="h6" textAlign="right" color="primary">
            {tipoStr?.toLowerCase().replace(/(^\w|-\w)/g, (match) => match.toUpperCase())}
          </Typography>
        </Grid>
      </Grid>
      {/* <StepperComponent
        sx={{ my: 1 }}
        estados={estados}
        autorizacion
        siguienteProps={{
          onClick: () => setEstado((i) => i + 1),
          disabled: estado === codigosEstados.length - 1,
          label: "Avanzar",
        }}
        anteriorProps={{
          onClick: () => setEstado((i) => i - 1),
          disabled: estado === 0,
          label: "retroceder",
        }}
        autorizarProps={{
          onClick: () => {
            console.log("autorizarProps");
          },
          disabled: false,
          label: undefined,
        }}
        estado={codigosEstados[estado]}
        propiedades={{ id: "cod_estado", label: "estado_desc" }}
      /> */}
      {/* Tabs para la pantalla */}
      {opcionesOrdenadas.length > 0 && (
        <TabComponent
          tabInicial={opcionesOrdenadas.filter((o) => o.nivel_opcion === "I")[0]?.cod_opcion || false}
          onCambiarTab={() => {
            setEntidadPaisSeleccionado(null);
            setEntidadNombreSeleccionado(null);
            setEntidadContactoSeleccionado(null);
          }}
          tabHoverExpand
          opciones={[
            ...(opcionesOrdenadas
              .filter((o) => o.nivel_opcion === "I")
              .filter((o) => (id === "new" ? o.nom_opcion === "Información" : true))
              .map((o) => ({
                id: o.cod_opcion,
                label: o.nom_opcion,
                icono: o.ico_opcion,
                disable: !permisosArray.find((pa) => pa.cod_opcion === o.cod_opcion),
                activeIconColor: "white.main",
                activeColor: "white.main",
                activeBg: "primary.main",
                content:
                  o.nom_opcion === "Información" ? (
                    <Grid>
                      <FormularioCompletoEntidad id={id} tipoStr={tipoStr} tipo={Number(tipo)} cliente={item} catalogos={{ monedas, empresas, estados, paises, ciudades, industrias, tipos }} />
                    </Grid>
                  ) : o.nom_opcion === "Nombres" ? (
                    <Grid>
                      <ListaEntidadNombres
                        tipo={tipo}
                        entidad={item}
                        entidad_id={id}
                        obtenerFilaSeleccionada={(fila) => {
                          setEntidadNombreSeleccionado(fila);
                        }}
                      />
                      {entidadNombreSeleccionado && (
                        <FormularioCompletoEntidadNombres catalogos={{ empresas, estados, paises, ciudades, industrias, tipos }} entidadNombres={entidadNombreSeleccionado} />
                      )}
                    </Grid>
                  ) : o.nom_opcion === "Identificaciones" ? (
                    <Grid>
                      <ListaEntidadIdentificacion
                        tipo={tipo}
                        entidad={item}
                        entidad_id={id}
                        obtenerFilaSeleccionada={(fila) => {
                          // console.log(fila);
                          // setEntidadContactoSeleccionado(fila);
                        }}
                      />
                    </Grid>
                  ) : o.nom_opcion === "Contactos" ? (
                    <ListaEntidadContactos
                      tipo={tipo}
                      entidad={item}
                      entidad_id={id}
                      obtenerFilaSeleccionada={(fila) => {
                        setEntidadNombreSeleccionado(fila);
                      }}
                    />
                  ) : o.nom_opcion === "Direcciones" ? (
                    <Grid>
                      <ListaEntidadDirecciones
                        tipo={tipo}
                        entidad={item}
                        entidad_id={id}
                        obtenerFilaSeleccionada={(fila) => {
                          setEntidadContactoSeleccionado(fila);
                        }}
                        mostrarKb ={tipoStr === "CLIENTE"}
                      />
                    </Grid>
                  ) : o.nom_opcion === "Paises" ? (
                    <Grid>
                      <ListaEntidadPaises
                        tipo={tipo}
                        entidad={item}
                        entidad_id={id}
                        obtenerFilaSeleccionada={(fila) => {
                          setEntidadPaisSeleccionado(fila);
                        }}
                        key={actualizar}
                      />
                      {entidadPaisSeleccionado && (
                        <VistaEntidadPaises
                          tipo={tipo}
                          entidad_id={id}
                          catalogos={{ empresas, estados, paises, ciudades, industrias, tipos }}
                          entidadPais={entidadPaisSeleccionado}
                          tipoStr={tipoStr}
                          actualizarLista={() => setActualizar((e) => e + 1)}
                        />
                      )}
                    </Grid>
                  ) : o.nom_opcion === "Crédito" ? (
                    <Grid>
                      <ListaEntidadCreditos entidad_id={id} />
                    </Grid>
                  ) : o.nom_opcion === "Impuesto" ? (
                    <ListaEntidadImpuestos entidad_id={id} />
                  ) : o.nom_opcion === "Configuracion" ? (
                    <Grid>
                      <ListaentidadConfiguracion
                        tipo={tipo}
                        entidad={item}
                        entidad_id={id}
                        obtenerFilaSeleccionada={(fila) => {
                          setEntidadContactoSeleccionado(fila);
                        }}
                      />
                    </Grid>
                  ) : o.nom_opcion === "Bitácora" ? (
                    <Grid>
                      <ListaEntidadBitacora
                        tipo={tipo}
                        entidad={item}
                        entidad_id={id}
                        obtenerFilaSeleccionada={(fila) => {
                          setEntidadContactoSeleccionado(fila);
                        }}
                      />
                    </Grid>
                  ) : o.nom_opcion === "Relacion" ? (
                    <Grid>
                      <VistaEntidadRelacion entidad={item} />
                    </Grid>
                  ) : o.nom_opcion === "Tarifas" ? (
                    <CreacionTarifa proveedor={item || null} />
                  ) : (
                    <></>
                  ),
              })) || []),
          ]}
        />
      )}
      {/* {JSON.stringify(opcionesOrdenadas, null, 2)} */}
      {/* {JSON.stringify(opcionesOrdenadas[0], null, 2)} */}
      {/* <pre>
        {JSON.stringify(
          currentCategoria?.opciones.filter((o) => o.nivel_opcion === "I"),
          null,
          2
        )}
      </pre> */}
    </Box>
  );
};
VistaCliente.propTypes = {
  // ELEMENTO
  tipoStr: PropTypes.string,
  id_prop: PropTypes.number,
  tipo_prop: PropTypes.number,
};
export default VistaCliente;

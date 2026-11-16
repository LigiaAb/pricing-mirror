import React, { useCallback, useEffect, useMemo, useState } from "react";
import LOADER from "../../../assets/loader_1.gif";
import PropTypes from "prop-types";
import { Grid, Typography, Box } from "@mui/material";
import EditableDataGridComponent from "../../../components/Tabla/EditableDataGridComponent";
import DialogComponent from "../../../components/Dialog/DialogComponent";
import { FiltroEntidad } from "../../Entidad/FiltroEntidad";
import FormularioCompletoEntidad from "../../Entidad/FormularioCompletoEntidad";
import TablaEntidadActividad from "../../Actividades/TablaEntidadActividad";
import { api } from "../../../api";
import useObtenerOpcionesAcciones from "../../../hooks/useObtenerOpcionesAcciones";
import { se } from "date-fns/locale";

const permisosBase = { ver: false, editar: false, eliminar: false, guardar: false };
const objetoBase = { cod_tarifa_entidad: null, cliente: null, cod_metodo: null, entidad_id: null, nombre_cliente: null, cod_estado: null };

const FormularioCompletoEntidadMetodo = (props) => {
  const { metodo, catalogos } = props;

  // const { estados = [], paises = [], ciudades = [], industrias = [], empresas = [], monedas = [], tipos = [] } = catalogos;

  const [openCrear, setOpenCrear] = useState(false);
  const [filaSeleccionada, setFilaSeleccionada] = useState(null);
  const [openBusqueda, setOpenBusqueda] = useState(false);
  const [results, setResults] = useState([]);
  const [lista, setLista] = useState([]);
  const [listaConsultada, setListaConsultada] = useState([]);
  const [clienteExterno, setClienteExterno] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [item, setItem] = useState({});
  const [estados, setEstados] = useState([]);
  const [paises, setPaises] = useState([]);
  const [ciudades, setCiudades] = useState([]);
  const [industrias, setIndustrias] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [tipos, setTipos] = useState([]);
  const { permisosArray } = useObtenerOpcionesAcciones();
  const encabezaods = useMemo(
    () => [
      {
        field: "cliente",
        headerName: "Cliente",
        editable: true,
        varificarSiEsEditable: ({ id, field, row }) => row?.isNew,
        type: "selectQuery",
        valueOptions: [],
        labelOption: "entidad_nombre",
        valueOption: "entidad_id",
        url: "api/appweb/busqueda-entidad-x-criterio",
        queryField: "ref_busqueda",
        params: { list_descripcion_tipo: ["PRE-CLIENTE", "CLIENTE"], tipo_busqueda: "NOMBRE" },
        method: "GET",
        // minWidth: 150,
        // onBuscar: () => setOpenBusqueda(true),
        onCrear: () => setOpenCrear(true),
        valorExterno: clienteExterno,
      },
      // { field: "aplica", headerName: "Aplica", type: "checkbox", editable: true, width: 50 },
    ],
    [clienteExterno],
  );
  const datosObligatorios = useMemo(() => {
    return { cliente: "Cliente" };
  }, []);
  const obtenerAccionesSegunPermisos = useMemo(() => {
    let item = permisosArray.find((i) => i.nom_opcion === "Identificaciones");
    return {
      ...permisosBase,
      agregar: true, // item?.acciones.some((i) => i.cod_accion === 3),
      ver: false, // item?.acciones.some((i) => i.cod_accion === 1),
      editar: false, // item?.acciones.some((i) => i.cod_accion === 2),
      guardar: true, // item?.acciones.some((i) => i.cod_accion === 2),
      eliminar: true, // item?.acciones.some((i) => [5, 4].includes(i.cod_accion)),
    };
  }, [permisosArray]);
  const formatearFilaTabla = useCallback(
    (fila) => ({
      ...fila,
      cliente: { entidad_id: fila.entidad_id, entidad_nombre: fila.nombre_cliente },
      cod_metodo: metodo.cod_metodo,
      tipo: tipos.find((m) => m.cod_tipo === fila.cod_tipo),
    }),
    [metodo, tipos],
  );
  const formatearFilaApi = useCallback(
    (fila) => ({
      cod_estado: fila.cod_estado || 1,
      cod_metodo: metodo.cod_metodo,
      cod_tarifa_entidad: fila.cod_tarifa_entidad || null,
      entidad_id: fila.cliente?.entidad_id,
      entidad_aplica: true,
    }),
    [metodo],
  );
  const listaAProcesar = useMemo(() => lista.map((i) => i), [lista]);
  const entidadSeleccionada = (data) => {
    setOpenBusqueda(false);
    setResults([]);

    let newVal = filaSeleccionada.row;

    setFilaSeleccionada((val) => ({ ...val, row: { ...newVal, cliente: data } }));
    // setListaAProcesar((lista) => lista.map((row) => (row.cod_actividad != newVal.cod_actividad ? row : { ...newVal, cliente: data })));
    setClienteExterno(data);
  };

  const nuevoEnBusqueda = () => {
    setOpenBusqueda(false);
    setResults([]);
    setOpenCrear(true);
  };

  const entidadCreada = async (data) => {
    const entityData = await api.post("api/appweb/recuperar-datos-entidad", { cod_tipo: data.cod_tipo, entidad_id: data.entidad_id });
    setOpenCrear(false);
  };
  const consultar_estados = useCallback(async () => await api.get("api/appweb/listaestados").then(({ data }) => setEstados(data.data)), []);
  const consultar_paises = useCallback(async () => await api.get("api/appweb/listapaises").then(({ data }) => setPaises(data.data)), []);
  const consultar_ciudades = useCallback(async () => await api.get("api/appweb/lista-ciudad").then(({ data }) => setCiudades(data.data)), []);
  const consultar_industrias = useCallback(async () => await api.get("api/appweb/lista-industria").then(({ data }) => setIndustrias(data.data)), []);
  const consultar_empresas = useCallback(async () => await api.get("api/appweb/listaempresas").then(({ data }) => setEmpresas(data.data)), []);
  const consultar_monedas = useCallback(async () => await api.get("api/appweb/lista-moneda").then(({ data }) => setMonedas(data.data)), []);
  const consultar_tipos = useCallback(async () => await api.get("api/appweb/lista-tipo").then(({ data }) => setTipos(data.data)), []);

  const consultar_entidades_metodo = useCallback(
    async () =>
      await api.get("api/appweb/lista-tarifa-entidad", { params: { cod_estado: 1, cod_metodo: metodo.cod_metodo } }).then(({ data }) => {
        setLista(data.data.map(formatearFilaTabla));
        setListaConsultada(data.data.map(formatearFilaTabla));
      }),
    [metodo],
  );

  const eliminarFila = useCallback(async (row) => await api.post("api/appweb/actualizar-tarifa-entidad", { ...row, cod_estado: 4 }).then(() => consultar_entidades_metodo()), []);
  const guardar = useCallback(async (row) => await api.post("api/appweb/actualizar-tarifa-entidad", ...row).then(() => consultar_entidades_metodo()), []);
  const agregar = useCallback(async (row) => await api.post("api/appweb/insertar-tarifa-entidad", { ...row }).then(() => consultar_entidades_metodo()), []);

  const consultarCatalogos = useCallback(async () => {
    await Promise.all([
      consultar_estados(),
      consultar_paises(),
      consultar_ciudades(),
      consultar_industrias(),
      consultar_empresas(),
      consultar_monedas(),
      consultar_tipos(),
      consultar_entidades_metodo(),
    ]);
  }, [consultar_estados, consultar_paises, consultar_ciudades, consultar_industrias, consultar_empresas, consultar_monedas, consultar_tipos, consultar_entidades_metodo]);

  useEffect(() => {
    setIsLoading(true);
    consultarCatalogos().finally(() => setIsLoading(false));
  }, [consultarCatalogos]);

  if (isLoading) return <Box component="img" src={LOADER} sx={{ maxWidth: { xs: "90%" }, mx: "auto" }} />;

  return (
    <Grid container>
      <Grid width="100%">
        <EditableDataGridComponent
          idKey="cod_tarifa_entidad"
          acciones={obtenerAccionesSegunPermisos}
          datos={lista}
          encabezados={encabezaods}
          objetoBase={objetoBase}
          columnasAExtender={[0]}
          onInput={({ field, id, value }) => {
            if (field === "tipo") setFilaSeleccionada((val) => ({ ...val, row: { ...val.row, [field]: value } }));
          }}
          onAddRow={(row) => {
            setLista((lista) => [...lista, { ...row, ...objetoBase, cod_tarifa_entidad: row.id, id: row.id, cod_estado: 1 }]);
            setFilaSeleccionada((val) => ({ ...(val || {}), row: { ...objetoBase, ...row } }));
          }}
          onEdditRow={(row) => setFilaSeleccionada(row)}
          onRowSave={async (row) => {
            setLista((lista) => lista.map((i) => (i.cod_tarifa_entidad !== row.id ? i : formatearFilaTabla(row.row))));
            if (listaConsultada.some((i) => i.cod_tarifa_entidad === row.id)) await guardar(formatearFilaApi(row.row));
            else await agregar(formatearFilaApi(row.row));
          }}
          onDeleteRow={(row) => {
            if (listaConsultada.some((i) => i.cod_tarifa_entidad === row.id)) eliminarFila(formatearFilaApi(row.row));
          }}
          textoAlertaEliminacion={(id) => {
            let l = lista.find((i) => i.cod_tarifa_entidad === id);
            return (
              <>
                <Typography>
                  Esta por eliminar la asingacion del Cliente{" "}
                  <Typography variant="span" fontSize={20} color="error">
                    <b>{l?.cliente?.entidad_nombre}</b>.
                  </Typography>
                  <br />
                  Esto puede causar problemas a la hora mostrar las cotizaciones.
                  <br />
                  ¿Esta seguro que desea continuar?
                </Typography>
              </>
            );
          }}
          camposRequeridosParaGuardar={datosObligatorios}
        />
      </Grid>
      <DialogComponent
        openDialog={openCrear}
        handleClose={() => setOpenCrear(false)}
        titulo="Crear Pre-Cliente"
        width="80vw"
        content={
          <Grid sx={{ display: "flex", flexDirection: "column", px: 3 }}>
            <FormularioCompletoEntidad id="new" tipo={5} cliente={item} catalogos={{ estados, paises, ciudades, industrias, empresas, monedas, tipos }} onCreate={entidadCreada} />
          </Grid>
        }
      />

      <DialogComponent
        openDialog={openBusqueda}
        handleClose={() => {
          setOpenBusqueda(false);
          setResults([]);
        }}
        titulo="Buscar Cliente"
        content={
          <Grid sx={{ display: "flex", flexDirection: "column", px: 3, minWidth: "80vw", maxHeight: "80vh" }}>
            <FiltroEntidad
              tiposEntidad={["PRE-CLIENTE", "CLIENTE"]}
              tiposBusqueda={[
                { label: "CODIGO", value: 1 },
                { label: "NIT", value: 2 },
                { label: "NOMBRE", value: 3 },
              ]}
              setResults={setResults}
              useCache={false}
              listaTipos={tipos}
              tipoDefaultIndex={2}
            />

            <TablaEntidadActividad lista={results} reConsultar={null} obtenerFilaSeleccionada={entidadSeleccionada} handleNuevo={nuevoEnBusqueda} />
          </Grid>
        }
      />
      <Grid container>{/* <pre>{JSON.stringify(lista, null, 2)}</pre> */}</Grid>
    </Grid>
  );
};

FormularioCompletoEntidadMetodo.propTypes = {
  metodo: PropTypes.object,
  reConsultar: PropTypes.func,
  catalogos: PropTypes.object,
};

export default FormularioCompletoEntidadMetodo;

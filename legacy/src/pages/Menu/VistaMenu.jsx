import React, { useCallback, useEffect, useMemo, useState } from "react";
import FormularioCompletoMenu from "../../views/Menu/FormularioCompletoMenu";
import TabComponent from "../../components/Tabs/TabComponent";
import { Box, Button, Grid, Icon, Typography } from "@mui/material";
// import ModalMenu from "./ModalMenu";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api";
import { decryptId } from "../../api/encryptDecrypt";
import { useDispatch, useSelector } from "react-redux";
import { apagarCarga, encenderCarga } from "../../store/slices/status/statusSlice";
import TransferListsComponent from "../../components/Lists/TransferListsComponent";

function not(a, b, key) {
  return a.filter((value) => b.findIndex((item) => item[key] === value[key]) === -1);
}

const VistaMenu = () => {
  /**
   * PARAMETROS DE URL
   * Obtener la lista de paramentros de la url (id)
   */
  let { encryptedId } = useParams();
  let id = decryptId(encryptedId);
  const { currentCategoria } = useSelector((slice) => slice.menu);
  /**
   * USE NAVIGATE
   * Navegacion para regresar a la lista anterior y cualquier ruta necesaria en el futuro
   */
  const navigate = useNavigate();
  /**
   * USE STATE
   * Lista de States
   */
  const [item, setItem] = useState({});
  const [empresas, setEmpresas] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [categoriaMenu, setCategoriaMenu] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [opcionActual, setCategoriaAvtual] = useState(false);
  const dispatch = useDispatch();

  const opcionSeleccionada = useMemo(() => currentCategoria?.opciones.find((i) => i.cod_opcion === opcionActual), [currentCategoria?.opciones, opcionActual]);

  const listaNo = useMemo(
    () =>
      categorias
        .filter((i) => !categoriaMenu.map((i) => i.cod_categoria).includes(i.cod_categoria))
        .map((i) => ({
          ...i,
          label: () => i.nom_cat,
        })),
    [categorias, categoriaMenu]
  );
  const listaSi = useMemo(
    () =>
      categorias
        .filter((i) => categoriaMenu.map((i) => i.cod_categoria).includes(i.cod_categoria))
        .map((i) => ({
          ...i,
          label: () => i.nom_cat,
        })),
    [categorias, categoriaMenu]
  );
  /**
   * CONSULTA DE DATOS
   * Consulta a base de datos de la lista
   */
  // Obtener los datos del crud
  const obtenerDatos = useCallback(async () => {
    id === "new"
      ? null
      : await api
          .get("api/appweb/lista-menu", { params: { cod_menu: id } })
          .then(({ data }) => setItem(data.data[0]))
          .catch((e) => console.error(e));
  }, [id]);
  const obtenerEmpresas = useCallback(async () => {
    await api
      .get("api/appweb/listaempresas")
      .then(({ data }) => setEmpresas(data.data))
      .catch((e) => console.error(e));
  }, []);
  const obtenerCentrosCosto = useCallback(async () => {
    await api
      .get("api/appweb/listacentrocosto")
      .then(({ data }) => setCentrosCosto(data.data))
      .catch((e) => console.error(e));
  }, []);
  const obtenerModulos = useCallback(async () => {
    await api
      .get("api/appweb/listamodulo")
      .then(({ data }) => setModulos(data.data))
      .catch((e) => console.error(e));
  }, []);
  const obtenerCategoriaMenu = useCallback(async () => {
    id === "new"
      ? null
      : await api
          .get("api/appweb/lista-categoria-menu", { params: { cod_menu: id } })
          .then(({ data }) => setCategoriaMenu(data.data))
          .catch((e) => console.error(e));
  }, [id]);
  const obtenerRole = useCallback(async (id) => {
    await api
      .get("api/appweb/lista-categoria")
      .then(({ data }) => setCategorias(data.data))
      .catch((e) => console.error(e));
  }, []);
  const guardarTodo = async (left, lista) => {
    const listaAAgregar = not(lista, listaSi, "cod_categoria");
    const listaAQuitar = not(listaSi, lista, "cod_categoria");
    // AGREGAR LISTA
    await Promise.all(listaAAgregar.map((i) => api.post("api/appweb/insertar-categoria-menu", { cod_categoria: i.cod_categoria, cod_menu: item.cod_menu })));
    // // ELIMINAR DE LISTA LISTA eliminarccxmodulo
    await Promise.all(listaAQuitar.map((i) => api.post("api/appweb/eliminar-categoria-menu", { cod_categoria: i.cod_categoria, cod_menu: item.cod_menu })));

    if (listaAAgregar.length > 0 || listaAQuitar.length > 0) await obtenerCategoriaMenu();
  };
  // Realizar la consulta
  const hacerConsultas = useCallback(async () => {
    await Promise.all([obtenerDatos(), obtenerEmpresas(), obtenerCentrosCosto(), obtenerRole(), obtenerModulos(), obtenerCategoriaMenu()]).then(() => dispatch(apagarCarga()));
  }, [obtenerDatos, obtenerEmpresas, obtenerCentrosCosto, obtenerRole, obtenerModulos, obtenerCategoriaMenu, dispatch]);
  useEffect(() => {
    hacerConsultas();
  }, [hacerConsultas]);

  useEffect(() => {
    dispatch(encenderCarga());
  }, [dispatch]);

  return (
    <Box sx={{ p: 1, m: 0 }}>
      {/* Boton para regresar a la lista */}
      <Button color="primary" onClick={() => navigate(`/configuracion/accesos/menu`)}>
        <Icon className="c-derecha-arriba-izquierda" />
        Regresar a la lista
      </Button>
      {/* Nombre del elemento */}
      <Typography variant="h6">Menu {id}</Typography>
      {/* Tabs para la pantalla */}
      <TabComponent
        opciones={currentCategoria?.opciones?.filter((i) => i.nivel_opcion === "I").map((i) => ({ ...i, id: i.cod_opcion, label: i.nom_opcion, icono: i.opcion_icono }))}
        tabInicial={opcionActual}
        tabSeleccionado={setCategoriaAvtual}
      />
      {opcionSeleccionada?.nom_opcion === "Información" ? (
        <Box sx={{ p: 1, m: 0 }}>
          <FormularioCompletoMenu id={id} menu={item} catalogos={{ empresas, centrosCosto, modulos }} />
        </Box>
      ) : opcionSeleccionada?.nom_opcion === "Asignar Categorias" ? (
        <Box sx={{ p: 1, m: 0 }}>
          <Typography variant="h6">Asignación de Roles</Typography>
          <Grid width="100%">
            <TransferListsComponent
              // cambioEnLista={guardarUnMovimiento}
              guardarListas={guardarTodo}
              listaPrincipal={listaNo}
              listaSecundaria={listaSi}
              objectLabel="label"
              objectValue="cod_categoria"
              propFiltro={["nom_cat"]}
              tituloListaPrincipal="Categorias no Asignados"
              tituloListaSecundaria="Categorias Asignados"
              // readonly
              permitirPasarTodos
              // size={6}
            />
          </Grid>
        </Box>
      ) : (
        <>Opcion No Manejada</>
      )}
    </Box>
  );
};
export default VistaMenu;

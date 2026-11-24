import React, { useCallback, useEffect, useMemo, useState } from "react";
import FormularioCompletoPuesto from "../../views/Puesto/FormularioCompletoPuesto";
import TabComponent from "../../components/Tabs/TabComponent";
import { Box, Button, Grid, Icon, Typography } from "@mui/material";
// import ModalPuesto from "./ModalPuesto";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api";
import TablaPuestoRol from "../../views/PuestoRol/TablaPuestoRol";
import FormularioCompletoPuestoRol from "../../views/PuestoRol/FormularioCompletoPuestoRol";
import { decryptId } from "../../api/encryptDecrypt";
import { useDispatch } from "react-redux";
import { apagarCarga, encenderCarga } from "../../store/slices/status/statusSlice";
import TransferListsComponent from "../../components/Lists/TransferListsComponent";
import FormularioComponent from "../../components/Formulario/FormularioComponent";

function not(a, b, key) {
  return a.filter((value) => b.findIndex((item) => item[key] === value[key]) === -1);
}

const VistaPuesto = () => {
  /**
   * PARAMETROS DE URL
   * Obtener la lista de paramentros de la url (id)
   */
  let { encryptedId } = useParams();
  let id = decryptId(encryptedId);

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
  const [estados, setEstados] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [tiposAsignacion, setTiposAsignacion] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const [rolPuesto, setRolPuesto] = useState([]);
  const [roles, setRoles] = useState([]);
  const [rolSeleccionado, setRolSeleccionado] = useState({});
  const [jsonModify, setJsonModify] = useState(JSON.stringify({}, null, 2));
  const dispatch = useDispatch();

  const listaNo = useMemo(
    () =>
      roles
        .filter((i) => !rolPuesto.map((i) => i.cod_rol).includes(i.cod_rol))
        .map((i) => ({
          ...i,
          label: () => i.rol_desc,
        })),
    [roles, rolPuesto]
  );

  const listaSi = useMemo(
    () =>
      roles
        .filter((i) => rolPuesto.map((i) => i.cod_rol).includes(i.cod_rol))
        .map((i) => ({
          ...i,
          label: () => i.rol_desc,
        })),
    [roles, rolPuesto]
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
          .get("api/appweb/lista-puesto", { params: { cod_puesto: id } })
          .then(({ data }) => {
            setItem(data.data[0]);
            setJsonModify(JSON.stringify(JSON.parse(data.data[0].json_puesto), null, 2));
          })
          .catch((e) => console.error(e));
  }, [id]);

  //  Obtener el catalogo de estados
  const obtenerEstados = useCallback(async () => {
    await api
      .get("api/appweb/listaestados")
      .then(({ data }) => setEstados(data.data))
      .catch((e) => console.error(e));
  }, []);

  //  Obtener el catalogo de empresas
  const obtenerEmpresa = useCallback(async () => {
    await api
      .get("api/appweb/listaempresas")
      .then(({ data }) => setEmpresas(data.data))
      .catch((e) => console.error(e));
  }, []);

  //  Obtener el catalogo de centro de costo
  const obtenerCentroCosto = useCallback(async () => {
    await api
      .get("api/appweb/listacentrocosto")
      .then(({ data }) => setCentrosCosto(data.data))
      .catch((e) => console.error(e));
  }, []);

  //  Obtener el catalogo de centro de costo
  const obtenerTiposAsignacion = useCallback(async () => {
    await api
      .get("api/appweb/lista-tipo", { params: { tipo_tabla: "ASIGNACION_ENTIDAD" } })
      .then(({ data }) => setTiposAsignacion(data.data))
      .catch((e) => console.error(e));
  }, []);

  //  Obtener el catalogo de centro de costo
  const obtenerRolesPorPuesto = useCallback(async () => {
    id === "new"
      ? null
      : await api
          .get("api/appweb/lista-rolxpuesto", { params: { cod_puesto: id } })
          .then(({ data }) => setRolPuesto(data.data))
          .catch((e) => console.error(e));
  }, [id]);

  const guardarJson = useCallback(async () => {
    await api.post("api/appweb/actualizar-json-rol", {
      cod_rol: Number(id),
      json_rol: JSON.stringify(JSON.parse(jsonModify)),
    });
  }, []);

  const safeJSONStringify = (obj) => {
    let defString = "{}";
    try {
      if (!obj) return defString;
      else return JSON.stringify(obj);
    } catch (error) {
      // console.error("Error en JSON.stringify:", error);
      return defString; // Retorna un string vacío '{}' en caso de error
    }
  };

  const safeJSONParse = (jsonStr) => {
    let defObj = {};
    try {
      if (!jsonStr) return defObj;
      else return JSON.parse(jsonStr);
    } catch (error) {
      // console.error("Error en JSON.parse:", error);
      return defObj; // Retorna un objeto vacío {} en caso de error
    }
  };

  const darFormatoAObjeto = (json = {}, valoresAMantener = []) => {
    let json_ = {};

    valoresAMantener.map((key) => (json_[key] = json[key]));

    return json_;
  };

  function actualizarDatosDinamicos(jsonDestino, formatoOrigen) {
    let formatoDestino = jsonDestino ? { ...jsonDestino } : {};
    // Recorrer la jerarquía hasta llegar a "acciones"
    if (!formatoDestino.paises) formatoDestino.paises = formatoOrigen.paises || {};
    Object.keys(formatoOrigen.paises || {}).forEach((paisId) => {
      let paisDestino = formatoDestino.paises[paisId];
      if (!formatoDestino.paises[paisId]) formatoDestino.paises[paisId] = darFormatoAObjeto(formatoOrigen.paises[paisId], ["cod_pais", "nombre_pais", "empresas"]);
      else formatoDestino.paises[paisId] = darFormatoAObjeto(formatoDestino.paises[paisId], ["cod_pais", "nombre_pais", "empresas"]);
      paisDestino = formatoDestino.paises[paisId];
      const paisOrigen = formatoOrigen.paises[paisId];

      Object.keys(paisOrigen.empresas || {}).forEach((empresaId) => {
        let empresaDestino = paisDestino.empresas[empresaId];
        if (!paisDestino.empresas[empresaId])
          paisDestino.empresas[empresaId] = paisOrigen.empresas[empresaId] ? darFormatoAObjeto(paisOrigen.empresas[empresaId], ["cod_empresa", "nombre_emp", "centrosCosto", "tiposTransporte"]) : {};
        else paisDestino.empresas[empresaId] = darFormatoAObjeto(paisDestino.empresas[empresaId], ["cod_empresa", "nombre_emp", "centrosCosto", "tiposTransporte"]);
        empresaDestino = paisDestino.empresas[empresaId];
        const empresaOrigen = paisOrigen.empresas[empresaId];

        Object.keys(empresaOrigen.centrosCosto || {}).forEach((centroId) => {
          let centroDestino = empresaDestino.centrosCosto[centroId];
          if (!empresaDestino.centrosCosto[centroId])
            empresaDestino.centrosCosto[centroId] = empresaOrigen.centrosCosto[centroId] ? darFormatoAObjeto(empresaOrigen.centrosCosto[centroId], ["cod_cc", "nombre_cc", "modulos", "tiposTransporte"]) : {};
          else empresaDestino.centrosCosto[centroId] = darFormatoAObjeto(empresaDestino.centrosCosto[centroId], ["cod_cc", "nombre_cc", "modulos", "tiposTransporte"]);
          centroDestino = empresaDestino.centrosCosto[centroId];
          const centroOrigen = empresaOrigen.centrosCosto[centroId];

          // Fusionar tiposTransporte del origen con el destino (sin sobrescribir)
          if (centroOrigen?.tiposTransporte) {
            if (!centroDestino.tiposTransporte) centroDestino.tiposTransporte = {};
            Object.keys(centroOrigen.tiposTransporte).forEach((tipoId) => {
              if (!centroDestino.tiposTransporte[tipoId]) {
                centroDestino.tiposTransporte[tipoId] = centroOrigen.tiposTransporte[tipoId];
              }
            });
          }

          Object.keys(centroOrigen.modulos).forEach((moduloId) => {
            let moduloDestino = centroDestino.modulos[moduloId];
            if (!centroDestino.modulos[moduloId])
              centroDestino.modulos[moduloId] = centroOrigen.modulos[moduloId] ? darFormatoAObjeto(centroOrigen.modulos[moduloId], ["cod_modulo", "nom_modulo", "modulo_ruta", "menus"]) : {};
            else centroDestino.modulos[moduloId] = darFormatoAObjeto(centroDestino.modulos[moduloId], ["cod_modulo", "nom_modulo", "modulo_ruta", "menus"]);
            moduloDestino = centroDestino.modulos[moduloId];
            const moduloOrigen = centroOrigen.modulos[moduloId];

            Object.keys(moduloOrigen.menus).forEach((menuId) => {
              let menuDestino = moduloDestino.menus[menuId];
              if (!moduloDestino.menus[menuId])
                moduloDestino.menus[menuId] = moduloOrigen.menus[menuId] ? darFormatoAObjeto(moduloOrigen.menus[menuId], ["cod_menu", "nom_menu", "menu_ruta", "categorias"]) : {};
              else moduloDestino.menus[menuId] = darFormatoAObjeto(moduloDestino.menus[menuId], ["cod_menu", "nom_menu", "menu_ruta", "categorias"]);
              menuDestino = moduloDestino.menus[menuId];
              const menuOrigen = moduloOrigen.menus[menuId];

              Object.keys(menuOrigen.categorias).forEach((categoriaId) => {
                let categoriaDestino = menuDestino.categorias[categoriaId];
                if (!menuDestino.categorias[categoriaId])
                  menuDestino.categorias[categoriaId] = menuOrigen.categorias[categoriaId]
                    ? darFormatoAObjeto(menuOrigen.categorias[categoriaId], ["cod_categoria", "nom_cat", "ruta_cat", "opciones"])
                    : {};
                else menuDestino.categorias[categoriaId] = darFormatoAObjeto(menuDestino.categorias[categoriaId], ["cod_categoria", "nom_cat", "ruta_cat", "opciones"]);
                categoriaDestino = menuDestino.categorias[categoriaId];
                const categoriaOrigen = menuOrigen.categorias[categoriaId];

                Object.keys(categoriaOrigen.opciones).forEach((opcionId) => {
                  let opcionDestino = categoriaDestino.opciones[opcionId];
                  if (!categoriaDestino.opciones[opcionId])
                    categoriaDestino.opciones[opcionId] = categoriaOrigen.opciones[opcionId]
                      ? darFormatoAObjeto(categoriaOrigen.opciones[opcionId], ["cod_opcion", "nom_opcion", "nivel_opcion", "acciones"])
                      : {};
                  else categoriaDestino.opciones[opcionId] = darFormatoAObjeto(categoriaDestino.opciones[opcionId], ["cod_opcion", "nom_opcion", "nivel_opcion", "acciones"]);
                  opcionDestino = categoriaDestino.opciones[opcionId];
                  const opcionOrigen = categoriaOrigen.opciones[opcionId];

                  Object.keys(opcionOrigen.acciones).forEach((accionId) => {
                    let accionDestino = opcionDestino.acciones[accionId];
                    if (!opcionDestino.acciones[accionId])
                      opcionDestino.acciones[accionId] = opcionOrigen.acciones[accionId] ? darFormatoAObjeto(opcionOrigen.acciones[accionId], ["cod_accion", "nom_accion"]) : {};
                    else opcionDestino.acciones[accionId] = darFormatoAObjeto(opcionDestino.acciones[accionId], ["cod_accion", "nom_accion"]);
                    accionDestino = opcionDestino.acciones[accionId];
                    const accionOrigen = darFormatoAObjeto(opcionOrigen.acciones[accionId], ["cod_accion", "nom_accion"]);

                    opcionDestino.acciones[accionId] = {
                      ...accionDestino,
                      ...accionOrigen,
                    };
                    // Aquí se actualizan las acciones sin perder las ya existentes
                    // opcionDestino.acciones = {
                    //   ...opcionDestino.acciones,
                    //   ...opcionOrigen.acciones,
                    // };
                  });
                });
              });
            });
          });
        });
      });
    });

    return formatoDestino;
  }

  const generarJSONParaUsuario = (items) => {
    // const json = safeJSONParse(item?.json_puesto);
    let json = { ruta_inicial: safeJSONParse(jsonModify)?.ruta_inicial, tipo_asignacion: item.cod_tipo_asignacion };

    items.map((c) => {
      const jsonRolParsed = safeJSONParse(c.json_rol);

      if (Object.keys(json).length === 0 || !json.paises) {
        // Si json está vacío o no tiene paises, usar directamente el json_rol
        json = { ...json, ...jsonRolParsed };
      } else {
        json = { ...json, ...actualizarDatosDinamicos(json, jsonRolParsed) };
      }

    });

    return json;
  };

  const obtenerRole = useCallback(async () => {
    await api
      .get("api/appweb/lista-rol")
      .then(({ data }) => setRoles(data.data))
      .catch((e) => console.error(e));
  }, []);

  const guardarTodo = async (left, lista) => {
    const listaAAgregar = not(lista, listaSi, "cod_rol");
    const listaAQuitar = not(listaSi, lista, "cod_rol");
    // AGREGAR LISTA
    await Promise.all(listaAAgregar.map((i) => api.post("api/appweb/insertar-rolxpuesto", { cod_rol: i.cod_rol, cod_puesto: item.cod_puesto, cod_estado: 1 })));
    // ELIMINAR DE LISTA
    await Promise.all(listaAQuitar.map((i) => api.post("api/appweb/eliminar-rolxpuesto", { cod_rol: i.cod_rol, cod_puesto: item.cod_puesto, cod_estado: 4 })));

    // Usar 'lista' en lugar de 'listaSi' para que incluya los roles actualizados
    const jsonGenerado = generarJSONParaUsuario(lista);
    await api.post("api/appweb/actualizar-json-puesto", { cod_puesto: Number(id), json_puesto: safeJSONStringify(jsonGenerado) });

    if (listaAAgregar.length > 0 || listaAQuitar.length > 0) await obtenerRolesPorPuesto();
  };

  const guardarUnMovimiento = async (lista) => {
    const listaAAgregar = not(lista, listaSi, "cod_rol");
    const listaAQuitar = not(listaSi, lista, "cod_rol");
    console.log(listaAAgregar, listaAQuitar);
    // AGREGAR LISTA
    await Promise.all(listaAAgregar.map((i) => api.post("api/appweb/insertar-rolxpuesto", { cod_rol: i.cod_rol, cod_puesto: item.cod_puesto, cod_estado: 1 })));
    // // ELIMINAR DE LISTA LISTA eliminarccxmodulo
    await Promise.all(listaAQuitar.map((i) => api.post("api/appweb/eliminar-rolxpuesto", { cod_rol: i.cod_rol, cod_puesto: item.cod_puesto, cod_estado: 4 })));

    if (listaAAgregar.length > 0 || listaAQuitar.length > 0) await obtenerRolesPorPuesto();
  };
  // Realizar la consulta
  const hacerConsultas = useCallback(async () => {
    await Promise.all([obtenerDatos(), obtenerTiposAsignacion(), obtenerEstados(), obtenerEmpresa(), obtenerCentroCosto(), obtenerRolesPorPuesto(), obtenerRole()]).then(() => dispatch(apagarCarga()));
  }, [obtenerCentroCosto, obtenerTiposAsignacion, obtenerDatos, obtenerEmpresa, obtenerEstados, obtenerRolesPorPuesto, obtenerRole, dispatch]);

  useEffect(() => {
    hacerConsultas();
  }, [hacerConsultas]);

  useEffect(() => {
    dispatch(encenderCarga());
  }, [dispatch]);

  return (
    <Box sx={{ p: 1, m: 0 }}>
      {/* Boton para regresar a la lista */}
      <Button color="primary" onClick={() => navigate("/configuracion/personal/puesto")}>
        <Icon className="c-derecha-arriba-izquierda" />
        Regresar a la lista
      </Button>
      {/* Nombre del elemento */}
      <Typography variant="h6">Puesto {item?.puesto_desc}</Typography>
      {/* Tabs para la pantalla */}
      <TabComponent
        tabInicial={1}
        opciones={[
          // Tab principal con el formulario completo relacionado al CRUD
          {
            id: 1,
            label: "Informacion",
            content: (
              <Box sx={{ p: 1, m: 0 }}>
                <FormularioCompletoPuesto
                  puesto={item}
                  catalogos={{ estados, empresas, centrosCosto, tiposAsignacion }}
                  actualizarItem={(val) => {
                    setItem((v) => ({ ...v, ...val }));
                  }}
                  id={id}
                />
              </Box>
            ),
          },
          {
            id: 2,
            label: "Roles Relacionados",
            content: (
              <Box sx={{ p: 1, m: 0 }}>
                <Typography variant="h6">Asignación de Roles</Typography>

                {/* <pre>{JSON.stringify(safeJSONParse(item?.json_puesto), null, 2)}</pre> */}
                {/* {item && <pre>{JSON.stringify(generarJSONParaUsuario(listaSi), null, 2)}</pre>} */}

                <Grid width="100%">
                  <TransferListsComponent
                    // cambioEnLista={guardarUnMovimiento}
                    guardarListas={guardarTodo}
                    listaPrincipal={listaNo}
                    listaSecundaria={listaSi}
                    objectLabel="label"
                    objectValue="cod_rol"
                    propFiltro={["rol_desc"]}
                    tituloListaPrincipal="Roles no Asignados"
                    tituloListaSecundaria="Roles Asignados"
                    // readonly
                    permitirPasarTodos
                    // size={6}
                  />
                </Grid>
                {/* {item && <pre>{JSON.stringify(generarJSONParaUsuario(listaSi), null, 2)}</pre>} */}
                {/* {item && <pre>{JSON.stringify(listaSi, null, 2)}</pre>} */}
              </Box>
            ),
          },
          {
            id: 3,
            label: "Json",
            content: (
              <Box sx={{ p: 1, m: 0 }}>
                <FormularioComponent inputs={[{ id: "json", val: jsonModify, tipo: "textarea", height: "50vh" }]} botones={{ agregar: { texto: "Guardar", onClick: guardarJson } }} unaColumna />
                {/* <pre>{JSON.stringify(jsonModify, null, 2)}</pre> */}
              </Box>
            ),
          },
          // // [ TEMPORAL ] Tab que contiene el modal para maquetacion
          // {
          //   id: 2,
          //   label: "Vista de formulario Modal",
          //   content: (
          //     <Box sx={{ p: 1, m: 0 }}>
          //       <ModalPuesto />
          //     </Box>
          //   ),
          // },
          // Opcion adicional referente a alguna información de apoyo
          // { id: 3, label: "Informacion de opcion", content: <Box sx={{ p: 1, m: 0 }}></Box> },
        ]}
      />
    </Box>
  );
};
export default VistaPuesto;

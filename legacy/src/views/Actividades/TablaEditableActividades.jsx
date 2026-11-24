import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Box, Grid, Typography, List, ListItem, ListItemText, Fab, Drawer } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import { encryptId, decryptId } from "../../api/encryptDecrypt";
import ActionAlertComponent from "../../components/Dialog/ActionAlertComponent";
import DialogComponent from "../../components/Dialog/DialogComponent";
import { FiltroEntidad } from "../Entidad/FiltroEntidad";
import FormularioCompletoEntidadContactos from "../Entidad/EntidadContactos/FormularioCompletoEntidadContactos";
import FormularioCompletoEntidad from "../Entidad/FormularioCompletoEntidad";
import TablaEntidadActividad from "./TablaEntidadActividad";
import TablaContactosActividad from "./TablaContatosActividad";
import EditableDataGridComponent from "../../components/Tabla/EditableDataGridComponent";
import useObtenerOpcionesAcciones from "../../hooks/useObtenerOpcionesAcciones";
import { useSelector } from "react-redux";
import { useFetchAllEntidades } from "../../hooks/Fetch/useFetchEntidades";
import SeguimientoDeCliente from "../../pages/Reportes/reports/CRM/SeguimientoDeCliente";

const TablaEditableActividades = (props) => {
  const listaClientesParaSeguimiento = useFetchAllEntidades(["CLIENTE"]);
  //cod_cliente
  /**
   * # ---------------------------------------------------------------------------- #
   * #                                     PROPS                                    #
   * # ---------------------------------------------------------------------------- #
   * Obtener las propiedades y eventos del componente
   */

  const { nombre, cod_usuario, json } = useSelector((state) => state.auth);
  const { lista = [], reConsultar, catalogos = {}, obtenerFilaSeleccionada = () => {}, currentDate = null } = props;
  const {
    tipos = [],
    cencos = [],
    paises = [],
    configs = [],
    estados = [],
    ciudades = [],
    empresas = [],
    empleados = [],
    entidades = [],
    industrias = [],
    tratamientos = [],
    temperamentos = [],
    identificaciones = [],
  } = catalogos;

  const navigate = useNavigate();
  /**
   * # ---------------------------------------------------------------------------- #
   * #                                   USE STATE                                  #
   * # ---------------------------------------------------------------------------- #
   * Lista de States
   */
  const [mostrarAlerta, setMostrarAlerta] = useState(false);
  const [listaAProcesar, setListaAProcesar] = useState(lista || []);
  const [filaSeleccionada, setFilaSeleccionada] = useState(null);
  const permisosBase = {
    ver: false,
    editar: false,
    eliminar: false,
    guardar: false,
  };
  const { permisosArray } = useObtenerOpcionesAcciones();
  const [contactos, setContactos] = useState([]);
  const [openBusqueda, setOpenBusqueda] = useState(false);
  const [openBusquedaContacto, setOpenBusquedaContacto] = useState(false);
  const [openCrear, setOpenCrear] = useState(false);
  const [openCrearContacto, setOpenCrearContacto] = useState(false);
  const [item, setItem] = useState({});
  const [results, setResults] = useState([]);
  const [mostrarFaltantes, setMostrarFaltantes] = useState(false);
  const [mensajeCamposFaltantes, setMensajeCamposFaltantes] = useState("Los campos requeridos para registrar una fila no se han llenado");

  const [forceContacto, setForceContacto] = useState(false);

  const [contactoExterno, setContactoExterno] = useState(null);
  const [clienteExterno, setClienteExterno] = useState(null);

  const [abrirSeguimientoCliente, setAbrirSeguimientoCliente] = useState(false);

  const encabezados = useMemo(
    () => [
      {
        field: "cliente",
        headerName: "Cliente",
        editable: true,
        varificarSiEsEditable: ({ id, field, row }) => row?.isNew && !filaSeleccionada?.row.contacto,
        type: "selectQuery",
        valueOptions: [],
        labelOption: "entidad_nombre",
        valueOption: "entidad_id",
        url: "api/appweb/busqueda-entidad-x-criterio",
        method: "GET",
        queryField: "ref_busqueda",
        params: {
          list_descripcion_tipo: ["PRE-CLIENTE", "CLIENTE"],
          tipo_busqueda: "NOMBRE",
        },
        // minWidth: 150,
        // onBuscar: () => setOpenBusqueda(true),
        onCrear: () => setOpenCrear(true),
        valorExterno: clienteExterno,
      },
      {
        field: "contacto",
        headerName: "Contacto",
        editable: true,
        varificarSiEsEditable: ({ id, field, row }) => row?.isNew && filaSeleccionada?.row.cliente && !forceContacto,
        // type: "select",
        type: "modalSelect",
        valueOptions: contactos,
        labelOption: "entidadcontacto_nombre",
        valueOption: "entidadcontacto_id",
        // minWidth: 150,
        onBuscar: () => setOpenBusquedaContacto(true),
        onCrear: () => setOpenCrearContacto(true),
        valorExterno: contactoExterno,
      },
      {
        field: "contacto_telefono",
        headerName: "Telefono",
        editable: false,
        type: "text",
        // total: (rows) => {
        //   const total = rows.reduce((sum, row) => sum + (Number(row.contacto_telefono) || 0), 0);
        //   return `${total}`;
        // }, // Add numeric values
      },
      {
        field: "contacto_email",
        headerName: "Email",
        editable: false,
        type: "text",
      },
      ...configs.map((tipo, i) => ({
        field: tipo.abreviatura,
        headerName: tipo.abreviatura,
        type: "checkbox",
        editable: true,
        width: 50,
        varificarSiEsEditable: ({ id, field, row }) => {
          if (filaSeleccionada?.row?.resultado) return false;
          let checked = false;
          for (let i in configs) {
            checked = filaSeleccionada?.row[configs[i].abreviatura] ? filaSeleccionada?.row[configs[i].abreviatura] : false;
            if (checked) break;
          }
          if (!checked) return true;
          return filaSeleccionada?.row[field];
        },
        total: (rows) => {
          const trueCount = rows.filter((row) => row[tipo.abreviatura]).length;
          return <Typography sx={{ textAlign: "center" }}>{trueCount}</Typography>;
        }, // Count true values
      })),
      {
        field: "referencia",
        headerName: "No. File",
        editable: true,
        type: "text",
      },
      {
        field: "comentario",
        headerName: "Descripción",
        editable: true,
        type: "text",
        minWidth: 130,
      },
      {
        field: "fecha_seguimiento",
        headerName: "Fecha",
        editable: true,
        type: "date",
        width: 120,
      },
    ],
    [filaSeleccionada, lista, configs, entidades, contactos, forceContacto]
  );

  const datos = useMemo(() => {
    let lista = [];
    lista.push(
      ...listaAProcesar.map((i) => {
        return {
          ...i,
          cliente: i.cliente
            ? i.cliente
            : {
                entidad_nombre: i.nombre_cliente,
                entidad_id: i.cod_cliente,
              },
          contacto: i.contacto,
          contacto_telefono: i.contacto ? i.contacto.entidadcontacto_telefono : 0,
          contacto_email: i.contacto ? i.contacto.entidadcontacto_email : "",
          accionesDeFila: {
            editar: [23, 36].includes(i.cod_estado) && !i.resultado,
          },
        };
      })
    );
    return lista;
  }, [listaAProcesar, filaSeleccionada, identificaciones, entidades, contactos]);

  const obtenerAccionesSegunPermisos = () => {
    let item = permisosArray.find((i) => i.nom_opcion === "Información");
    return {
      ...permisosBase,
      agregar: item?.acciones.some((i) => i.cod_accion === 3),
      ver: true, // item?.acciones.some((i) => i.cod_accion === 1),
      editar: item?.acciones.some((i) => i.cod_accion === 2),
      guardar: item?.acciones.some((i) => i.cod_accion === 2),
      eliminar: true,
    };
  };
  const objetoBase = useMemo(() => ({ cod_estado: 23 }), []);

  /**
   * ACCIONES A REALIZAAR SEGUN BOTON DE LA TABLA
   */
  const verAFila = (fila) => fila && navigate(`${encryptId(`${fila?.id}`)}`);

  const eliminarFila = useCallback(
    async (row) => {
      setListaAProcesar((lista) => lista.filter((fila) => fila.cod_actividad != row.cod_actividad));
    },
    [reConsultar]
  );
  const guardar = useCallback(
    async (row) => {
      let faltantes = [];
      if (!row.comentario) {
        faltantes.push("Comentario");
      }
      if (!row.fecha_seguimiento) {
        faltantes.push("Nueva Fecha");
      }
      if (faltantes.length > 0) {
        setMensajeCamposFaltantes(
          faltantes.map((campo, i) => (
            <ListItem key={campo} sx={{ py: 0, my: 0 }}>
              <ListItemText primary={<Typography>{"- " + faltantes[i]}</Typography>} sx={{ py: 0, my: 0 }} />
            </ListItem>
          ))
        );
        setMostrarFaltantes(true);
        setFilaSeleccionada((val) => ({
          ...val,
          row: { ...row, comentario: null, fecha_seguimiento: null },
        }));
        setListaAProcesar((lista) =>
          lista.map((row2) => {
            return row.cod_actividad !== row2.cod_actividad ? row2 : { ...row, comentario: null, fecha_seguimiento: null };
          })
        );
        return;
      }

      const tipo_str = Object.keys(row).find((key) => [...configs.map((tipo) => tipo.abreviatura)].includes(key) && row[key]);
      const tipo_obj = configs.find((tipo) => tipo.abreviatura == tipo_str);

      await api
        .post("api/appweb/insertar-resultado", {
          actividad_padre: row.cod_actividad,
          fecha_programada: row.fecha_seguimiento,
          asunto: `Actividad ${new Date(row.fecha_seguimiento).toLocaleDateString()} - ${row.cliente.entidad_nombre}`,
          descripcion: row.comentario,
          cod_tipo: tipo_obj ? tipo_obj.cod_tipo_actividad : 30,
          cod_cliente: row.cliente.entidad_id,
          cod_emp: row.cod_emp,
          cod_cc: row.cod_cc,
          cod_asesor: row.cod_asesor,
          contactos: row.contacto ? [row.contacto.entidadcontacto_id] : [],
          cod_estado: 24,
          crear_seguimiento: tipo_obj ? !tipo_obj.solo_resultado : true,
          referencia: row.referencia,
        })
        .then(async ({ data }) => {
          if (data.data.mensaje == "Resultado creado correctamente") {
            await api.post("api/appweb/cambiar-estado-actividad", {
              cod_actividad: row.cod_actividad,
              cod_estado: 24,
            });
          }
        });
    },
    [reConsultar, configs, currentDate]
  );
  const agregar = useCallback(
    async (row) => {
      let cod_cc = JSON.parse(decryptId(localStorage.getItem("currentCentroCosto"))).cod_cc || null;
      let cod_emp = JSON.parse(decryptId(localStorage.getItem("currentEmpresa"))).cod_empresa || null;

      const sendData = {
        fecha_programada: new Date(currentDate),
        asunto: `Actividad ${new Date(currentDate).toLocaleDateString()} - ${row.cliente.entidad_nombre}`,
        descripcion: `Actividad ${new Date(currentDate).toLocaleDateString()} - ${row.cliente.entidad_nombre}`,
        cod_tipo: 30,
        cod_cliente: row.cliente.entidad_id,
        cod_emp,
        cod_cc,
        cod_asesor: cod_usuario,
        contactos: row.contacto ? [row.contacto.entidadcontacto_id] : [],
        cod_estado: row.comentario && row.fecha_seguimiento ? 24 : 23,
        referencia: row.referencia,
      };

      await api.post("api/appweb/insertar-actividad", sendData).then(async ({ data }) => {
        if (data.data.mensaje !== "Actividad creada correctamente") {
          navigate(0);
        } else {
          const cod_padre = data.data.cod_actividad;
          const tipo_str = Object.keys(row).find((key) => [...configs.map((tipo) => tipo.abreviatura)].includes(key) && row[key]);

          if (tipo_str && !(row.comentario && row.fecha_seguimiento)) {
            setMostrarAlerta(true);
            return;
          }
          if (row.comentario && row.fecha_seguimiento) {
            const tipo_obj = configs.find((tipo) => tipo.abreviatura == tipo_str);

            await api.post("api/appweb/insertar-resultado", {
              actividad_padre: cod_padre,
              fecha_programada: row.fecha_seguimiento,
              asunto: `Actividad ${new Date(row.fecha_seguimiento).toLocaleDateString()} - ${row.cliente.entidad_nombre}`,
              descripcion: row.comentario,
              cod_tipo: tipo_obj ? tipo_obj.cod_tipo_actividad : 30,
              cod_cliente: row.cliente.entidad_id,
              cod_emp,
              cod_cc,
              cod_asesor: cod_usuario,
              contactos: row.contacto ? [row.contacto.entidadcontacto_id] : [],
              cod_estado: tipo_obj ? 24 : 23,
              crear_seguimiento: tipo_obj ? !tipo_obj.solo_resultado : true,
            });
          }
        }
      });
    },
    [reConsultar, configs, currentDate]
  );

  const onInput = async (row) => {
    const { field, id, value } = row;
    let newVal = filaSeleccionada.row;
    const tipos = configs.map((tipo) => tipo.abreviatura);

    if (tipos.includes(field)) {
      newVal[field] = value ? value : null;

      setFilaSeleccionada((val) => ({
        ...val,
        row: newVal,
      }));
      setListaAProcesar((lista) =>
        lista.map((row) => {
          return row.cod_actividad !== id ? row : newVal;
        })
      );
    }

    if (field == "contacto") {
      setFilaSeleccionada((val) => ({
        ...val,
        row: { ...newVal, contacto: value },
      }));
      setListaAProcesar((lista) =>
        lista.map((row) => {
          return row.cod_actividad !== id ? row : { ...newVal, contacto: value };
        })
      );
      setContactoExterno(null);
    }

    if (field == "cliente") {
      newVal = { ...newVal, cliente: value, contacto: null };
      if (value) {
        const cod_cc = JSON.parse(decryptId(localStorage.getItem("currentCentroCosto")))?.cod_cc;
        await api
          .get("api/appweb/lista-entidad-contacto", {
            params: {
              cod_tipo: value?.cod_tipo,
              entidad_id: value?.entidad_id,
              cod_cc,
            },
          })
          .then(({ data }) => setContactos(data.data.data))
          .catch((e) => console.error(e));
      }
      setFilaSeleccionada((val) => ({
        ...val,
        row: newVal,
      }));
      setListaAProcesar((lista) =>
        lista.map((row) => {
          return row.cod_actividad !== id ? row : newVal;
        })
      );
    }
  };

  useEffect(() => {
    setListaAProcesar(lista);
  }, [lista]);

  const entidadCreada = async (data) => {
    const entityData = await api.post("api/appweb/recuperar-datos-entidad", { cod_tipo: data.cod_tipo, entidad_id: data.entidad_id });
    setOpenCrear(false);
  };

  const contactoCreado = async (contacto) => {
    setOpenCrearContacto(false);
    setContactos((lista) => [...lista, contacto]);
    setContactoExterno(contacto);
  };

  const entidadSeleccionada = (data) => {
    setOpenBusqueda(false);
    setResults([]);

    setOpenBusquedaContacto(false);
    let newVal = filaSeleccionada.row;

    setFilaSeleccionada((val) => ({
      ...val,
      row: { ...newVal, cliente: data },
    }));
    setListaAProcesar((lista) =>
      lista.map((row) => {
        return row.cod_actividad != newVal.cod_actividad ? row : { ...newVal, cliente: data };
      })
    );
    setClienteExterno(data);
  };

  const contactoSeleccionado = (contacto) => {
    setOpenBusquedaContacto(false);
    let newVal = filaSeleccionada.row;
    // console.log(contacto)
    setFilaSeleccionada((val) => ({
      ...val,
      row: { ...newVal, contacto },
    }));
    setListaAProcesar((lista) =>
      lista.map((row) => {
        return row.cod_actividad != newVal.cod_actividad ? row : { ...newVal, contacto };
      })
    );
    setContactoExterno(contacto);
  };

  const nuevoEnBusqueda = () => {
    setOpenBusqueda(false);
    setResults([]);
    setOpenCrear(true);
  };

  const nuevoEnContacto = () => {
    setOpenBusquedaContacto(false);
    setResults([]);
    setOpenCrearContacto(true);
  };

  const toggleDrawer = (open) => (event) => {
    if (event.type === "keydown" && (event.key === "Tab" || event.key === "Shift")) {
      return;
    }

    setAbrirSeguimientoCliente(open);
  };

  return (
    <Box sx={{ p: 1, m: 0 }}>
      <Typography sx={{ textAlign: "right" }}>Al crear un resultado sin marcar un tipo se generará una copia de la actividad actual en la nueva fecha.</Typography>
      <EditableDataGridComponent
        alwaysSave
        totales
        totalesPorPagina={false}
        encabezados={encabezados}
        datos={datos}
        idKey="cod_actividad"
        onAddRow={(row) => {
          setListaAProcesar((lista) => [
            ...lista,
            {
              ...row,
              ...objetoBase,
              cod_actividad: row.id,
              id: row.id,
              cod_estado: 1,
            },
          ]);
          setFilaSeleccionada((val) => ({
            ...(val || {}),
            row: { ...objetoBase, ...row },
          }));
        }}
        onDeleteRow={(row) => {
          if (listaAProcesar.some((i) => i.cod_actividad === row.id)) eliminarFila(row.row);
        }}
        onInput={onInput}
        onEdditRow={(row) => setFilaSeleccionada(row)}
        onRowSave={async (row) => {
          if (lista.some((i) => i.cod_actividad === row.id)) {
            await guardar({
              ...row.row,
            });
          } else {
            await agregar({
              ...row.row,
            });
          }
        }}
        columnasAExtender={[0, 1]}
        objetoBase={objetoBase}
        acciones={obtenerAccionesSegunPermisos()}
        filaSeleccionada={verAFila} // BOTON DE OJO
        camposRequeridosParaGuardar={{
          cliente: "Cliente",
        }}
        groupModel={[
          {
            groupId: "Actividad",
            children: [{ field: "cliente" }, { field: "contacto" }, { field: "contacto_telefono" }, { field: "contacto_email" }],
          },
          {
            groupId: "Resultado",
            children: [
              { field: "comentario" },
              { field: "fecha_seguimiento" },
              { field: "referencia" },
              ...[
                ...configs.map((tipo) => ({
                  field: tipo.abreviatura,
                })),
              ],
            ],
          },
        ]}
        textoAlertaEliminacion="¿Desea remover este registro? No se eliminará del sistema."
      />

      <ActionAlertComponent
        aceptar={() => {
          setMostrarAlerta(false);
        }}
        cancelar={() => {
          setMostrarAlerta(false);
        }}
        openDialog={mostrarAlerta}
        tipo="error"
        handleClose={() => {}}
        content={"Para registrar un resultado es necesario ingresar por lo menos una descripción y una fecha de seguimiento."}
      />

      <ActionAlertComponent
        aceptar={() => {
          setMostrarFaltantes(false);
        }}
        cancelar={() => {
          setMostrarFaltantes(false);
        }}
        openDialog={mostrarFaltantes}
        tipo="warning"
        activarCanecelar={false}
        handleClose={() => {
          setMostrarFaltantes(false);
        }}
        content={
          <Grid container wdith="100%" direction="column">
            <Grid size={12}>
              <Typography>{`Para registrar un resultado se necesitan los siguientes campos:`}</Typography>
            </Grid>
            <List dense sx={{ my: 0, p: 0 }}>
              {mensajeCamposFaltantes}
            </List>
          </Grid>
        }
      />

      <DialogComponent
        openDialog={openCrear}
        handleClose={() => setOpenCrear(false)}
        titulo="Crear Pre-Cliente"
        width="80vw"
        children={
          <Grid sx={{ display: "flex", flexDirection: "column", px: 3 }}>
            <FormularioCompletoEntidad id="new" tipo={5} cliente={item} catalogos={catalogos} onCreate={entidadCreada} />
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
        children={
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

      <DialogComponent
        openDialog={openCrearContacto}
        handleClose={() => setOpenCrearContacto(false)}
        titulo="Crear Contacto"
        width="80vw"
        children={
          <Grid sx={{ display: "flex", flexDirection: "column", px: 3 }}>
            <FormularioCompletoEntidadContactos
              id="new"
              cliente={filaSeleccionada?.row.cliente}
              catalogos={{ empresas, estados, paises, ciudades, industrias, tipos, cencos, tratamientos, temperamentos }}
              onCreate={contactoCreado}
              onActividad
            />
          </Grid>
        }
      />

      <DialogComponent
        openDialog={openBusquedaContacto}
        handleClose={() => {
          setOpenBusquedaContacto(false);
          setForceContacto(false);
        }}
        titulo="Buscar Contacto"
        children={
          <Grid sx={{ display: "flex", flexDirection: "column", px: 3, minWidth: "80vw", maxHeight: "80vh" }}>
            <TablaContactosActividad
              lista={contactos}
              reConsultar={null}
              obtenerFilaSeleccionada={contactoSeleccionado}
              cliente={filaSeleccionada?.row.cliente}
              handleNuevo={nuevoEnContacto}
              catalogos={{ empresas, estados, paises, ciudades, industrias, tipos, cencos }}
            />
          </Grid>
        }
      />
      <Fab
        size="small"
        color="primary"
        aria-label="seguimiento"
        sx={{
          margin: 0,
          top: 100,
          right: 20,
          bottom: "auto",
          left: "auto",
          position: "fixed",
        }}
        onClick={toggleDrawer(true)}
        disabled={filaSeleccionada?.row?.cliente ? false : !filaSeleccionada?.row?.cod_cliente}
      >
        <Typography variant="span" className="c-logo-dsv" sx={{ fontSize: "25px !important", fontWeight: 100 }} />
      </Fab>
      <Drawer sx={{ maxWidth: "50%", "& .MuiDrawer-paper": { maxWidth: "50%" } }} anchor={"right"} open={abrirSeguimientoCliente} onClose={toggleDrawer(false)}>
        <Box sx={{ padding: "1em" }}>
          <SeguimientoDeCliente mostrar_filtro={false} entidad_default={filaSeleccionada?.row?.cliente} cod_entidad_default={filaSeleccionada?.row?.cod_cliente} height="90vh" />
        </Box>
      </Drawer>
      {/* <pre>{JSON.stringify(filaSeleccionada?.row?.cliente)}</pre> */}
    </Box>
  );
};
TablaEditableActividades.propTypes = {
  //   tipo: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  //   entidad_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  //   // LISTA DE DATOS
  //   lista: PropTypes.array,
  //   // CATALOGOS
  //   estados: PropTypes.array,
  //   // EVENTOS
  //   reConsultar: PropTypes.func,
  //   //CATALOGOS
  //   catalogos: PropTypes.object,
  //   obtenerFilaSeleccionada: PropTypes.func,
};
export default TablaEditableActividades;
